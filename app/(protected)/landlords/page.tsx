import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth/route-guard'
import { createClient } from '@/lib/supabase/server'
import { LandlordListView } from '@/components/landlords/landlord-list-view'
import type { Landlord } from '@/lib/types/master-data'

export const metadata: Metadata = {
  title: 'ผู้ให้เช่า | ระบบบริหารงานเช่าและเปิดสาขา',
}

export default async function LandlordsPage() {
  const user = await requireUser()
  const supabase = await createClient()

  const { data } = await supabase
    .from('landlords')
    .select('*')
    .order('created_at', { ascending: false })

  const landlords: Landlord[] = data ?? []

  return <LandlordListView landlords={landlords} userRole={user.profile.role} />
}
