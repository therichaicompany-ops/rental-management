import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth/route-guard'
import { LandlordForm } from '@/components/landlords/landlord-form'

export const metadata: Metadata = {
  title: 'เพิ่มผู้ให้เช่าใหม่ | ระบบบริหารงานเช่าและเปิดสาขา',
}

export default async function NewLandlordPage() {
  const user = await requireUser()

  return <LandlordForm userRole={user.profile.role} />
}
