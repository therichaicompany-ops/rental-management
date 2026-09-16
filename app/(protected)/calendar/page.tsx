import type { Metadata } from 'next'
import { CalendarView } from '@/components/calendar/calendar-view'

export const metadata: Metadata = {
  title: 'ปฏิทิน | ระบบบริหารงานเช่าและเปิดสาขา',
  description: 'ปฏิทินค่าเช่า งาน สัญญา และโครงการเปิดสาขา',
}

export default function CalendarPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">ปฏิทิน</h1>
        <p className="text-muted-foreground text-sm mt-1">
          ค่าเช่า · งาน · สัญญา · โครงการเปิดสาขา
        </p>
      </div>
      <CalendarView />
    </div>
  )
}
