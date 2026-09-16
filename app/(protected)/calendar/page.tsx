import type { Metadata } from 'next'
import { CalendarView } from '@/components/calendar/calendar-view'

export const metadata: Metadata = {
  title: 'ปฏิทิน | ระบบบริหารงานเช่าและเปิดสาขา',
  description: 'ปฏิทินค่าเช่า งาน สัญญา และโครงการเปิดสาขา',
}

export default function CalendarPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <CalendarView />
    </div>
  )
}
