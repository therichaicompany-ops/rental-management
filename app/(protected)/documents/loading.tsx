import { Loader2 } from 'lucide-react'

export default function DocumentsLoading() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex items-center justify-center py-24 gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-sm">กำลังโหลด Document Center...</span>
      </div>
    </div>
  )
}
