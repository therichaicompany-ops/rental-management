import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth/route-guard'
import { createClient } from '@/lib/supabase/server'
import { ContractDetailView } from '@/components/contracts/contract-detail-view'
import type { ContractWithRelations } from '@/lib/types/contracts-payments'

export const metadata: Metadata = {
  title: 'รายละเอียดสัญญาเช่า | ระบบบริหารงานเช่าและเปิดสาขา',
}

interface ContractDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ContractDetailPage({ params }: ContractDetailPageProps) {
  const { id } = await params
  const user = await requireUser()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('rental_contracts')
    .select(
      `
      *,
      locations (id, location_code, location_name, province, district),
      customers (id, customer_code, name, company_name, phone),
      landlords (id, landlord_code, name, company_name, phone, bank_name, bank_account_number),
      profiles!rental_contracts_assigned_to_fkey (id, full_name, email),
      rental_leads (id, lead_no, lead_name),
      rent_payments (*)
    `
    )
    .eq('id', id)
    .single()

  if (error || !data) {
    notFound()
  }

  // Sort rent_payments by billing_period ascending
  if (Array.isArray(data.rent_payments)) {
    data.rent_payments.sort((a: { billing_period?: string }, b: { billing_period?: string }) =>
      (a.billing_period || '').localeCompare(b.billing_period || '')
    )
  }

  const contract: ContractWithRelations = data as unknown as ContractWithRelations

  return <ContractDetailView contract={contract} userRole={user.profile.role} />
}
