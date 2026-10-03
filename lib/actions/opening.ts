'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { canWrite, hasFullAccess } from '@/lib/auth/permissions'
import {
  openingProjectSchema,
  openingTaskSchema,
  taskChecklistSchema,
  STAGE_DEFINITIONS,
  type OpeningProjectFormValues,
  type OpeningTaskFormValues,
  type TaskChecklistFormValues,
  type WorkflowStageModel,
} from '@/lib/types/opening'
import { parseLeadMetadata } from '@/lib/utils/lead-metadata'
import type { ActionResponse } from './customers'

/**
 * Ensure all workflow stages exist and have up-to-date sequences in the database.
 * Uses upsert so that newly added stages (e.g. TM30_NOTIFY) are inserted,
 * and existing stages get their sequence/name updated if the definitions change.
 */
export async function ensureWorkflowStagesAction(): Promise<WorkflowStageModel[]> {
  const supabase = await createClient()

  // 1. Fast read first: If stages already exist, return immediately without UPSERT write
  const { data: stages } = await supabase
    .from('workflow_stages')
    .select('*')
    .order('sequence', { ascending: true })

  if (stages && stages.length >= STAGE_DEFINITIONS.length) {
    return stages as WorkflowStageModel[]
  }

  // 2. Only upsert if missing or incomplete
  const stagesToUpsert = STAGE_DEFINITIONS.map((def) => ({
    stage_code: def.code,
    stage_name: def.name,
    sequence: def.sequence,
    is_required: true,
    is_active: true,
  }))

  await supabase
    .from('workflow_stages')
    .upsert(stagesToUpsert, { onConflict: 'stage_code' })

  const { data: reloaded } = await supabase
    .from('workflow_stages')
    .select('*')
    .order('sequence', { ascending: true })

  return (reloaded as WorkflowStageModel[]) || []
}

/**
 * Create a new Opening Project from an agreed/active contract.
 * Automatically generates tasks & checklists according to contract conditions.
 */
export async function createOpeningProjectAction(
  values: OpeningProjectFormValues
): Promise<ActionResponse & { data?: unknown }> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }
  }

  if (!canWrite(currentUser.profile.role, 'opening')) {
    return { success: false, error: 'คุณไม่มีสิทธิ์ในการสร้างโครงการเปิดสาขา' }
  }

  const parsed = openingProjectSchema.safeParse(values)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(', '),
    }
  }

  const supabase = await createClient()

  // 1. Fetch Contract to check eligibility & requirement flags
  const { data: contract, error: contractErr } = await supabase
    .from('rental_contracts')
    .select('*')
    .eq('id', parsed.data.contract_id)
    .single()

  if (contractErr || !contract) {
    return { success: false, error: 'ไม่พบข้อมูลสัญญาเช่า' }
  }

  // Check if project already exists for this contract
  const { data: existingProj } = await supabase
    .from('opening_projects')
    .select('id, project_no')
    .eq('contract_id', parsed.data.contract_id)
    .maybeSingle()

  if (existingProj) {
    return {
      success: false,
      error: `สัญญานี้มีโครงการเปิดสาขาอยู่แล้ว (${existingProj.project_no})`,
    }
  }

  // 2. Ensure stages exist
  const stages = await ensureWorkflowStagesAction()
  const stageMap = new Map(stages.map((s) => [s.stage_code, s.id]))

  // Default initial stage based on contract status
  let initialStageId = stageMap.get('NEGOTIATION')
  if (contract.status === 'agreed') {
    initialStageId = stageMap.get('AGREED') || initialStageId
  } else if (contract.status === 'active') {
    initialStageId = stageMap.get('DOCUMENT_CHECK') || initialStageId
  }

  const projectNo =
    parsed.data.project_no?.trim() ||
    `PRJ-${Date.now().toString().slice(-6)}`

  // 3. Insert opening project
  const { data: project, error: projErr } = await supabase
    .from('opening_projects')
    .insert({
      project_no: projectNo,
      contract_id: parsed.data.contract_id,
      current_stage_id: initialStageId || null,
      target_open_date: parsed.data.target_open_date || null,
      assigned_to: parsed.data.assigned_to?.trim() || currentUser.profile.id,
      status: parsed.data.status || 'in_progress',
      note: parsed.data.note?.trim() || null,
    })
    .select()
    .single()

  if (projErr || !project) {
    console.error('createOpeningProjectAction projErr:', projErr)
    return { success: false, error: projErr?.message || 'ไม่สามารถสร้างโครงการได้' }
  }

  // 4. Parse hasForeignResident from contract note (stored as TM30 tag in note field)
  const { hasForeignResident } = parseLeadMetadata(contract.note)

  // Build a combined conditions object: DB columns + note-parsed flags
  const contractConditions: Record<string, boolean> = {
    need_branch_registration: Boolean(contract.need_branch_registration),
    need_vat_registration: Boolean(contract.need_vat_registration),
    need_employer_change: Boolean(contract.need_employer_change),
    need_signboard: Boolean(contract.need_signboard),
    need_excise_permit: Boolean(contract.need_excise_permit),
    hasForeignResident,
  }

  // 5. Generate default tasks and checklists according to contract conditions
  for (const def of STAGE_DEFINITIONS) {
    // Skip stages that require a condition that is not met
    if (def.requiresCondition && !contractConditions[def.requiresCondition]) {
      continue
    }

    const stageId = stageMap.get(def.code)
    if (!stageId) continue

    for (const t of def.defaultTasks || []) {
      const { data: insertedTask } = await supabase
        .from('opening_tasks')
        .insert({
          opening_project_id: project.id,
          stage_id: stageId,
          task_name: t.name,
          description: t.description || null,
          assigned_to: project.assigned_to || null,
          status: 'todo',
        })
        .select()
        .single()

      if (insertedTask && t.checklists && t.checklists.length > 0) {
        const checklistsToInsert = t.checklists.map((c) => ({
          task_id: insertedTask.id,
          item_name: c.name,
          is_required: c.is_required,
          is_checked: false,
        }))

        await supabase.from('task_checklists').insert(checklistsToInsert)
      }
    }
  }

  revalidatePath('/opening')
  revalidatePath(`/contracts/${parsed.data.contract_id}`)
  return { success: true, data: project }
}

export async function updateOpeningProjectAction(
  id: string,
  values: Partial<OpeningProjectFormValues>
): Promise<ActionResponse & { data?: unknown }> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }
  }

  if (!canWrite(currentUser.profile.role, 'opening')) {
    return { success: false, error: 'คุณไม่มีสิทธิ์ในการแก้ไขโครงการเปิดสาขา' }
  }

  const supabase = await createClient()

  const payload: Record<string, unknown> = { ...values }
  if (payload.assigned_to === '') payload.assigned_to = null
  if (payload.target_open_date === '') payload.target_open_date = null

  const { data, error } = await supabase
    .from('opening_projects')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/opening')
  revalidatePath(`/opening/${id}`)
  return { success: true, data }
}

export async function advanceProjectStageAction(
  projectId: string,
  nextStageId: string
): Promise<ActionResponse> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }
  }

  if (!canWrite(currentUser.profile.role, 'opening')) {
    return { success: false, error: 'คุณไม่มีสิทธิ์ในการเปลี่ยนขั้นตอน' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('opening_projects')
    .update({ current_stage_id: nextStageId })
    .eq('id', projectId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/opening')
  revalidatePath(`/opening/${projectId}`)
  return { success: true }
}

export async function createTaskAction(
  values: OpeningTaskFormValues & { auto_create_checklists?: boolean }
): Promise<ActionResponse & { data?: unknown }> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }
  }

  if (!canWrite(currentUser.profile.role, 'opening')) {
    return { success: false, error: 'คุณไม่มีสิทธิ์ในการสร้างงาน' }
  }

  const parsed = openingTaskSchema.safeParse(values)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(', '),
    }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('opening_tasks')
    .insert({
      opening_project_id: parsed.data.opening_project_id,
      stage_id: parsed.data.stage_id?.trim() || null,
      task_name: parsed.data.task_name.trim(),
      description: parsed.data.description?.trim() || null,
      assigned_to: parsed.data.assigned_to?.trim() || null,
      due_date: parsed.data.due_date || null,
      status: parsed.data.status || 'todo',
      note: parsed.data.note?.trim() || null,
    })
    .select()
    .single()

  if (error || !data) {
    return { success: false, error: error?.message || 'ไม่สามารถสร้างงานได้' }
  }

  // Auto-create default checklists from STAGE_DEFINITIONS unless explicitly turned off
  if (values.auto_create_checklists !== false) {
    let matchedChecklists: { name: string; is_required: boolean }[] = []

    if (parsed.data.stage_id) {
      const { data: st } = await supabase
        .from('workflow_stages')
        .select('stage_code')
        .eq('id', parsed.data.stage_id)
        .maybeSingle()

      if (st) {
        const stageDef = STAGE_DEFINITIONS.find((d) => d.code === st.stage_code)
        if (stageDef && stageDef.defaultTasks) {
          const taskDef =
            stageDef.defaultTasks.find((t) => t.name === parsed.data.task_name.trim()) ||
            stageDef.defaultTasks[0]
          if (taskDef?.checklists) {
            matchedChecklists = taskDef.checklists
          }
        }
      }
    }

    if (matchedChecklists.length === 0) {
      for (const s of STAGE_DEFINITIONS) {
        const t = (s.defaultTasks || []).find((dt) => dt.name === parsed.data.task_name.trim())
        if (t && t.checklists) {
          matchedChecklists = t.checklists
          break
        }
      }
    }

    if (matchedChecklists.length > 0) {
      const checklistsToInsert = matchedChecklists.map((c) => ({
        task_id: data.id,
        item_name: c.name,
        is_required: c.is_required,
        is_checked: false,
      }))
      await supabase.from('task_checklists').insert(checklistsToInsert)
    }
  }

  revalidatePath(`/opening/${parsed.data.opening_project_id}`)
  return { success: true, data }
}

/**
 * Update Task
 * CRITICAL RULE: ถ้า required checklist ยังไม่ครบ ห้ามเปลี่ยน Task เป็น DONE
 */
export async function updateTaskAction(
  id: string,
  projectId: string,
  values: Partial<OpeningTaskFormValues>
): Promise<ActionResponse & { data?: unknown }> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }
  }

  if (!canWrite(currentUser.profile.role, 'opening')) {
    return { success: false, error: 'คุณไม่มีสิทธิ์ในการแก้ไขงาน' }
  }

  const supabase = await createClient()

  // Checklist Validation Rule
  if (values.status === 'done') {
    const { data: checklists, error: checkErr } = await supabase
      .from('task_checklists')
      .select('id, item_name, is_required, is_checked')
      .eq('task_id', id)

    if (!checkErr && checklists) {
      const incompleteRequired = checklists.filter(
        (c) => c.is_required && !c.is_checked
      )

      if (incompleteRequired.length > 0) {
        return {
          success: false,
          error: `ไม่สามารถบันทึกเป็น "เสร็จสิ้น" ได้ เนื่องจากยังมีรายการเช็คลิสต์ที่จำเป็น ${incompleteRequired.length} รายการที่ยังไม่ได้ดำเนินการ (${incompleteRequired.map((c) => c.item_name).join(', ')})`,
        }
      }
    }
  }

  const payload: Record<string, unknown> = { ...values }
  if (payload.assigned_to === '') payload.assigned_to = null
  if (payload.due_date === '') payload.due_date = null
  if (payload.stage_id === '') payload.stage_id = null

  if (values.status === 'done') {
    payload.completed_at = new Date().toISOString()
    payload.completed_by = currentUser.profile.id
  } else if (values.status) {
    payload.completed_at = null
    payload.completed_by = null
  }

  const { data, error } = await supabase
    .from('opening_tasks')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/opening/${projectId}`)
  return { success: true, data }
}

export async function deleteTaskAction(
  taskId: string,
  projectId: string
): Promise<ActionResponse> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }
  }

  if (!hasFullAccess(currentUser.profile.role)) {
    return { success: false, error: 'คุณไม่มีสิทธิ์ในการลบงาน (เฉพาะผู้ดูแลระบบ/เจ้าของระบบ)' }
  }

  const supabase = await createClient()

  const { error } = await supabase.from('opening_tasks').delete().eq('id', taskId)
  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/opening/${projectId}`)
  return { success: true }
}

/**
 * Check or Uncheck a checklist item
 */
export async function toggleChecklistAction(
  checklistId: string,
  isChecked: boolean,
  projectId: string
): Promise<ActionResponse> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }
  }

  if (!canWrite(currentUser.profile.role, 'opening')) {
    return { success: false, error: 'คุณไม่มีสิทธิ์ในการปรับปรุงเช็คลิสต์' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('task_checklists')
    .update({
      is_checked: isChecked,
      checked_by: isChecked ? currentUser.profile.id : null,
      checked_at: isChecked ? new Date().toISOString() : null,
    })
    .eq('id', checklistId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/opening/${projectId}`)
  return { success: true }
}

export async function addChecklistAction(
  values: TaskChecklistFormValues,
  projectId: string
): Promise<ActionResponse & { data?: unknown }> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }
  }

  if (!canWrite(currentUser.profile.role, 'opening')) {
    return { success: false, error: 'คุณไม่มีสิทธิ์ในการเพิ่มเช็คลิสต์' }
  }

  const parsed = taskChecklistSchema.safeParse(values)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(', '),
    }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('task_checklists')
    .insert({
      task_id: parsed.data.task_id,
      item_name: parsed.data.item_name.trim(),
      is_required: parsed.data.is_required,
      is_checked: false,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/opening/${projectId}`)
  return { success: true, data }
}

export async function deleteChecklistAction(
  checklistId: string,
  projectId: string
): Promise<ActionResponse> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }
  }

  if (!canWrite(currentUser.profile.role, 'opening')) {
    return { success: false, error: 'คุณไม่มีสิทธิ์ในการลบเช็คลิสต์' }
  }

  const supabase = await createClient()

  const { error } = await supabase.from('task_checklists').delete().eq('id', checklistId)
  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/opening/${projectId}`)
  return { success: true }
}
