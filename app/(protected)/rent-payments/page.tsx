import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth/route-guard'
import { createClient } from '@/lib/supabase/server'
import { PaymentListView } from '@/components/payments/payment-list-view'
import type { RentPaymentWithRelations } from '@/lib/types/contracts-payments'

export const metadata: Metadata = {
  title: 'ค่าเช่าและการชำระเงิน (Rent Payments) | ระบบบริหารงานเช่าและเปิดสาขา',
}

export default async function RentPaymentsPage() {
  const user = await requireUser()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('rent_payments')
    .select(
      `
      *,
      rental_contracts (
        id,
        contract_no,
        locations (id, location_name, province),
        customers (id, name, company_name),
        landlords (id, name, company_name, bank_name, bank_account_number)
      )
    `
    )
    .order('due_date', { ascending: false })

  if (error) {
    console.error('RentPaymentsPage fetch error:', error)
  }

  const payments: RentPaymentWithRelations[] =
    (data as unknown as RentPaymentWithRelations[]) ?? []

  return <PaymentListView payments={payments} userRole={user.profile.role} />
}
