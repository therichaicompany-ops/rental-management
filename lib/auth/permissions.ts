import type { UserRole } from '@/lib/types/auth'

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
// Permission map — which roles can access which resources
// ----------------------------------------------------------------
const PERMISSIONS: Record<UserRole, Resource[]> = {
  owner: [
    'dashboard', 'customers', 'landlords', 'locations', 'rentals', 'contracts', 'rentPayments',
    'opening', 'documents', 'calendar', 'reports', 'users', 'settings',
  ],
  admin: [
    'dashboard', 'customers', 'landlords', 'locations', 'rentals', 'contracts', 'rentPayments',
    'opening', 'documents', 'calendar', 'reports', 'users', 'settings',
  ],
  accounting: [
    'dashboard', 'customers', 'landlords', 'locations', 'rentPayments', 'contracts', 'documents', 'reports',
  ],
  hr: [
    'dashboard', 'customers', 'landlords', 'locations', 'opening', 'documents',
  ],
  operation: [
    'dashboard', 'customers', 'landlords', 'locations', 'rentals', 'contracts', 'opening', 'documents', 'calendar',
  ],
  staff: [
    'dashboard', 'customers', 'landlords', 'locations', 'rentals', 'opening', 'documents', 'calendar',
  ],
  viewer: [
    'dashboard', 'customers', 'landlords', 'locations', 'rentals', 'reports',
  ],
}

// ----------------------------------------------------------------
// Core permission check
// ----------------------------------------------------------------
export function canAccess(role: UserRole, resource: Resource): boolean {
  return PERMISSIONS[role]?.includes(resource) ?? false
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
 * Can write (create/edit) = any role except viewer
 */
export function canWrite(role: UserRole): boolean {
  return role !== 'viewer'
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
  { key: 'customers', label: 'ลูกค้า', href: '/customers', icon: 'UserCheck' },
  { key: 'landlords', label: 'ผู้ให้เช่า', href: '/landlords', icon: 'Landmark' },
  { key: 'locations', label: 'สถานที่', href: '/locations', icon: 'MapPin' },
  { key: 'rentals', label: 'งานเช่า (Leads)', href: '/rental-leads', icon: 'Home' },
  { key: 'rentPayments', label: 'ค่าเช่า', href: '/rent-payments', icon: 'CreditCard' },
  { key: 'opening', label: 'เปิดสาขา', href: '/opening', icon: 'Building2' },
  { key: 'documents', label: 'เอกสาร', href: '/documents', icon: 'FileText' },
  { key: 'calendar', label: 'Calendar', href: '/calendar', icon: 'Calendar' },
  { key: 'reports', label: 'รายงาน', href: '/reports', icon: 'BarChart3' },
  { key: 'users', label: 'ผู้ใช้งาน', href: '/users', icon: 'Users' },
  { key: 'settings', label: 'ตั้งค่า', href: '/settings', icon: 'Settings' },
]

export function getMenuForRole(role: UserRole): MenuItem[] {
  return MENU_ITEMS.filter((item) => canAccess(role, item.key))
}
