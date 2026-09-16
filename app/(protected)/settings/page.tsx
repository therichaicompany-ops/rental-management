import type { Metadata } from 'next'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { requireUser } from '@/lib/auth/route-guard'
import { SettingsView } from '@/components/settings/settings-view'

export const metadata: Metadata = {
  title: 'ตั้งค่าระบบ | ระบบบริหารงานเช่าและเปิดสาขา',
  description: 'การตั้งค่าระบบ ข้อมูลผู้ใช้ และสิทธิ์การใช้งาน',
}

export default async function SettingsPage() {
  await requireUser()
  const user = await getCurrentUser()
  const profile = user?.profile

  return <SettingsView user={user} profile={profile} />
}
