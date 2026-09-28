import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/route-guard'
import { createClient } from '@/lib/supabase/server'
import { canWrite } from '@/lib/auth/permissions'
import { ContractForm } from '@/components/contracts/contract-form'
import { isHouseRecord } from '@/lib/utils/lead-metadata'

export const metadata: Metadata = {
  title: 'สร้างสัญญาเช่าใหม่ | ระบบบริหารงานเช่าและเปิดสาขา',
}

export default async function NewContractPage() {
  const user = await requireRole('contracts')

  if (!canWrite(user.profile.role, 'contracts')) {
    redirect('/contracts')
  }

  const supabase = await createClient()

  const [locationsRes, landlordsRes, customersRes, leadsRes, staffRes] = await Promise.all([
    supabase
      .from('locations')
      .select('id, location_name, location_code, province')
      .order('location_name', { ascending: true }),
    supabase
      .from('landlords')
      .select('id, name, company_name, landlord_code')
      .order('name', { ascending: true }),
    supabase
      .from('customers')
      .select('id, name, company_name, customer_code')
      .order('name', { ascending: true }),
    supabase
      .from('rental_leads')
      .select('id, lead_no, lead_name, note')
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('is_active', true)
      .order('full_name', { ascending: true }),
  ])

  let leads = leadsRes.data ?? []
  if (user.profile.role === 'operation') {
    leads = leads.filter((l) => !isHouseRecord(l))
  }

  return (
    <ContractForm
      locations={locationsRes.data ?? []}
      landlords={landlordsRes.data ?? []}
      customers={customersRes.data ?? []}
      leads={leads}
      staffProfiles={staffRes.data ?? []}
      userRole={user.profile.role}
    />
  )
}
