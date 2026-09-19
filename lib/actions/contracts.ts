'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { canWrite, hasFullAccess } from '@/lib/auth/permissions'
import {
  rentalContractSchema,
  type RentalContractFormValues,
} from '@/lib/types/contracts-payments'
import { parseLeadMetadata, getContractPartyRole } from '@/lib/utils/lead-metadata'
import type { ActionResponse } from './customers'

export async function createContractAction(
  values: RentalContractFormValues
): Promise<ActionResponse & { data?: unknown }> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }
  }

  if (!canWrite(currentUser.profile.role)) {
    return { success: false, error: 'คุณไม่มีสิทธิ์ในการสร้างข้อมูล' }
  }

  const parsed = rentalContractSchema.safeParse(values)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(', '),
    }
  }

  const supabase = await createClient()

  const contractNo =
    parsed.data.contract_no?.trim() ||
    `CTR-${Date.now().toString().slice(-6)}`

  const { data, error } = await supabase
    .from('rental_contracts')
    .insert({
      contract_no: contractNo,
      lead_id: parsed.data.lead_id?.trim() || null,
      location_id: parsed.data.location_id,
      customer_id: parsed.data.customer_id?.trim() || null,
      landlord_id: parsed.data.landlord_id?.trim() || null,
      contract_date: parsed.data.contract_date || null,
      start_date: parsed.data.start_date,
      end_date: parsed.data.end_date,
      monthly_rent: parsed.data.monthly_rent ?? 0,
      deposit_amount: parsed.data.deposit_amount ?? 0,
      advance_rent_amount: parsed.data.advance_rent_amount ?? 0,
      other_service_amount: parsed.data.other_service_amount ?? 0,
      payment_due_day: parsed.data.payment_due_day ?? 5,
      wht_enabled: parsed.data.wht_enabled ?? false,
      wht_rate: parsed.data.wht_rate ?? 0,
      recurring_rent_enabled: parsed.data.recurring_rent_enabled ?? true,
      status: parsed.data.status ?? 'draft',
      need_branch_registration: parsed.data.need_branch_registration ?? true,
      need_vat_registration: parsed.data.need_vat_registration ?? false,
      need_employer_change: parsed.data.need_employer_change ?? false,
      need_signboard: parsed.data.need_signboard ?? true,
      assigned_to: parsed.data.assigned_to?.trim() || null,
      note: parsed.data.note?.trim() || null,
    })
    .select()
    .single()

  if (error) {
    console.error('createContractAction error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/contracts')
  return { success: true, data }
}

export async function updateContractAction(
  id: string,
  values: Partial<RentalContractFormValues>
): Promise<ActionResponse & { data?: unknown }> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }
  }

  if (!canWrite(currentUser.profile.role)) {
    return { success: false, error: 'คุณไม่มีสิทธิ์ในการแก้ไขข้อมูล' }
  }

  const supabase = await createClient()

  const payload: Record<string, unknown> = { ...values }
  if (payload.customer_id === '') payload.customer_id = null
  if (payload.landlord_id === '') payload.landlord_id = null
  if (payload.lead_id === '') payload.lead_id = null
  if (payload.assigned_to === '') payload.assigned_to = null
  if (payload.contract_date === '') payload.contract_date = null

  const { data, error } = await supabase
    .from('rental_contracts')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('updateContractAction error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/contracts')
  revalidatePath(`/contracts/${id}`)
  return { success: true, data }
}

export async function deleteContractAction(id: string): Promise<ActionResponse> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }
  }

  if (!hasFullAccess(currentUser.profile.role)) {
    return { success: false, error: 'คุณไม่มีสิทธิ์ในการลบสัญญาเช่า (เฉพาะผู้ดูแลระบบ/เจ้าของระบบ)' }
  }

  const supabase = await createClient()

  // First verify if any rent payments are tied to it
  const { count, error: countErr } = await supabase
    .from('rent_payments')
    .select('id', { count: 'exact', head: true })
    .eq('contract_id', id)

  if (countErr) {
    return { success: false, error: countErr.message }
  }

  if (count && count > 0) {
    return {
      success: false,
      error: `ไม่สามารถลบสัญญาได้เนื่องจากมีงวดการชำระเงินที่ผูกอยู่ ${count} รายการ กรุณาลบงวดการชำระเงินก่อน`,
    }
  }

  const { error } = await supabase.from('rental_contracts').delete().eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/contracts')
  return { success: true }
}

/**
 * Automatically generate monthly payment schedule records from contract start_date to end_date
 * Generates ONLY the single payment type matching contract direction:
 * - บริษัทเช่ากับเจ้าของ -> 'payable' (จ่ายเจ้าของ)
 * - ลูกค้าเช่ากับบริษัท -> 'receivable' (รับจากลูกค้า)
 */
export async function generatePaymentScheduleAction(
  contractId: string
): Promise<ActionResponse & { count?: number }> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }
  }

  if (!canWrite(currentUser.profile.role)) {
    return { success: false, error: 'คุณไม่มีสิทธิ์ในการดำเนินการ' }
  }

  const supabase = await createClient()

  const { data: contract, error: contractErr } = await supabase
    .from('rental_contracts')
    .select('*, rental_leads(note)')
    .eq('id', contractId)
    .single()

  if (contractErr || !contract) {
    return { success: false, error: 'ไม่พบข้อมูลสัญญาเช่า' }
  }

  if (!contract.start_date || !contract.end_date) {
    return { success: false, error: 'สัญญานี้ไม่ได้กำหนดวันเริ่มต้นหรือวันสิ้นสุด' }
  }

  const startDate = new Date(contract.start_date)
  const endDate = new Date(contract.end_date)

  if (startDate > endDate) {
    return { success: false, error: 'วันเริ่มต้นสัญญาต้องมาก่อนวันสิ้นสุดสัญญา' }
  }

  // Determine the contract direction / single party role
  const rawNote =
    contract.note || (contract.rental_leads as { note?: string } | null)?.note || ''
  const contractMeta = parseLeadMetadata(rawNote)
  const partyRole = getContractPartyRole(
    contractMeta.financial,
    contractMeta.isHouse,
    Boolean(contract.landlord_id),
    Boolean(contract.customer_id),
    rawNote
  )

  // Fetch existing rent payments for this contract to avoid duplicates
  const { data: existingPayments, error: fetchErr } = await supabase
    .from('rent_payments')
    .select('billing_period, payment_type')
    .eq('contract_id', contractId)

  if (fetchErr) {
    return { success: false, error: fetchErr.message }
  }

  const existingKeys = new Set(
    (existingPayments || []).map(
      (p: { billing_period: string; payment_type: string }) =>
        `${p.billing_period}_${p.payment_type}`
    )
  )

  // Strictly insert ONLY the single payment type for this contract
  const paymentTypes: ('payable' | 'receivable')[] = [partyRole]

  const rentAmount = Number(contract.monthly_rent) || 0
  const serviceAmount = Number(contract.other_service_amount) || 0
  const whtRate = Number(contract.wht_rate) || 0
  const whtAmount = contract.wht_enabled
    ? Math.round(rentAmount * (whtRate / 100) * 100) / 100
    : 0
  const dueDay = contract.payment_due_day || 5

  const paymentsToInsert: {
    contract_id: string
    payment_type: 'payable' | 'receivable'
    billing_period: string
    due_date: string
    rent_amount: number
    wht_amount: number
    service_amount: number
    other_amount: number
    status: 'pending' | 'overdue'
    amount_paid: number
  }[] = []
  const todayStr = new Date().toISOString().split('T')[0]

  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
  const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1)

  while (current <= endMonth) {
    const year = current.getFullYear()
    const month = current.getMonth() // 0-11
    const monthStr = String(month + 1).padStart(2, '0')
    const billingPeriod = `${year}-${monthStr}-01`

    // Determine due date in this month, clamping to last day of month
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
    const clampedDay = Math.min(dueDay, lastDayOfMonth)
    const dueDate = `${year}-${monthStr}-${String(clampedDay).padStart(2, '0')}`

    const status = dueDate < todayStr ? 'overdue' : 'pending'

    for (const pType of paymentTypes) {
      const key = `${billingPeriod}_${pType}`
      if (!existingKeys.has(key)) {
        paymentsToInsert.push({
          contract_id: contractId,
          payment_type: pType,
          billing_period: billingPeriod,
          due_date: dueDate,
          rent_amount: rentAmount,
          wht_amount: whtAmount,
          service_amount: serviceAmount,
          other_amount: 0,
          status,
          amount_paid: 0,
        })
      }
    }

    // Move to next month
    current.setMonth(current.getMonth() + 1)
  }

  if (paymentsToInsert.length === 0) {
    return {
      success: true,
      count: 0,
      error: 'มีงวดการชำระครบถ้วนตามระยะเวลาสัญญาแล้ว ไม่จำเป็นต้องสร้างเพิ่ม',
    }
  }

  // Insert payments (Remember: gross_amount, net_amount, balance_amount are GENERATED columns in DB!)
  const { data: inserted, error: insertErr } = await supabase
    .from('rent_payments')
    .insert(paymentsToInsert)
    .select()

  if (insertErr) {
    console.error('generatePaymentScheduleAction insertErr:', insertErr)
    return { success: false, error: insertErr.message }
  }

  revalidatePath('/rent-payments')
  revalidatePath(`/contracts/${contractId}`)

  return { success: true, count: inserted?.length || paymentsToInsert.length }
}

/**
 * Remove duplicate or mismatched payment schedule rows that don't match the contract's direction
 */
export async function cleanupWrongPaymentTypesAction(
  contractId: string,
  keepType: 'payable' | 'receivable'
): Promise<ActionResponse & { deletedCount?: number }> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }
  }
  if (!canWrite(currentUser.profile.role)) {
    return { success: false, error: 'คุณไม่มีสิทธิ์ในการดำเนินการ' }
  }

  const supabase = await createClient()

  // Find payments with the opposite/wrong payment type
  const oppositeType = keepType === 'payable' ? 'receivable' : 'payable'
  const { data: wrongPayments, error: fetchErr } = await supabase
    .from('rent_payments')
    .select('id')
    .eq('contract_id', contractId)
    .eq('payment_type', oppositeType)

  if (fetchErr) {
    return { success: false, error: fetchErr.message }
  }

  if (!wrongPayments || wrongPayments.length === 0) {
    return { success: true, deletedCount: 0 }
  }

  const wrongIds = wrongPayments.map((p) => p.id)

  // Delete payment transactions on these wrong payments first
  await supabase
    .from('payment_transactions')
    .delete()
    .in('rent_payment_id', wrongIds)

  // Delete wrong payments
  const { error: deleteErr } = await supabase
    .from('rent_payments')
    .delete()
    .in('id', wrongIds)

  if (deleteErr) {
    return { success: false, error: deleteErr.message }
  }

  revalidatePath('/rent-payments')
  revalidatePath(`/contracts/${contractId}`)
  return { success: true, deletedCount: wrongIds.length }
}
