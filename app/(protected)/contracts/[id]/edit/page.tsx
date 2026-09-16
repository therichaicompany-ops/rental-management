import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth/route-guard'
import { createClient } from '@/lib/supabase/server'
import { canWrite } from '@/lib/auth/permissions'
import { ContractForm } from '@/components/contracts/contract-form'
import type { ContractWithRelations } from '@/lib/types/contracts-payments'

export const metadata: Metadata = {
  title: 'แก้ไขสัญญาเช่า | ระบบบริหารงานเช่าและเปิดสาขา',
}

interface EditContractPageProps {
  params: Promise<{ id: string }>
}

export default async function EditContractPage({ params }: EditContractPageProps) {
  const { id } = await params
  const user = await requireUser()

  if (!canWrite(user.profile.role)) {
    redirect(`/contracts/${id}`)
  }

  const supabase = await createClient()

  const [contractRes, locationsRes, landlordsRes, customersRes, leadsRes, staffRes] =
    await Promise.all([
      supabase
        .from('rental_contracts')
        .select('*')
        .eq('id', id)
        .single(),
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
        .select('id, lead_no, lead_name')
        .order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('is_active', true)
        .order('full_name', { ascending: true }),
    ])

  if (contractRes.error || !contractRes.data) {
    notFound()
  }

  const contract = contractRes.data as unknown as ContractWithRelations

  return (
    <ContractForm
      initialData={contract}
      locations={locationsRes.data ?? []}
      landlords={landlordsRes.data ?? []}
      customers={customersRes.data ?? []}
      leads={leadsRes.data ?? []}
      staffProfiles={staffRes.data ?? []}
    />
  )
}
