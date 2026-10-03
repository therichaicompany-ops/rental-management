import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { NotificationHistoryView } from '@/components/notifications/notification-history-view'
import { getNotificationHistoryAction } from '@/lib/actions/reminder'
import { getLineDestinationsAction } from '@/lib/actions/line'

export const metadata: Metadata = {
  title: 'ประวัติการแจ้งเตือน (Notification Logs) | ระบบบริหารงานเช่าและเปิดสาขา',
  description: 'ตรวจสอบประวัติการส่งข้อความแจ้งเตือนค่าเช่าเข้ากลุ่ม LINE ทั้งหมด',
}

export default async function NotificationsPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  const [historyRes, destinations] = await Promise.all([
    getNotificationHistoryAction({ limit: 20, page: 1 }),
    getLineDestinationsAction(),
  ])

  return (
    <NotificationHistoryView
      initialLogs={historyRes.logs}
      initialTotal={historyRes.totalCount}
      destinations={destinations}
    />
  )
}
