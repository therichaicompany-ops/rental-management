import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/route-guard'
import { createClient } from '@/lib/supabase/server'
import { PaymentListView } from '@/components/payments/payment-list-view'
import type { RentPaymentWithRelations } from '@/lib/types/contracts-payments'
import { isHouseRecord } from '@/lib/utils/lead-metadata'

export const metadata: Metadata = {
  title: 'ค่าเช่าและการชำระเงิน (Rent Payments) | ระบบบริหารงานเช่าและเปิดสาขา',
}

export default async function RentPaymentsPage() {
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
        customers (id, name, company_name, phone),
        landlords (id, name, company_name, phone, bank_name, bank_account_number)
      )
    `
    )
    .order('due_date', { ascending: false })

  if (error) {
    console.error('RentPaymentsPage fetch error:', error)
  }

  let payments: RentPaymentWithRelations[] =
    (data as unknown as RentPaymentWithRelations[]) ?? []

  // Operation role can ONLY see payments for branch contracts, never house contracts
  if (user.profile.role === 'operation') {
    payments = payments.filter((p) => !isHouseRecord(p.rental_contracts))
  }

  return <PaymentListView payments={payments} userRole={user.profile.role} />
}
