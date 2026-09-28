import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/route-guard'
import { createClient } from '@/lib/supabase/server'
import { RentalLeadListView } from '@/components/rental-leads/rental-lead-list-view'
import type { RentalLeadWithRelations } from '@/lib/types/rental-leads'
import type { UserProfile } from '@/lib/types/auth'
import { isHouseRecord } from '@/lib/utils/lead-metadata'

export const metadata: Metadata = {
  title: 'ประเภทงาน | ระบบบริหารงานเช่าและเปิดสาขา',
}

export default async function RentalLeadsPage() {
  const user = await requireRole('rentals')
  const supabase = await createClient()

  const [leadsRes, profilesRes] = await Promise.all([
    supabase
      .from('rental_leads')
      .select(
        '*, locations(id, location_code, location_name, province, district), customers(id, customer_code, name, company_name, phone), landlords(id, landlord_code, name, company_name, phone), profiles!rental_leads_assigned_to_fkey(id, full_name, email)'
      )
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('is_active', true)
      .order('full_name', { ascending: true }),
  ])

  let leads: RentalLeadWithRelations[] =
    (leadsRes.data as unknown as RentalLeadWithRelations[]) ?? []

  // Operation role can ONLY see branch leads, never house leads
  if (user.profile.role === 'operation') {
    leads = leads.filter((l) => !isHouseRecord(l))
  }

  const staffProfiles: Pick<UserProfile, 'id' | 'full_name' | 'email'>[] =
    profilesRes.data ?? []

  return (
    <RentalLeadListView
      leads={leads}
      staffProfiles={staffProfiles}
      userRole={user.profile.role}
    />
  )
}
