import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingStateProps {
  message?: string
  className?: string
  fullPage?: boolean
}

export function LoadingState({
  message = 'กำลังโหลด...',
  className,
  fullPage = false,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 text-muted-foreground',
        fullPage && 'min-h-[400px]',
        className
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
