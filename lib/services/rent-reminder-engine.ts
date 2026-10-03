import { createAdminClient } from '@/lib/supabase/admin'
import { getReminderSettings } from './reminder-settings-service'
import {
  formatPayableRentMessage,
  formatReceivableRentMessage,
} from './line-message-formatter'
import { sendLineMessage } from './line-messaging-service'
import type { ReminderRunResult } from '@/lib/types/reminder'
import type { LineDestinationModel, LineGroupType } from '@/lib/types/line'

/**
 * Helper to get current Date string in Asia/Bangkok (YYYY-MM-DD)
 */
export function getBangkokDateString(date = new Date()): string {
  // Format to YYYY-MM-DD in Asia/Bangkok timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(date)
}

/**
 * Calculate difference in days between target dueDate and today (both in Bangkok timezone)
 * targetDate - today:
 *  > 0: Future (e.g. 7 days remaining)
 *  = 0: Due today
 *  < 0: Overdue (e.g. -2 means 2 days overdue)
 */
export function calculateDaysDiff(dueDateStr: string, todayStr: string): number {
  const d1 = new Date(dueDateStr + 'T00:00:00Z')
  const d2 = new Date(todayStr + 'T00:00:00Z')
  const diffTime = d1.getTime() - d2.getTime()
  return Math.round(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Execute mark_overdue_rent_payments logic:
 * Updates pending/partial payments where due_date < current_date to 'overdue'
 */
export async function markOverdueRentPayments(): Promise<number> {
  const supabase = createAdminClient() as any
  const today = getBangkokDateString()

  try {
    // First try calling the stored function if it exists
    const { error: rpcError } = await supabase.rpc('mark_overdue_rent_payments')
    if (!rpcError) {
      return 1
    }
  } catch {
    // Fall back to direct table update
  }

  try {
    const { data, error } = await supabase
      .from('rent_payments')
      .update({
        status: 'overdue',
        updated_at: new Date().toISOString(),
      })
      .in('status', ['pending', 'partial'])
      .lt('due_date', today)
      .select('id')

    if (error) {
      console.warn('markOverdueRentPayments update warning:', error)
      return 0
    }
    return data?.length || 0
  } catch (err) {
    console.error('markOverdueRentPayments exception:', err)
    return 0
  }
}

/**
 * Core Reminder Automation Engine:
 * Scans rent payments, checks threshold, validates rules, sends LINE messages, logs results.
 */
export async function runRentReminderAutomation(options?: {
  forcedDate?: string // for testing specific dates
  targetPaymentId?: string // for testing specific payment
}): Promise<ReminderRunResult> {
  const today = options?.forcedDate || getBangkokDateString()
  const timestamp = new Date().toISOString()
  const result: ReminderRunResult = {
    success: true,
    timestamp,
    totalChecked: 0,
    sentCount: 0,
    skippedCount: 0,
    failedCount: 0,
    details: [],
  }

  const supabase = createAdminClient() as any

  // 1. Mark Overdue Rent Payments first
  await markOverdueRentPayments()

  // 2. Load Settings
  const settings = await getReminderSettings()
  if (!settings.rent_reminder_enabled) {
    return {
      ...result,
      error: 'ระบบแจ้งเตือนค่าเช่าอัตโนมัติถูกปิดการใช้งานอยู่ในระบบ (rent_reminder_enabled = false)',
    }
  }

  // 3. Load Active LINE Destinations
  const { data: rawDestinations, error: destError } = await supabase
    .from('line_destinations')
    .select('*')
    .eq('is_active', true)

  if (destError || !rawDestinations || rawDestinations.length === 0) {
    return {
      ...result,
      error: 'ไม่พบกลุ่ม LINE ปลายทางที่เปิดใช้งานอยู่ (กรุณาตั้งค่าที่ /settings/line)',
    }
  }

  const destinations: LineDestinationModel[] = rawDestinations
  // Match destination by name tag or type
  const payableDest =
    destinations.find((d) => d.destination_type === 'PAYABLE' || d.name.includes('[PAYABLE]')) ||
    destinations[0]

  const receivableDest =
    destinations.find((d) => d.destination_type === 'RECEIVABLE' || d.name.includes('[RECEIVABLE]')) ||
    destinations[1] ||
    destinations[0]

  // 4. Query rent_payments where status != 'paid' and status != 'cancelled'
  let query = supabase
    .from('rent_payments')
    .select(
      `
      id,
      contract_id,
      payment_type,
      billing_period,
      due_date,
      rent_amount,
      wht_amount,
      service_amount,
      other_amount,
      gross_amount,
      net_amount,
      amount_paid,
      balance_amount,
      status,
      payment_note,
      rental_contracts (
        id,
        contract_no,
        locations (id, location_name),
        customers (id, name, company_name),
        landlords (id, name, company_name, bank_name, bank_account_number)
      )
    `
    )
    .neq('status', 'paid')
    .neq('status', 'cancelled')

  if (options?.targetPaymentId) {
    query = query.eq('id', options.targetPaymentId)
  }

  const { data: payments, error: fetchErr } = await query

  if (fetchErr || !payments) {
    return {
      ...result,
      success: false,
      error: fetchErr ? fetchErr.message : 'ไม่สามารถดึงข้อมูลค่าเช่าได้',
    }
  }

  result.totalChecked = payments.length

  // 5. Query existing notification_logs for today to enforce duplicate prevention
  const { data: todayLogs } = await supabase
    .from('notification_logs')
    .select('entity_id, notification_type, status')
    .eq('notification_date', today)
    .eq('entity_type', 'rent_payment')

  const alreadySentSet = new Set<string>()
  if (todayLogs) {
    for (const log of todayLogs) {
      if (log.status === 'sent') {
        alreadySentSet.add(`${log.entity_id}:${log.notification_type}`)
      }
    }
  }

  // 6. Process each payment
  for (const payment of payments) {
    const isPayable = payment.payment_type === 'payable'
    const notificationType: LineGroupType = isPayable ? 'PAYABLE' : 'RECEIVABLE'
    const targetDest = isPayable ? payableDest : receivableDest
    const contract = payment.rental_contracts || {}
    const contractNo = contract.contract_no || 'ไม่ระบุสัญญา'

    // RULE 1: If status = 'paid', DO NOT SEND
    if (payment.status === 'paid') {
      result.skippedCount++
      result.details.push({
        paymentId: payment.id,
        contractNo,
        paymentType: notificationType,
        dueDate: payment.due_date,
        daysDiff: calculateDaysDiff(payment.due_date, today),
        status: 'skipped',
        reason: 'สถานะชำระแล้ว (Paid) - ห้ามส่ง',
      })
      continue
    }

    // RULE 2: Calculate days diff
    const daysDiff = calculateDaysDiff(payment.due_date, today)

    // Check if daysDiff qualifies for reminder
    let shouldSend = false
    let reminderReason = ''

    if (daysDiff >= 0) {
      if (settings.rent_reminder_days.includes(daysDiff)) {
        shouldSend = true
        reminderReason = daysDiff === 0 ? 'ครบกำหนดชำระวันนี้' : `ครบกำหนดในอีก ${daysDiff} วัน`
      }
    } else {
      // Overdue
      if (settings.overdue_reminder_enabled) {
        shouldSend = true
        reminderReason = `เกินกำหนดชำระแล้ว ${Math.abs(daysDiff)} วัน (Overdue)`
      }
    }

    if (!shouldSend) {
      result.skippedCount++
      result.details.push({
        paymentId: payment.id,
        contractNo,
        paymentType: notificationType,
        dueDate: payment.due_date,
        daysDiff,
        status: 'skipped',
        reason: `ไม่อยู่ในเงื่อนไขรอบการแจ้งเตือน (เหลือ ${daysDiff} วัน)`,
      })
      continue
    }

    // RULE 3: Duplicate Prevention - If notification already sent on the same day, DO NOT RESEND
    const dedupeKey = `${payment.id}:${notificationType}`
    if (alreadySentSet.has(dedupeKey)) {
      result.skippedCount++
      result.details.push({
        paymentId: payment.id,
        contractNo,
        paymentType: notificationType,
        dueDate: payment.due_date,
        daysDiff,
        status: 'skipped',
        reason: 'มีการแจ้งเตือนสำหรับรายการนี้ในวันนี้ไปแล้ว (ห้ามส่งซ้ำ)',
      })
      continue
    }

    // RULE 4: Strict Group ID Check - ห้ามส่งจริงถ้าไม่มี Group ID
    if (!targetDest || !targetDest.line_group_id || !targetDest.line_group_id.trim()) {
      result.failedCount++
      result.details.push({
        paymentId: payment.id,
        contractNo,
        paymentType: notificationType,
        dueDate: payment.due_date,
        daysDiff,
        status: 'failed',
        reason: 'ห้ามส่งจริงถ้าไม่มี Group ID สำหรับกลุ่มปลายทางนี้',
      })
      continue
    }

    // 7. Format Message
    let flexContainer: Record<string, unknown>
    let altTextStr: string

    if (isPayable) {
      const landlord = contract.landlords || {}
      const location = contract.locations || {}
      const formatted = formatPayableRentMessage({
        contactName: landlord.name || landlord.company_name || 'ผู้ให้เช่า',
        roomNo: contract.note || '-',
        locationName: location.location_name || 'ไม่ระบุสถานที่',
        rentAmount: Number(payment.rent_amount) || 0,
        whtAmount: Number(payment.wht_amount) || 0,
        serviceAmount: Number(payment.service_amount) || 0,
        netAmount: Number(payment.net_amount) || 0,
        dueDate: payment.due_date,
        status: reminderReason,
        contractNo: contract.contract_no || undefined,
      })
      flexContainer = formatted.flex
      altTextStr = formatted.altText
    } else {
      const customer = contract.customers || {}
      const location = contract.locations || {}
      const formatted = formatReceivableRentMessage({
        customerName: customer.name || customer.company_name || 'ลูกค้า',
        roomNo: contract.note || '-',
        locationName: location.location_name || 'ไม่ระบุสถานที่',
        rentAmount: Number(payment.rent_amount) || 0,
        serviceAmount: Number(payment.service_amount) || 0,
        receivableAmount: Number(payment.net_amount) || 0,
        dueDate: payment.due_date,
        status: reminderReason,
        contractNo: contract.contract_no || undefined,
      })
      flexContainer = formatted.flex
      altTextStr = formatted.altText
    }

    // 8. Send Line Message (Will automatically log to notification_logs)
    const sendRes = await sendLineMessage({
      toGroupId: targetDest.line_group_id,
      messages: [
        {
          type: 'flex',
          altText: altTextStr,
          contents: flexContainer,
        },
      ],
      notificationType,
      entityType: 'rent_payment',
      entityId: payment.id,
      destinationId: targetDest.id,
      notificationDate: today,
    })

    if (sendRes.success) {
      result.sentCount++
      alreadySentSet.add(dedupeKey) // Prevent duplicate within the same run
      result.details.push({
        paymentId: payment.id,
        contractNo,
        paymentType: notificationType,
        dueDate: payment.due_date,
        daysDiff,
        status: 'sent',
        reason: reminderReason,
      })
    } else {
      result.failedCount++
      result.details.push({
        paymentId: payment.id,
        contractNo,
        paymentType: notificationType,
        dueDate: payment.due_date,
        daysDiff,
        status: 'failed',
        reason: sendRes.error || 'ส่งข้อความ LINE ล้มเหลว',
      })
    }
  }

  return result
}
