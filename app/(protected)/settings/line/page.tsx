import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { requireUser } from '@/lib/auth/route-guard'
import { hasFullAccess } from '@/lib/auth/permissions'
import { getLineDestinationsAction, getNotificationLogsAction } from '@/lib/actions/line'
import { LineSettingsView } from '@/components/settings/line-settings-view'

export const metadata: Metadata = {
  title: 'ตั้งค่า LINE Messaging API | ระบบบริหารงานเช่าและเปิดสาขา',
  description: 'จัดการกลุ่ม LINE สำหรับรับการแจ้งเตือนค่าเช่า PAYABLE และ RECEIVABLE',
}

export default async function LineSettingsPage() {
  await requireUser()
  const user = await getCurrentUser()
  const profile = user?.profile

  if (!profile || !hasFullAccess(profile.role)) {
    redirect('/settings')
  }

  const [destinations, logs] = await Promise.all([
    getLineDestinationsAction(),
    getNotificationLogsAction(25),
  ])

  // Resolve base URL for Webhook display
  const headersList = await headers()
  const host = headersList.get('x-forwarded-host') || headersList.get('host') || 'localhost:3000'
  const protocol = headersList.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https')
  const baseUrl = `${protocol}://${host}`

  return (
    <LineSettingsView
      destinations={destinations}
      logs={logs}
      userRole={profile.role}
      baseUrl={baseUrl}
    />
  )
}
