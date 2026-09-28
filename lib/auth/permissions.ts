import type { UserRole } from '@/lib/types/auth'
import rolePermissionsJson from '@/lib/config/role-permissions.json'

// ----------------------------------------------------------------
// Resource keys — all routes that require permissions
// ----------------------------------------------------------------
export type Resource =
  | 'dashboard'
  | 'customers'
  | 'landlords'
  | 'locations'
  | 'rentals'
  | 'contracts'
  | 'rentPayments'
  | 'opening'
  | 'documents'
  | 'calendar'
  | 'reports'
  | 'users'
  | 'settings'

// ----------------------------------------------------------------
// Default Permission map — which roles can access which resources
// ----------------------------------------------------------------
export const DEFAULT_PERMISSIONS: Record<UserRole, Resource[]> = {
  owner: [
    'dashboard', 'customers', 'landlords', 'locations', 'rentals', 'contracts', 'rentPayments',
    'opening', 'documents', 'calendar', 'reports', 'users', 'settings',
  ],
  admin: [
    'dashboard', 'customers', 'landlords', 'locations', 'rentals', 'contracts', 'rentPayments',
    'opening', 'documents', 'calendar', 'reports', 'users', 'settings',
  ],
  accounting: [
    'dashboard', 'customers', 'landlords', 'locations', 'rentals', 'contracts', 'rentPayments', 'opening',
  ],
  hr: [
    'dashboard', 'customers', 'locations', 'opening',
  ],
  operation: [
    'dashboard', 'customers', 'landlords', 'locations', 'rentals', 'contracts', 'rentPayments', 'opening',
  ],
  staff: [
    'dashboard', 'customers', 'locations', 'opening',
  ],
  viewer: [
    'dashboard', 'customers', 'locations', 'opening',
  ],
}

// Active permissions resolved from config file or defaults
export function getActivePermissions(): Record<UserRole, Resource[]> {
  try {
    if (rolePermissionsJson && typeof rolePermissionsJson === 'object') {
      return {
        ...DEFAULT_PERMISSIONS,
        ...(rolePermissionsJson as unknown as Record<UserRole, Resource[]>),
      }
    }
  } catch {
    // Fallback to defaults
  }
  return DEFAULT_PERMISSIONS
}

// ----------------------------------------------------------------
// Core permission check
// ----------------------------------------------------------------
export function canAccess(role: UserRole, resource: Resource): boolean {
  const permissions = getActivePermissions()
  return permissions[role]?.includes(resource) ?? false
}

// ----------------------------------------------------------------
// Role helpers
// ----------------------------------------------------------------
export function isOwner(role: UserRole): boolean {
  return role === 'owner'
}

export function isAdmin(role: UserRole): boolean {
  return role === 'admin'
}

export function isAccounting(role: UserRole): boolean {
  return role === 'accounting'
}

export function isHR(role: UserRole): boolean {
  return role === 'hr'
}

export function isOperation(role: UserRole): boolean {
  return role === 'operation'
}

export function isViewer(role: UserRole): boolean {
  return role === 'viewer'
}

/**
 * Full access = owner or admin (can perform delete and administrative tasks)
 */
export function hasFullAccess(role: UserRole): boolean {
  return isOwner(role) || isAdmin(role)
}

/**
 * Can write (create/edit) check based on user role and optional target resource.
 * - owner, admin: full write on all resources
 * - operation: write on customers, landlords, locations, rentals (branch only), contracts (branch only), rentPayments (branch only), opening
 * - staff: write on customers, locations, opening
 * - accounting: read-only ("ดูอย่างเดียว")
 * - hr: read-only ("ดูและโหลดเอกสารลูกค้าได้")
 * - viewer: read-only ("ดูอย่างเดียว ห้ามแก้ไข")
 */
export function canWrite(role: UserRole, resource?: Resource): boolean {
  if (role === 'owner' || role === 'admin') return true
  if (role === 'viewer' || role === 'accounting' || role === 'hr') return false

  if (role === 'staff') {
    if (!resource) return true
    return ['customers', 'locations', 'opening'].includes(resource)
  }

  if (role === 'operation') {
    if (!resource) return true
    return [
      'customers',
      'landlords',
      'locations',
      'rentals',
      'contracts',
      'rentPayments',
      'opening',
    ].includes(resource)
  }

  return false
}

/**
 * Helper to check if a role is restricted to branch-only operations
 * (operation role cannot see or create house/residential data)
 */
export function isBranchOnlyRole(role: UserRole): boolean {
  return role === 'operation'
}

/**
 * Check whether a user with given role can access house data
 */
export function canAccessHouseData(role: UserRole): boolean {
  return role !== 'operation'
}

// ----------------------------------------------------------------
// Menu items for sidebar — filtered by role at runtime
// ----------------------------------------------------------------
export type MenuItem = {
  key: Resource
  label: string
  href: string
  icon: string
}

export const MENU_ITEMS: MenuItem[] = [
  { key: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { key: 'customers', label: 'ลูกค้า/ผู้เช่า', href: '/customers', icon: 'UserCheck' },
  { key: 'landlords', label: 'ผู้ให้เช่า', href: '/landlords', icon: 'Landmark' },
  { key: 'locations', label: 'สถานที่', href: '/locations', icon: 'MapPin' },
  { key: 'rentals', label: 'ประเภทงาน', href: '/rental-leads', icon: 'Home' },
  { key: 'contracts', label: 'สัญญาเช่า', href: '/contracts', icon: 'FileSignature' },
  { key: 'rentPayments', label: 'ค่าเช่า', href: '/rent-payments', icon: 'CreditCard' },
  { key: 'opening', label: 'ความคืบหน้าของงาน', href: '/opening', icon: 'Building2' },
  { key: 'documents', label: 'เอกสาร', href: '/documents', icon: 'FileText' },
  { key: 'calendar', label: 'Calendar', href: '/calendar', icon: 'Calendar' },
  { key: 'reports', label: 'รายงาน', href: '/reports', icon: 'BarChart3' },
  { key: 'users', label: 'ผู้ใช้งาน', href: '/users', icon: 'Users' },
  { key: 'settings', label: 'ตั้งค่า', href: '/settings', icon: 'Settings' },
]

export function getMenuForRole(role: UserRole): MenuItem[] {
  return MENU_ITEMS.filter((item) => canAccess(role, item.key))
}
