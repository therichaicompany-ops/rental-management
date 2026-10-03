import { z } from 'zod'

export interface ReminderSettings {
  rent_reminder_enabled: boolean
  rent_reminder_days: number[] // e.g. [7, 3, 1, 0]
  rent_reminder_time: string // e.g. '09:00'
  overdue_reminder_enabled: boolean
}

export const defaultReminderSettings: ReminderSettings = {
  rent_reminder_enabled: true,
  rent_reminder_days: [7, 3, 1, 0],
  rent_reminder_time: '09:00',
  overdue_reminder_enabled: true,
}

export const reminderSettingsSchema = z.object({
  rent_reminder_enabled: z.boolean(),
  rent_reminder_days: z.array(z.number()),
  rent_reminder_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'รูปแบบเวลาไม่ถูกต้อง (HH:mm)'),
  overdue_reminder_enabled: z.boolean(),
})

export interface ReminderRunResult {
  success: boolean
  timestamp: string
  totalChecked: number
  sentCount: number
  skippedCount: number
  failedCount: number
  details: Array<{
    paymentId: string
    contractNo?: string
    paymentType: string
    dueDate: string
    daysDiff: number
    status: 'sent' | 'skipped' | 'failed'
    reason?: string
  }>
  error?: string
}
