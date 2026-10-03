'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { canWrite, hasFullAccess } from '@/lib/auth/permissions'
import {
  lineDestinationSchema,
  type LineDestinationFormValues,
  type LineDestinationModel,
  type NotificationLogModel,
  type LineGroupType,
} from '@/lib/types/line'
import {
  formatPayableRentMessage,
  formatReceivableRentMessage,
} from '@/lib/services/line-message-formatter'
import { sendLineMessage } from '@/lib/services/line-messaging-service'

export interface ActionResponse<T = unknown> {
  success: boolean
  error?: string
  data?: T
}

/**
 * Helper to determine category from destination_type or encoded name prefix
 */
function resolveCategory(dest: { name: string; destination_type: string }): LineGroupType {
  if (dest.destination_type === 'PAYABLE' || dest.destination_type === 'RECEIVABLE') {
    return dest.destination_type as LineGroupType
  }
  if (dest.name.includes('[PAYABLE]')) return 'PAYABLE'
  if (dest.name.includes('[RECEIVABLE]')) return 'RECEIVABLE'
  return 'PAYABLE' // default fallback
}

/**
 * Fetch all LINE group destinations
 */
export async function getLineDestinationsAction(): Promise<LineDestinationModel[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('line_destinations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !data) {
    console.error('getLineDestinationsAction error:', error)
    return []
  }

  return data.map((d) => ({
    ...d,
    group_category: resolveCategory(d),
  }))
}

/**
 * Fetch recent notification logs
 */
export async function getNotificationLogsAction(limit = 15): Promise<NotificationLogModel[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notification_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error || !data) {
    console.error('getNotificationLogsAction error:', error)
    return []
  }

  return data as NotificationLogModel[]
}

/**
 * Create or register a new LINE group destination
 */
export async function createLineDestinationAction(
  values: LineDestinationFormValues
): Promise<ActionResponse<LineDestinationModel>> {
  const currentUser = await getCurrentUser()
  if (!currentUser) return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }

  if (!hasFullAccess(currentUser.profile.role)) {
    return { success: false, error: 'เฉพาะ Owner หรือ Admin เท่านั้นที่สามารถจัดการกลุ่ม LINE ได้' }
  }

  const parsed = lineDestinationSchema.safeParse(values)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors.map((e) => e.message).join(', ') }
  }

  const supabase = await createClient()
  const { name, line_group_id, group_type, is_active } = parsed.data

  // Safe formatting: if constraint allows PAYABLE/RECEIVABLE use it, else encode prefix in name
  const cleanName = name.replace(/^\[(PAYABLE|RECEIVABLE)\]\s*/, '')
  const taggedName = `[${group_type}] ${cleanName}`

  // Try insert with destination_type = group_type
  let insertPayload: Record<string, unknown> = {
    name: taggedName,
    destination_type: group_type,
    line_group_id,
    is_active,
  }

  let { data, error } = await supabase
    .from('line_destinations')
    .insert(insertPayload)
    .select()
    .single()

  // If check constraint rejects custom destination_type, fallback to 'group'
  if (error && error.code === '23514') {
    insertPayload = {
      name: taggedName,
      destination_type: 'group',
      line_group_id,
      is_active,
    }
    const retry = await supabase.from('line_destinations').insert(insertPayload).select().single()
    data = retry.data
    error = retry.error
  }

  if (error || !data) {
    return { success: false, error: error?.message || 'ไม่สามารถบันทึกกลุ่ม LINE ได้' }
  }

  revalidatePath('/settings/line')
  return { success: true, data: { ...data, group_category: group_type } }
}

/**
 * Update an existing LINE group destination
 */
export async function updateLineDestinationAction(
  id: string,
  values: Partial<LineDestinationFormValues>
): Promise<ActionResponse> {
  const currentUser = await getCurrentUser()
  if (!currentUser) return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }

  if (!hasFullAccess(currentUser.profile.role)) {
    return { success: false, error: 'เฉพาะ Owner หรือ Admin เท่านั้นที่สามารถจัดการกลุ่ม LINE ได้' }
  }

  const supabase = await createClient()

  // Fetch current
  const { data: current } = await supabase
    .from('line_destinations')
    .select('*')
    .eq('id', id)
    .single()

  if (!current) return { success: false, error: 'ไม่พบข้อมูลกลุ่มที่ต้องการแก้ไข' }

  const groupType = values.group_type || resolveCategory(current)
  const baseName = (values.name || current.name).replace(/^\[(PAYABLE|RECEIVABLE)\]\s*/, '')
  const taggedName = `[${groupType}] ${baseName}`

  const updatePayload: Record<string, unknown> = {
    name: taggedName,
    is_active: values.is_active !== undefined ? values.is_active : current.is_active,
  }

  if (values.line_group_id) {
    updatePayload.line_group_id = values.line_group_id.trim()
  }

  // Try updating destination_type as well
  updatePayload.destination_type = groupType
  let { error } = await supabase.from('line_destinations').update(updatePayload).eq('id', id)

  if (error && error.code === '23514') {
    delete updatePayload.destination_type
    const retry = await supabase.from('line_destinations').update(updatePayload).eq('id', id)
    error = retry.error
  }

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/settings/line')
  return { success: true }
}

/**
 * Delete a LINE group destination
 */
export async function deleteLineDestinationAction(id: string): Promise<ActionResponse> {
  const currentUser = await getCurrentUser()
  if (!currentUser) return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }

  if (!hasFullAccess(currentUser.profile.role)) {
    return { success: false, error: 'เฉพาะ Owner หรือ Admin เท่านั้น' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('line_destinations').delete().eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/settings/line')
  return { success: true }
}

/**
 * Test Send LINE Message Action
 * Strict Rule: "ห้ามส่งจริงถ้าไม่มี Group ID"
 */
export async function testSendLineMessageAction(
  destinationId: string,
  testType: 'PAYABLE' | 'RECEIVABLE'
): Promise<ActionResponse> {
  const currentUser = await getCurrentUser()
  if (!currentUser) return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }

  if (!canWrite(currentUser.profile.role, 'settings')) {
    return { success: false, error: 'คุณไม่มีสิทธิ์ในการทดสอบส่งข้อความ LINE' }
  }

  const supabase = await createClient()

  // 1. Fetch Destination
  const { data: dest, error: destErr } = await supabase
    .from('line_destinations')
    .select('*')
    .eq('id', destinationId)
    .single()

  if (destErr || !dest) {
    return { success: false, error: 'ไม่พบข้อมูลกลุ่มเป้าหมาย' }
  }

  // Strict Rule Check: ห้ามส่งจริงถ้าไม่มี Group ID
  if (!dest.line_group_id || !dest.line_group_id.trim()) {
    return {
      success: false,
      error: 'ไม่สามารถทดสอบได้: ห้ามส่งจริงถ้าไม่มี Group ID (กรุณาระบุ Group ID ของกลุ่มเป้าหมาย)',
    }
  }

  if (!dest.is_active) {
    return {
      success: false,
      error: 'กลุ่มนี้ถูกปิดการใช้งานอยู่ (Inactive) กรุณาเปิดใช้งานก่อนทดสอบส่งข้อความ',
    }
  }

  // 2. Generate Sample Message based on testType
  const todayStr = new Date().toISOString().split('T')[0]
  let flexContainer: Record<string, unknown>
  let altTextStr: string

  if (testType === 'PAYABLE') {
    const formatted = formatPayableRentMessage({
      contactName: 'คุณสมชาย ทรัพย์มั่นคง (ผู้ให้เช่า)',
      roomNo: 'A102 / ชั้น 1',
      locationName: 'อาคารริชคอมเพล็กซ์ สาขาอโศก',
      rentAmount: 35000,
      whtAmount: 1750, // 5%
      serviceAmount: 2500,
      netAmount: 35750,
      dueDate: todayStr,
      status: 'รอชำระ (Pending Payment)',
      contractNo: 'CTR-DEMO-PAYABLE',
    })
    flexContainer = formatted.flex
    altTextStr = formatted.altText
  } else {
    const formatted = formatReceivableRentMessage({
      customerName: 'บริษัท สยามรีเทล ดิสทริบิวชั่น จำกัด',
      roomNo: 'Shop B-05',
      locationName: 'โครงการมาร์เก็ตเพลส พระราม 9',
      rentAmount: 48000,
      serviceAmount: 3000,
      receivableAmount: 51000,
      dueDate: todayStr,
      status: 'รอเรียกเก็บ (Pending Invoice)',
      contractNo: 'CTR-DEMO-RECEIVABLE',
    })
    flexContainer = formatted.flex
    altTextStr = formatted.altText
  }

  // 3. Send message via Line Messaging Service
  const sendRes = await sendLineMessage({
    toGroupId: dest.line_group_id,
    messages: [
      {
        type: 'flex',
        altText: `[ทดสอบระบบ] ${altTextStr}`,
        contents: flexContainer,
      },
    ],
    notificationType: testType,
    entityType: 'test_notification',
    destinationId: dest.id,
  })

  revalidatePath('/settings/line')

  if (!sendRes.success) {
    return {
      success: false,
      error: sendRes.error || 'การส่งข้อความไปยัง LINE API ล้มเหลว',
    }
  }

  return { success: true }
}
