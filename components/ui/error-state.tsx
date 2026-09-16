'use client'

import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'

interface ErrorStateProps {
  message?: string
  className?: string
}

export function ErrorState({
  message,
  className,
}: ErrorStateProps) {
  const { t } = useI18n()
  const resolvedMessage = message ?? t.common.error

  return (
    <div
      className={cn(
        'flex min-h-[300px] flex-col items-center justify-center gap-3',
        className
      )}
    >
      <div className="rounded-full bg-red-100 p-3">
        <AlertCircle className="h-6 w-6 text-red-500" />
      </div>
      <p className="text-sm text-muted-foreground">{resolvedMessage}</p>
    </div>
  )
}
