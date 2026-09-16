'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'

interface LoadingStateProps {
  message?: string
  className?: string
  fullPage?: boolean
}

export function LoadingState({
  message,
  className,
  fullPage = false,
}: LoadingStateProps) {
  const { t } = useI18n()
  const resolvedMessage = message ?? t.common.loading

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 text-muted-foreground',
        fullPage && 'min-h-[400px]',
        className
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      <p className="text-sm">{resolvedMessage}</p>
    </div>
  )
}
