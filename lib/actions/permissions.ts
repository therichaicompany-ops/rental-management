'use server'

import fs from 'fs/promises'
import path from 'path'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/route-guard'
import type { UserRole } from '@/lib/types/auth'
import type { Resource } from '@/lib/auth/permissions'
import { DEFAULT_PERMISSIONS, getActivePermissions } from '@/lib/auth/permissions'

const CONFIG_PATH = path.join(process.cwd(), 'lib', 'config', 'role-permissions.json')

export async function getRolePermissionsAction(): Promise<{
  success: boolean
  permissions: Record<UserRole, Resource[]>
  isCustomized: boolean
}> {
  try {
    const permissions = getActivePermissions()
    let isCustomized = false
    try {
      await fs.access(CONFIG_PATH)
      isCustomized = true
    } catch {
      isCustomized = false
    }
    return { success: true, permissions, isCustomized }
  } catch {
    return { success: false, permissions: DEFAULT_PERMISSIONS, isCustomized: false }
  }
}

export async function saveRolePermissionsAction(
  newPermissions: Record<UserRole, Resource[]>
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin()

    // Ensure directory exists
    await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true })

    // Validate that owner always retains full access for safety
    const safePermissions: Record<UserRole, Resource[]> = {
      ...newPermissions,
      owner: DEFAULT_PERMISSIONS.owner,
    }

    await fs.writeFile(CONFIG_PATH, JSON.stringify(safePermissions, null, 2), 'utf-8')
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error: unknown) {
    const err = error as { message?: string }
    return { success: false, error: err?.message || 'บันทึกสิทธิ์การใช้งานไม่สำเร็จ' }
  }
}

export async function resetRolePermissionsAction(): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin()
    await fs.writeFile(CONFIG_PATH, JSON.stringify(DEFAULT_PERMISSIONS, null, 2), 'utf-8')
    revalidatePath('/', 'layout')
    return { success: true }
  } catch (error: unknown) {
    const err = error as { message?: string }
    return { success: false, error: err?.message || 'รีเซ็ตสิทธิ์การใช้งานไม่สำเร็จ' }
  }
}
