import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth/route-guard'
import { createClient } from '@/lib/supabase/server'
import { CustomerForm } from '@/components/customers/customer-form'
import type { Customer } from '@/lib/types/master-data'

export const metadata: Metadata = {
  title: 'แก้ไขข้อมูลลูกค้า/ผู้เช่า | ระบบบริหารงานเช่าและเปิดสาขา',
}

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params
  const user = await requireUser()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    notFound()
  }

  const customer: Customer = data

  return <CustomerForm initialData={customer} userRole={user.profile.role} />
}
