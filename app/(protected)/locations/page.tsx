import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth/route-guard'
import { createClient } from '@/lib/supabase/server'
import { LocationListView } from '@/components/locations/location-list-view'
import type { LocationWithLandlord } from '@/lib/types/master-data'

export const metadata: Metadata = {
  title: 'สถานที่ | ระบบบริหารงานเช่าและเปิดสาขา',
}

export default async function LocationsPage() {
  const user = await requireUser()
  const supabase = await createClient()

  const { data } = await supabase
    .from('locations')
    .select('*, landlords(id, name, company_name, phone)')
    .order('created_at', { ascending: false })

  const locations: LocationWithLandlord[] = (data as unknown as LocationWithLandlord[]) ?? []

  return <LocationListView locations={locations} userRole={user.profile.role} />
}
