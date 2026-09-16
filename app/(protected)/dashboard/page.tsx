import type { Metadata } from 'next'
import { getDashboardDataAction } from '@/lib/actions/dashboard'
import { DashboardView } from '@/components/dashboard/dashboard-view'

export const metadata: Metadata = {
  title: 'Dashboard | ระบบบริหารงานเช่าและเปิดสาขา',
  description: 'ภาพรวมของระบบบริหารงานเช่าและเปิดสาขา',
}

export default async function DashboardPage() {
  const data = await getDashboardDataAction()

  return <DashboardView data={data} />
}
