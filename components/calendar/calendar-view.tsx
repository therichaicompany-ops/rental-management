'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  CheckSquare,
  FileText,
  Building2,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getCalendarEventsAction } from '@/lib/actions/calendar'
import type { CalendarEvent, CalendarEventType } from '@/lib/actions/calendar'
import { useI18n } from '@/lib/i18n/context'
import type { Locale } from '@/lib/i18n/types'

// ----------------------------------------------------------------
// Config
// ----------------------------------------------------------------
const MONTH_NAMES: Record<Locale, string[]> = {
  th: [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ],
  en: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
  my: [
    'ဇန်နဝါရီ', 'ဖေဖော်ဝါရီ', 'မတ်', 'ဧပြီ', 'မေ', 'ဇွန်',
    'ဇူလိုင်', 'သြဂုတ်', 'စက်တင်ဘာ', 'အောက်တိုဘာ', 'နိုဝင်ဘာ', 'ဒီဇင်ဘာ',
  ],
}

const DAYS_SHORT: Record<Locale, string[]> = {
  th: ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  my: ['တနင်္ဂ', 'တနင်္လာ', 'အင်္ဂါ', 'ဗုဒ္ဓ', 'ကြာသ', 'သော', 'စနေ'],
}

const EVENT_TYPE_LABELS: Record<Locale, Record<CalendarEventType, string>> = {
  th: {
    rent: 'ค่าเช่า',
    task: 'งาน',
    contract: 'สัญญา',
    opening: 'เปิดสาขา',
  },
  en: {
    rent: 'Rent',
    task: 'Task',
    contract: 'Contract',
    opening: 'Branch Opening',
  },
  my: {
    rent: 'အိမ်ငှားခ',
    task: 'လုပ်ငန်းတာဝန်',
    contract: 'စာချုပ်',
    opening: 'ဆိုင်ခွဲဖွင့်လှစ်ခြင်း',
  },
}

interface EventTypeConfig {
  icon: React.ComponentType<{ className?: string }>
  chipBg: string
  chipText: string
  dotColor: string
}

const EVENT_TYPE_CONFIG: Record<CalendarEventType, EventTypeConfig> = {
  rent: {
    icon: CreditCard,
    chipBg: 'bg-orange-100',
    chipText: 'text-orange-800',
    dotColor: 'bg-orange-500',
  },
  task: {
    icon: CheckSquare,
    chipBg: 'bg-blue-100',
    chipText: 'text-blue-800',
    dotColor: 'bg-blue-500',
  },
  contract: {
    icon: FileText,
    chipBg: 'bg-emerald-100',
    chipText: 'text-emerald-800',
    dotColor: 'bg-emerald-500',
  },
  opening: {
    icon: Building2,
    chipBg: 'bg-violet-100',
    chipText: 'text-violet-800',
    dotColor: 'bg-violet-500',
  },
}

// ----------------------------------------------------------------
// Build calendar grid
// ----------------------------------------------------------------
function buildGrid(year: number, month: number): { date: string; isCurrentMonth: boolean }[] {
  const firstDay = new Date(year, month - 1, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate()
  const prevDays = new Date(year, month - 1, 0).getDate()

  const cells: { date: string; isCurrentMonth: boolean }[] = []

  // Prev month filler
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevDays - i
    const m = month === 1 ? 12 : month - 1
    const y = month === 1 ? year - 1 : year
    cells.push({ date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, isCurrentMonth: false })
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      date: `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      isCurrentMonth: true,
    })
  }

  // Next month filler to complete 6 rows = 42 cells
  let next = 1
  while (cells.length < 42) {
    const m = month === 12 ? 1 : month + 1
    const y = month === 12 ? year + 1 : year
    cells.push({ date: `${y}-${String(m).padStart(2, '0')}-${String(next).padStart(2, '0')}`, isCurrentMonth: false })
    next++
  }

  return cells
}

// ----------------------------------------------------------------
// Day Cell
// ----------------------------------------------------------------
interface DayCellProps {
  date: string
  isCurrentMonth: boolean
  isToday: boolean
  events: CalendarEvent[]
  enabledTypes: Set<CalendarEventType>
  locale: Locale
}

function DayCell({ date, isCurrentMonth, isToday, events, enabledTypes, locale }: DayCellProps) {
  const visible = events.filter((e) => enabledTypes.has(e.type))
  const day = parseInt(date.split('-')[2], 10)

  const moreText = locale === 'th' ? 'อีก' : locale === 'my' ? 'ခု' : 'more'

  return (
    <div
      className={[
        'border-r border-b p-1.5 min-h-[90px] flex flex-col gap-0.5',
        isCurrentMonth ? 'bg-background' : 'bg-muted/30',
      ].join(' ')}
    >
      {/* Day number */}
      <span
        className={[
          'text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full shrink-0',
          isToday
            ? 'bg-primary text-primary-foreground'
            : isCurrentMonth
            ? 'text-foreground'
            : 'text-muted-foreground/50',
        ].join(' ')}
      >
        {day}
      </span>

      {/* Events (max 3 visible + overflow count) */}
      <div className="flex flex-col gap-0.5 overflow-hidden flex-1">
        {visible.slice(0, 3).map((e) => {
          const cfg = EVENT_TYPE_CONFIG[e.type]
          const chip = (
            <span
              className={`truncate text-[10px] px-1 py-0.5 rounded font-medium block ${cfg.chipBg} ${cfg.chipText}`}
              title={e.title + (e.subtitle ? ` — ${e.subtitle}` : '')}
            >
              {e.title}
            </span>
          )
          return e.href ? (
            <Link key={e.id} href={e.href} className="block hover:opacity-80 transition-opacity">
              {chip}
            </Link>
          ) : (
            <div key={e.id}>{chip}</div>
          )
        })}
        {visible.length > 3 && (
          <span className="text-[10px] text-muted-foreground pl-1">
            +{visible.length - 3} {moreText}
          </span>
        )}
      </div>
    </div>
  )
}

// ----------------------------------------------------------------
// Main Calendar View
// ----------------------------------------------------------------
export function CalendarView() {
  const { t, locale } = useI18n()
  const now = new Date()
  const [year, setYear] = React.useState(now.getFullYear())
  const [month, setMonth] = React.useState(now.getMonth() + 1)
  const [events, setEvents] = React.useState<CalendarEvent[]>([])
  const [loading, setLoading] = React.useState(true)
  const [enabledTypes, setEnabledTypes] = React.useState<Set<CalendarEventType>>(
    new Set(['rent', 'task', 'contract', 'opening'])
  )

  const today = now.toISOString().slice(0, 10)
  const grid = React.useMemo(() => buildGrid(year, month), [year, month])

  const eventLabels = EVENT_TYPE_LABELS[locale] || EVENT_TYPE_LABELS.th
  const monthNames = MONTH_NAMES[locale] || MONTH_NAMES.th
  const daysShort = DAYS_SHORT[locale] || DAYS_SHORT.th
  const displayYear = locale === 'th' ? year + 543 : year

  // Group events by date
  const eventsByDate = React.useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const e of events) {
      const arr = map.get(e.date) ?? []
      arr.push(e)
      map.set(e.date, arr)
    }
    return map
  }, [events])

  // Fetch on month/year change
  React.useEffect(() => {
    setLoading(true)
    getCalendarEventsAction(year, month).then((data) => {
      setEvents(data)
      setLoading(false)
    })
  }, [year, month])

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  function toggleType(type: CalendarEventType) {
    setEnabledTypes(prev => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Subtitle */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t.calendar.title}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t.calendar.subtitle}
        </p>
      </div>

      {/* Navigation and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Month nav */}
        <div className="flex items-center gap-2">
          <Button id="cal-prev" variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-bold min-w-[180px] text-center">
            {monthNames[month - 1]} {displayYear}
          </h2>
          <Button id="cal-next" variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            id="cal-today"
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth() + 1) }}
          >
            {t.calendar.today}
          </Button>
        </div>

        {/* Filter toggles */}
        <div className="flex flex-wrap gap-2">
          {(Object.entries(EVENT_TYPE_CONFIG) as [CalendarEventType, EventTypeConfig][]).map(([type, cfg]) => {
            const Icon = cfg.icon
            const active = enabledTypes.has(type)
            return (
              <button
                key={type}
                id={`cal-filter-${type}`}
                onClick={() => toggleType(type)}
                className={[
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                  active
                    ? `${cfg.chipBg} ${cfg.chipText} border-transparent`
                    : 'bg-background text-muted-foreground border-border',
                ].join(' ')}
              >
                <Icon className="h-3.5 w-3.5" />
                {eventLabels[type]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Legend dots */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {(Object.entries(EVENT_TYPE_CONFIG) as [CalendarEventType, EventTypeConfig][]).map(([type, cfg]) => (
          <span key={type} className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${cfg.dotColor}`} />
            {eventLabels[type]}
          </span>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden overflow-x-auto">
        <div className="min-w-[560px] sm:min-w-0">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b bg-muted/40">
            {daysShort.map((d, i) => (
              <div
                key={d}
                className={`py-2 text-center text-xs font-semibold ${
                  i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-muted-foreground'
                }`}
              >
                {d}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24 gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">{t.common.loading}</span>
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {grid.map((cell) => (
                <DayCell
                  key={cell.date}
                  date={cell.date}
                  isCurrentMonth={cell.isCurrentMonth}
                  isToday={cell.date === today}
                  events={eventsByDate.get(cell.date) ?? []}
                  enabledTypes={enabledTypes}
                  locale={locale}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Event count summary */}
      {!loading && (
        <p className="text-xs text-muted-foreground text-right">
          {locale === 'th'
            ? `พบ ${events.length} รายการในเดือนนี้`
            : locale === 'my'
            ? `ယခုလတွင် ပွဲ ${events.length} ခု တွေ့ရှိသည်`
            : `${events.length} events this month`}
        </p>
      )}
    </div>
  )
}
