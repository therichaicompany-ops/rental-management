'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Calendar,
  Building2,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  CheckSquare,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { StageStepper } from './stage-stepper'
import type {
  OpeningProjectWithRelations,
  OpeningProjectStatus,
  TaskStatus,
  WorkflowStageModel,
  OpeningTaskModel,
} from '@/lib/types/opening'
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_BADGE_VARIANTS,
  TASK_STATUS_LABELS,
  TASK_STATUS_BADGE_VARIANTS,
  STAGE_DEFINITIONS,
} from '@/lib/types/opening'
import type { UserRole, UserProfile } from '@/lib/types/auth'
import { canWrite } from '@/lib/auth/permissions'
import {
  updateOpeningProjectAction,
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
  toggleChecklistAction,
  addChecklistAction,
  deleteChecklistAction,
} from '@/lib/actions/opening'
import { DocumentSection } from '@/components/documents/document-section'
import { useI18n } from '@/lib/i18n/context'
import { labelOf, PROJECT_STATUS_TRI, TASK_STATUS_TRI, STAGE_NAME_TRI, W } from '@/lib/i18n/labels'

interface OpeningDetailViewProps {
  project: OpeningProjectWithRelations
  stages: WorkflowStageModel[]
  staffProfiles: Pick<UserProfile, 'id' | 'full_name' | 'email'>[]
  userRole: UserRole
}

export function OpeningDetailView({
  project,
  stages,
  staffProfiles,
  userRole,
}: OpeningDetailViewProps) {
  const { t, locale, tx } = useI18n()
  const intlLocale = locale === 'en' ? 'en-US' : locale === 'my' ? 'my-MM' : 'th-TH'
  const router = useRouter()
  const allowWrite = canWrite(userRole)

  // Filters
  const [stageFilter, setStageFilter] = React.useState<string>('all')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')

  // Modals & States
  const [isEditProjectOpen, setIsEditProjectOpen] = React.useState(false)
  const [isAddTaskOpen, setIsAddTaskOpen] = React.useState(false)
  const [deletingTaskId, setDeletingTaskId] = React.useState<string | null>(null)
  const [actionError, setActionError] = React.useState<string | null>(null)
  const [isPending, setIsPending] = React.useState(false)

  // Inline checklist addition state { [taskId]: text }
  const [newChecklistText, setNewChecklistText] = React.useState<Record<string, string>>({})
  const [newChecklistRequired, setNewChecklistRequired] = React.useState<Record<string, boolean>>({})

  // Form state for Edit Project
  const [editStatus, setEditStatus] = React.useState<OpeningProjectStatus>(project.status)
  const [editTargetDate, setEditTargetDate] = React.useState<string>(project.target_open_date || '')
  const [editAssignedTo, setEditAssignedTo] = React.useState<string>(project.assigned_to || '')
  const [editNote, setEditNote] = React.useState<string>(project.note || '')

  // Form state for Add Task
  const [newTaskName, setNewTaskName] = React.useState('')
  const [newTaskStageId, setNewTaskStageId] = React.useState(project.current_stage_id || '')
  const [newTaskDesc, setNewTaskDesc] = React.useState('')
  const [newTaskAssignedTo, setNewTaskAssignedTo] = React.useState('')
  const [newTaskDueDate, setNewTaskDueDate] = React.useState('')
  const [autoAddChecklists, setAutoAddChecklists] = React.useState(true)

  const badgeVariant =
    PROJECT_STATUS_BADGE_VARIANTS[project.status as OpeningProjectStatus] || {
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: 'border-slate-200',
    }

  const contract = project.rental_contracts

  // Local state for instant optimistic updates
  const [tasks, setTasks] = React.useState<OpeningTaskModel[]>(() => project.opening_tasks || [])
  const [currentStageId, setCurrentStageId] = React.useState<string | null>(
    project.current_stage_id || null
  )

  React.useEffect(() => {
    if (project.opening_tasks) {
      setTasks(project.opening_tasks)
    }
  }, [project.opening_tasks])

  React.useEffect(() => {
    setCurrentStageId(project.current_stage_id || null)
  }, [project.current_stage_id])

  // Overall statistics (derived from state for real-time reactivity)
  const totalTasks = tasks.length
  const doneTasks = tasks.filter((t) => t.status === 'done').length
  const percentComplete = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  let totalChecklists = 0
  let checkedChecklists = 0
  tasks.forEach((t) => {
    (t.task_checklists || []).forEach((c) => {
      totalChecklists += 1
      if (c.is_checked) checkedChecklists += 1
    })
  })

  // Filtered tasks
  const filteredTasks = React.useMemo(() => {
    return tasks.filter((t) => {
      if (stageFilter !== 'all' && t.stage_id !== stageFilter) return false
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      return true
    })
  }, [tasks, stageFilter, statusFilter])

  // Handlers
  const handleSaveProjectEdit = async () => {
    setIsPending(true)
    setActionError(null)

    const res = await updateOpeningProjectAction(project.id, {
      status: editStatus,
      target_open_date: editTargetDate || null,
      assigned_to: editAssignedTo || null,
      note: editNote || null,
    })
    setIsPending(false)

    if (res.success) {
      setIsEditProjectOpen(false)
      router.refresh()
    } else {
      setActionError(res.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลโครงการ')
    }
  }

  const handleStageChangeForNewTask = (stageId: string) => {
    setNewTaskStageId(stageId)
    const st = stages.find((s) => s.id === stageId)
    if (st) {
      const def = STAGE_DEFINITIONS.find((d) => d.code === st.stage_code)
      if (def && def.defaultTasks?.[0]) {
        const isCurrentNameADefault = STAGE_DEFINITIONS.some((d) =>
          d.defaultTasks?.some((t) => t.name === newTaskName.trim())
        )
        if (!newTaskName.trim() || isCurrentNameADefault) {
          setNewTaskName(def.defaultTasks[0].name)
          if (def.defaultTasks[0].description) {
            setNewTaskDesc(def.defaultTasks[0].description)
          }
        }
      }
    }
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskName.trim()) return

    setIsPending(true)
    setActionError(null)

    const res = await createTaskAction({
      opening_project_id: project.id,
      stage_id: newTaskStageId || null,
      task_name: newTaskName.trim(),
      description: newTaskDesc.trim() || null,
      assigned_to: newTaskAssignedTo || null,
      due_date: newTaskDueDate || null,
      status: 'todo',
      auto_create_checklists: autoAddChecklists,
    })
    setIsPending(false)

    if (res.success) {
      setIsAddTaskOpen(false)
      setNewTaskName('')
      setNewTaskDesc('')
      setNewTaskDueDate('')
      router.refresh()
    } else {
      setActionError(res.error || 'เกิดข้อผิดพลาดในการสร้างงาน')
    }
  }

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    setActionError(null)

    const targetTask = tasks.find((t) => t.id === taskId)
    if (!targetTask) return
    const prevStatus = targetTask.status

    // Quick client-side validation
    if (newStatus === 'done') {
      const incompleteRequired = (targetTask.task_checklists || []).filter(
        (c) => c.is_required && !c.is_checked
      )
      if (incompleteRequired.length > 0) {
        setActionError(
          `ไม่สามารถบันทึกเป็น "เสร็จสิ้น" ได้ เนื่องจากยังมีรายการเช็คลิสต์ที่จำเป็น ${incompleteRequired.length} รายการที่ยังไม่ได้ดำเนินการ (${incompleteRequired.map((c) => c.item_name).join(', ')})`
        )
        return
      }
    }

    // 1. Optimistic update (0ms instant UI feedback)
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: newStatus,
              completed_at: newStatus === 'done' ? new Date().toISOString() : null,
            }
          : t
      )
    )

    // 2. Background sync
    const res = await updateTaskAction(taskId, project.id, { status: newStatus })
    if (!res.success) {
      // Revert if error
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: prevStatus, completed_at: targetTask.completed_at }
            : t
        )
      )
      setActionError(res.error || tx({ th: 'ไม่สามารถอัปเดตสถานะงานได้', en: 'Failed to update task status', my: 'လုပ်ငန်းအခြေအနေ ပြင်ဆင်၍မရပါ' }))
    }
  }

  const handleUpdateTaskAssigned = async (taskId: string, assignedTo: string) => {
    setActionError(null)
    const targetTask = tasks.find((t) => t.id === taskId)
    const prevAssigned = targetTask?.assigned_to
    const prevProfiles = targetTask?.profiles
    const staff = staffProfiles.find((p) => p.id === assignedTo)

    // 1. Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              assigned_to: assignedTo || null,
              profiles: staff
                ? { id: staff.id, full_name: staff.full_name, email: staff.email }
                : null,
            }
          : t
      )
    )

    // 2. Background sync
    const res = await updateTaskAction(taskId, project.id, { assigned_to: assignedTo || null })
    if (!res.success) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, assigned_to: prevAssigned ?? null, profiles: prevProfiles ?? null }
            : t
        )
      )
      setActionError(res.error || tx({ th: 'ไม่สามารถอัปเดตผู้รับผิดชอบได้', en: 'Failed to update assignee', my: 'တာဝန်ခံ ပြင်ဆင်၍မရပါ' }))
    }
  }

  const handleUpdateTaskDueDate = async (taskId: string, dueDate: string) => {
    setActionError(null)
    const targetTask = tasks.find((t) => t.id === taskId)
    const prevDueDate = targetTask?.due_date

    // 1. Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, due_date: dueDate || null } : t))
    )

    // 2. Background sync
    const res = await updateTaskAction(taskId, project.id, { due_date: dueDate || null })
    if (!res.success) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, due_date: prevDueDate ?? null } : t))
      )
      setActionError(res.error || tx({ th: 'ไม่สามารถอัปเดตกำหนดเสร็จได้', en: 'Failed to update due date', my: 'ရက်စွဲ ပြင်ဆင်၍မရပါ' }))
    }
  }

  const handleDeleteTask = async () => {
    if (!deletingTaskId) return
    const idToDelete = deletingTaskId
    setDeletingTaskId(null)
    setActionError(null)

    // 1. Optimistic removal (immediate closure and card removal)
    const prevTasks = tasks
    setTasks((prev) => prev.filter((t) => t.id !== idToDelete))

    // 2. Background sync
    const res = await deleteTaskAction(idToDelete, project.id)
    if (!res.success) {
      setTasks(prevTasks)
      setActionError(res.error || tx({ th: 'ไม่สามารถลบงานได้', en: 'Failed to delete task', my: 'လုပ်ငန်း ဖျက်၍မရပါ' }))
    }
  }

  const handleToggleChecklist = async (checklistId: string, currentChecked: boolean) => {
    setActionError(null)
    const nextChecked = !currentChecked

    // 1. Optimistic toggle (0ms instant UI feedback)
    setTasks((prevTasks) =>
      prevTasks.map((t) => ({
        ...t,
        task_checklists: (t.task_checklists || []).map((c) =>
          c.id === checklistId ? { ...c, is_checked: nextChecked } : c
        ),
      }))
    )

    // 2. Background sync
    const res = await toggleChecklistAction(checklistId, nextChecked, project.id)
    if (!res.success) {
      // Revert if error
      setTasks((prevTasks) =>
        prevTasks.map((t) => ({
          ...t,
          task_checklists: (t.task_checklists || []).map((c) =>
            c.id === checklistId ? { ...c, is_checked: currentChecked } : c
          ),
        }))
      )
      setActionError(res.error || tx({ th: 'ไม่สามารถเปลี่ยนสถานะเช็คลิสต์ได้', en: 'Failed to toggle checklist', my: 'စစ်ဆေးချက် အခြေအနေ ပြောင်း၍မရပါ' }))
    }
  }

  const handleAddChecklist = async (taskId: string) => {
    const text = newChecklistText[taskId]?.trim()
    if (!text) return

    const isReq = newChecklistRequired[taskId] ?? true
    const tempId = `temp-${Date.now()}`
    setActionError(null)

    // Reset input immediately
    setNewChecklistText((prev) => ({ ...prev, [taskId]: '' }))

    // 1. Optimistic append
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              task_checklists: [
                ...(t.task_checklists || []),
                {
                  id: tempId,
                  task_id: taskId,
                  item_name: text,
                  is_required: isReq,
                  is_checked: false,
                  checked_by: null,
                  checked_at: null,
                  created_at: new Date().toISOString(),
                },
              ],
            }
          : t
      )
    )

    // 2. Background sync
    const res = await addChecklistAction(
      {
        task_id: taskId,
        item_name: text,
        is_required: isReq,
      },
      project.id
    )

    if (res.success && res.data) {
      const realItem = res.data as { id: string }
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                task_checklists: (t.task_checklists || []).map((c) =>
                  c.id === tempId ? { ...c, id: realItem.id } : c
                ),
              }
            : t
        )
      )
    } else {
      // Revert if error
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                task_checklists: (t.task_checklists || []).filter((c) => c.id !== tempId),
              }
            : t
        )
      )
      setActionError(res.error || tx({ th: 'ไม่สามารถเพิ่มเช็คลิสต์ได้', en: 'Failed to add checklist', my: 'စစ်ဆေးချက် ပေါင်းထည့်၍မရပါ' }))
    }
  }

  const handleDeleteChecklist = async (taskId: string, checklistId: string) => {
    setActionError(null)

    // 1. Optimistic delete (0ms instant UI feedback)
    const prevTasks = tasks
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              task_checklists: (t.task_checklists || []).filter((c) => c.id !== checklistId),
            }
          : t
      )
    )

    // 2. Background sync
    const res = await deleteChecklistAction(checklistId, project.id)
    if (!res.success) {
      setTasks(prevTasks)
      setActionError(res.error || 'ไม่สามารถลบเช็คลิสต์ได้')
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="h-9 w-9 p-0">
            <Link href="/opening">
              <ArrowLeft className="h-5 w-5 text-slate-500" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {project.project_no}
              </h1>
              <Badge
                variant="outline"
                className={`${badgeVariant.bg} ${badgeVariant.text} ${badgeVariant.border} text-xs font-semibold`}
              >
                {PROJECT_STATUS_LABELS[project.status as OpeningProjectStatus] || project.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {tx({ th: 'สาขา: ', en: 'Branch: ', my: 'ရုံးခွဲ: ' })}<strong>{contract?.locations?.location_name || '-'}</strong> (
              {contract?.locations?.province}) | {tx({ th: 'สัญญา: ', en: 'Contract: ', my: 'စာချုပ်: ' })}{' '}
              {contract ? (
                <Link
                  href={`/contracts/${contract.id}`}
                  className="text-primary-600 hover:underline inline-flex items-center gap-0.5"
                >
                  {contract.contract_no}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              ) : (
                '-'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {allowWrite && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditProjectOpen(true)}
              >
                <Edit className="mr-1.5 h-3.5 w-3.5" />
                {tx({ th: 'แก้ไขโครงการ', en: 'Edit Project', my: 'စီမံကိန်း ပြင်ဆင်ရန်' })}
              </Button>

              <Button
                size="sm"
                onClick={() => setIsAddTaskOpen(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                {tx({ th: 'เพิ่มงานใหม่', en: 'Add Task', my: 'လုပ်ငန်းသစ် ထည့်ရန်' })}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Global Action Error Banner */}
      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-rose-600 hover:text-rose-800 font-bold ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* 13 Workflow Stages Stepper */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h2 className="text-xs font-bold text-slate-900 tracking-wide uppercase flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary-600" />
            {tx({ th: 'ขั้นตอนการเปิดสาขา', en: 'Branch Opening Stages', my: 'ဆိုင်ခွဲဖွင့်လှစ်ခြင်း အဆင့်များ' })} ({stages.length} Stages)
          </h2>
          <span className="text-[11px] text-slate-500">
            {allowWrite ? tx({ th: 'คลิกที่ขั้นตอนเพื่อขยับ Stage', en: 'Click stage to advance', my: 'အဆင့်ရွှေ့ရန် နှိပ်ပါ' }) : tx({ th: 'สัญลักษณ์: ✅ เสร็จสิ้น, 🟡 กำลังทำ, ⚪ รอดำเนินการ', en: 'Legend: ✅ Done, 🟡 In Progress, ⚪ Pending', my: 'အမှတ်အသား: ✅ ပြီးစီး၊ 🟡 လုပ်ဆောင်ဆဲ၊ ⚪ စောင့်ဆိုင်းဆဲ' })}
          </span>
        </div>

        <StageStepper
          stages={stages}
          currentStageId={currentStageId}
          projectId={project.id}
          allowEdit={allowWrite}
          onStageChange={setCurrentStageId}
        />
      </div>

      {/* Progress & Target Open Date Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">{tx({ th: 'วันเป้าหมายเปิดสาขา', en: 'Target Opening Date', my: 'ဆိုင်ဖွင့်ရန် ရည်မှန်းရက်' })}</span>
          <p className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary-600" />
            {project.target_open_date
              ? new Date(project.target_open_date).toLocaleDateString(intlLocale)
              : tx({ th: 'ยังไม่กำหนด', en: 'Not set', my: 'မသတ်မှတ်ရသေး' })}
          </p>
          <span className="text-xs text-slate-400">
            {tx({ th: 'ผู้รับผิดชอบ', en: 'Assignee', my: 'တာဝန်ခံ' })}: {project.profiles?.full_name || project.profiles?.email || tx({ th: 'ยังไม่ระบุ', en: 'Unassigned', my: 'မသတ်မှတ်ရသေး' })}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">{tx({ th: 'ความคืบหน้างาน (Tasks)', en: 'Task Progress', my: 'လုပ်ငန်း တိုးတက်မှု' })}</span>
            <span className="text-xs font-bold text-primary-700">{percentComplete}%</span>
          </div>
          <p className="text-lg font-bold text-slate-900 mt-1">
            {doneTasks} / {totalTasks} {tx({ th: 'งานเสร็จสิ้น', en: 'tasks completed', my: 'ပြီးစီး' })}
          </p>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                percentComplete === 100
                  ? 'bg-emerald-500'
                  : percentComplete > 0
                  ? 'bg-amber-500'
                  : 'bg-slate-300'
              }`}
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">{tx({ th: 'เช็คลิสต์ทั้งหมด', en: 'Total Checklists', my: 'စစ်ဆေးချက် စုစုပေါင်း' })}</span>
          <p className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-emerald-600" />
            {checkedChecklists} / {totalChecklists} {tx({ th: 'รายการ', en: 'items', my: 'ခု' })}
          </p>
          <span className="text-xs text-slate-400">
            {tx({ th: 'เช็คลิสต์ที่จำเป็นต้องผ่านครบเพื่อเสร็จสิ้นงาน', en: 'Required checklists must be passed to complete tasks', my: 'ပြီးစီးရန် လိုအပ်သော စစ်ဆေးချက်များ အားလုံး အောင်မြင်ရမည်' })}
          </span>
        </div>
      </div>

      {/* Task List Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            {tx({ th: 'รายการงานและเช็คลิสต์ (Tasks & Checklists)', en: 'Tasks & Checklists', my: 'လုပ်ငန်းများနှင့် စစ်ဆေးချက်များ' })}
          </h2>
          <p className="text-xs text-slate-500">
            {tx({ th: 'ติดตามงานย่อยในแต่ละขั้นตอน ติ๊กเช็คลิสต์ และตรวจสอบความพร้อมก่อนส่งมอบ', en: 'Track subtasks in each stage, tick checklists, and verify readiness', my: 'အဆင့်တိုင်းရှိ လုပ်ငန်းခွဲများကို စစ်ဆေးပြီး အဆင်သင့်ဖြစ်မှုကို အတည်ပြုပါ' })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Stage Filter */}
          <select
            aria-label="กรองขั้นตอน"
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700"
          >
            <option value="all">{tx({ th: 'ทุกขั้นตอน (All Stages)', en: 'All Stages', my: 'အဆင့်အားလုံး' })}</option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.sequence}. {s.stage_name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            aria-label="กรองสถานะงาน"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700"
          >
            <option value="all">{tx({ th: 'ทุกสถานะงาน', en: 'All Statuses', my: 'အခြေအနေ အားလုံး' })}</option>
            {Object.entries(TASK_STATUS_TRI).map(([val]) => (
              <option key={val} value={val}>
                {labelOf(TASK_STATUS_TRI, val, locale)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Task Cards */}
      {filteredTasks.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
          <CheckSquare className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm font-medium text-slate-700">{tx({ th: 'ไม่มีรายการงานตามตัวกรอง', en: 'No tasks matching filters', my: 'သတ်မှတ်ချက်နှင့်ကိုက်ညီသော လုပ်ငန်း မရှိပါ' })}</p>
          <p className="text-xs text-slate-400">
            {tx({ th: 'คุณสามารถเพิ่มงานใหม่ในโครงการได้ตลอดเวลา', en: 'You can add new tasks to this project anytime.', my: 'စီမံကိန်းထဲသို့ လုပ်ငန်းသစ် အချိန်မရွေး ထည့်သွင်းနိုင်သည်' })}
          </p>
          {allowWrite && (
            <Button
              size="sm"
              onClick={() => setIsAddTaskOpen(true)}
              className="mt-4 bg-primary-600 hover:bg-primary-700 text-white"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              {tx({ th: 'เพิ่มงานใหม่', en: 'Add Task', my: 'လုပ်ငန်း အသစ်ထည့်မည်' })}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => {
            const taskBadge =
              TASK_STATUS_BADGE_VARIANTS[task.status as TaskStatus] || {
                bg: 'bg-slate-100',
                text: 'text-slate-600',
                border: 'border-slate-200',
              }

            const checklists = task.task_checklists || []
            const isDone = task.status === 'done'
            const isOverdue =
              task.due_date &&
              new Date(task.due_date) < new Date() &&
              task.status !== 'done' &&
              task.status !== 'cancelled'

            return (
              <div
                key={task.id}
                className={`bg-white rounded-xl border shadow-sm transition-all p-5 space-y-4 ${
                  isDone
                    ? 'border-emerald-200 bg-emerald-50/10'
                    : isOverdue
                    ? 'border-rose-200'
                    : 'border-slate-200'
                }`}
              >
                {/* Task Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className={`text-sm font-bold ${
                          isDone ? 'line-through text-slate-500' : 'text-slate-900'
                        }`}
                      >
                        {task.task_name}
                      </h3>

                      {task.workflow_stages && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                          {task.workflow_stages.sequence}. {task.workflow_stages.stage_name}
                        </span>
                      )}

                      {isOverdue && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                          {tx({ th: 'เกินกำหนด', en: 'Overdue', my: 'ရက်လွန်' })}
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-500">{task.description}</p>
                    )}
                  </div>

                  {/* Task Controls: Status & Delete */}
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      aria-label="สถานะงาน"
                      value={task.status}
                      disabled={!allowWrite}
                      onChange={(e) =>
                        handleUpdateTaskStatus(task.id, e.target.value as TaskStatus)
                      }
                      className={`text-xs font-semibold rounded-lg px-2.5 py-1.5 border focus:outline-none focus:ring-2 focus:ring-primary-500 ${taskBadge.bg} ${taskBadge.text} ${taskBadge.border}`}
                    >
                      {Object.entries(TASK_STATUS_TRI).map(([val]) => (
                        <option key={val} value={val}>
                          {labelOf(TASK_STATUS_TRI, val, locale)}
                        </option>
                      ))}
                    </select>

                    {allowWrite && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingTaskId(task.id)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600"
                        title={tx({ th: 'ลบงาน', en: 'Delete Task', my: 'လုပ်ငန်း ဖျက်ရန်' })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Assignment & Due Date Meta */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">{tx({ th: 'ผู้รับผิดชอบ:', en: 'Assignee:', my: 'တာဝန်ခံ:' })}</span>
                    {allowWrite ? (
                      <select
                        aria-label="เปลี่ยนผู้รับผิดชอบ"
                        value={task.assigned_to || ''}
                        onChange={(e) => handleUpdateTaskAssigned(task.id, e.target.value)}
                        className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-0.5 font-medium text-slate-800"
                      >
                        <option value="">-- {tx({ th: 'ไม่ระบุ', en: 'Unassigned', my: 'မသတ်မှတ်' })} --</option>
                        {staffProfiles.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.full_name || p.email}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="font-medium">
                        {task.profiles?.full_name || task.profiles?.email || 'ยังไม่ระบุ'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">{tx({ th: 'กำหนดเสร็จ:', en: 'Due Date:', my: 'ရက်စွဲ:' })}</span>
                    {allowWrite ? (
                      <input
                        type="date"
                        aria-label="กำหนดวันเสร็จ"
                        value={task.due_date || ''}
                        onChange={(e) => handleUpdateTaskDueDate(task.id, e.target.value)}
                        className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-0.5 font-medium text-slate-800"
                      />
                    ) : (
                      <span className="font-medium">
                        {task.due_date ? new Date(task.due_date).toLocaleDateString(intlLocale) : '-'}
                      </span>
                    )}
                  </div>

                  {task.completed_at ? (
                    <span className="text-emerald-700 text-[11px] flex items-center gap-1">
                      ✓ {tx({ th: 'เสร็จเมื่อ', en: 'Done at', my: 'ပြီးစီးသည့်ရက်' })} {new Date(task.completed_at).toLocaleDateString(intlLocale, { day: '2-digit', month: 'short', year: '2-digit' })}
                    </span>
                  ) : task.updated_at && task.status !== 'todo' ? (
                    <span className="text-amber-600 text-[11px]">
                      {tx({ th: 'อัปเดต', en: 'Updated', my: 'ပြင်ဆင်သည့်ရက်' })} {new Date(task.updated_at).toLocaleDateString(intlLocale, { day: '2-digit', month: 'short', year: '2-digit' })}
                    </span>
                  ) : null}
                </div>

                {/* Checklists Inside Task */}
                <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600 font-semibold mb-1">
                    <span>
                      {tx({ th: 'เช็คลิสต์', en: 'Checklist', my: 'စစ်ဆေးချက်' })} ({checklists.filter((c) => c.is_checked).length}/{checklists.length})
                    </span>
                  </div>

                  {checklists.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-2 p-1.5 bg-white rounded border border-slate-100 hover:border-slate-200 transition-colors"
                    >
                      <label className="flex items-center gap-2 cursor-pointer text-xs flex-1">
                        <input
                          type="checkbox"
                          checked={c.is_checked}
                          disabled={!allowWrite}
                          onChange={() => handleToggleChecklist(c.id, c.is_checked)}
                          className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span
                          className={`${
                            c.is_checked ? 'line-through text-slate-400' : 'text-slate-800'
                          }`}
                        >
                          {c.item_name}
                        </span>
                        {c.is_required && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-600 border border-rose-200 font-medium">
                            {tx({ th: 'จำเป็น', en: 'Required', my: 'မဖြစ်မနေ' })}
                          </span>
                        )}
                      </label>

                      {allowWrite && (
                        <button
                          type="button"
                          onClick={() => handleDeleteChecklist(task.id, c.id)}
                          className="text-slate-300 hover:text-rose-500 px-1 text-xs"
                          title={tx({ th: 'ลบเช็คลิสต์', en: 'Delete checklist', my: 'စစ်ဆေးချက် ဖျက်ရန်' })}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Add Checklist Inline */}
                  {allowWrite && (
                    <div className="flex items-center gap-2 pt-1.5">
                      <Input
                        placeholder={tx({ th: 'เพิ่มรายการเช็คลิสต์...', en: 'Add checklist item...', my: 'စစ်ဆေးချက် ထည့်ရန်...' })}
                        value={newChecklistText[task.id] || ''}
                        onChange={(e) =>
                          setNewChecklistText((prev) => ({ ...prev, [task.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddChecklist(task.id)
                          }
                        }}
                        className="h-8 text-xs bg-white"
                      />

                      <label className="flex items-center gap-1 text-[11px] text-slate-600 shrink-0 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newChecklistRequired[task.id] ?? true}
                          onChange={(e) =>
                            setNewChecklistRequired((prev) => ({
                              ...prev,
                              [task.id]: e.target.checked,
                            }))
                          }
                          className="h-3.5 w-3.5 rounded border-slate-300 text-primary-600"
                        />
                        {tx({ th: 'จำเป็น', en: 'Required', my: 'မဖြစ်မနေ' })}
                      </label>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddChecklist(task.id)}
                        className="h-8 text-xs shrink-0"
                      >
                        {tx({ th: 'เพิ่ม', en: 'Add', my: 'ထည့်ရန်' })}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Project Dialog */}
      <Dialog open={isEditProjectOpen} onOpenChange={setIsEditProjectOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{tx({ th: 'แก้ไขข้อมูลโครงการ', en: 'Edit Opening Project', my: 'စီမံကိန်း အချက်အလက် ပြင်ဆင်ရန်' })}</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {tx({ th: 'ปรับปรุงวันเป้าหมายเปิดสาขา สถานะโครงการ หรือผู้รับผิดชอบ', en: 'Update target opening date, status, or assignee', my: 'ရည်မှန်းရက်၊ အခြေအနေ သို့မဟုတ် တာဝန်ခံကို ပြင်ဆင်ပါ' })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {tx({ th: 'สถานะโครงการ', en: 'Project Status', my: 'စီမံကိန်း အခြေအနေ' })}
              </label>
              <Select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as OpeningProjectStatus)}
              >
                {Object.entries(PROJECT_STATUS_TRI).map(([val]) => (
                  <option key={val} value={val}>
                    {labelOf(PROJECT_STATUS_TRI, val, locale)}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {tx({ th: 'วันเป้าหมายเปิดสาขา (Target Open Date)', en: 'Target Opening Date', my: 'ဆိုင်ဖွင့်ရန် ရည်မှန်းရက်' })}
              </label>
              <Input
                type="date"
                value={editTargetDate}
                onChange={(e) => setEditTargetDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {tx({ th: 'ผู้รับผิดชอบโครงการ', en: 'Project Manager / Assignee', my: 'စီမံကိန်း တာဝန်ခံ' })}
              </label>
              <Select
                value={editAssignedTo}
                onChange={(e) => setEditAssignedTo(e.target.value)}
              >
                <option value="">-- {tx({ th: 'ไม่ระบุผู้รับผิดชอบ', en: 'Unassigned', my: 'တာဝန်ခံ မသတ်မှတ်' })} --</option>
                {staffProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name || p.email}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{tx({ th: 'หมายเหตุ', en: 'Notes', my: 'မှတ်ချက်' })}</label>
              <Textarea
                rows={2}
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => setIsEditProjectOpen(false)}
              disabled={isPending}
            >
              {t.common.cancel}
            </Button>
            <Button
              onClick={handleSaveProjectEdit}
              disabled={isPending}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              {isPending ? tx({ th: 'กำลังบันทึก...', en: 'Saving...', my: 'သိမ်းဆည်းနေသည်...' }) : tx({ th: 'บันทึกการเปลี่ยนแปลง', en: 'Save Changes', my: 'အပြောင်းအလဲ သိမ်းဆည်းရန်' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{tx({ th: 'เพิ่มงานใหม่ (New Task)', en: 'New Task', my: 'လုပ်ငန်းသစ်' })}</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {tx({ th: 'สร้างงานย่อยสำหรับติดตามความพร้อมในการเปิดสาขา', en: 'Create subtask to track branch readiness', my: 'ဆိုင်ဖွင့်လှစ်ရန် အဆင်သင့်ဖြစ်မှုကို ခြေရာခံမည့် လုပ်ငန်းခွဲ ဖန်တီးပါ' })}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTask} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {tx({ th: 'ชื่องาน', en: 'Task Name', my: 'လုပ်ငန်းအမည်' })} <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                placeholder={tx({ th: 'เช่น ติดตั้งระบบอินเทอร์เน็ตสาขา', en: 'e.g. Install internet system', my: 'ဥပမာ အင်တာနက်စနစ် တပ်ဆင်ခြင်း' })}
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {tx({ th: 'ขั้นตอน Workflow ที่สังกัด', en: 'Assigned Workflow Stage', my: 'သက်ဆိုင်ရာ လုပ်ငန်းစဉ်အဆင့်' })}
              </label>
              <Select
                value={newTaskStageId}
                onChange={(e) => handleStageChangeForNewTask(e.target.value)}
              >
                <option value="">-- {tx({ th: 'ไม่ระบุขั้นตอน', en: 'Unassigned Stage', my: 'အဆင့် မသတ်မှတ်' })} --</option>
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.sequence}. {s.stage_name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">{tx({ th: 'รายละเอียดงาน', en: 'Task Description', my: 'လုပ်ငန်း အသေးစိတ်' })}</label>
              <Textarea
                rows={2}
                placeholder={tx({ th: 'ระบุข้อกำหนด หรือสิ่งที่ต้องดำเนินการ...', en: 'Requirements or action items...', my: 'လိုအပ်ချက်များ သို့မဟုတ် ဆောင်ရွက်ရမည့် အချက်များ...' })}
                value={newTaskDesc}
                onChange={(e) => setNewTaskDesc(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {tx({ th: 'ผู้รับผิดชอบ', en: 'Assignee', my: 'တာဝန်ခံ' })}
                </label>
                <Select
                  value={newTaskAssignedTo}
                  onChange={(e) => setNewTaskAssignedTo(e.target.value)}
                >
                  <option value="">{tx({ th: '-- ไม่ระบุ --', en: '-- Unassigned --', my: '-- သတ်မှတ်မထားပါ --' })}</option>
                  {staffProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name || p.email}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {tx({ th: 'วันครบกำหนด', en: 'Due Date', my: 'ရက်စွဲ' })}
                </label>
                <Input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                />
              </div>
            </div>

            {/* Default Checklists Preview & Auto-generation Toggle */}
            {(() => {
              const targetStage = stages.find((s) => s.id === newTaskStageId)
              const targetStageDef = targetStage
                ? STAGE_DEFINITIONS.find((d) => d.code === targetStage.stage_code)
                : STAGE_DEFINITIONS.find((d) =>
                    (d.defaultTasks || []).some((t) => t.name === newTaskName.trim())
                  )
              const matchedTask =
                targetStageDef?.defaultTasks?.find((t) => t.name === newTaskName.trim()) ||
                targetStageDef?.defaultTasks?.[0]
              const previewChecklists = matchedTask?.checklists || []

              if (previewChecklists.length === 0) return null

              return (
                <div className="rounded-lg border border-primary-200/80 bg-primary-50/40 p-3 text-xs space-y-2">
                  <label className="flex items-center gap-2 font-medium text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoAddChecklists}
                      onChange={(e) => setAutoAddChecklists(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span>
                      {tx({ th: 'เพิ่มเช็คลิสต์เริ่มต้นให้อัตโนมัติ', en: 'Auto-add default checklists', my: 'မူလစစ်ဆေးချက်များကို အလိုအလျောက် ထည့်ရန်' })} ({previewChecklists.length} {tx({ th: 'รายการ', en: 'items', my: 'ခု' })})
                    </span>
                  </label>
                  {autoAddChecklists && (
                    <div className="max-h-36 overflow-y-auto space-y-1 pl-6 pt-1 text-slate-600">
                      {previewChecklists.map((c, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between py-0.5 border-b border-slate-100 last:border-b-0"
                        >
                          <span className="truncate pr-2">• {c.name}</span>
                          {c.is_required ? (
                            <span className="shrink-0 text-[10px] bg-rose-50 text-rose-600 border border-rose-200/60 px-1.5 py-0.5 rounded font-medium">
                              {tx({ th: 'จำเป็น', en: 'Required', my: 'မဖြစ်မနေ' })}
                            </span>
                          ) : (
                            <span className="shrink-0 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">
                              {tx({ th: 'ไม่บังคับ', en: 'Optional', my: 'ရွေးချယ်နိုင်' })}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddTaskOpen(false)}
                disabled={isPending}
              >
                {tx({ th: 'ยกเลิก', en: 'Cancel', my: 'ပယ်ဖျက်မည်' })}
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-primary-600 hover:bg-primary-700 text-white"
              >
                {isPending ? tx({ th: 'กำลังบันทึก...', en: 'Saving...', my: 'သိမ်းဆည်းနေသည်...' }) : tx({ th: 'สร้างงาน', en: 'Create Task', my: 'လုပ်ငန်း ဖန်တီးရန်' })}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Documents */}
      <DocumentSection
        entityType="opening_project"
        entityId={project.id}
        userRole={userRole}
        defaultDocumentType="BRANCH_DOCUMENT"
        title={tx({ th: 'เอกสารแนบ (Opening Project)', en: 'Opening Project Attachments', my: 'ဆိုင်ဖွင့်ပွဲ စီမံကိန်း စာရွက်စာတမ်းများ' })}
      />

      {/* Delete Task Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(deletingTaskId)}
        onOpenChange={(open) => !open && setDeletingTaskId(null)}
        title={tx({ th: 'ยืนยันการลบงาน', en: 'Confirm Deleting Task', my: 'ဖျက်ရန် အတည်ပြုပါ' })}
        description={tx({ th: 'คุณแน่ใจหรือไม่ว่าต้องการลบงานนี้? เช็คลิสต์ทั้งหมดในงานนี้จะถูกลบออกด้วย', en: 'Are you sure you want to delete this task? All checklists will also be deleted.', my: 'ဤလုပ်ငန်းကို ဖျက်ရန် သေချာပါသလား? ပါဝင်သော စစ်ဆေးချက်များ အားလုံး ပျက်ပြယ်သွားပါမည်။' })}
        confirmText={tx({ th: 'ยืนยันลบ', en: 'Confirm Delete', my: 'ဖျက်ပစ်ပါ' })}
        cancelText={t.common.cancel}
        variant="danger"
        loading={isPending}
        onConfirm={handleDeleteTask}
      />
    </div>
  )
}
