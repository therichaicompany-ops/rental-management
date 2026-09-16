import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth/route-guard'
import { getMenuForRole } from '@/lib/auth/permissions'
import { AppShell } from '@/components/layout/app-shell'

export const metadata: Metadata = {
  title: 'ระบบบริหารงานเช่าและเปิดสาขา',
}

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  const menuItems = getMenuForRole(user.profile.role)

  return (
    <AppShell
      profile={user.profile}
      menuItems={menuItems}
      pageTitle="ระบบบริหารงานเช่าและเปิดสาขา"
    >
      {children}
    </AppShell>
  )
}
