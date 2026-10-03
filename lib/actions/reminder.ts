'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { hasFullAccess } from '@/lib/auth/permissions'
import {
  type ReminderSettings,
  type ReminderRunResult,
  reminderSettingsSchema,
} from '@/lib/types/reminder'
import {
  getReminderSettings,
  saveReminderSettings,
} from '@/lib/services/reminder-settings-service'
import { runRentReminderAutomation } from '@/lib/services/rent-reminder-engine'
import { sendLineMessage } from '@/lib/services/line-messaging-service'
import type { NotificationLogModel } from '@/lib/types/line'

export interface ActionResponse<T = unknown> {
  success: boolean
  error?: string
  data?: T
}

/**
 * Fetch reminder settings (Owner/Admin only)
 */
export async function getReminderSettingsAction(): Promise<ActionResponse<ReminderSettings>> {
  const user = await getCurrentUser()
  if (!user || !hasFullAccess(user.profile.role)) {
    return { success: false, error: 'คุณไม่มีสิทธิ์เข้าถึงการตั้งค่าการแจ้งเตือน' }
  }

  const settings = await getReminderSettings()
  return { success: true, data: settings }
}

/**
 * Save reminder settings (Owner/Admin only)
 */
export async function saveReminderSettingsAction(
  formData: unknown
): Promise<ActionResponse<ReminderSettings>> {
  const user = await getCurrentUser()
  if (!user || !hasFullAccess(user.profile.role)) {
    return { success: false, error: 'คุณไม่มีสิทธิ์แก้ไขการตั้งค่าการแจ้งเตือน' }
  }

  const parsed = reminderSettingsSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'ข้อมูลไม่ถูกต้อง' }
  }

  const saveRes = await saveReminderSettings(parsed.data, user.id)
  if (!saveRes.success) {
    return { success: false, error: saveRes.error }
  }

  revalidatePath('/settings/notifications')
  return { success: true, data: parsed.data }
}

/**
 * Trigger rent reminder automation manually (Owner/Admin only)
 */
export async function runRentReminderNowAction(): Promise<ActionResponse<ReminderRunResult>> {
  const user = await getCurrentUser()
  if (!user || !hasFullAccess(user.profile.role)) {
    return { success: false, error: 'คุณไม่มีสิทธิ์สั่งรันระบบแจ้งเตือน' }
  }

  try {
    const result = await runRentReminderAutomation()
    revalidatePath('/settings/notifications')
    revalidatePath('/notifications')
    return { success: true, data: result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown execution error'
    return { success: false, error: msg }
  }
}

/**
 * Fetch notification logs history with filters and pagination
 */
export async function getNotificationHistoryAction(params?: {
  status?: string
  notificationType?: string
  limit?: number
  page?: number
}): Promise<{
  logs: NotificationLogModel[]
  totalCount: number
}> {
  const supabase = await createClient()
  const limit = params?.limit || 20
  const page = params?.page || 1
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = (supabase as any)
    .from('notification_logs')
    .select('*', { count: 'exact' })

  if (params?.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  if (params?.notificationType && params.notificationType !== 'all') {
    query = query.eq('notification_type', params.notificationType)
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error || !data) {
    console.error('getNotificationHistoryAction error:', error)
    return { logs: [], totalCount: 0 }
  }

  return {
    logs: data as NotificationLogModel[],
    totalCount: count || 0,
  }
}

/**
 * Retry sending a failed notification
 */
export async function retryFailedNotificationAction(
  logId: string
): Promise<ActionResponse<void>> {
  const user = await getCurrentUser()
  if (!user || !hasFullAccess(user.profile.role)) {
    return { success: false, error: 'คุณไม่มีสิทธิ์ส่งซ้ำการแจ้งเตือน' }
  }

  const supabase = await createClient()
  const { data: log, error: logErr } = await (supabase as any)
    .from('notification_logs')
    .select('*')
    .eq('id', logId)
    .single()

  if (logErr || !log) {
    return { success: false, error: 'ไม่พบประวัติการแจ้งเตือนนี้' }
  }

  if (!log.destination_id) {
    return { success: false, error: 'ไม่พบรหัสกลุ่มปลายทางสำหรับการส่งซ้ำ' }
  }

  // Get destination
  const { data: dest, error: destErr } = await (supabase as any)
    .from('line_destinations')
    .select('*')
    .eq('id', log.destination_id)
    .single()

  if (destErr || !dest || !dest.line_group_id) {
    return { success: false, error: 'ไม่พบข้อมูลกลุ่มปลายทาง หรือไม่มี Group ID' }
  }

  let messages: Array<Record<string, unknown>>
  try {
    messages = JSON.parse(log.message || '[]')
    if (!Array.isArray(messages) || messages.length === 0) {
      messages = [{ type: 'text', text: log.message || '[ส่งซ้ำ] แจ้งเตือนสัญญาเช่า' }]
    }
  } catch {
    messages = [{ type: 'text', text: log.message || '[ส่งซ้ำ] แจ้งเตือนสัญญาเช่า' }]
  }

  const sendRes = await sendLineMessage({
    toGroupId: dest.line_group_id,
    messages,
    notificationType: log.notification_type,
    entityType: log.entity_type,
    entityId: log.entity_id,
    destinationId: dest.id,
  })

  if (!sendRes.success) {
    return { success: false, error: sendRes.error || 'ส่งซ้ำไม่สำเร็จ' }
  }

  revalidatePath('/notifications')
  return { success: true }
}
