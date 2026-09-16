import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth/route-guard'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { ROLE_LABELS } from '@/lib/types/auth'
import { Users } from 'lucide-react'
import type { UserProfile } from '@/lib/types/auth'

export const metadata: Metadata = {
  title: 'ผู้ใช้งาน',
}

export default async function UsersPage() {
  // Only owner/admin can access — redirects to /dashboard if not
  await requireAdmin()

  const supabase = await createClient()
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">ผู้ใช้งานระบบ</h2>
          <p className="text-muted-foreground mt-1">รายชื่อผู้ใช้งานทั้งหมดในระบบ</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{profiles?.length ?? 0} คน</span>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          ไม่สามารถโหลดข้อมูลผู้ใช้งานได้ กรุณาลองใหม่อีกครั้ง
        </div>
      )}

      {/* Empty state */}
      {!error && (!profiles || profiles.length === 0) && (
        <EmptyState
          title="ไม่มีผู้ใช้งาน"
          message="ยังไม่มีผู้ใช้งานในระบบ"
        />
      )}

      {/* Users table */}
      {!error && profiles && profiles.length > 0 && (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" id="users-table">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">ชื่อ</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">ตำแหน่ง</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">แผนก</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {profiles.map((profile: UserProfile) => (
                  <tr key={profile.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium">{profile.full_name ?? '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{profile.email ?? '-'}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{ROLE_LABELS[profile.role]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{profile.department ?? '-'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={profile.is_active ? 'success' : 'destructive'}>
                        {profile.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
