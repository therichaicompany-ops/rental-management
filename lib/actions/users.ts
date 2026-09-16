'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/route-guard'
import { createAdminClient } from '@/lib/supabase/admin'
import type { UserRole } from '@/lib/types/auth'

export interface CreateUserInput {
  full_name: string
  email: string
  password: string
  role: UserRole
  department?: string
  phone?: string
}

export async function createUserAction(input: CreateUserInput) {
  try {
    const currentUser = await requireAdmin()

    if (!input.full_name?.trim()) {
      return { success: false, error: 'กรุณากรอกชื่อ-นามสกุล' }
    }
    if (!input.email?.trim() || !input.email.includes('@')) {
      return { success: false, error: 'กรุณากรอกอีเมลที่ถูกต้อง' }
    }
    if (!input.password || input.password.length < 6) {
      return { success: false, error: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' }
    }

    const adminClient = createAdminClient()

    // 1. Create auth user with confirmed email
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      email_confirm: true,
      user_metadata: {
        full_name: input.full_name.trim(),
      },
    })

    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('unique')) {
        return { success: false, error: 'อีเมลนี้ถูกใช้งานในระบบแล้ว' }
      }
      return { success: false, error: authError.message }
    }

    if (!authData.user) {
      return { success: false, error: 'ไม่สามารถสร้างผู้ใช้งานได้ กรุณาลองใหม่อีกครั้ง' }
    }

    // 2. Ensure profile has the specified role, department, phone
    const { error: profileError } = await adminClient.from('profiles').upsert({
      id: authData.user.id,
      full_name: input.full_name.trim(),
      email: input.email.trim().toLowerCase(),
      role: input.role || 'staff',
      department: input.department?.trim() || null,
      phone: input.phone?.trim() || null,
      is_active: true,
    })

    if (profileError) {
      console.error('Error updating profile:', profileError)
      // Even if profile upsert has an issue, user is created
    }

    revalidatePath('/users')
    return { success: true }
  } catch (err: unknown) {
    console.error('createUserAction error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้างผู้ใช้งาน',
    }
  }
}

export async function toggleUserStatusAction(userId: string, currentStatus: boolean) {
  try {
    const currentUser = await requireAdmin()

    if (currentUser.id === userId) {
      return { success: false, error: 'ไม่สามารถปิดการใช้งานบัญชีของตนเองได้' }
    }

    const adminClient = createAdminClient()
    const newStatus = !currentStatus

    const { error } = await adminClient
      .from('profiles')
      .update({ is_active: newStatus })
      .eq('id', userId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/users')
    return { success: true }
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ',
    }
  }
}

export async function updateUserRoleAction(userId: string, role: UserRole) {
  try {
    const currentUser = await requireAdmin()

    if (currentUser.id === userId && role !== 'owner') {
      return { success: false, error: 'ไม่สามารถลดสิทธิ์บัญชีของตนเองได้' }
    }

    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from('profiles')
      .update({ role })
      .eq('id', userId)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath('/users')
    return { success: true }
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเปลี่ยนตำแหน่ง',
    }
  }
}
