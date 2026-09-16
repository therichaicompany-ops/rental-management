import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth/route-guard'
import { createClient } from '@/lib/supabase/server'
import { CustomerListView } from '@/components/customers/customer-list-view'
import type { Customer } from '@/lib/types/master-data'

export const metadata: Metadata = {
  title: 'ลูกค้า | ระบบบริหารงานเช่าและเปิดสาขา',
}

export default async function CustomersPage() {
  const user = await requireUser()
  const supabase = await createClient()

  const { data } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })

  const customers: Customer[] = data ?? []

  return <CustomerListView customers={customers} userRole={user.profile.role} />
}
