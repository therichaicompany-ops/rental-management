import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/route-guard'
import { canWrite } from '@/lib/auth/permissions'
import { createClient } from '@/lib/supabase/server'
import { LocationForm } from '@/components/locations/location-form'
import type { Landlord } from '@/lib/types/master-data'

export const metadata: Metadata = {
  title: 'เพิ่มสถานที่ใหม่ | ระบบบริหารงานเช่าและเปิดสาขา',
}

export default async function NewLocationPage() {
  const user = await requireRole('locations')
  if (!canWrite(user.profile.role, 'locations')) {
    redirect('/locations')
  }
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
