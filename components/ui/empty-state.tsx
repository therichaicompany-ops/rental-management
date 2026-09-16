'use client'

import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n/context'

interface EmptyStateProps {
  title?: string
  message?: string
  className?: string
}

export function EmptyState({
  title,
  message,
  className,
}: EmptyStateProps) {
  const { t } = useI18n()
  const resolvedTitle = title ?? t.common.noData
  const resolvedMessage = message ?? t.common.noDataDesc

  return (
    <div
      className={cn(
        'flex min-h-[300px] flex-col items-center justify-center gap-3 text-center',
        className
      )}
    >
      <div className="rounded-full bg-muted p-4">
        <Inbox className="h-8 w-8 text-muted-foreground" />
      </div>
      <div>
        <p className="font-medium text-foreground">{resolvedTitle}</p>
        <p className="text-sm text-muted-foreground mt-1">{resolvedMessage}</p>
      </div>
    </div>
  )
}
