'use server'

import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/route-guard'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------
export type CalendarEventType = 'rent' | 'task' | 'contract' | 'opening'

export interface CalendarEvent {
  id: string
  type: CalendarEventType
  title: string
  date: string           // YYYY-MM-DD
  status: string
  subtitle?: string
  href?: string
}

// ----------------------------------------------------------------
// Fetch events for a given month
// ----------------------------------------------------------------
export async function getCalendarEventsAction(
  year: number,
  month: number   // 1-indexed
): Promise<CalendarEvent[]> {
  await requireUser()
  const supabase = await createClient()

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0).toISOString().slice(0, 10) // last day of month

  const [rentRes, taskRes, contractRes, openingRes] = await Promise.all([
    // Rent payment due dates
    supabase
      .from('v_rent_payment_summary')
      .select('id, contract_no, location_name, payment_type, due_date, status')
      .gte('due_date', startDate)
      .lte('due_date', endDate)
      .limit(200),

    // Task due dates
    supabase
      .from('opening_tasks')
      .select(
        `
        id,
        task_name,
        due_date,
        status,
        opening_projects (
          id,
          project_no,
          rental_contracts (
            locations (location_name)
          )
        )
      `
      )
      .not('due_date', 'is', null)
      .gte('due_date', startDate)
      .lte('due_date', endDate)
      .not('status', 'in', '("done","skipped","cancelled")')
      .limit(200),

    // Contract dates
    supabase
      .from('rental_contracts')
      .select('id, contract_no, contract_date, status, locations(location_name)')
      .not('contract_date', 'is', null)
      .gte('contract_date', startDate)
      .lte('contract_date', endDate)
      .limit(100),

    // Opening project target dates
    supabase
      .from('opening_projects')
      .select(
        `
        id,
        project_no,
        target_open_date,
        status,
        rental_contracts (
          locations (location_name)
        )
      `
      )
      .not('target_open_date', 'is', null)
      .gte('target_open_date', startDate)
      .lte('target_open_date', endDate)
      .not('status', 'in', '("opened","cancelled")')
      .limit(100),
  ])

  const events: CalendarEvent[] = []

  // Rent events
  for (const r of rentRes.data ?? []) {
    const row = r as Record<string, unknown>
    events.push({
      id: `rent-${row.id}`,
      type: 'rent',
      title: `ค่าเช่า ${String(row.payment_type) === 'payable' ? '(จ่าย)' : '(รับ)'}`,
      date: String(row.due_date ?? ''),
      status: String(row.status ?? ''),
      subtitle: String(row.location_name ?? row.contract_no ?? ''),
      href: `/rent-payments/${row.id}`,
    })
  }

  // Task events
  for (const t of taskRes.data ?? []) {
    const row = t as Record<string, unknown>
    const proj = row.opening_projects as Record<string, unknown> | null
    const loc = (proj?.rental_contracts as Record<string, unknown> | null)
      ?.locations as Record<string, unknown> | null
    events.push({
      id: `task-${row.id}`,
      type: 'task',
      title: String(row.task_name ?? 'งาน'),
      date: String(row.due_date ?? ''),
      status: String(row.status ?? ''),
      subtitle: String(loc?.location_name ?? proj?.project_no ?? ''),
      href: proj?.id ? `/opening/${proj.id}` : undefined,
    })
  }

  // Contract events
  for (const c of contractRes.data ?? []) {
    const row = c as Record<string, unknown>
    const loc = row.locations as Record<string, unknown> | null
    events.push({
      id: `contract-${row.id}`,
      type: 'contract',
      title: `สัญญา ${row.contract_no}`,
      date: String(row.contract_date ?? ''),
      status: String(row.status ?? ''),
      subtitle: String(loc?.location_name ?? ''),
      href: `/contracts/${row.id}`,
    })
  }

  // Opening events
  for (const o of openingRes.data ?? []) {
    const row = o as Record<string, unknown>
    const loc = (row.rental_contracts as Record<string, unknown> | null)
      ?.locations as Record<string, unknown> | null
    events.push({
      id: `opening-${row.id}`,
      type: 'opening',
      title: `เปิดร้าน ${row.project_no}`,
      date: String(row.target_open_date ?? ''),
      status: String(row.status ?? ''),
      subtitle: String(loc?.location_name ?? ''),
      href: `/opening/${row.id}`,
    })
  }

  return events
}
