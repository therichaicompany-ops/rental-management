'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { canWrite, hasFullAccess } from '@/lib/auth/permissions'
import {
  rentalLeadSchema,
  negotiationLogSchema,
  type RentalLeadFormValues,
  type NegotiationLogFormValues,
} from '@/lib/types/rental-leads'
import { parseLeadMetadata } from '@/lib/utils/lead-metadata'
import type { ActionResponse } from './customers'

export async function createRentalLeadAction(
  values: RentalLeadFormValues
): Promise<ActionResponse> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }
  }

  if (!canWrite(currentUser.profile.role)) {
    return { success: false, error: 'คุณไม่มีสิทธิ์ในการสร้างข้อมูล' }
  }

  const parsed = rentalLeadSchema.safeParse(values)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(', '),
    }
  }

  const supabase = await createClient()

  const leadNo =
    parsed.data.lead_no?.trim() ||
    `LEAD-${Date.now().toString().slice(-6)}`

  const { data, error } = await supabase
    .from('rental_leads')
    .insert({
      lead_no: leadNo,
      lead_name: parsed.data.lead_name.trim(),
      location_id: parsed.data.location_id?.trim() || null,
      customer_id: parsed.data.customer_id?.trim() || null,
      landlord_id: parsed.data.landlord_id?.trim() || null,
      source: parsed.data.source?.trim() || null,
      first_contact_date: parsed.data.first_contact_date || null,
      expected_start_date: parsed.data.expected_start_date || null,
      expected_open_date: parsed.data.expected_open_date || null,
      proposed_monthly_rent: parsed.data.proposed_monthly_rent ?? 0,
      proposed_deposit_amount: parsed.data.proposed_deposit_amount ?? 0,
      proposed_advance_rent_amount: parsed.data.proposed_advance_rent_amount ?? 0,
      proposed_service_amount: parsed.data.proposed_service_amount ?? 0,
      need_branch_registration: parsed.data.need_branch_registration,
      need_vat_registration: parsed.data.need_vat_registration,
      need_employer_change: parsed.data.need_employer_change,
      need_signboard: parsed.data.need_signboard,
      status: parsed.data.status,
      assigned_to: parsed.data.assigned_to?.trim() || null,
      next_follow_up_date: parsed.data.next_follow_up_date || null,
      note: parsed.data.note?.trim() || null,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: `เกิดข้อผิดพลาด: ${error.message}` }
  }

  revalidatePath('/rental-leads')
  return { success: true, data }
}

export async function updateRentalLeadAction(
  id: string,
  values: RentalLeadFormValues
): Promise<ActionResponse> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }
  }

  if (!canWrite(currentUser.profile.role)) {
    return { success: false, error: 'คุณไม่มีสิทธิ์ในการแก้ไขข้อมูล' }
  }

  const parsed = rentalLeadSchema.safeParse(values)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(', '),
    }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('rental_leads')
    .update({
      lead_no: parsed.data.lead_no?.trim() || undefined,
      lead_name: parsed.data.lead_name.trim(),
      location_id: parsed.data.location_id?.trim() || null,
      customer_id: parsed.data.customer_id?.trim() || null,
      landlord_id: parsed.data.landlord_id?.trim() || null,
      source: parsed.data.source?.trim() || null,
      first_contact_date: parsed.data.first_contact_date || null,
      expected_start_date: parsed.data.expected_start_date || null,
      expected_open_date: parsed.data.expected_open_date || null,
      proposed_monthly_rent: parsed.data.proposed_monthly_rent ?? 0,
      proposed_deposit_amount: parsed.data.proposed_deposit_amount ?? 0,
      proposed_advance_rent_amount: parsed.data.proposed_advance_rent_amount ?? 0,
      proposed_service_amount: parsed.data.proposed_service_amount ?? 0,
      need_branch_registration: parsed.data.need_branch_registration,
      need_vat_registration: parsed.data.need_vat_registration,
      need_employer_change: parsed.data.need_employer_change,
      need_signboard: parsed.data.need_signboard,
      status: parsed.data.status,
      assigned_to: parsed.data.assigned_to?.trim() || null,
      next_follow_up_date: parsed.data.next_follow_up_date || null,
      note: parsed.data.note?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { success: false, error: `เกิดข้อผิดพลาด: ${error.message}` }
  }

  revalidatePath('/rental-leads')
  revalidatePath(`/rental-leads/${id}`)
  return { success: true, data }
}

export async function deleteRentalLeadAction(id: string): Promise<ActionResponse> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }
  }

  if (!hasFullAccess(currentUser.profile.role)) {
    return { success: false, error: 'เฉพาะผู้ดูแลระบบ (Owner/Admin) เท่านั้นที่สามารถลบข้อมูลได้' }
  }

  const supabase = await createClient()

  const { error } = await supabase.from('rental_leads').delete().eq('id', id)

  if (error) {
    return { success: false, error: `ไม่สามารถลบข้อมูลได้: ${error.message}` }
  }

  revalidatePath('/rental-leads')
  return { success: true }
}

export async function createNegotiationLogAction(
  leadId: string,
  values: NegotiationLogFormValues
): Promise<ActionResponse> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }
  }

  if (!canWrite(currentUser.profile.role)) {
    return { success: false, error: 'คุณไม่มีสิทธิ์ในการบันทึกการเจรจา' }
  }

  const parsed = negotiationLogSchema.safeParse(values)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(', '),
    }
  }

  const supabase = await createClient()

  // Insert negotiation log
  const { data: logData, error: logError } = await supabase
    .from('negotiation_logs')
    .insert({
      lead_id: leadId,
      contact_date: parsed.data.contact_date,
      contact_method: parsed.data.contact_method,
      contact_person: parsed.data.contact_person?.trim() || null,
      contact_phone: parsed.data.contact_phone?.trim() || null,
      monthly_rent: parsed.data.monthly_rent ?? null,
      deposit_amount: parsed.data.deposit_amount ?? null,
      advance_rent_amount: parsed.data.advance_rent_amount ?? null,
      service_amount: parsed.data.service_amount ?? null,
      negotiation_detail: parsed.data.negotiation_detail.trim(),
      result: parsed.data.result?.trim() || null,
      next_action: parsed.data.next_action?.trim() || null,
      next_follow_up_date: parsed.data.next_follow_up_date || null,
      created_by: currentUser.profile.id,
    })
    .select()
    .single()

  if (logError) {
    return { success: false, error: `เกิดข้อผิดพลาดในการบันทึก: ${logError.message}` }
  }

  // Update lead with latest follow up date and latest proposed rent if negotiated
  const leadUpdates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (parsed.data.next_follow_up_date) {
    leadUpdates.next_follow_up_date = parsed.data.next_follow_up_date
  }
  if (parsed.data.monthly_rent && parsed.data.monthly_rent > 0) {
    leadUpdates.proposed_monthly_rent = parsed.data.monthly_rent
  }
  if (parsed.data.deposit_amount && parsed.data.deposit_amount > 0) {
    leadUpdates.proposed_deposit_amount = parsed.data.deposit_amount
  }

  await supabase.from('rental_leads').update(leadUpdates).eq('id', leadId)

  revalidatePath(`/rental-leads/${leadId}`)
  revalidatePath('/rental-leads')
  return { success: true, data: logData }
}

export async function convertToContractAction(leadId: string): Promise<ActionResponse> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }
  }

  if (!canWrite(currentUser.profile.role)) {
    return { success: false, error: 'คุณไม่มีสิทธิ์ในการสร้างสัญญาเช่า' }
  }

  const supabase = await createClient()

  // 1. Fetch Lead
  const { data: lead, error: leadError } = await supabase
    .from('rental_leads')
    .select('*')
    .eq('id', leadId)
    .single()

  if (leadError || !lead) {
    return { success: false, error: 'ไม่พบข้อมูลงานเช่า' }
  }

  // 2. Validate status and location
  if (lead.status !== 'agreed' && lead.status !== 'converted') {
    return {
      success: false,
      error: 'สามารถสร้างสัญญาได้เฉพาะ Lead ที่มีสถานะ "ตกลงแล้ว (agreed)" หรือ "ทำสัญญาเรียบร้อย (converted)" เท่านั้น',
    }
  }

  if (!lead.location_id) {
    return {
      success: false,
      error: 'ไม่สามารถสร้างสัญญาได้เนื่องจาก Lead นี้ยังไม่ได้ระบุสถานที่ (Location)',
    }
  }

  // 3. Prevent duplicate contract creation from the same lead
  const { data: existingContract } = await supabase
    .from('rental_contracts')
    .select('id, contract_no')
    .eq('lead_id', leadId)
    .maybeSingle()

  if (existingContract) {
    return {
      success: false,
      error: `งานเช่านี้ถูกสร้างเป็นสัญญาเช่าไปแล้ว (สัญญาเลขที่ ${existingContract.contract_no}) ไม่สามารถสร้างซ้ำได้`,
    }
  }

  // 4. Create Contract Draft
  const contractNo = `CTR-${Date.now().toString().slice(-6)}`
  const today = new Date().toISOString().split('T')[0]
  const leadMeta = parseLeadMetadata(lead.note)
  const startDateStr = lead.expected_start_date || today
  const sDate = new Date(startDateStr)
  // Default 3 years contract duration (standard commercial rental term)
  const eDate = new Date(sDate.getFullYear() + 3, sDate.getMonth(), sDate.getDate())
  const endDateStr = leadMeta.financial.contract_end_date || eDate.toISOString().split('T')[0]

  const isHouse = leadMeta.isHouse
  const depositAmount = isHouse && leadMeta.financial.down_payment
    ? Number(leadMeta.financial.down_payment)
    : (lead.proposed_deposit_amount ?? 0)

  const { data: contract, error: contractError } = await supabase
    .from('rental_contracts')
    .insert({
      contract_no: contractNo,
      lead_id: lead.id,
      location_id: lead.location_id,
      customer_id: lead.customer_id,
      landlord_id: lead.landlord_id,
      contract_date: today,
      start_date: startDateStr,
      end_date: endDateStr,
      monthly_rent: lead.proposed_monthly_rent ?? 0,
      deposit_amount: depositAmount,
      advance_rent_amount: lead.proposed_advance_rent_amount ?? 0,
      other_service_amount: lead.proposed_service_amount ?? 0,
      need_branch_registration: isHouse ? false : (lead.need_branch_registration ?? true),
      need_vat_registration: isHouse ? false : (lead.need_vat_registration ?? false),
      need_employer_change: isHouse ? false : (lead.need_employer_change ?? false),
      need_signboard: isHouse ? false : (lead.need_signboard ?? true),
      status: 'active',
      payment_due_day: leadMeta.financial.payment_due_day || 5,
      assigned_to: lead.assigned_to,
      note: lead.note || null,
    })
    .select()
    .single()

  if (contractError) {
    return { success: false, error: `สร้างสัญญาไม่สำเร็จ: ${contractError.message}` }
  }

  // 5. Update Lead status to 'converted'
  await supabase
    .from('rental_leads')
    .update({
      status: 'converted',
      updated_at: new Date().toISOString(),
    })
    .eq('id', leadId)

  revalidatePath(`/rental-leads/${leadId}`)
  revalidatePath('/rental-leads')
  revalidatePath('/contracts')
  revalidatePath('/rent-payments')
  return { success: true, data: contract }
}
