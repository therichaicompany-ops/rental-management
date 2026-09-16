'use client'

import { logoutAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { useState } from 'react'

interface LogoutButtonProps {
  variant?: 'default' | 'ghost' | 'outline'
  showIcon?: boolean
}

export function LogoutButton({ variant = 'ghost', showIcon = true }: LogoutButtonProps) {
  const [isPending, setIsPending] = useState(false)

  async function handleLogout() {
    setIsPending(true)
    await logoutAction()
  }

  return (
    <form action={handleLogout}>
      <Button
        type="submit"
        variant={variant}
        size="sm"
        disabled={isPending}
        className="w-full justify-start gap-2 text-sm"
        id="logout-button"
      >
        {showIcon && <LogOut className="h-4 w-4" />}
        {isPending ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}
      </Button>
    </form>
  )
}
