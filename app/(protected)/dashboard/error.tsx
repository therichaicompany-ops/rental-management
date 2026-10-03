'use client'

import { ErrorState } from '@/components/ui/error-state'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/context'

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t, tx } = useI18n()

  return (
    <div className="space-y-4">
      <ErrorState
        message={tx({
          th: 'เกิดข้อผิดพลาดขณะโหลด Dashboard กรุณาลองใหม่อีกครั้ง',
          en: 'An error occurred while loading the Dashboard. Please try again.',
          my: 'Dashboard ဖွင့်ရာတွင် အမှားဖြစ်ပေါ်ပါသည်၊ ထပ်မံကြိုးစားပါ',
        })}
      />
      <div className="flex justify-center">
        <Button variant="outline" onClick={reset}>
          {t.common.retry}
        </Button>
      </div>
    </div>
  )
}
