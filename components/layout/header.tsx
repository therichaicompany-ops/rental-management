'use client'

import { useState } from 'react'
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

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center border-b bg-white px-4 shadow-sm gap-4">
      {/* Mobile: Hamburger menu */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setSheetOpen(true)}
        id="mobile-menu-toggle"
        aria-label="เปิดเมนู"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Page title */}
      <h1 className="flex-1 text-lg font-semibold text-foreground">{title}</h1>

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
                {profile.full_name ?? 'ผู้ใช้งาน'}
              </p>
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5 mt-0.5">
                {ROLE_LABELS[profile.role]}
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
          <SheetTitle className="sr-only">เมนูนำทาง</SheetTitle>
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
