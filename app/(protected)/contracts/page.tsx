import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/route-guard'
import { createClient } from '@/lib/supabase/server'
import { ContractListView } from '@/components/contracts/contract-list-view'
import type { ContractWithRelations } from '@/lib/types/contracts-payments'
import { isHouseRecord } from '@/lib/utils/lead-metadata'

export const metadata: Metadata = {
  title: 'สัญญาเช่า (Rental Contracts) | ระบบบริหารงานเช่าและเปิดสาขา',
}

export default async function ContractsPage() {
  const user = await requireRole('contracts')
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('rental_contracts')
    .select(
      `
      *,
      rental_leads (id, lead_no, note),
      locations (id, location_code, location_name, province, district),
      customers (id, customer_code, name, company_name, phone),
      landlords (id, landlord_code, name, company_name, phone, bank_name, bank_account_number),
      profiles!rental_contracts_assigned_to_fkey (id, full_name, email)
    `
    )
    .order('created_at', { ascending: false })

  if (error) {
    console.error('ContractsPage fetch error:', error)
  }

  let contracts: ContractWithRelations[] = (data as unknown as ContractWithRelations[]) ?? []

  // Operation role can ONLY see branch contracts, never house contracts
  if (user.profile.role === 'operation') {
    contracts = contracts.filter((c) => !isHouseRecord(c))
  }

  return <ContractListView contracts={contracts} userRole={user.profile.role} />
}
