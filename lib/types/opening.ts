import { z } from 'zod'
import type { UserProfile } from './auth'
import type { Location } from './master-data'

// ----------------------------------------------------------------
// Enums & Types
// ----------------------------------------------------------------
export type OpeningProjectStatus =
  | 'not_started'
  | 'in_progress'
  | 'on_hold'
  | 'ready_to_open'
  | 'opened'
  | 'cancelled'

export type TaskStatus =
  | 'todo'
  | 'in_progress'
  | 'waiting'
  | 'done'
  | 'skipped'
  | 'cancelled'

// ----------------------------------------------------------------
// 13 Workflow Stages Definition
// ----------------------------------------------------------------
export interface StageDefinition {
  code: string
  name: string
  sequence: number
  description: string
  requiresCondition?: 'need_branch_registration' | 'need_signboard' | 'need_employer_change' | 'need_vat_registration'
  defaultTasks?: {
    name: string
    description?: string
    checklists?: { name: string; is_required: boolean }[]
  }[]
}

export const STAGE_DEFINITIONS: StageDefinition[] = [
  {
    code: 'NEGOTIATION',
    name: 'เจรจาเงื่อนไข',
    sequence: 1,
    description: 'พูดคุยเงื่อนไขค่าเช่าและข้อกำหนดเบื้องต้น',
    defaultTasks: [
      {
        name: 'สรุปเงื่อนไขการเช่าเบื้องต้น',
        description: 'ตรวจสอบความต้องการของพื้นที่และค่าเช่า',
        checklists: [
          { name: 'ตรวจสอบราคาค่าเช่าที่ตกลง', is_required: true },
          { name: 'ตรวจสอบเงื่อนไขเงินมัดจำ', is_required: true },
        ],
      },
    ],
  },
  {
    code: 'AGREED',
    name: 'ตกลงเงื่อนไข',
    sequence: 2,
    description: 'คู่สัญญาตกลงรับเงื่อนไขเรียบร้อยแล้ว',
    defaultTasks: [
      {
        name: 'จัดทำเอกสารยืนยันข้อตกลง',
        checklists: [{ name: 'ยืนยันใบเสนอราคา/บันทึกข้อตกลง', is_required: true }],
      },
    ],
  },
  {
    code: 'DEPOSIT',
    name: 'วางมัดจำ',
    sequence: 3,
    description: 'ชำระเงินมัดจำและเงินประกันตามสัญญา',
    defaultTasks: [
      {
        name: 'ตรวจสอบการชำระเงินมัดจำ',
        checklists: [
          { name: 'แนบหลักฐานสลิปการโอนเงินมัดจำ', is_required: true },
          { name: 'ออกใบเสร็จ/ใบรับเงินมัดจำ', is_required: false },
        ],
      },
    ],
  },
  {
    code: 'CONTRACT',
    name: 'เซ็นสัญญา',
    sequence: 4,
    description: 'ลงนามในสัญญาเช่าอย่างเป็นทางการ',
    defaultTasks: [
      {
        name: 'ลงนามสัญญาเช่าฉบับสมบูรณ์',
        checklists: [
          { name: 'คู่สัญญาเซ็นครบทุกหน้า', is_required: true },
          { name: 'ติดอากรแสตมป์ถูกต้องตามกฎหมาย', is_required: true },
          { name: 'สแกนไฟล์สัญญาเข้าระบบ', is_required: true },
        ],
      },
    ],
  },
  {
    code: 'DOCUMENT_CHECK',
    name: 'ตรวจสอบเอกสาร',
    sequence: 5,
    description: 'รวบรวมและตรวจสอบเอกสารสิทธิ์และทะเบียน',
    defaultTasks: [
      {
        name: 'ตรวจสอบเอกสารประกอบสัญญาและสิทธิ์สถานที่',
        checklists: [
          { name: 'สำเนาโฉนดที่ดิน/สัญญาเช่าหลัก', is_required: true },
          { name: 'สำเนาบัตรประชาชน/หนังสือรับรองบริษัทผู้ให้เช่า', is_required: true },
          { name: 'หนังสือยินยอมให้ใช้สถานที่จัดตั้งสาขา', is_required: true },
          { name: 'สำเนาทะเบียนบ้านของสถานที่เช่า', is_required: true },
        ],
      },
    ],
  },
  {
    code: 'SEND_ACCOUNTING',
    name: 'ส่งเรื่องบัญชี',
    sequence: 6,
    description: 'ส่งเรื่องและเอกสารให้ฝ่ายบัญชีเพื่อตั้งงวดชำระ',
    defaultTasks: [
      {
        name: 'ส่งเรื่องเปิดรหัสสาขาและตั้งงวดบัญชี',
        checklists: [
          { name: 'ส่งสัญญาเช่าให้แผนกบัญชี', is_required: true },
          { name: 'ตั้งตารางงวดค่าเช่าในระบบ', is_required: true },
          { name: 'ยืนยันอัตราภาษีหัก ณ ที่จ่าย', is_required: true },
        ],
      },
    ],
  },
  {
    code: 'BRANCH_REGISTRATION',
    name: 'จดทะเบียนสาขา',
    sequence: 7,
    description: 'ดำเนินการจดทะเบียนจัดตั้งสาขาต่อกรมพัฒนาธุรกิจการค้า',
    requiresCondition: 'need_branch_registration',
    defaultTasks: [
      {
        name: 'จดทะเบียนจัดตั้งสาขา (DBD)',
        checklists: [
          { name: 'จัดทำแบบคำขอจดทะเบียนสาขา', is_required: true },
          { name: 'กรรมการลงนามแบบคำขอ', is_required: true },
          { name: 'ยื่นจดทะเบียนต่อ DBD เรียบร้อย', is_required: true },
          { name: 'ได้รับหนังสือรับรองสาขาฉบับใหม่', is_required: true },
        ],
      },
    ],
  },
  {
    code: 'SIGNBOARD',
    name: 'ขออนุญาตป้าย',
    sequence: 8,
    description: 'ยื่นแบบและขออนุญาตติดตั้งป้ายสาขาต่อหน่วยงานท้องถิ่น',
    requiresCondition: 'need_signboard',
    defaultTasks: [
      {
        name: 'ยื่นขออนุญาตติดตั้งป้ายและชำระภาษีป้าย',
        checklists: [
          { name: 'วัดขนาดและถ่ายรูปจุดติดตั้งป้าย', is_required: true },
          { name: 'ยื่นแบบขออนุญาตต่อเทศบาล/เขต', is_required: true },
          { name: 'ได้รับใบอนุญาต/ชำระภาษีป้าย', is_required: true },
        ],
      },
    ],
  },
  {
    code: 'EMPLOYMENT_CHANGE',
    name: 'แจ้งย้าย/ขึ้นทะเบียนนายจ้าง',
    sequence: 9,
    description: 'ดำเนินการแจ้งย้ายหรือขึ้นทะเบียนสาขากับประกันสังคม',
    requiresCondition: 'need_employer_change',
    defaultTasks: [
      {
        name: 'ดำเนินการประกันสังคมสาขา',
        checklists: [
          { name: 'ยื่นแบบแจ้งจัดตั้งสาขากับ สปส.', is_required: true },
          { name: 'ผูกระบบพนักงานประจำสาขา', is_required: true },
        ],
      },
    ],
  },
  {
    code: 'JOB_APPROVAL',
    name: 'อนุมัติงาน/เปิดระบบ',
    sequence: 10,
    description: 'อนุมัติระบบ IT, POS, และเครื่องมือการทำงาน',
    defaultTasks: [
      {
        name: 'ติดตั้งและทดสอบระบบในสาขา',
        checklists: [
          { name: 'ติดตั้งระบบอินเทอร์เน็ตและเครือข่าย', is_required: true },
          { name: 'ติดตั้งระบบขาย/POS/กล้องวงจรปิด', is_required: true },
          { name: 'ทดสอบการส่งข้อมูลเข้าระบบส่วนกลาง', is_required: true },
        ],
      },
    ],
  },
  {
    code: 'PRE_OPEN_SIGN',
    name: 'ลงนามก่อนเปิดสาขา',
    sequence: 11,
    description: 'ฝ่ายบริหารและผู้เกี่ยวข้องตรวจสอบและลงนามอนุมัติเปิด',
    defaultTasks: [
      {
        name: 'ตรวจสอบความพร้อมรอบสุดท้ายและลงนามอนุมัติ',
        checklists: [
          { name: 'ตรวจรับการตกแต่งสถานที่และการส่งมอบ', is_required: true },
          { name: 'ผู้จัดการเขต/ฝ่ายปฏิบัติการลงนามอนุมัติ', is_required: true },
        ],
      },
    ],
  },
  {
    code: 'READY_TO_OPEN',
    name: 'พร้อมเปิดสาขา',
    sequence: 12,
    description: 'เตรียมการขาย สินค้า และพนักงานพร้อมเริ่มดำเนินงาน',
    defaultTasks: [
      {
        name: 'ส่งมอบพื้นที่และเตรียมเปิดบริการ',
        checklists: [
          { name: 'สต็อกสินค้าพร้อมจำหน่าย', is_required: true },
          { name: 'พนักงานประจำสาขาพร้อมปฏิบัติงาน', is_required: true },
        ],
      },
    ],
  },
  {
    code: 'OPENED',
    name: 'เปิดสาขาเรียบร้อย',
    sequence: 13,
    description: 'เปิดให้บริการอย่างเป็นทางการเรียบร้อย',
    defaultTasks: [
      {
        name: 'ยืนยันวันเปิดให้บริการจริง',
        checklists: [
          { name: 'เปิดบริการวันแรกเรียบร้อย', is_required: true },
          { name: 'อัปเดตสถานะสาขาในระบบหลัก', is_required: true },
        ],
      },
    ],
  },
]

// ----------------------------------------------------------------
// Thai Labels & UI Badges
// ----------------------------------------------------------------
export const PROJECT_STATUS_LABELS: Record<OpeningProjectStatus, string> = {
  not_started: 'ยังไม่เริ่ม',
  in_progress: 'กำลังดำเนินการ',
  on_hold: 'ระงับชั่วคราว (On-hold)',
  ready_to_open: 'พร้อมเปิดสาขา',
  opened: 'เปิดสาขาเรียบร้อย',
  cancelled: 'ยกเลิก',
}

export const PROJECT_STATUS_BADGE_VARIANTS: Record<
  OpeningProjectStatus,
  { bg: string; text: string; border: string }
> = {
  not_started: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  in_progress: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  on_hold: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  ready_to_open: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  opened: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  cancelled: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'รอดำเนินการ',
  in_progress: 'กำลังทำ',
  waiting: 'รอข้อมูล/รออนุมัติ',
  done: 'เสร็จสิ้น',
  skipped: 'ข้าม',
  cancelled: 'ยกเลิก',
}

export const TASK_STATUS_BADGE_VARIANTS: Record<
  TaskStatus,
  { bg: string; text: string; border: string }
> = {
  todo: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  in_progress: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  waiting: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  done: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  skipped: { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200' },
  cancelled: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
}

// ----------------------------------------------------------------
// Models
// ----------------------------------------------------------------
export interface WorkflowStageModel {
  id: string
  stage_code: string
  stage_name: string
  sequence: number
  is_required: boolean
  is_active: boolean
  created_at: string
}

export interface TaskChecklistModel {
  id: string
  task_id: string
  item_name: string
  is_required: boolean
  is_checked: boolean
  checked_by: string | null
  checked_at: string | null
  created_at: string
  profiles?: Pick<UserProfile, 'id' | 'full_name' | 'email'> | null
}

export interface OpeningTaskModel {
  id: string
  opening_project_id: string
  stage_id: string | null
  task_name: string
  description: string | null
  assigned_to: string | null
  due_date: string | null
  status: TaskStatus
  completed_at: string | null
  completed_by: string | null
  note: string | null
  created_at: string
  updated_at: string
  task_checklists?: TaskChecklistModel[]
  workflow_stages?: WorkflowStageModel | null
  profiles?: Pick<UserProfile, 'id' | 'full_name' | 'email'> | null
}

export interface OpeningProjectModel {
  id: string
  project_no: string
  contract_id: string
  current_stage_id: string | null
  target_open_date: string | null
  assigned_to: string | null
  status: OpeningProjectStatus
  note: string | null
  created_at: string
  updated_at: string
}

export interface OpeningProjectWithRelations extends OpeningProjectModel {
  rental_contracts?: {
    id: string
    contract_no: string
    status: string
    need_branch_registration: boolean
    need_vat_registration: boolean
    need_employer_change: boolean
    need_signboard: boolean
    locations?: Pick<Location, 'id' | 'location_name' | 'location_code' | 'province' | 'district'> | null
  } | null
  workflow_stages?: WorkflowStageModel | null
  profiles?: Pick<UserProfile, 'id' | 'full_name' | 'email'> | null
  opening_tasks?: OpeningTaskModel[]
}

// ----------------------------------------------------------------
// Zod Schemas
// ----------------------------------------------------------------
export const openingProjectSchema = z.object({
  contract_id: z.string().uuid('กรุณาเลือกสัญญาเช่า'),
  project_no: z.string().trim().max(50).optional().nullable(),
  target_open_date: z.string().optional().nullable(),
  assigned_to: z.string().uuid().or(z.literal('')).optional().nullable(),
  status: z
    .enum(['not_started', 'in_progress', 'on_hold', 'ready_to_open', 'opened', 'cancelled'])
    .default('not_started'),
  note: z.string().trim().max(2000).optional().nullable(),
})

export type OpeningProjectFormValues = z.infer<typeof openingProjectSchema>

export const openingTaskSchema = z.object({
  opening_project_id: z.string().uuid('กรุณาระบุโครงการ'),
  stage_id: z.string().uuid().or(z.literal('')).optional().nullable(),
  task_name: z.string().trim().min(1, 'กรุณาระบุชื่องาน'),
  description: z.string().trim().max(1000).optional().nullable(),
  assigned_to: z.string().uuid().or(z.literal('')).optional().nullable(),
  due_date: z.string().optional().nullable(),
  status: z.enum(['todo', 'in_progress', 'waiting', 'done', 'skipped', 'cancelled']).default('todo'),
  note: z.string().trim().max(1000).optional().nullable(),
})

export type OpeningTaskFormValues = z.infer<typeof openingTaskSchema>

export const taskChecklistSchema = z.object({
  task_id: z.string().uuid('กรุณาระบุงาน'),
  item_name: z.string().trim().min(1, 'กรุณาระบุชื่อรายการเช็คลิสต์'),
  is_required: z.boolean().default(true),
})

export type TaskChecklistFormValues = z.infer<typeof taskChecklistSchema>
