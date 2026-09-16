'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { canWrite, hasFullAccess } from '@/lib/auth/permissions'
import {
  rentPaymentSchema,
  paymentTransactionSchema,
  type RentPaymentFormValues,
  type PaymentTransactionFormValues,
} from '@/lib/types/contracts-payments'
import type { ActionResponse } from './customers'

export async function createRentPaymentAction(
  values: RentPaymentFormValues
): Promise<ActionResponse & { data?: unknown }> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }
  }

  if (!canWrite(currentUser.profile.role)) {
    return { success: false, error: 'คุณไม่มีสิทธิ์ในการสร้างข้อมูลงวดชำระ' }
  }

  const parsed = rentPaymentSchema.safeParse(values)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(', '),
    }
  }

  const supabase = await createClient()

  // Note: gross_amount, net_amount, balance_amount are GENERATED ALWAYS AS STORED in Postgres
  const { data, error } = await supabase
    .from('rent_payments')
    .insert({
      contract_id: parsed.data.contract_id,
      payment_type: parsed.data.payment_type,
      billing_period: parsed.data.billing_period,
      due_date: parsed.data.due_date,
      rent_amount: parsed.data.rent_amount ?? 0,
      wht_amount: parsed.data.wht_amount ?? 0,
      service_amount: parsed.data.service_amount ?? 0,
      other_amount: parsed.data.other_amount ?? 0,
      status: parsed.data.status ?? 'pending',
      payment_note: parsed.data.payment_note?.trim() || null,
      amount_paid: 0,
    })
    .select()
    .single()

  if (error) {
    console.error('createRentPaymentAction error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/rent-payments')
  if (data?.contract_id) {
    revalidatePath(`/contracts/${data.contract_id}`)
  }

  return { success: true, data }
}

export async function updateRentPaymentAction(
  id: string,
  values: Partial<RentPaymentFormValues>
): Promise<ActionResponse & { data?: unknown }> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }
  }

  if (!canWrite(currentUser.profile.role)) {
    return { success: false, error: 'คุณไม่มีสิทธิ์ในการแก้ไขข้อมูลงวดชำระ' }
  }

  const supabase = await createClient()

  // Ensure generated columns are not in the update payload
  const payload: Record<string, unknown> = { ...values }
  delete payload.gross_amount
  delete payload.net_amount
  delete payload.balance_amount

  const { data, error } = await supabase
    .from('rent_payments')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('updateRentPaymentAction error:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/rent-payments')
  revalidatePath(`/rent-payments/${id}`)
  if (data?.contract_id) {
    revalidatePath(`/contracts/${data.contract_id}`)
  }

  return { success: true, data }
}

export async function deleteRentPaymentAction(id: string): Promise<ActionResponse> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }
  }

  if (!hasFullAccess(currentUser.profile.role)) {
    return { success: false, error: 'คุณไม่มีสิทธิ์ในการลบงวดชำระ (เฉพาะผู้ดูแลระบบ/เจ้าของระบบ)' }
  }

  const supabase = await createClient()

  // First check if there are payment transactions
  const { count, error: countErr } = await supabase
    .from('payment_transactions')
    .select('id', { count: 'exact', head: true })
    .eq('rent_payment_id', id)

  if (countErr) {
    return { success: false, error: countErr.message }
  }

  if (count && count > 0) {
    return {
      success: false,
      error: `ไม่สามารถลบงวดชำระนี้ได้ เนื่องจากมีประวัติการชำระเงิน ${count} รายการ กรุณาลบรายการชำระเงินก่อน`,
    }
  }

  const { error } = await supabase.from('rent_payments').delete().eq('id', id)
  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/rent-payments')
  return { success: true }
}

export async function addPaymentTransactionAction(
  values: PaymentTransactionFormValues
): Promise<ActionResponse & { data?: unknown }> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }
  }

  if (!canWrite(currentUser.profile.role)) {
    return { success: false, error: 'คุณไม่มีสิทธิ์ในการบันทึกการชำระเงิน' }
  }

  const parsed = paymentTransactionSchema.safeParse(values)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(', '),
    }
  }

  const supabase = await createClient()

  // 1. Insert transaction
  const { data: tx, error: txError } = await supabase
    .from('payment_transactions')
    .insert({
      rent_payment_id: parsed.data.rent_payment_id,
      transaction_date: parsed.data.transaction_date,
      amount: parsed.data.amount,
      payment_method: parsed.data.payment_method,
      reference_no: parsed.data.reference_no?.trim() || null,
      paid_by: currentUser.profile.id,
      note: parsed.data.note?.trim() || null,
    })
    .select()
    .single()

  if (txError) {
    console.error('addPaymentTransactionAction txError:', txError)
    return { success: false, error: txError.message }
  }

  // 2. Refresh & check updated rent_payments status
  // Note: trigger trg_payment_transaction_refresh updates amount_paid automatically
  const { data: updatedPayment, error: fetchErr } = await supabase
    .from('rent_payments')
    .select('id, contract_id, net_amount, amount_paid, due_date, status')
    .eq('id', parsed.data.rent_payment_id)
    .single()

  if (!fetchErr && updatedPayment) {
    const todayStr = new Date().toISOString().split('T')[0]
    const net = Number(updatedPayment.net_amount) || 0
    const paid = Number(updatedPayment.amount_paid) || 0
    let nextStatus = updatedPayment.status

    if (paid >= net && net > 0) {
      nextStatus = 'paid'
    } else if (paid > 0) {
      nextStatus = 'partial'
    } else if (updatedPayment.due_date < todayStr) {
      nextStatus = 'overdue'
    } else {
      nextStatus = 'pending'
    }

    if (nextStatus !== updatedPayment.status) {
      await supabase
        .from('rent_payments')
        .update({ status: nextStatus })
        .eq('id', updatedPayment.id)
    }

    if (updatedPayment.contract_id) {
      revalidatePath(`/contracts/${updatedPayment.contract_id}`)
    }
  }

  revalidatePath('/rent-payments')
  revalidatePath(`/rent-payments/${parsed.data.rent_payment_id}`)

  return { success: true, data: tx }
}

export async function deletePaymentTransactionAction(
  transactionId: string,
  rentPaymentId: string
): Promise<ActionResponse> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }
  }

  if (!canWrite(currentUser.profile.role)) {
    return { success: false, error: 'คุณไม่มีสิทธิ์ในการลบรายการชำระเงิน' }
  }

  const supabase = await createClient()

  const { error: delErr } = await supabase
    .from('payment_transactions')
    .delete()
    .eq('id', transactionId)

  if (delErr) {
    return { success: false, error: delErr.message }
  }

  // Re-sync payment status
  const { data: updatedPayment } = await supabase
    .from('rent_payments')
    .select('id, contract_id, net_amount, amount_paid, due_date, status')
    .eq('id', rentPaymentId)
    .single()

  if (updatedPayment) {
    const todayStr = new Date().toISOString().split('T')[0]
    const net = Number(updatedPayment.net_amount) || 0
    const paid = Number(updatedPayment.amount_paid) || 0
    let nextStatus = updatedPayment.status

    if (paid >= net && net > 0) {
      nextStatus = 'paid'
    } else if (paid > 0) {
      nextStatus = 'partial'
    } else if (updatedPayment.due_date < todayStr) {
      nextStatus = 'overdue'
    } else {
      nextStatus = 'pending'
    }

    if (nextStatus !== updatedPayment.status) {
      await supabase
        .from('rent_payments')
        .update({ status: nextStatus })
        .eq('id', updatedPayment.id)
    }

    if (updatedPayment.contract_id) {
      revalidatePath(`/contracts/${updatedPayment.contract_id}`)
    }
  }

  revalidatePath('/rent-payments')
  revalidatePath(`/rent-payments/${rentPaymentId}`)

  return { success: true }
}
