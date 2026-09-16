'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { canWrite, hasFullAccess } from '@/lib/auth/permissions'
import { locationSchema, type LocationFormValues } from '@/lib/types/master-data'
import type { ActionResponse } from './customers'

export async function createLocationAction(
  values: LocationFormValues
): Promise<ActionResponse> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }
  }

  if (!canWrite(currentUser.profile.role)) {
    return { success: false, error: 'คุณไม่มีสิทธิ์ในการสร้างข้อมูล (สิทธิ์ Viewer ไม่สามารถสร้างได้)' }
  }

  const parsed = locationSchema.safeParse(values)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(', '),
    }
  }

  const supabase = await createClient()

  const locationCode =
    parsed.data.location_code?.trim() ||
    `LOC-${Date.now().toString().slice(-6)}`

  const { data, error } = await supabase
    .from('locations')
    .insert({
      location_code: locationCode,
      location_name: parsed.data.location_name.trim(),
      house_no: parsed.data.house_no?.trim() || null,
      room_no: parsed.data.room_no?.trim() || null,
      village_name: parsed.data.village_name?.trim() || null,
      address: parsed.data.address?.trim() || null,
      subdistrict: parsed.data.subdistrict?.trim() || null,
      district: parsed.data.district?.trim() || null,
      province: parsed.data.province?.trim() || null,
      postal_code: parsed.data.postal_code?.trim() || null,
      google_maps_url: parsed.data.google_maps_url?.trim() || null,
      latitude: parsed.data.latitude ?? null,
      longitude: parsed.data.longitude ?? null,
      landlord_id: parsed.data.landlord_id?.trim() || null,
      note: parsed.data.note?.trim() || null,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: `เกิดข้อผิดพลาด: ${error.message}` }
  }

  revalidatePath('/locations')
  return { success: true, data }
}

export async function updateLocationAction(
  id: string,
  values: LocationFormValues
): Promise<ActionResponse> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }
  }

  if (!canWrite(currentUser.profile.role)) {
    return { success: false, error: 'คุณไม่มีสิทธิ์ในการแก้ไขข้อมูล' }
  }

  const parsed = locationSchema.safeParse(values)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(', '),
    }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('locations')
    .update({
      location_code: parsed.data.location_code?.trim() || null,
      location_name: parsed.data.location_name.trim(),
      house_no: parsed.data.house_no?.trim() || null,
      room_no: parsed.data.room_no?.trim() || null,
      village_name: parsed.data.village_name?.trim() || null,
      address: parsed.data.address?.trim() || null,
      subdistrict: parsed.data.subdistrict?.trim() || null,
      district: parsed.data.district?.trim() || null,
      province: parsed.data.province?.trim() || null,
      postal_code: parsed.data.postal_code?.trim() || null,
      google_maps_url: parsed.data.google_maps_url?.trim() || null,
      latitude: parsed.data.latitude ?? null,
      longitude: parsed.data.longitude ?? null,
      landlord_id: parsed.data.landlord_id?.trim() || null,
      note: parsed.data.note?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { success: false, error: `เกิดข้อผิดพลาด: ${error.message}` }
  }

  revalidatePath('/locations')
  revalidatePath(`/locations/${id}`)
  return { success: true, data }
}

export async function deleteLocationAction(id: string): Promise<ActionResponse> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { success: false, error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' }
  }

  if (!hasFullAccess(currentUser.profile.role)) {
    return { success: false, error: 'เฉพาะผู้ดูแลระบบ (Owner/Admin) เท่านั้นที่สามารถลบข้อมูลได้' }
  }

  const supabase = await createClient()

  const { error } = await supabase.from('locations').delete().eq('id', id)

  if (error) {
    return { success: false, error: `ไม่สามารถลบข้อมูลได้: ${error.message}` }
  }

  revalidatePath('/locations')
  return { success: true }
}
