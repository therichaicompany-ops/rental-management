import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  title?: string
  message?: string
  className?: string
}

export function EmptyState({
  title = 'ไม่มีข้อมูล',
  message = 'ยังไม่มีข้อมูลในส่วนนี้',
  className,
}: EmptyStateProps) {
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
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground mt-1">{message}</p>
      </div>
    </div>
  )
}
