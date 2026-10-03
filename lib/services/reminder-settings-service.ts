import { createAdminClient } from '@/lib/supabase/admin'
import {
  type ReminderSettings,
  defaultReminderSettings,
} from '@/lib/types/reminder'

const KEYS = {
  ENABLED: 'rent_reminder_enabled',
  DAYS: 'rent_reminder_days',
  TIME: 'rent_reminder_time',
  OVERDUE_ENABLED: 'overdue_reminder_enabled',
}

/**
 * Fetch reminder settings from system_settings table with fallback to defaults
 */
export async function getReminderSettings(): Promise<ReminderSettings> {
  try {
    const supabase = createAdminClient() as any
    const { data, error } = await supabase
      .from('system_settings')
      .select('setting_key, setting_value')
      .in('setting_key', Object.values(KEYS))

    if (error || !data || data.length === 0) {
      return { ...defaultReminderSettings }
    }

    const map = new Map<string, string>()
    for (const row of data) {
      if (row.setting_key && row.setting_value !== null) {
        map.set(row.setting_key, row.setting_value)
      }
    }

    let reminderDays = defaultReminderSettings.rent_reminder_days
    if (map.has(KEYS.DAYS)) {
      try {
        const parsed = JSON.parse(map.get(KEYS.DAYS)!)
        if (Array.isArray(parsed)) {
          reminderDays = parsed.map((n) => Number(n)).filter((n) => !isNaN(n))
        }
      } catch {
        // fallback
      }
    }

    return {
      rent_reminder_enabled: map.has(KEYS.ENABLED)
        ? map.get(KEYS.ENABLED) === 'true'
        : defaultReminderSettings.rent_reminder_enabled,
      rent_reminder_days: reminderDays,
      rent_reminder_time: map.get(KEYS.TIME) || defaultReminderSettings.rent_reminder_time,
      overdue_reminder_enabled: map.has(KEYS.OVERDUE_ENABLED)
        ? map.get(KEYS.OVERDUE_ENABLED) === 'true'
        : defaultReminderSettings.overdue_reminder_enabled,
    }
  } catch (err) {
    console.error('getReminderSettings error:', err)
    return { ...defaultReminderSettings }
  }
}

/**
 * Update reminder settings in system_settings table
 */
export async function saveReminderSettings(
  settings: Partial<ReminderSettings>,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient() as any
    const rowsToUpsert: Array<{
      setting_key: string
      setting_value: string
      description: string
      updated_by?: string | null
      updated_at: string
    }> = []

    const now = new Date().toISOString()

    if (settings.rent_reminder_enabled !== undefined) {
      rowsToUpsert.push({
        setting_key: KEYS.ENABLED,
        setting_value: String(settings.rent_reminder_enabled),
        description: 'เปิด/ปิด ระบบแจ้งเตือนค่าเช่าอัตโนมัติ',
        updated_by: userId || null,
        updated_at: now,
      })
    }

    if (settings.rent_reminder_days !== undefined) {
      rowsToUpsert.push({
        setting_key: KEYS.DAYS,
        setting_value: JSON.stringify(settings.rent_reminder_days),
        description: 'จำนวนวันแจ้งเตือนล่วงหน้าก่อนครบกำหนด เช่น [7, 3, 1, 0]',
        updated_by: userId || null,
        updated_at: now,
      })
    }

    if (settings.rent_reminder_time !== undefined) {
      rowsToUpsert.push({
        setting_key: KEYS.TIME,
        setting_value: settings.rent_reminder_time,
        description: 'เวลาส่งแจ้งเตือนประจำวัน (HH:mm) Asia/Bangkok',
        updated_by: userId || null,
        updated_at: now,
      })
    }

    if (settings.overdue_reminder_enabled !== undefined) {
      rowsToUpsert.push({
        setting_key: KEYS.OVERDUE_ENABLED,
        setting_value: String(settings.overdue_reminder_enabled),
        description: 'เปิด/ปิด แจ้งเตือนเมื่อเกินกำหนดชำระ (Overdue)',
        updated_by: userId || null,
        updated_at: now,
      })
    }

    if (rowsToUpsert.length === 0) return { success: true }

    const { error } = await supabase
      .from('system_settings')
      .upsert(rowsToUpsert, { onConflict: 'setting_key' })

    if (error) {
      console.error('saveReminderSettings upsert error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error saving settings'
    console.error('saveReminderSettings exception:', err)
    return { success: false, error: msg }
  }
}
