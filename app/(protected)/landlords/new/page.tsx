import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/route-guard'
import { canWrite } from '@/lib/auth/permissions'
import { LandlordForm } from '@/components/landlords/landlord-form'

export const metadata: Metadata = {
  title: 'เพิ่มผู้ให้เช่าใหม่ | ระบบบริหารงานเช่าและเปิดสาขา',
}

export default async function NewLandlordPage() {
  const user = await requireRole('landlords')
  if (!canWrite(user.profile.role, 'landlords')) {
    redirect('/landlords')
  }

  return <LandlordForm userRole={user.profile.role} />
}
