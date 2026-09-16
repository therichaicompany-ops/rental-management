'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { canWrite, hasFullAccess } from '@/lib/auth/permissions'
import { landlordSchema, type LandlordFormValues } from '@/lib/types/master-data'
import type { ActionResponse } from './customers'

export async function createLandlordAction(
  values: LandlordFormValues
): Promise<ActionResponse> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }
  }

  if (!canWrite(currentUser.profile.role)) {
    return { success: false, error: 'คุณไม่มีสิทธิ์ในการสร้างข้อมูล (สิทธิ์ Viewer ไม่สามารถสร้างได้)' }
  }

  const parsed = landlordSchema.safeParse(values)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(', '),
    }
  }

  const supabase = await createClient()

  const landlordCode =
    parsed.data.landlord_code?.trim() ||
    `LL-${Date.now().toString().slice(-6)}`

  const { data, error } = await supabase
    .from('landlords')
    .insert({
      landlord_code: landlordCode,
      name: parsed.data.name?.trim() || null,
      company_name: parsed.data.company_name?.trim() || null,
      tax_id: parsed.data.tax_id?.trim() || null,
      contact_name: parsed.data.contact_name?.trim() || null,
      phone: parsed.data.phone?.trim() || null,
      email: parsed.data.email?.trim() || null,
      address: parsed.data.address?.trim() || null,
      bank_name: parsed.data.bank_name?.trim() || null,
      bank_account_name: parsed.data.bank_account_name?.trim() || null,
      bank_account_number: parsed.data.bank_account_number?.trim() || null,
      note: parsed.data.note?.trim() || null,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: `เกิดข้อผิดพลาด: ${error.message}` }
  }

  revalidatePath('/landlords')
  return { success: true, data }
}

export async function updateLandlordAction(
  id: string,
  values: LandlordFormValues
): Promise<ActionResponse> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }
  }

  if (!canWrite(currentUser.profile.role)) {
    return { success: false, error: 'คุณไม่มีสิทธิ์ในการแก้ไขข้อมูล' }
  }

  const parsed = landlordSchema.safeParse(values)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(', '),
    }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('landlords')
    .update({
      landlord_code: parsed.data.landlord_code?.trim() || null,
      name: parsed.data.name?.trim() || null,
      company_name: parsed.data.company_name?.trim() || null,
      tax_id: parsed.data.tax_id?.trim() || null,
      contact_name: parsed.data.contact_name?.trim() || null,
      phone: parsed.data.phone?.trim() || null,
      email: parsed.data.email?.trim() || null,
      address: parsed.data.address?.trim() || null,
      bank_name: parsed.data.bank_name?.trim() || null,
      bank_account_name: parsed.data.bank_account_name?.trim() || null,
      bank_account_number: parsed.data.bank_account_number?.trim() || null,
      note: parsed.data.note?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { success: false, error: `เกิดข้อผิดพลาด: ${error.message}` }
  }

  revalidatePath('/landlords')
  revalidatePath(`/landlords/${id}`)
  return { success: true, data }
}

export async function deleteLandlordAction(id: string): Promise<ActionResponse> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }
  }

  if (!hasFullAccess(currentUser.profile.role)) {
    return { success: false, error: 'เฉพาะผู้ดูแลระบบ (Owner/Admin) เท่านั้นที่สามารถลบข้อมูลได้' }
  }

  const supabase = await createClient()

  const { error } = await supabase.from('landlords').delete().eq('id', id)

  if (error) {
    return { success: false, error: `ไม่สามารถลบข้อมูลได้: ${error.message}` }
  }

  revalidatePath('/landlords')
  return { success: true }
}
