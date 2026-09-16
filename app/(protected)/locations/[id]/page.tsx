import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth/route-guard'
import { createClient } from '@/lib/supabase/server'
import { LocationForm } from '@/components/locations/location-form'
import type { Location, Landlord } from '@/lib/types/master-data'

export const metadata: Metadata = {
  title: 'แก้ไขข้อมูลสถานที่ | ระบบบริหารงานเช่าและเปิดสาขา',
}

interface LocationDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function LocationDetailPage({ params }: LocationDetailPageProps) {
  const { id } = await params
  const user = await requireUser()
  const supabase = await createClient()

  const { data: locationData, error: locationError } = await supabase
    .from('locations')
    .select('*')
    .eq('id', id)
    .single()

  if (locationError || !locationData) {
    notFound()
  }

  const { data: landlordsData } = await supabase
    .from('landlords')
    .select('id, name, company_name')
    .order('name', { ascending: true })

  const location: Location = locationData
  const landlords: Pick<Landlord, 'id' | 'name' | 'company_name'>[] =
    landlordsData ?? []

  return (
    <LocationForm
      initialData={location}
      landlords={landlords}
      userRole={user.profile.role}
    />
  )
}
