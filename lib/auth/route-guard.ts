import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { hasFullAccess, canAccess } from '@/lib/auth/permissions'
import type { CurrentUser } from '@/lib/types/auth'
import type { Resource } from '@/lib/auth/permissions'

/**
 * Require authenticated user.
 * Redirects to /login if not authenticated or profile inactive.
 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }
  return user
}

/**
 * Require user with access to a specific resource.
 * Redirects to /dashboard if permission denied.
 */
export async function requireRole(resource: Resource): Promise<CurrentUser> {
  const user = await requireUser()
  if (!canAccess(user.profile.role, resource)) {
    redirect('/dashboard')
  }
  return user
}

/**
 * Require owner or admin role.
 * Redirects to /dashboard if not owner/admin.
 */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser()
  if (!hasFullAccess(user.profile.role)) {
    redirect('/dashboard')
  }
  return user
}
