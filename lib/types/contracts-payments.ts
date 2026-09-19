import { z } from 'zod'
import type { Customer, Landlord, Location } from './master-data'
import type { UserProfile } from './auth'
import type { RentalLead } from './rental-leads'

// ----------------------------------------------------------------
// Enums
// ----------------------------------------------------------------
export type ContractStatus =
  | 'draft'
  | 'negotiating'
  | 'agreed'
  | 'active'
  | 'expiring'
  | 'expired'
  | 'cancelled'

export type PaymentType = 'payable' | 'receivable'

export type RentPaymentStatus =
  | 'pending'
  | 'partial'
  | 'paid'
  | 'overdue'
  | 'cancelled'

export type PaymentMethod = 'bank_transfer' | 'cheque' | 'cash' | 'other'

// ----------------------------------------------------------------
// Thai Labels & UI Badges
// ----------------------------------------------------------------
export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft: 'ฉบับร่าง',
  negotiating: 'อยู่ระหว่างเจรจา',
  agreed: 'ตกลงแล้ว',
  active: 'มีผลบังคับใช้ (Active)',
  expiring: 'ใกล้หมดอายุ',
  expired: 'หมดอายุแล้ว',
  cancelled: 'ยกเลิก',
}

export const CONTRACT_STATUS_BADGE_VARIANTS: Record<
  ContractStatus,
  { bg: string; text: string; border: string }
> = {
  draft: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  negotiating: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  agreed: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  active: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  expiring: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  expired: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  cancelled: { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200' },
}

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  payable: 'บริษัทต้องจ่ายเจ้าของ (Payable)',
  receivable: 'ลูกค้าต้องจ่ายบริษัท (Receivable)',
}

export const PAYMENT_STATUS_LABELS: Record<RentPaymentStatus, string> = {
  pending: 'รอชำระ',
  partial: 'ชำระบางส่วน',
  paid: 'ชำระครบแล้ว',
  overdue: 'เกินกำหนดชำระ',
  cancelled: 'ยกเลิก',
}

export const PAYMENT_STATUS_BADGE_VARIANTS: Record<
  RentPaymentStatus,
  { bg: string; text: string; border: string }
> = {
  pending: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  partial: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  paid: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  overdue: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  cancelled: { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200' },
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: 'โอนเงินผ่านธนาคาร',
  cheque: 'เช็คธนาคาร',
  cash: 'เงินสด',
  other: 'อื่นๆ',
}

// ----------------------------------------------------------------
// Models
// ----------------------------------------------------------------
export interface ContractModel {
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
  payment_due_day: number | null
  wht_enabled: boolean
  wht_rate: number
  recurring_rent_enabled: boolean
  other_service_amount: number
  status: ContractStatus
  need_branch_registration: boolean
  need_vat_registration: boolean
  need_employer_change: boolean
  need_signboard: boolean
  assigned_to: string | null
  note: string | null
  created_at: string
  updated_at: string
}

export interface ContractWithRelations extends ContractModel {
  locations?: Pick<Location, 'id' | 'location_code' | 'location_name' | 'province' | 'district'> | null
  customers?: Pick<Customer, 'id' | 'customer_code' | 'name' | 'company_name' | 'phone'> | null
  landlords?: Pick<Landlord, 'id' | 'landlord_code' | 'name' | 'company_name' | 'phone' | 'bank_name' | 'bank_account_number'> | null
  profiles?: Pick<UserProfile, 'id' | 'full_name' | 'email'> | null
  rental_leads?: Pick<RentalLead, 'id' | 'lead_no' | 'lead_name'> | null
  rent_payments?: RentPaymentModel[]
}

export interface RentPaymentModel {
  id: string
  contract_id: string
  payment_type: PaymentType
  billing_period: string
  due_date: string
  rent_amount: number
  wht_amount: number
  service_amount: number
  other_amount: number
  gross_amount: number
  net_amount: number
  amount_paid: number
  balance_amount: number
  status: RentPaymentStatus
  payment_note: string | null
  created_at: string
  updated_at: string
}

export interface PaymentTransactionModel {
  id: string
  rent_payment_id: string
  transaction_date: string
  amount: number
  payment_method: PaymentMethod
  reference_no: string | null
  paid_by: string | null
  note: string | null
  created_at: string
  profiles?: Pick<UserProfile, 'id' | 'full_name' | 'email'> | null
}

export interface RentPaymentWithRelations extends RentPaymentModel {
  rental_contracts?: {
    id: string
    contract_no: string
    locations?: Pick<Location, 'id' | 'location_name' | 'province'> | null
    customers?: Pick<Customer, 'id' | 'name' | 'company_name'> | null
    landlords?: Pick<Landlord, 'id' | 'name' | 'company_name' | 'bank_name' | 'bank_account_number'> | null
  } | null
  payment_transactions?: PaymentTransactionModel[]
}

// ----------------------------------------------------------------
// Zod Validation Schemas
// ----------------------------------------------------------------
export const rentalContractSchema = z.object({
  contract_no: z.string().trim().max(50, 'เลขที่สัญญาต้องไม่เกิน 50 ตัวอักษร').optional().nullable(),
  lead_id: z.string().uuid().or(z.literal('')).optional().nullable(),
  location_id: z.string().uuid('กรุณาเลือกสถานที่'),
  customer_id: z.string().uuid().or(z.literal('')).optional().nullable(),
  landlord_id: z.string().uuid().or(z.literal('')).optional().nullable(),
  contract_date: z.string().optional().nullable(),
  start_date: z.string().min(1, 'กรุณาระบุวันเริ่มต้นสัญญา'),
  end_date: z.string().min(1, 'กรุณาระบุวันสิ้นสุดสัญญา'),
  monthly_rent: z.coerce.number().min(0, 'ค่าเช่าต้องไม่ติดลบ').default(0),
  deposit_amount: z.coerce.number().min(0, 'เงินมัดจำต้องไม่ติดลบ').default(0),
  advance_rent_amount: z.coerce.number().min(0, 'ค่าเช่าล่วงหน้าต้องไม่ติดลบ').default(0),
  other_service_amount: z.coerce.number().min(0, 'ค่าบริการต้องไม่ติดลบ').default(0),
  payment_due_day: z.coerce
    .number()
    .min(1, 'วันครบกำหนดต้องอยู่ระหว่างวันที่ 1-31')
    .max(31, 'วันครบกำหนดต้องอยู่ระหว่างวันที่ 1-31')
    .optional()
    .nullable(),
  wht_enabled: z.boolean().default(false),
  wht_rate: z.coerce.number().min(0).max(100).default(0),
  recurring_rent_enabled: z.boolean().default(true),
  status: z
    .enum(['draft', 'negotiating', 'agreed', 'active', 'expiring', 'expired', 'cancelled'])
    .default('draft'),
  need_branch_registration: z.boolean().default(true),
  need_vat_registration: z.boolean().default(false),
  need_employer_change: z.boolean().default(false),
  need_signboard: z.boolean().default(true),
  assigned_to: z.string().uuid().or(z.literal('')).optional().nullable(),
  note: z.string().trim().max(2000, 'หมายเหตุต้องไม่เกิน 2,000 ตัวอักษร').optional().nullable(),
})

export type RentalContractFormValues = z.infer<typeof rentalContractSchema>

export const rentPaymentSchema = z.object({
  contract_id: z.string().uuid('กรุณาเลือกสัญญา'),
  payment_type: z.enum(['payable', 'receivable'], {
    required_error: 'กรุณาเลือกประเภทการชำระ',
  }),
  billing_period: z.string().min(1, 'กรุณาระบุงวดประจำเดือน (YYYY-MM-01)'),
  due_date: z.string().min(1, 'กรุณาระบุวันครบกำหนดชำระ'),
  rent_amount: z.coerce.number().min(0, 'ค่าเช่าต้องไม่ติดลบ').default(0),
  wht_amount: z.coerce.number().min(0, 'ภาษีหัก ณ ที่จ่ายต้องไม่ติดลบ').default(0),
  service_amount: z.coerce.number().min(0, 'ค่าบริการต้องไม่ติดลบ').default(0),
  other_amount: z.coerce.number().min(0, 'ยอดอื่นๆ ต้องไม่ติดลบ').default(0),
  status: z.enum(['pending', 'partial', 'paid', 'overdue', 'cancelled']).default('pending'),
  payment_note: z.string().trim().max(2000).optional().nullable(),
})

export type RentPaymentFormValues = z.infer<typeof rentPaymentSchema>

export const paymentTransactionSchema = z.object({
  rent_payment_id: z.string().uuid(),
  transaction_date: z.string().min(1, 'กรุณาระบุวันที่และเวลาที่ชำระ'),
  amount: z.coerce.number().positive('จำนวนเงินต้องมากกว่า 0'),
  payment_method: z.enum(['bank_transfer', 'cheque', 'cash', 'other']).default('bank_transfer'),
  reference_no: z.string().trim().max(100, 'เลขที่อ้างอิง/สลิปต้องไม่เกิน 100 ตัวอักษร').optional().nullable(),
  note: z.string().trim().max(1000, 'หมายเหตุต้องไม่เกิน 1,000 ตัวอักษร').optional().nullable(),
})

export type PaymentTransactionFormValues = z.infer<typeof paymentTransactionSchema>

export function getEffectivePaymentStatus(payment: {
  status?: string | null
  amount_paid?: number | string | null
  net_amount?: number | string | null
  due_date?: string | null
}): RentPaymentStatus {
  if (payment.status === 'cancelled') return 'cancelled'
  const net = Number(payment.net_amount) || 0
  const paid = Number(payment.amount_paid) || 0
  if (paid >= net && net > 0) return 'paid'
  if (paid > 0) return 'partial'
  const today = new Date().toISOString().split('T')[0]
  if (payment.due_date && payment.due_date < today) return 'overdue'
  return 'pending'
}
