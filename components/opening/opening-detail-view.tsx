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
} from '@/lib/types/opening'
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_BADGE_VARIANTS,
  TASK_STATUS_LABELS,
  TASK_STATUS_BADGE_VARIANTS,
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

  const badgeVariant =
    PROJECT_STATUS_BADGE_VARIANTS[project.status as OpeningProjectStatus] || {
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: 'border-slate-200',
    }

  const contract = project.rental_contracts
  const tasks = React.useMemo(() => project.opening_tasks || [], [project.opening_tasks])

  // Overall statistics
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
    const res = await updateTaskAction(taskId, project.id, { status: newStatus })

    if (res.success) {
      router.refresh()
    } else {
      setActionError(res.error || 'ไม่สามารถอัปเดตสถานะงานได้')
    }
  }

  const handleUpdateTaskAssigned = async (taskId: string, assignedTo: string) => {
    setActionError(null)
    await updateTaskAction(taskId, project.id, { assigned_to: assignedTo || null })
    router.refresh()
  }

  const handleUpdateTaskDueDate = async (taskId: string, dueDate: string) => {
    setActionError(null)
    await updateTaskAction(taskId, project.id, { due_date: dueDate || null })
    router.refresh()
  }

  const handleDeleteTask = async () => {
    if (!deletingTaskId) return
    setIsPending(true)
    setActionError(null)

    const res = await deleteTaskAction(deletingTaskId, project.id)
    setIsPending(false)

    if (res.success) {
      setDeletingTaskId(null)
      router.refresh()
    } else {
      setActionError(res.error || 'ไม่สามารถลบงานได้')
    }
  }

  const handleToggleChecklist = async (checklistId: string, currentChecked: boolean) => {
    setActionError(null)
    const res = await toggleChecklistAction(checklistId, !currentChecked, project.id)
    if (res.success) {
      router.refresh()
    } else {
      setActionError(res.error || 'ไม่สามารถเปลี่ยนสถานะเช็คลิสต์ได้')
    }
  }

  const handleAddChecklist = async (taskId: string) => {
    const text = newChecklistText[taskId]?.trim()
    if (!text) return

    const isReq = newChecklistRequired[taskId] ?? true
    setActionError(null)

    const res = await addChecklistAction(
      {
        task_id: taskId,
        item_name: text,
        is_required: isReq,
      },
      project.id
    )

    if (res.success) {
      setNewChecklistText((prev) => ({ ...prev, [taskId]: '' }))
      router.refresh()
    } else {
      setActionError(res.error || 'ไม่สามารถเพิ่มเช็คลิสต์ได้')
    }
  }

  const handleDeleteChecklist = async (checklistId: string) => {
    setActionError(null)
    const res = await deleteChecklistAction(checklistId, project.id)
    if (res.success) {
      router.refresh()
    } else {
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
              สาขา: <strong>{contract?.locations?.location_name || '-'}</strong> (
              {contract?.locations?.province}) | สัญญา:{' '}
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
                แก้ไขโครงการ
              </Button>

              <Button
                size="sm"
                onClick={() => setIsAddTaskOpen(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                เพิ่มงานใหม่
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
            ขั้นตอนการเปิดสาขา (13 Workflow Stages)
          </h2>
          <span className="text-[11px] text-slate-500">
            {allowWrite ? 'คลิกที่ขั้นตอนเพื่อขยับ Stage' : 'สัญลักษณ์: ✅ เสร็จสิ้น, 🟡 กำลังทำ, ⚪ รอดำเนินการ'}
          </span>
        </div>

        <StageStepper
          stages={stages}
          currentStageId={project.current_stage_id}
          projectId={project.id}
          allowEdit={allowWrite}
        />
      </div>

      {/* Progress & Target Open Date Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">วันเป้าหมายเปิดสาขา</span>
          <p className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary-600" />
            {project.target_open_date
              ? new Date(project.target_open_date).toLocaleDateString('th-TH')
              : 'ยังไม่กำหนด'}
          </p>
          <span className="text-xs text-slate-400">
            ผู้รับผิดชอบ: {project.profiles?.full_name || project.profiles?.email || 'ยังไม่ระบุ'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">ความคืบหน้างาน (Tasks)</span>
            <span className="text-xs font-bold text-primary-700">{percentComplete}%</span>
          </div>
          <p className="text-lg font-bold text-slate-900 mt-1">
            {doneTasks} / {totalTasks} งานเสร็จสิ้น
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
          <span className="text-xs font-medium text-slate-500">เช็คลิสต์ทั้งหมด</span>
          <p className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-emerald-600" />
            {checkedChecklists} / {totalChecklists} รายการ
          </p>
          <span className="text-xs text-slate-400">
            เช็คลิสต์ที่จำเป็นต้องผ่านครบเพื่อเสร็จสิ้นงาน
          </span>
        </div>
      </div>

      {/* Task List Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            รายการงานและเช็คลิสต์ (Tasks & Checklists)
          </h2>
          <p className="text-xs text-slate-500">
            ติดตามงานย่อยในแต่ละขั้นตอน ติ๊กเช็คลิสต์ และตรวจสอบความพร้อมก่อนส่งมอบ
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
            <option value="all">ทุกขั้นตอน (All Stages)</option>
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
            <option value="all">ทุกสถานะงาน</option>
            {Object.entries(TASK_STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Task Cards */}
      {filteredTasks.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
          <CheckSquare className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm font-medium text-slate-700">ไม่มีรายการงานตามตัวกรอง</p>
          <p className="text-xs text-slate-400">
            คุณสามารถเพิ่มงานใหม่ในโครงการได้ตลอดเวลา
          </p>
          {allowWrite && (
            <Button
              size="sm"
              onClick={() => setIsAddTaskOpen(true)}
              className="mt-4 bg-primary-600 hover:bg-primary-700 text-white"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              เพิ่มงานใหม่
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
                          เกินกำหนดชำระ
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
                      {Object.entries(TASK_STATUS_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      ))}
                    </select>

                    {allowWrite && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingTaskId(task.id)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600"
                        title="ลบงาน"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Assignment & Due Date Meta */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">ผู้รับผิดชอบ:</span>
                    {allowWrite ? (
                      <select
                        aria-label="เปลี่ยนผู้รับผิดชอบ"
                        value={task.assigned_to || ''}
                        onChange={(e) => handleUpdateTaskAssigned(task.id, e.target.value)}
                        className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-0.5 font-medium text-slate-800"
                      >
                        <option value="">-- ไม่ระบุ --</option>
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
                    <span className="text-slate-400">กำหนดเสร็จ:</span>
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
                        {task.due_date ? new Date(task.due_date).toLocaleDateString('th-TH') : '-'}
                      </span>
                    )}
                  </div>

                  {task.completed_at && (
                    <span className="text-emerald-700 text-[11px]">
                      เสร็จเมื่อ {new Date(task.completed_at).toLocaleDateString('th-TH')}
                    </span>
                  )}
                </div>

                {/* Checklists Inside Task */}
                <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600 font-semibold mb-1">
                    <span>
                      เช็คลิสต์ ({checklists.filter((c) => c.is_checked).length}/{checklists.length})
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
                            จำเป็น
                          </span>
                        )}
                      </label>

                      {allowWrite && (
                        <button
                          type="button"
                          onClick={() => handleDeleteChecklist(c.id)}
                          className="text-slate-300 hover:text-rose-500 px-1 text-xs"
                          title="ลบเช็คลิสต์"
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
                        placeholder="เพิ่มรายการเช็คลิสต์..."
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
                        จำเป็น
                      </label>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddChecklist(task.id)}
                        className="h-8 text-xs shrink-0"
                      >
                        เพิ่ม
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
            <DialogTitle>แก้ไขข้อมูลโครงการ</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              ปรับปรุงวันเป้าหมายเปิดสาขา สถานะโครงการ หรือผู้รับผิดชอบ
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                สถานะโครงการ
              </label>
              <Select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as OpeningProjectStatus)}
              >
                {Object.entries(PROJECT_STATUS_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                วันเป้าหมายเปิดสาขา (Target Open Date)
              </label>
              <Input
                type="date"
                value={editTargetDate}
                onChange={(e) => setEditTargetDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ผู้รับผิดชอบโครงการ
              </label>
              <Select
                value={editAssignedTo}
                onChange={(e) => setEditAssignedTo(e.target.value)}
              >
                <option value="">-- ไม่ระบุผู้รับผิดชอบ --</option>
                {staffProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name || p.email}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">หมายเหตุ</label>
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
              ยกเลิก
            </Button>
            <Button
              onClick={handleSaveProjectEdit}
              disabled={isPending}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              {isPending ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>เพิ่มงานใหม่ (New Task)</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              สร้างงานย่อยสำหรับติดตามความพร้อมในการเปิดสาขา
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTask} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ชื่องาน <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                placeholder="เช่น ติดตั้งระบบอินเทอร์เน็ตสาขา"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ขั้นตอน Workflow ที่สังกัด
              </label>
              <Select
                value={newTaskStageId}
                onChange={(e) => setNewTaskStageId(e.target.value)}
              >
                <option value="">-- ไม่ระบุขั้นตอน --</option>
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.sequence}. {s.stage_name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">รายละเอียดงาน</label>
              <Textarea
                rows={2}
                placeholder="ระบุข้อกำหนด หรือสิ่งที่ต้องดำเนินการ..."
                value={newTaskDesc}
                onChange={(e) => setNewTaskDesc(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ผู้รับผิดชอบ
                </label>
                <Select
                  value={newTaskAssignedTo}
                  onChange={(e) => setNewTaskAssignedTo(e.target.value)}
                >
                  <option value="">-- ไม่ระบุ --</option>
                  {staffProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name || p.email}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  วันครบกำหนด
                </label>
                <Input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddTaskOpen(false)}
                disabled={isPending}
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-primary-600 hover:bg-primary-700 text-white"
              >
                {isPending ? 'กำลังบันทึก...' : 'สร้างงาน'}
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
        title="เอกสารแนบ (Opening Project)"
      />

      {/* Delete Task Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(deletingTaskId)}
        onOpenChange={(open) => !open && setDeletingTaskId(null)}
        title="ยืนยันการลบงาน"
        description="คุณแน่ใจหรือไม่ว่าต้องการลบงานนี้? เช็คลิสต์ทั้งหมดในงานนี้จะถูกลบออกด้วย"
        confirmText="ยืนยันลบ"
        cancelText="ยกเลิก"
        variant="danger"
        loading={isPending}
        onConfirm={handleDeleteTask}
      />
    </div>
  )
}
