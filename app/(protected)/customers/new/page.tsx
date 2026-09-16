import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth/route-guard'
import { CustomerForm } from '@/components/customers/customer-form'

export const metadata: Metadata = {
  title: 'เพิ่มลูกค้าใหม่ | ระบบบริหารงานเช่าและเปิดสาขา',
}

export default async function NewCustomerPage() {
  const user = await requireUser()

  return <CustomerForm userRole={user.profile.role} />
}
