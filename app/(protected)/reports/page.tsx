import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth/route-guard'
import { getProvincesAction } from '@/lib/actions/reports'
import { ReportsView } from '@/components/reports/reports-view'

export const metadata: Metadata = {
  title: 'Reports | ระบบบริหารงานเช่าและเปิดสาขา',
  description: 'รายงานและสรุปข้อมูลค่าเช่า งานเปิดสาขา และงานต่างๆ',
}

export default async function ReportsPage() {
  await requireUser()
  const provinces = await getProvincesAction()

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <ReportsView provinces={provinces} />
    </div>
  )
}
