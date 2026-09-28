import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/route-guard'
import { canWrite } from '@/lib/auth/permissions'
import { CustomerForm } from '@/components/customers/customer-form'

export const metadata: Metadata = {
  title: 'เพิ่มลูกค้า/ผู้เช่าใหม่ | ระบบบริหารงานเช่าและเปิดสาขา',
}

export default async function NewCustomerPage() {
  const user = await requireRole('customers')
  if (!canWrite(user.profile.role, 'customers')) {
    redirect('/customers')
  }

  return <CustomerForm userRole={user.profile.role} />
}
