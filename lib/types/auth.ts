import type { Database } from '@/supabase/types'

export type UserRole = Database['public']['Enums']['user_role']

export type UserProfile = Database['public']['Tables']['profiles']['Row']

export type CurrentUser = {
  id: string
  email: string | undefined
  profile: UserProfile
}

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'เจ้าของระบบ',
  admin: 'ผู้ดูแลระบบ',
  accounting: 'บัญชี',
  hr: 'HR',
  operation: 'ฝ่ายปฏิบัติการ',
  staff: 'พนักงาน',
  viewer: 'ผู้ดูข้อมูล',
}
