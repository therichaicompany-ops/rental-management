import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth/route-guard'
import { createClient } from '@/lib/supabase/server'
import { LandlordForm } from '@/components/landlords/landlord-form'
import type { Landlord } from '@/lib/types/master-data'

export const metadata: Metadata = {
  title: 'แก้ไขข้อมูลผู้ให้เช่า | ระบบบริหารงานเช่าและเปิดสาขา',
}

interface LandlordDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function LandlordDetailPage({ params }: LandlordDetailPageProps) {
  const { id } = await params
  const user = await requireUser()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('landlords')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    notFound()
  }

  const landlord: Landlord = data

  return <LandlordForm initialData={landlord} userRole={user.profile.role} />
}
