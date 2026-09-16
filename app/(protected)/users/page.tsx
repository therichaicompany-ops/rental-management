import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth/route-guard'
import { createClient } from '@/lib/supabase/server'
import { UsersManagementView } from '@/components/users/users-management-view'
import type { UserProfile } from '@/lib/types/auth'

export const metadata: Metadata = {
  title: 'ผู้ใช้งาน',
}

export default async function UsersPage() {
  // Only owner/admin can access — redirects to /dashboard if not
  const currentUser = await requireAdmin()

  const supabase = await createClient()
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">ผู้ใช้งานระบบ</h2>
          <p className="text-muted-foreground mt-1 text-sm">รายชื่อผู้ใช้งานทั้งหมดในระบบ</p>
        </div>
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          ไม่สามารถโหลดข้อมูลผู้ใช้งานได้ กรุณาลองใหม่อีกครั้ง ({error.message})
        </div>
      </div>
    )
  }

  return (
    <UsersManagementView
      initialProfiles={(profiles as UserProfile[]) || []}
      currentUserId={currentUser.id}
    />
  )
}
