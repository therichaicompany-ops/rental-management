'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogoutButton } from '@/components/auth/logout-button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { SidebarContent } from '@/components/layout/sidebar'
import { LanguageSwitcher } from '@/components/layout/language-switcher'
import { useI18n } from '@/lib/i18n/context'
import { ROLE_LABELS } from '@/lib/types/auth'
import type { UserProfile } from '@/lib/types/auth'
import type { MenuItem } from '@/lib/auth/permissions'

interface HeaderProps {
  title: string
  profile: UserProfile
  menuItems: MenuItem[]
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)
}

export function Header({ title, profile, menuItems }: HeaderProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const pathname = usePathname()
  const { t } = useI18n()

  // Compute localized section title based on active path
  const getLocalizedTitle = (): string => {
    if (pathname.startsWith('/dashboard')) return t.nav.dashboard
    if (pathname.startsWith('/customers')) return t.nav.customers
    if (pathname.startsWith('/landlords')) return t.nav.landlords
    if (pathname.startsWith('/locations')) return t.nav.locations
    if (pathname.startsWith('/rental-leads')) return t.nav.rentalLeads
    if (pathname.startsWith('/contracts')) return t.contracts.title
    if (pathname.startsWith('/rent-payments')) return t.nav.rentPayments
    if (pathname.startsWith('/opening')) return t.nav.opening
    if (pathname.startsWith('/documents')) return t.nav.documents
    if (pathname.startsWith('/calendar')) return t.nav.calendar
    if (pathname.startsWith('/reports')) return t.nav.reports
    if (pathname.startsWith('/users')) return t.nav.users
    if (pathname.startsWith('/settings')) return t.nav.settings
    if (title && title !== 'ระบบบริหารงานเช่าและเปิดสาขา') return title
    return `${t.common.systemName} ${t.common.systemSubtitle}`
  }

  const displayTitle = getLocalizedTitle()

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center border-b bg-white px-4 shadow-sm gap-3">
      {/* Mobile: Hamburger menu */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setSheetOpen(true)}
        id="mobile-menu-toggle"
        aria-label="Menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Page title */}
      <h1 className="flex-1 text-lg font-semibold text-foreground truncate">{displayTitle}</h1>

      {/* Language Switcher */}
      <LanguageSwitcher variant="outline" className="h-9 px-2.5" />

      {/* User menu dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 px-2 h-10"
            id="user-menu-trigger"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary-100 text-primary-700 text-xs font-semibold">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium leading-tight">
                {profile.full_name ?? t.auth.user}
              </p>
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5 mt-0.5">
                {t.auth.roles[profile.role] ?? ROLE_LABELS[profile.role]}
              </Badge>
            </div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <p className="font-medium">{profile.full_name ?? '-'}</p>
            <p className="text-xs text-muted-foreground font-normal truncate">
              {profile.email ?? '-'}
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <LogoutButton variant="ghost" showIcon />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Mobile sidebar sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="p-0 bg-sidebar w-72">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="bg-sidebar h-full">
            <SidebarContent
              profile={profile}
              menuItems={menuItems}
              onClose={() => setSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </header>
  )
}
