import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { hasFullAccess } from '@/lib/auth/permissions'
import { ReminderSettingsView } from '@/components/settings/reminder-settings-view'
import { getReminderSettings } from '@/lib/services/reminder-settings-service'
import { getLineDestinationsAction } from '@/lib/actions/line'

export const metadata: Metadata = {
  title: 'ตั้งค่าระบบแจ้งเตือนค่าเช่าอัตโนมัติ | ระบบบริหารงานเช่าและเปิดสาขา',
  description: 'ตั้งค่าเงื่อนไขเวลาและรอบวันแจ้งเตือนสัญญาเช่าล่วงหน้าผ่าน LINE',
}

export default async function SettingsNotificationsPage() {
  const user = await getCurrentUser()

  // Only Owner and Admin can access
  if (!user || !hasFullAccess(user.profile.role)) {
    redirect('/dashboard')
  }

  const [settings, destinations] = await Promise.all([
    getReminderSettings(),
    getLineDestinationsAction(),
  ])

  return (
    <ReminderSettingsView
      initialSettings={settings}
      destinations={destinations}
    />
  )
}
