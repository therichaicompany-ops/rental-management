'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Home, CreditCard, Building2,
  FileText, Calendar, BarChart3, Users, Settings,
  UserCheck, Landmark, MapPin, FileSignature,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { LogoutButton } from '@/components/auth/logout-button'
import { Separator } from '@/components/ui/separator'
import type { UserProfile } from '@/lib/types/auth'
import type { MenuItem } from '@/lib/auth/permissions'
import { ROLE_LABELS } from '@/lib/types/auth'
import { useI18n } from '@/lib/i18n/context'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Home,
  CreditCard,
  Building2,
  FileText,
  Calendar,
  BarChart3,
  Users,
  Settings,
  UserCheck,
  Landmark,
  MapPin,
  FileSignature,
}

interface SidebarProps {
  profile: UserProfile
  menuItems: MenuItem[]
  onClose?: () => void
}

export function SidebarContent({ profile, menuItems, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { t } = useI18n()

  return (
    <div className="flex h-full flex-col">
      {/* Logo / System Name */}
      <div className="px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500 text-white font-bold text-sm flex-shrink-0">
            R
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-sidebar-foreground leading-tight">
              {t.common.systemName}
            </p>
            <p className="text-xs text-slate-400 leading-tight">
              {t.common.systemSubtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {menuItems.map((item) => {
          const Icon = ICON_MAP[item.icon] ?? LayoutDashboard
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const itemLabel =
            item.key === 'rentals'
              ? (t.nav.rentalLeads ?? t.nav.rentals ?? item.label)
              : (t.nav[item.key as keyof typeof t.nav] ?? item.label)

          return (
            <Link
              key={item.key}
              href={item.href}
              id={`nav-${item.key}`}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                isActive
                  ? 'bg-primary-500 text-white font-medium'
                  : 'text-slate-300 hover:bg-sidebar-hover hover:text-white'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span>{itemLabel}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom: User info + Logout */}
      <div className="border-t border-sidebar-border px-4 py-4">
        <div className="mb-3">
          <p className="text-xs font-medium text-slate-400 truncate">
            {profile.full_name ?? profile.email ?? '-'}
          </p>
          <p className="text-xs text-slate-500 truncate">
            {t.auth.roles[profile.role] ?? ROLE_LABELS[profile.role]}
          </p>
        </div>
        <Separator className="bg-sidebar-border mb-3" />
        <LogoutButton variant="ghost" showIcon />
      </div>
    </div>
  )
}
