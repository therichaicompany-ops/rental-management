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
  requiresCondition?: 'need_branch_registration' | 'need_signboard' | 'need_employer_change' | 'need_vat_registration' | 'hasForeignResident' | 'need_excise_permit'
  defaultTasks?: {
    name: string
    description?: string
    checklists?: { name: string; is_required: boolean }[]
  }[]
}

export const STAGE_DEFINITIONS: StageDefinition[] = [
  {
    code: 'NEGOTIATION',
    name: 'โทรเจรจาการเช่า',
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
    name: 'ตกลงเช่า',
    sequence: 2,
    description: 'คู่สัญญาตกลงรับเงื่อนไขเรียบร้อยแล้ว',
    defaultTasks: [
      {
        name: 'จัดทำเอกสารยืนยันข้อตกลง',
        checklists: [
          { name: 'ใบเสร็จจองสถานที่ / ชำระเงินมัดจำ', is_required: true },
          { name: 'จัดเตรียมเอกสารการเช่า', is_required: true },
        ],
      },
    ],
  },
  {
    code: 'DEPOSIT',
    name: 'รับมัดจำ / ค่าเช่าล่วงหน้า',
    sequence: 3,
    description: 'ชำระเงินมัดจำและเงินประกันตามสัญญา',
    defaultTasks: [
      {
        name: 'ตรวจสอบการชำระเงินมัดจำ',
        checklists: [
          { name: 'แนบหลักฐานสลิปการโอนเงินมัดจำ', is_required: true },
        ],
      },
    ],
  },
  {
    code: 'CONTRACT',
    name: 'นัดทำสัญญาเช่า',
    sequence: 4,
    description: 'ลงนามในสัญญาเช่าอย่างเป็นทางการ',
    defaultTasks: [
      {
        name: 'ลงนามสัญญาเช่าฉบับสมบูรณ์',
        checklists: [
          { name: 'คู่สัญญาเซ็นครบทุกหน้า', is_required: true },
          { name: 'สแกนไฟล์สัญญาเข้าระบบ', is_required: true },
          { name: 'ผู้เช่าลงนามในสัญญาแล้ว', is_required: true },
          { name: 'ติดอากรแสตมป์ถูกต้องตามกฎหมาย', is_required: false },
          { name: 'ผู้ให้เช่าลงนามในสัญญาแล้ว', is_required: true },
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
          { name: 'สำเนาทะเบียนบ้านของสถานที่เช่า', is_required: true },
          { name: 'หนังสือยินยอมให้ใช้สถานที่จัดตั้งสาขา', is_required: true },
          { name: 'สำเนาโฉนดที่ดิน/สัญญาเช่าหลัก', is_required: true },
          { name: 'สำเนาบัตรประชาชน/หนังสือรับรองบริษัทผู้ให้เช่า', is_required: true },
          { name: 'สำเนาทะเบียนบ้านผู้ให้เช่า', is_required: true },
          { name: 'เอกสารกรรมสิทธิ์ความยินยอมเจ้าของ', is_required: true },
        ],
      },
    ],
  },
  {
    code: 'SEND_ACCOUNTING',
    name: 'ส่งเรื่องให้บัญชี',
    sequence: 6,
    description: 'ส่งเรื่องและเอกสารให้ฝ่ายบัญชีเพื่อตั้งงวดชำระ',
    defaultTasks: [
      {
        name: 'ส่งเรื่องเปิดรหัสสาขาและตั้งงวดบัญชี',
        checklists: [
          { name: 'ส่งสัญญาเช่าให้แผนกบัญชี', is_required: true },
          { name: 'ตั้งตารางงวดค่าเช่าในระบบ', is_required: true },
          { name: 'ภาพวาดแผนที่ของสาขา', is_required: true },
          { name: 'รูปถ่ายสถานที่และมีป้ายชื่อบริษัทเรียบร้อยแล้ว', is_required: true },
        ],
      },
    ],
  },
  {
    code: 'BRANCH_REGISTRATION',
    name: 'จดสาขา',
    sequence: 7,
    description: 'ดำเนินการจดทะเบียนจัดตั้งสาขาต่อกรมพัฒนาธุรกิจการค้า',
    requiresCondition: 'need_branch_registration',
    defaultTasks: [
      {
        name: 'จดทะเบียนจัดตั้งสาขา (DBD)',
        checklists: [
          { name: 'แบบ ภ.พ.09 คำขอแจ้งการเปลี่ยนแปลงทะเบียนภาษีมูลค่าเพิ่ม', is_required: true },
          { name: 'จัดทำแบบคำขอจดทะเบียนสาขา', is_required: true },
          { name: 'กรรมการลงนามแบบคำขอ', is_required: true },
          { name: 'ได้รับหนังสือรับรองสาขาฉบับใหม่', is_required: true },
          { name: 'ยื่นจดทะเบียนต่อ DBD เรียบร้อย', is_required: true },
          { name: 'แบบ ภ.พ.20 (ใบทะเบียนภาษีมูลค่าเพิ่ม)', is_required: true },
        ],
      },
    ],
  },
  {
    code: 'SIGNBOARD',
    name: 'ทำป้ายบริษัท',
    sequence: 8,
    description: 'ยื่นแบบและขออนุญาตติดตั้งป้ายสาขาต่อหน่วยงานท้องถิ่น',
    requiresCondition: 'need_signboard',
    defaultTasks: [
      {
        name: 'ยื่นขออนุญาตติดตั้งป้ายและชำระภาษีป้าย',
        checklists: [
          { name: 'วัดขนาดและถ่ายรูปจุดติดตั้งป้าย', is_required: true },
          { name: 'นัดวันติดตั้งป้ายบริษัท', is_required: true },
        ],
      },
    ],
  },
  {
    code: 'EMPLOYMENT_CHANGE',
    name: 'เปลี่ยนนายจ้าง / รออนุมัติจัดหางาน',
    sequence: 9,
    description: 'ยื่นเรื่องเปลี่ยนนายจ้าง/ประเภทงาน และรออนุมัติจากกรมการจัดหางาน',
    requiresCondition: 'need_employer_change',
    defaultTasks: [
      {
        name: 'ยื่นเปลี่ยนนายจ้างและรออนุมัติจัดหางาน',
        description: 'ดำเนินการแจ้งเปลี่ยนนายจ้างผ่านระบบ e-Workpermit และรออนุมัติ',
        checklists: [
          { name: 'ยื่นเรื่องเปลี่ยนนายจ้าง/แจ้งเข้าทำงานผ่านระบบ e-Workpermit', is_required: true },
          { name: 'จัดเตรียมและลงนามเอกสาร บต. และสัญญาจ้าง', is_required: true },
          { name: 'รอการพิจารณาและอนุมัติจากระบบกรมการจัดหางาน', is_required: true },
          { name: 'ได้รับใบอนุญาตทำงาน (Work Permit) ฉบับอนุมัติเรียบร้อย', is_required: true },
          { name: 'เปลี่ยนประเภทงานเป็นพนักงานขายของหน้าร้าน', is_required: false },
        ],
      },
    ],
  },
  {
    code: 'JOB_APPROVAL',
    name: 'ทำประกันสังคมต่างด้าว',
    sequence: 10,
    description: 'ดำเนินการขึ้นทะเบียนผู้ประกันตนประกันสังคมสำหรับแรงงานต่างด้าว',
    defaultTasks: [
      {
        name: 'ขึ้นทะเบียนประกันสังคมแรงงานต่างด้าว',
        description: 'ยื่นแบบ สปส. 1-03 และเอกสารประกอบเพื่อทำประกันสังคมให้แรงงานต่างด้าว',
        checklists: [
          { name: 'จัดเตรียมสำเนาพาสปอร์ต วีซ่า และใบอนุญาตทำงาน', is_required: true },
          { name: 'ยื่นแบบขึ้นทะเบียนผู้ประกันตนแรงงานต่างด้าว (สปส. 1-03)', is_required: true },
          { name: 'เลือกสถานพยาบาล/โรงพยาบาลตามสิทธิประกันสังคม', is_required: true },
          { name: 'ตรวจสอบสถานะการขึ้นทะเบียนผู้ประกันตนในระบบ สปส.', is_required: true },
        ],
      },
    ],
  },
  {
    code: 'PRE_OPEN_SIGN',
    name: 'เซ็นเอกสารก่อนเปิดร้าน',
    sequence: 11,
    description: 'ฝ่ายบริหารและผู้เกี่ยวข้องตรวจสอบและลงนามอนุมัติเปิด',
    defaultTasks: [
      {
        name: 'ตรวจสอบความพร้อมรอบสุดท้ายและลงนามอนุมัติ',
        checklists: [
          { name: 'บันทึกข้อตกลงความร่วมในการดำเนินการร้านค้า/สาขา', is_required: true },
          { name: 'หนังสือจ้างงานพนักงานขายของหน้าร้าน', is_required: true },
          { name: 'หนังสือจ้างงานพนักงานจัดของ', is_required: true },
          { name: 'หนังสือจ้างงานพนักงานรายวันคนไทย', is_required: true },
          { name: 'กฏเงื่อนไขข้อบังคับของบริษัท', is_required: true },
          { name: 'คำมั่นสัญญาในการสืบสิทธิ์และเข้ารับช่วงดำเนินการกรณีเหตุสุดวิสัย', is_required: true },
          { name: 'เอกสารแจ้งเรื่องสินค้าที่บริษัทอนุญาตให้ขาย', is_required: true },
          { name: 'ใบสั่งซื้อสินค้า', is_required: true },
          { name: 'สำเนาหน้าพาสปอร์ตของพนักงานขายของหน้าร้าน', is_required: true },
          { name: 'สำเนาหน้าวีซ่าของพนักงานขายของหน้าร้าน', is_required: true },
          { name: 'สำเนาใบอนุญาตทำงานของพนักงานขายของหน้าร้าน', is_required: true },
          { name: 'สำเนาหน้าพาสปอร์ตของพนักงานจัดของ', is_required: true },
          { name: 'สำเนาหน้าวีซ่าของพนักงานจัดของ', is_required: true },
          { name: 'สำเนาใบอนุญาตทำงานของพนักงานจัดของ', is_required: true },
          { name: 'สำเนาบัตรประชาชนพนักงานรายวันคนไทย', is_required: true },
          { name: 'สำเนาทะเบียนบ้านของพนักงานรายวันคนไทย', is_required: true },
          { name: 'สำเนาหน้าวีซ่าของผู้รับช่วงดำเนินการ', is_required: true },
          { name: 'สำเนาหน้าพาสปอร์ตของผู้รับช่วงดำเนินการ', is_required: true },
        ],
      },
    ],
  },
  {
    code: 'READY_TO_OPEN',
    name: 'พร้อมเปิดร้าน',
    sequence: 12,
    description: 'เตรียมการขาย สินค้า และพนักงานพร้อมเริ่มดำเนินงาน',
    defaultTasks: [
      {
        name: 'ส่งมอบพื้นที่และเตรียมเปิดบริการ',
        checklists: [
          { name: 'สต็อกสินค้าพร้อมจำหน่าย', is_required: true },
          { name: 'จ้างพนักงานคนไทยอยู่หน้าร้าน', is_required: false },
          { name: 'พนักงานประจำสาขา', is_required: true },
          { name: 'เตรียมคิวอาร์โค้ดรับชำระเงินของสาขา', is_required: true },
          { name: 'ยื่นขอใบอนุญาตขายสุรา / บุหรี่ กับสรรพสามิต', is_required: false },
        ],
      },
    ],
  },
  {
    code: 'OPENED',
    name: 'เปิดร้านแล้ว',
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
