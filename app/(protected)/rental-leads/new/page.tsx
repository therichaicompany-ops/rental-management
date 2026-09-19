import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth/route-guard'
import { createClient } from '@/lib/supabase/server'
import { RentalLeadForm } from '@/components/rental-leads/rental-lead-form'
import type { Location, Customer, Landlord } from '@/lib/types/master-data'
import type { UserProfile } from '@/lib/types/auth'

export const metadata: Metadata = {
  title: 'เพิ่มประเภทงานใหม่ | ระบบบริหารงานเช่าและเปิดสาขา',
}

export default async function NewRentalLeadPage() {
  const user = await requireUser()
  const supabase = await createClient()

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
    <RentalLeadForm
      locations={locations}
      customers={customers}
      landlords={landlords}
      staffProfiles={staffProfiles}
      userRole={user.profile.role}
    />
  )
}
