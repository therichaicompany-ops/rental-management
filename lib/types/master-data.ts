import { z } from 'zod'
import type { Database } from '@/supabase/types'

// ----------------------------------------------------------------
// Database Row Types
// ----------------------------------------------------------------
export type Customer = Database['public']['Tables']['customers']['Row']
export type CustomerInsert = Database['public']['Tables']['customers']['Insert']
export type CustomerUpdate = Database['public']['Tables']['customers']['Update']

export type Landlord = Database['public']['Tables']['landlords']['Row']
export type LandlordInsert = Database['public']['Tables']['landlords']['Insert']
export type LandlordUpdate = Database['public']['Tables']['landlords']['Update']

export type Location = Database['public']['Tables']['locations']['Row']
export type LocationInsert = Database['public']['Tables']['locations']['Insert']
export type LocationUpdate = Database['public']['Tables']['locations']['Update']

export type CustomerType = Database['public']['Enums']['customer_type']

// Location with joined Landlord
export type LocationWithLandlord = Location & {
  landlords?: Pick<Landlord, 'id' | 'name' | 'company_name' | 'phone'> | null
}

// ----------------------------------------------------------------
// Zod Validation Schemas
// ----------------------------------------------------------------

export const customerSchema = z.object({
  customer_code: z.string().trim().max(50, 'รหัสลูกค้าต้องไม่เกิน 50 ตัวอักษร').optional().nullable(),
  customer_type: z.enum(['individual', 'company'], {
    required_error: 'กรุณาเลือกประเภทลูกค้า',
  }),
  name: z.string().trim().max(255, 'ชื่อต้องไม่เกิน 255 ตัวอักษร').optional().nullable(),
  company_name: z.string().trim().max(255, 'ชื่อบริษัทต้องไม่เกิน 255 ตัวอักษร').optional().nullable(),
  tax_id: z.string().trim().max(20, 'เลขประจำตัวผู้เสียภาษีต้องไม่เกิน 20 ตัวอักษร').optional().nullable(),
  contact_name: z.string().trim().max(255, 'ชื่อผู้ติดต่อต้องไม่เกิน 255 ตัวอักษร').optional().nullable(),
  phone: z.string().trim().max(50, 'เบอร์โทรศัพท์ต้องไม่เกิน 50 ตัวอักษร').optional().nullable(),
  email: z.string().trim().email('รูปแบบอีเมลไม่ถูกต้อง').or(z.literal('')).optional().nullable(),
  line_name: z.string().trim().max(100, 'LINE ID / Name ต้องไม่เกิน 100 ตัวอักษร').optional().nullable(),
  address: z.string().trim().max(1000, 'ที่อยู่ต้องไม่เกิน 1,000 ตัวอักษร').optional().nullable(),
  note: z.string().trim().max(2000, 'หมายเหตุต้องไม่เกิน 2,000 ตัวอักษร').optional().nullable(),
}).refine(
  (data) => {
    // ต้องมีอย่างน้อย 1 ชื่อ (name หรือ company_name)
    const hasName = data.name && data.name.trim().length > 0
    const hasCompany = data.company_name && data.company_name.trim().length > 0
    return hasName || hasCompany
  },
  {
    message: 'กรุณาระบุชื่อลูกค้าหรือชื่อบริษัทอย่างน้อย 1 รายการ',
    path: ['name'],
  }
)

export type CustomerFormValues = z.infer<typeof customerSchema>

export const landlordSchema = z.object({
  landlord_code: z.string().trim().max(50, 'รหัสผู้ให้เช่าต้องไม่เกิน 50 ตัวอักษร').optional().nullable(),
  name: z.string().trim().max(255, 'ชื่อต้องไม่เกิน 255 ตัวอักษร').optional().nullable(),
  company_name: z.string().trim().max(255, 'ชื่อบริษัทต้องไม่เกิน 255 ตัวอักษร').optional().nullable(),
  tax_id: z.string().trim().max(20, 'เลขประจำตัวผู้เสียภาษีต้องไม่เกิน 20 ตัวอักษร').optional().nullable(),
  contact_name: z.string().trim().max(255, 'ชื่อผู้ติดต่อต้องไม่เกิน 255 ตัวอักษร').optional().nullable(),
  phone: z.string().trim().max(50, 'เบอร์โทรศัพท์ต้องไม่เกิน 50 ตัวอักษร').optional().nullable(),
  email: z.string().trim().email('รูปแบบอีเมลไม่ถูกต้อง').or(z.literal('')).optional().nullable(),
  address: z.string().trim().max(1000, 'ที่อยู่ต้องไม่เกิน 1,000 ตัวอักษร').optional().nullable(),
  bank_name: z.string().trim().max(100, 'ชื่อธนาคารต้องไม่เกิน 100 ตัวอักษร').optional().nullable(),
  bank_account_name: z.string().trim().max(255, 'ชื่อบัญชีต้องไม่เกิน 255 ตัวอักษร').optional().nullable(),
  bank_account_number: z.string().trim().max(50, 'เลขบัญชีต้องไม่เกิน 50 ตัวอักษร').optional().nullable(),
  note: z.string().trim().max(2000, 'หมายเหตุต้องไม่เกิน 2,000 ตัวอักษร').optional().nullable(),
}).refine(
  (data) => {
    const hasName = data.name && data.name.trim().length > 0
    const hasCompany = data.company_name && data.company_name.trim().length > 0
    return hasName || hasCompany
  },
  {
    message: 'กรุณาระบุชื่อผู้ให้เช่าหรือชื่อบริษัทอย่างน้อย 1 รายการ',
    path: ['name'],
  }
)

export type LandlordFormValues = z.infer<typeof landlordSchema>

export const locationSchema = z.object({
  location_code: z.string().trim().max(50, 'รหัสสถานที่ต้องไม่เกิน 50 ตัวอักษร').optional().nullable(),
  location_name: z.string().trim().min(1, 'กรุณาระบุชื่อสถานที่/สาขา').max(255, 'ชื่อสถานที่ต้องไม่เกิน 255 ตัวอักษร'),
  house_no: z.string().trim().max(50, 'เลขที่ต้องไม่เกิน 50 ตัวอักษร').optional().nullable(),
  room_no: z.string().trim().max(50, 'ห้องเลขที่ต้องไม่เกิน 50 ตัวอักษร').optional().nullable(),
  village_name: z.string().trim().max(255, 'ชื่ออาคาร/หมู่บ้านต้องไม่เกิน 255 ตัวอักษร').optional().nullable(),
  address: z.string().trim().max(1000, 'ที่อยู่ต้องไม่เกิน 1,000 ตัวอักษร').optional().nullable(),
  subdistrict: z.string().trim().max(100, 'ตำบล/แขวงต้องไม่เกิน 100 ตัวอักษร').optional().nullable(),
  district: z.string().trim().max(100, 'อำเภอ/เขตต้องไม่เกิน 100 ตัวอักษร').optional().nullable(),
  province: z.string().trim().max(100, 'จังหวัดต้องไม่เกิน 100 ตัวอักษร').optional().nullable(),
  postal_code: z.string().trim().max(10, 'รหัสไปรษณีย์ต้องไม่เกิน 10 ตัวอักษร').optional().nullable(),
  google_maps_url: z.string().trim().url('รูปแบบ URL ไม่ถูกต้อง').or(z.literal('')).optional().nullable(),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  landlord_id: z.string().uuid('กรุณาเลือกผู้ให้เช่า').or(z.literal('')).optional().nullable(),
  note: z.string().trim().max(2000, 'หมายเหตุต้องไม่เกิน 2,000 ตัวอักษร').optional().nullable(),
})

export type LocationFormValues = z.infer<typeof locationSchema>
