'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { canWrite, hasFullAccess } from '@/lib/auth/permissions'
import { customerSchema, type CustomerFormValues } from '@/lib/types/master-data'

export type ActionResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
}

export async function createCustomerAction(
  values: CustomerFormValues
): Promise<ActionResponse> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }
  }

  if (!canWrite(currentUser.profile.role)) {
    return { success: false, error: 'คุณไม่มีสิทธิ์ในการสร้างข้อมูล (สิทธิ์ Viewer ไม่สามารถสร้างได้)' }
  }

  const parsed = customerSchema.safeParse(values)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(', '),
    }
  }

  const supabase = await createClient()

  // If customer_code is empty, auto-generate a fallback timestamp code
  const customerCode =
    parsed.data.customer_code?.trim() ||
    `CUST-${Date.now().toString().slice(-6)}`

  const { data, error } = await supabase
    .from('customers')
    .insert({
      customer_code: customerCode,
      customer_type: parsed.data.customer_type,
      name: parsed.data.name?.trim() || null,
      company_name: parsed.data.company_name?.trim() || null,
      tax_id: parsed.data.tax_id?.trim() || null,
      contact_name: parsed.data.contact_name?.trim() || null,
      phone: parsed.data.phone?.trim() || null,
      email: parsed.data.email?.trim() || null,
      line_name: parsed.data.line_name?.trim() || null,
      address: parsed.data.address?.trim() || null,
      note: parsed.data.note?.trim() || null,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: `เกิดข้อผิดพลาด: ${error.message}` }
  }

  revalidatePath('/customers')
  return { success: true, data }
}

export async function updateCustomerAction(
  id: string,
  values: CustomerFormValues
): Promise<ActionResponse> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }
  }

  if (!canWrite(currentUser.profile.role)) {
    return { success: false, error: 'คุณไม่มีสิทธิ์ในการแก้ไขข้อมูล' }
  }

  const parsed = customerSchema.safeParse(values)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(', '),
    }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customers')
    .update({
      customer_code: parsed.data.customer_code?.trim() || null,
      customer_type: parsed.data.customer_type,
      name: parsed.data.name?.trim() || null,
      company_name: parsed.data.company_name?.trim() || null,
      tax_id: parsed.data.tax_id?.trim() || null,
      contact_name: parsed.data.contact_name?.trim() || null,
      phone: parsed.data.phone?.trim() || null,
      email: parsed.data.email?.trim() || null,
      line_name: parsed.data.line_name?.trim() || null,
      address: parsed.data.address?.trim() || null,
      note: parsed.data.note?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { success: false, error: `เกิดข้อผิดพลาด: ${error.message}` }
  }

  revalidatePath('/customers')
  revalidatePath(`/customers/${id}`)
  return { success: true, data }
}

export async function deleteCustomerAction(id: string): Promise<ActionResponse> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }
  }

  // Only owner and admin can delete
  if (!hasFullAccess(currentUser.profile.role)) {
    return { success: false, error: 'เฉพาะผู้ดูแลระบบ (Owner/Admin) เท่านั้นที่สามารถลบข้อมูลได้' }
  }

  const supabase = await createClient()

  const { error } = await supabase.from('customers').delete().eq('id', id)

  if (error) {
    return { success: false, error: `ไม่สามารถลบข้อมูลได้: ${error.message}` }
  }

  revalidatePath('/customers')
  return { success: true }
}
