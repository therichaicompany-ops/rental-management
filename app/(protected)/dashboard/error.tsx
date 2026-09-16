'use client'

import { ErrorState } from '@/components/ui/error-state'
import { Button } from '@/components/ui/button'

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="space-y-4">
      <ErrorState message="เกิดข้อผิดพลาดขณะโหลด Dashboard กรุณาลองใหม่อีกครั้ง" />
      <div className="flex justify-center">
        <Button variant="outline" onClick={reset}>
          ลองใหม่
        </Button>
      </div>
    </div>
  )
}
