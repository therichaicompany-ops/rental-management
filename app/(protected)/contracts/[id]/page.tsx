import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/route-guard'
import { createClient } from '@/lib/supabase/server'
import { ContractDetailView } from '@/components/contracts/contract-detail-view'
import type { ContractWithRelations } from '@/lib/types/contracts-payments'
import { isHouseRecord } from '@/lib/utils/lead-metadata'
import type { OpeningProjectWithRelations } from '@/lib/types/opening'

export const metadata: Metadata = {
  title: 'รายละเอียดสัญญาเช่า | ระบบบริหารงานเช่าและเปิดสาขา',
}

interface ContractDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ContractDetailPage({ params }: ContractDetailPageProps) {
  const { id } = await params
  const user = await requireRole('contracts')
  const supabase = await createClient()

  const [contractRes, openingRes] = await Promise.all([
    supabase
      .from('rental_contracts')
      .select(
        `
        *,
        locations (id, location_code, location_name, province, district),
        customers (id, customer_code, name, company_name, phone),
        landlords (id, landlord_code, name, company_name, phone, bank_name, bank_account_number),
        profiles!rental_contracts_assigned_to_fkey (id, full_name, email),
        rental_leads (id, lead_no, lead_name, note),
        rent_payments (*)
      `
      )
      .eq('id', id)
      .single(),

    supabase
      .from('opening_projects')
      .select(
        `
        id, project_no, status, updated_at,
        workflow_stages (id, stage_code, stage_name, sequence),
        opening_tasks (
          id, task_name, status, completed_at, updated_at,
          workflow_stages (id, stage_code, stage_name, sequence)
        )
      `
      )
      .eq('contract_id', id)
      .maybeSingle(),
  ])

  const { data, error } = contractRes

  if (error || !data) {
    notFound()
  }

  // Operation role cannot view house contracts
  if (user.profile.role === 'operation' && isHouseRecord(data)) {
    notFound()
  }

  // Sort rent_payments by billing_period ascending
  if (Array.isArray(data.rent_payments)) {
    data.rent_payments.sort((a: { billing_period?: string }, b: { billing_period?: string }) =>
      (a.billing_period || '').localeCompare(b.billing_period || '')
    )
  }

  const contract: ContractWithRelations = data as unknown as ContractWithRelations
  const openingProject = (openingRes.data ?? null) as unknown as OpeningProjectWithRelations | null

  return <ContractDetailView contract={contract} userRole={user.profile.role} openingProject={openingProject} />
}
