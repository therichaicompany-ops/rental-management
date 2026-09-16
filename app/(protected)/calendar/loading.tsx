import { Loader2 } from 'lucide-react'

export default function CalendarLoading() {
  return (
    <div className="flex items-center justify-center py-24 gap-3 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" />
      <span className="text-sm">กำลังโหลดปฏิทิน...</span>
    </div>
  )
}
