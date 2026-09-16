import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth/route-guard'
import { createClient } from '@/lib/supabase/server'
import { LocationForm } from '@/components/locations/location-form'
import type { Landlord } from '@/lib/types/master-data'

export const metadata: Metadata = {
  title: 'เพิ่มสถานที่ใหม่ | ระบบบริหารงานเช่าและเปิดสาขา',
}

export default async function NewLocationPage() {
  const user = await requireUser()
  const supabase = await createClient()

  const { data: landlordsData } = await supabase
    .from('landlords')
    .select('id, name, company_name')
    .order('name', { ascending: true })

  const landlords: Pick<Landlord, 'id' | 'name' | 'company_name'>[] =
    landlordsData ?? []

  return (
    <LocationForm
      landlords={landlords}
      userRole={user.profile.role}
    />
  )
}
