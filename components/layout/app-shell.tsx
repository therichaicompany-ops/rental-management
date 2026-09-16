import { SidebarContent } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import type { UserProfile } from '@/lib/types/auth'
import type { MenuItem } from '@/lib/auth/permissions'

interface AppShellProps {
  children: React.ReactNode
  profile: UserProfile
  menuItems: MenuItem[]
  pageTitle: string
}

export function AppShell({ children, profile, menuItems, pageTitle }: AppShellProps) {
  return (
    <div className="flex h-screen h-dvh overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col flex-shrink-0 bg-sidebar overflow-hidden">
        <SidebarContent profile={profile} menuItems={menuItems} />
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header title={pageTitle} profile={profile} menuItems={menuItems} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-safe animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
