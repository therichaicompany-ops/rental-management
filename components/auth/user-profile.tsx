'use client'

import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ROLE_LABELS } from '@/lib/types/auth'
import type { UserProfile } from '@/lib/types/auth'
import { useI18n } from '@/lib/i18n/context'

interface UserProfileProps {
  profile: UserProfile
  compact?: boolean
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name
  .split(' ')
  .map((part) => part[0])
  .join('')
  .toUpperCase()
  .slice(0, 2)
}

export function UserProfileCard({ profile, compact = false }: UserProfileProps) {
  const { t, tx } = useI18n()
  const roleLabel = (profile.role && t.auth.roles[profile.role]) || ROLE_LABELS[profile.role] || profile.role

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary-100 text-primary-700 text-xs font-semibold">
            {getInitials(profile.full_name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {profile.full_name ?? profile.email ?? '-'}
          </p>
          <p className="truncate text-xs text-muted-foreground">{roleLabel}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-xl border bg-card p-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14">
          <AvatarFallback className="bg-primary-100 text-primary-700 text-lg font-semibold">
            {getInitials(profile.full_name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-lg font-semibold">
            {profile.full_name ?? '-'}
          </h2>
          <p className="text-sm text-muted-foreground">{profile.email ?? '-'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">{t.settings.role}</p>
          <Badge variant="secondary">{roleLabel}</Badge>
        </div>
        {profile.department && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              {tx({ th: 'แผนก', en: 'Department', my: 'ဌာန' })}
            </p>
            <p className="font-medium">{profile.department}</p>
          </div>
        )}
        {profile.phone && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              {tx({ th: 'เบอร์โทร', en: 'Phone', my: 'ဖုန်းနံပါတ်' })}
            </p>
            <p className="font-medium">{profile.phone}</p>
          </div>
        )}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">{t.common.status}</p>
          <Badge variant={profile.is_active ? 'success' : 'destructive'}>
            {profile.is_active
              ? tx({ th: 'ใช้งาน', en: 'Active', my: 'အသုံးပြုနေသည်' })
              : tx({ th: 'ปิดการใช้งาน', en: 'Inactive', my: 'ပိတ်ထားသည်' })}
          </Badge>
        </div>
      </div>
    </div>
  )
}
