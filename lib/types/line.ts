import { z } from 'zod'

export type LineGroupType = 'PAYABLE' | 'RECEIVABLE'

export interface LineDestinationModel {
  id: string
  name: string
  destination_type: string // 'group', 'PAYABLE', 'RECEIVABLE'
  line_group_id: string
  is_active: boolean
  created_at: string
  group_category?: LineGroupType
}

export interface NotificationLogModel {
  id: string
  notification_type: string
  entity_type: string
  entity_id: string
  destination_id: string | null
  notification_date: string
  status: 'pending' | 'sent' | 'failed'
  message: string | null
  sent_at: string | null
  error_message: string | null
  created_at: string
}

export interface PayableRentMessageData {
  contactName: string // ผู้ติดต่อ/เจ้าของ
  roomNo?: string | null // ห้อง
  locationName: string // สถานที่
  rentAmount: number // ค่าเช่า
  whtAmount?: number // หัก ณ ที่จ่าย
  serviceAmount?: number // ค่าบริการ
  netAmount: number // ยอดจ่ายจริง
  dueDate: string // วันครบกำหนด
  status: string // สถานะ
  contractNo?: string
}

export interface ReceivableRentMessageData {
  customerName: string // ลูกค้า
  roomNo?: string | null // ห้อง
  locationName: string // สถานที่
  rentAmount: number // ค่าเช่า
  serviceAmount?: number // ค่าบริการ
  receivableAmount: number // ยอดที่ต้องรับ
  dueDate: string // วันครบกำหนด
  status: string // สถานะ
  contractNo?: string
}

export const lineDestinationSchema = z.object({
  name: z.string().trim().min(1, 'กรุณาระบุชื่อกลุ่ม'),
  line_group_id: z.string().trim().min(1, 'กรุณาระบุ LINE Group ID'),
  group_type: z.enum(['PAYABLE', 'RECEIVABLE']),
  is_active: z.boolean().default(true),
})

export type LineDestinationFormValues = z.infer<typeof lineDestinationSchema>
