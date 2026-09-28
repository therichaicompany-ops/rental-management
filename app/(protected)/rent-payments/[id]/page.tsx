import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/route-guard'
import { createClient } from '@/lib/supabase/server'
import { PaymentDetailView } from '@/components/payments/payment-detail-view'
import type { RentPaymentWithRelations } from '@/lib/types/contracts-payments'
import { isHouseRecord } from '@/lib/utils/lead-metadata'

export const metadata: Metadata = {
  title: 'รายละเอียดงวดชำระค่าเช่า | ระบบบริหารงานเช่าและเปิดสาขา',
}

interface PaymentDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function PaymentDetailPage({ params }: PaymentDetailPageProps) {
  const { id } = await params
  const user = await requireRole('rentPayments')
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('rent_payments')
    .select(
      `
      *,
      rental_contracts (
        id,
        contract_no,
        note,
        rental_leads (id, note),
        locations (id, location_name, province),
        customers (id, name, company_name),
        landlords (id, name, company_name, bank_name, bank_account_number)
      ),
      payment_transactions (
        *,
        profiles (id, full_name, email)
      )
    `
    )
    .eq('id', id)
    .single()

  if (error || !data) {
    notFound()
  }

  // Operation role cannot view payments for house contracts
  if (user.profile.role === 'operation' && isHouseRecord(data.rental_contracts)) {
    notFound()
  }

  // Sort payment transactions by transaction_date descending
  if (Array.isArray(data.payment_transactions)) {
    data.payment_transactions.sort(
      (a: { transaction_date: string }, b: { transaction_date: string }) =>
        new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
    )
  }

  const payment: RentPaymentWithRelations = data as unknown as RentPaymentWithRelations

  return <PaymentDetailView payment={payment} userRole={user.profile.role} />
}
