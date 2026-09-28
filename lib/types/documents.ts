import { z } from 'zod'

// ----------------------------------------------------------------
// Entity Types
// ----------------------------------------------------------------
export type DocumentEntityType =
  | 'lead'
  | 'contract'
  | 'rent_payment'
  | 'opening_project'
  | 'task'
  | 'customer'
  | 'location'
  | 'payment_transaction'

// ----------------------------------------------------------------
// Document Types
// ----------------------------------------------------------------
export type DocumentType =
  | 'RENTAL_CONTRACT'
  | 'TRANSFER_SLIP'
  | 'MAP'
  | 'VAT_DOCUMENT'
  | 'BRANCH_DOCUMENT'
  | 'EMPLOYMENT_DOCUMENT'
  | 'SIGNBOARD'
  | 'PRE_OPEN_DOCUMENT'
  | 'PASSPORT'
  | 'VISA'
  | 'WORK_PERMIT'
  | 'SMART_CARD'
  | 'PINK_CARD'
  | 'OVERSTAY_90_DAYS_NOTICE'
  | 'ID_CARD'
  | 'COMPANY_CERTIFICATE'
  | 'DIRECTOR_ID_CARD'
  | 'OTHER'

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  RENTAL_CONTRACT: 'สัญญาเช่า',
  TRANSFER_SLIP: 'สลิปโอนเงิน',
  MAP: 'แผนที่',
  VAT_DOCUMENT: 'เอกสาร VAT',
  BRANCH_DOCUMENT: 'เอกสารสาขา',
  EMPLOYMENT_DOCUMENT: 'เอกสารแรงงาน',
  SIGNBOARD: 'ป้ายบริษัท',
  PRE_OPEN_DOCUMENT: 'เอกสารก่อนเปิดร้าน',
  PASSPORT: 'หน้าพาสปอร์ต',
  VISA: 'หน้าวีซ่า',
  WORK_PERMIT: 'ใบอนุญาตทำงาน (Work permit)',
  SMART_CARD: 'Smart card',
  PINK_CARD: 'บัตรประจำตัวคนซึ่งไม่มีสัญชาติไทย (บัตรชมพู)',
  OVERSTAY_90_DAYS_NOTICE: 'ใบรับแจ้งการอยู่เกิน 90 วัน ของคนต่างด่าว',
  ID_CARD: 'สำเนาบัตรประชาชน',
  COMPANY_CERTIFICATE: 'หนังสือรับรองบริษัท',
  DIRECTOR_ID_CARD: 'สำเนาบัตรประชาชนกรรมการ',
  OTHER: 'อื่นๆ',
}

export const DOCUMENT_TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: 'RENTAL_CONTRACT', label: 'สัญญาเช่า' },
  { value: 'TRANSFER_SLIP', label: 'สลิปโอนเงิน' },
  { value: 'MAP', label: 'แผนที่' },
  { value: 'VAT_DOCUMENT', label: 'เอกสาร VAT' },
  { value: 'BRANCH_DOCUMENT', label: 'เอกสารสาขา' },
  { value: 'EMPLOYMENT_DOCUMENT', label: 'เอกสารแรงงาน' },
  { value: 'SIGNBOARD', label: 'ป้ายบริษัท' },
  { value: 'PRE_OPEN_DOCUMENT', label: 'เอกสารก่อนเปิดร้าน' },
  { value: 'PASSPORT', label: 'หน้าพาสปอร์ต' },
  { value: 'VISA', label: 'หน้าวีซ่า' },
  { value: 'WORK_PERMIT', label: 'ใบอนุญาตทำงาน (Work permit)' },
  { value: 'SMART_CARD', label: 'Smart card' },
  { value: 'PINK_CARD', label: 'บัตรชมพู' },
  { value: 'OVERSTAY_90_DAYS_NOTICE', label: 'ใบรับแจ้งอยู่เกิน 90 วัน' },
  { value: 'ID_CARD', label: 'สำเนาบัตรประชาชน' },
  { value: 'COMPANY_CERTIFICATE', label: 'หนังสือรับรองบริษัท' },
  { value: 'DIRECTOR_ID_CARD', label: 'สำเนาบัตรประชาชนกรรมการ' },
  { value: 'OTHER', label: 'อื่นๆ' },
]

export const ENTITY_TYPE_LABELS: Record<DocumentEntityType, string> = {
  lead: 'งานเช่า (Lead)',
  contract: 'สัญญาเช่า',
  rent_payment: 'ค่าเช่า',
  opening_project: 'เปิดสาขา',
  task: 'งาน',
  customer: 'ลูกค้า',
  location: 'สถานที่',
  payment_transaction: 'รายการชำระเงิน',
}

// ----------------------------------------------------------------
// Allowed file types & size
// ----------------------------------------------------------------
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'webp']

// ----------------------------------------------------------------
// DB Model
// ----------------------------------------------------------------
export interface DocumentModel {
  id: string
  entity_type: DocumentEntityType
  entity_id: string
  document_type: DocumentType
  file_name: string
  storage_bucket: string
  storage_path: string
  file_size: number | null
  mime_type: string | null
  uploaded_by: string | null
  created_at: string
}

export interface DocumentWithUploader extends DocumentModel {
  profiles: {
    id: string
    full_name: string
    email: string | null
  } | null
}

// ----------------------------------------------------------------
// Zod schemas
// ----------------------------------------------------------------
export const uploadDocumentSchema = z.object({
  entity_type: z.enum([
    'lead',
    'contract',
    'rent_payment',
    'opening_project',
    'task',
    'customer',
    'location',
    'payment_transaction',
  ]),
  entity_id: z.string().uuid('entity_id ไม่ถูกต้อง'),
  document_type: z.enum([
    'RENTAL_CONTRACT',
    'TRANSFER_SLIP',
    'MAP',
    'VAT_DOCUMENT',
    'BRANCH_DOCUMENT',
    'EMPLOYMENT_DOCUMENT',
    'SIGNBOARD',
    'PRE_OPEN_DOCUMENT',
    'PASSPORT',
    'VISA',
    'WORK_PERMIT',
    'SMART_CARD',
    'PINK_CARD',
    'OVERSTAY_90_DAYS_NOTICE',
    'ID_CARD',
    'COMPANY_CERTIFICATE',
    'DIRECTOR_ID_CARD',
    'OTHER',
  ]),
})

export type UploadDocumentValues = z.infer<typeof uploadDocumentSchema>

// ----------------------------------------------------------------
// List filters
// ----------------------------------------------------------------
export interface DocumentListFilters {
  document_type?: DocumentType
  entity_type?: DocumentEntityType
  uploaded_by?: string
  date_from?: string
  date_to?: string
}
