import { z } from 'zod'
import type { Customer, Landlord, Location } from './master-data'
import type { UserProfile } from './auth'

// ----------------------------------------------------------------
// Enums
// ----------------------------------------------------------------
export type LeadStatus =
  | 'new'
  | 'contacting'
  | 'negotiating'
  | 'follow_up'
  | 'agreed'
  | 'lost'
  | 'cancelled'
  | 'converted'

export type ContactMethod =
  | 'phone'
  | 'line'
  | 'facebook'
  | 'email'
  | 'onsite'
  | 'other'

export type RentalContractStatus =
  | 'draft'
  | 'active'
  | 'near_expiry'
  | 'expired'
  | 'terminated'
  | 'renewed'

// ----------------------------------------------------------------
// Thai Labels & UI Badges
// ----------------------------------------------------------------
export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'ใหม่',
  contacting: 'กำลังติดต่อ',
  negotiating: 'อยู่ระหว่างเจรจา',
  follow_up: 'ติดตามผล',
  agreed: 'ตกลงแล้ว (รอทำสัญญา)',
  lost: 'ไม่สำเร็จ / หลุด',
  cancelled: 'ยกเลิก',
  converted: 'สร้างสัญญาแล้ว',
}

export const LEAD_STATUS_BADGE_VARIANTS: Record<
  LeadStatus,
  { bg: string; text: string; border: string }
> = {
  new: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  contacting: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  negotiating: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  follow_up: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  agreed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  lost: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  cancelled: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  converted: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
}

export const CONTACT_METHOD_LABELS: Record<ContactMethod, string> = {
  phone: 'โทรศัพท์',
  line: 'LINE',
  facebook: 'Facebook',
  email: 'อีเมล',
  onsite: 'ลงพื้นที่ / พบตัว',
  other: 'ช่องทางอื่นๆ',
}

// ----------------------------------------------------------------
// Database Model Types
// ----------------------------------------------------------------
export interface RentalLead {
  id: string
  lead_no: string
  location_id: string | null
  customer_id: string | null
  landlord_id: string | null
  lead_name: string | null
  source: string | null
  first_contact_date: string | null
  expected_start_date: string | null
  expected_open_date: string | null
  proposed_monthly_rent: number
  proposed_deposit_amount: number
  proposed_advance_rent_amount: number
  proposed_service_amount: number
  need_branch_registration: boolean
  need_vat_registration: boolean
  need_employer_change: boolean
  need_signboard: boolean
  status: LeadStatus
  assigned_to: string | null
  next_follow_up_date: string | null
  note: string | null
  created_at: string
  updated_at: string
}

export interface NegotiationLog {
  id: string
  lead_id: string
  contact_date: string
  contact_method: ContactMethod
  contact_person: string | null
  contact_phone: string | null
  monthly_rent: number | null
  deposit_amount: number | null
  advance_rent_amount: number | null
  service_amount: number | null
  negotiation_detail: string | null
  result: string | null
  next_action: string | null
  next_follow_up_date: string | null
  created_by: string | null
  created_at: string
  profiles?: Pick<UserProfile, 'id' | 'full_name' | 'email'> | null
}

export interface RentalContract {
  id: string
  contract_no: string
  lead_id: string | null
  location_id: string
  customer_id: string | null
  landlord_id: string | null
  contract_date: string | null
  start_date: string | null
  end_date: string | null
  monthly_rent: number
  deposit_amount: number
  advance_rent_amount: number
  status: RentalContractStatus
  created_at: string
}

export interface RentalLeadWithRelations extends RentalLead {
  locations?: Pick<Location, 'id' | 'location_code' | 'location_name' | 'province' | 'district'> | null
  customers?: Pick<Customer, 'id' | 'customer_code' | 'name' | 'company_name' | 'phone'> | null
  landlords?: Pick<Landlord, 'id' | 'landlord_code' | 'name' | 'company_name' | 'phone'> | null
  profiles?: Pick<UserProfile, 'id' | 'full_name' | 'email'> | null
  negotiation_logs?: NegotiationLog[]
}

// ----------------------------------------------------------------
// Zod Schemas
// ----------------------------------------------------------------
export const rentalLeadSchema = z.object({
  lead_no: z.string().trim().max(50, 'รหัส Lead ต้องไม่เกิน 50 ตัวอักษร').optional().nullable(),
  lead_name: z.string().trim().min(1, 'กรุณาระบุชื่องานเช่า / โครงการ').max(255, 'ชื่องานเช่าต้องไม่เกิน 255 ตัวอักษร'),
  location_id: z.string().uuid('กรุณาเลือกสถานที่').or(z.literal('')).optional().nullable(),
  customer_id: z.string().uuid('กรุณาเลือกลูกค้า').or(z.literal('')).optional().nullable(),
  landlord_id: z.string().uuid('กรุณาเลือกผู้ให้เช่า').or(z.literal('')).optional().nullable(),
  source: z.string().trim().max(100, 'แหล่งที่มาต้องไม่เกิน 100 ตัวอักษร').optional().nullable(),
  first_contact_date: z.string().optional().nullable(),
  expected_start_date: z.string().optional().nullable(),
  expected_open_date: z.string().optional().nullable(),
  proposed_monthly_rent: z.coerce.number().min(0, 'ค่าเช่าต้องไม่ติดลบ').default(0),
  proposed_deposit_amount: z.coerce.number().min(0, 'เงินมัดจำต้องไม่ติดลบ').default(0),
  proposed_advance_rent_amount: z.coerce.number().min(0, 'ค่าเช่าล่วงหน้าต้องไม่ติดลบ').default(0),
  proposed_service_amount: z.coerce.number().min(0, 'ค่าบริการต้องไม่ติดลบ').default(0),
  need_branch_registration: z.boolean().default(true),
  need_vat_registration: z.boolean().default(false),
  need_employer_change: z.boolean().default(false),
  need_signboard: z.boolean().default(true),
  status: z.enum([
    'new',
    'contacting',
    'negotiating',
    'follow_up',
    'agreed',
    'lost',
    'cancelled',
    'converted',
  ]).default('new'),
  assigned_to: z.string().uuid('กรุณาเลือกผู้รับผิดชอบ').or(z.literal('')).optional().nullable(),
  next_follow_up_date: z.string().optional().nullable(),
  note: z.string().trim().max(5000, 'หมายเหตุต้องไม่เกิน 5,000 ตัวอักษร').optional().nullable(),
})

export type RentalLeadFormValues = z.infer<typeof rentalLeadSchema>

export const negotiationLogSchema = z.object({
  contact_date: z.string().min(1, 'กรุณาระบุวันและเวลาที่ติดต่อ'),
  contact_method: z.enum(['phone', 'line', 'facebook', 'email', 'onsite', 'other'], {
    required_error: 'กรุณาเลือกวิธีการติดต่อ',
  }),
  contact_person: z.string().trim().max(255, 'ชื่อผู้ประสานงานต้องไม่เกิน 255 ตัวอักษร').optional().nullable(),
  contact_phone: z.string().trim().max(50, 'เบอร์โทรต้องไม่เกิน 50 ตัวอักษร').optional().nullable(),
  monthly_rent: z.coerce.number().min(0, 'ค่าเช่าต้องไม่ติดลบ').optional().nullable(),
  deposit_amount: z.coerce.number().min(0, 'เงินมัดจำต้องไม่ติดลบ').optional().nullable(),
  advance_rent_amount: z.coerce.number().min(0, 'ค่าเช่าล่วงหน้าต้องไม่ติดลบ').optional().nullable(),
  service_amount: z.coerce.number().min(0, 'ค่าบริการต้องไม่ติดลบ').optional().nullable(),
  negotiation_detail: z.string().trim().min(1, 'กรุณากรอกรายละเอียดการเจรจา'),
  result: z.string().trim().max(1000, 'ผลการเจรจาต้องไม่เกิน 1,000 ตัวอักษร').optional().nullable(),
  next_action: z.string().trim().max(1000, 'สิ่งที่ต้องทำต่อต้องไม่เกิน 1,000 ตัวอักษร').optional().nullable(),
  next_follow_up_date: z.string().optional().nullable(),
})

export type NegotiationLogFormValues = z.infer<typeof negotiationLogSchema>
