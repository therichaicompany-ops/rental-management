import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth/route-guard'
import { createClient } from '@/lib/supabase/server'
import { RentalLeadDetailView } from '@/components/rental-leads/rental-lead-detail-view'
import type { RentalLeadWithRelations } from '@/lib/types/rental-leads'
import type { Customer, Landlord, Location } from '@/lib/types/master-data'
import type { UserProfile } from '@/lib/types/auth'

export const metadata: Metadata = {
  title: 'รายละเอียดประเภทงาน | ระบบบริหารงานเช่าและเปิดสาขา',
}

interface RentalLeadDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function RentalLeadDetailPage({ params }: RentalLeadDetailPageProps) {
  const { id } = await params
  const user = await requireUser()
  const supabase = await createClient()

  // 1. Fetch Lead with relations and negotiation logs
  const { data: leadData, error: leadError } = await supabase
    .from('rental_leads')
    .select(
      '*, locations(id, location_code, location_name, province, district), customers(id, customer_code, name, company_name, phone), landlords(id, landlord_code, name, company_name, phone), profiles!rental_leads_assigned_to_fkey(id, full_name, email), negotiation_logs(*, profiles(id, full_name, email))'
    )
    .eq('id', id)
    .single()

  if (leadError || !leadData) {
    notFound()
  }

  const lead: RentalLeadWithRelations = leadData as unknown as RentalLeadWithRelations

  // 2. Check if a contract has already been created for this lead
  const { data: contractData } = await supabase
    .from('rental_contracts')
    .select('id, contract_no')
    .eq('lead_id', id)
    .maybeSingle()

  // 3. Fetch Master Data options in parallel for edit form
  const [locRes, custRes, llRes, staffRes] = await Promise.all([
    supabase
      .from('locations')
      .select('id, location_code, location_name, province')
      .order('location_name', { ascending: true }),
    supabase
      .from('customers')
      .select('id, customer_code, name, company_name')
      .order('name', { ascending: true }),
    supabase
      .from('landlords')
      .select('id, landlord_code, name, company_name')
      .order('name', { ascending: true }),
    supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('is_active', true)
      .order('full_name', { ascending: true }),
  ])

  const locations: Pick<Location, 'id' | 'location_code' | 'location_name' | 'province'>[] =
    locRes.data ?? []

  const customers: Pick<Customer, 'id' | 'customer_code' | 'name' | 'company_name'>[] =
    custRes.data ?? []

  const landlords: Pick<Landlord, 'id' | 'landlord_code' | 'name' | 'company_name'>[] =
    llRes.data ?? []

  const staffProfiles: Pick<UserProfile, 'id' | 'full_name' | 'email'>[] =
    staffRes.data ?? []

  return (
    <RentalLeadDetailView
      lead={lead}
      locations={locations}
      customers={customers}
      landlords={landlords}
      staffProfiles={staffProfiles}
      userRole={user.profile.role}
      existingContract={contractData}
    />
  )
}
