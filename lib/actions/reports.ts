'use server'

import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/route-guard'

// ----------------------------------------------------------------
// Filters
// ----------------------------------------------------------------
export interface ReportFilters {
  year?: number
  month?: number          // 1-12, optional
  location_id?: string
  province?: string
  status?: string
}

// ----------------------------------------------------------------
// Shared types
// ----------------------------------------------------------------
export interface PaymentReportRow {
  id: string
  contract_no: string
  location_name: string
  village_name: string
  province: string
  customer_name: string
  payment_type: string
  billing_period: string
  due_date: string
  net_amount: number
  amount_paid: number
  balance_amount: number
  status: string
}

export interface OverdueReportRow extends PaymentReportRow {
  days_overdue: number
}

export interface OpeningStageRow {
  project_no: string
  contract_no: string
  location_name: string
  current_stage_name: string | null
  target_open_date: string | null
  status: string
  total_tasks: number
  completed_tasks: number
  remaining_tasks: number
}

export interface TaskByAssigneeRow {
  assigned_name: string
  task_name: string
  project_no: string
  location_name: string
  due_date: string | null
  status: string
}

export interface MonthlyRentRow {
  year: number
  month: number
  payment_type: string
  total_records: number
  total_net_amount: number
  total_paid: number
  total_balance: number
}

export interface RentByLocationRow {
  location_code: string
  location_name: string
  village_name: string
  province: string
  contract_no: string
  payment_type: string
  total_records: number
  total_net_amount: number
  total_paid: number
  total_balance: number
}

// ----------------------------------------------------------------
// Helper: build date range filter
// ----------------------------------------------------------------
function buildDateRange(
  filters: ReportFilters
): { start: string; end: string } | null {
  if (!filters.year) return null
  const y = filters.year
  if (filters.month) {
    const m = filters.month
    const start = `${y}-${String(m).padStart(2, '0')}-01`
    const end = new Date(y, m, 0).toISOString().slice(0, 10)
    return { start, end }
  }
  return { start: `${y}-01-01`, end: `${y}-12-31` }
}

// ----------------------------------------------------------------
// 1. ค่าเช่าบริษัทต้องจ่าย (payable)
// ----------------------------------------------------------------
export async function getPayableReportAction(
  filters: ReportFilters
): Promise<PaymentReportRow[]> {
  await requireUser()
  const supabase = await createClient()
  const range = buildDateRange(filters)

  let q = supabase
    .from('v_rent_payment_summary')
    .select(
      'id, contract_no, location_name, village_name, province, customer_name, payment_type, billing_period, due_date, net_amount, amount_paid, balance_amount, status'
    )
    .eq('payment_type', 'payable')
    .order('due_date', { ascending: true })
    .limit(500)

  if (range) {
    q = q.gte('billing_period', range.start).lte('billing_period', range.end)
  }
  if (filters.province) q = q.eq('province', filters.province)
  if (filters.status) q = q.eq('status', filters.status)

  const { data } = await q
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: String(r.id ?? ''),
    contract_no: String(r.contract_no ?? ''),
    location_name: String(r.location_name ?? ''),
    village_name: String(r.village_name ?? ''),
    province: String(r.province ?? ''),
    customer_name: String(r.customer_name ?? r.customer_company_name ?? '-'),
    payment_type: String(r.payment_type ?? ''),
    billing_period: String(r.billing_period ?? ''),
    due_date: String(r.due_date ?? ''),
    net_amount: Number(r.net_amount ?? 0),
    amount_paid: Number(r.amount_paid ?? 0),
    balance_amount: Number(r.balance_amount ?? 0),
    status: String(r.status ?? ''),
  }))
}

// ----------------------------------------------------------------
// 2. ค่าเช่าลูกค้าต้องจ่าย (receivable)
// ----------------------------------------------------------------
export async function getReceivableReportAction(
  filters: ReportFilters
): Promise<PaymentReportRow[]> {
  await requireUser()
  const supabase = await createClient()
  const range = buildDateRange(filters)

  let q = supabase
    .from('v_rent_payment_summary')
    .select(
      'id, contract_no, location_name, village_name, province, customer_name, payment_type, billing_period, due_date, net_amount, amount_paid, balance_amount, status'
    )
    .eq('payment_type', 'receivable')
    .order('due_date', { ascending: true })
    .limit(500)

  if (range) {
    q = q.gte('billing_period', range.start).lte('billing_period', range.end)
  }
  if (filters.province) q = q.eq('province', filters.province)
  if (filters.status) q = q.eq('status', filters.status)

  const { data } = await q
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: String(r.id ?? ''),
    contract_no: String(r.contract_no ?? ''),
    location_name: String(r.location_name ?? ''),
    village_name: String(r.village_name ?? ''),
    province: String(r.province ?? ''),
    customer_name: String(r.customer_name ?? r.customer_company_name ?? '-'),
    payment_type: String(r.payment_type ?? ''),
    billing_period: String(r.billing_period ?? ''),
    due_date: String(r.due_date ?? ''),
    net_amount: Number(r.net_amount ?? 0),
    amount_paid: Number(r.amount_paid ?? 0),
    balance_amount: Number(r.balance_amount ?? 0),
    status: String(r.status ?? ''),
  }))
}

// ----------------------------------------------------------------
// 3. ค้างชำระ (overdue)
// ----------------------------------------------------------------
export async function getOverdueReportAction(
  filters: ReportFilters
): Promise<OverdueReportRow[]> {
  await requireUser()
  const supabase = await createClient()

  let q = supabase
    .from('v_rent_payment_summary')
    .select(
      'id, contract_no, location_name, village_name, province, customer_name, payment_type, billing_period, due_date, net_amount, amount_paid, balance_amount, status, days_until_due'
    )
    .eq('status', 'overdue')
    .order('due_date', { ascending: true })
    .limit(500)

  if (filters.province) q = q.eq('province', filters.province)
  if (filters.status && filters.status !== 'overdue') {
    // status filter is fixed to overdue in this report
  }

  const { data } = await q
  const today = new Date()

  return (data ?? []).map((r: Record<string, unknown>) => {
    const dueDate = r.due_date ? new Date(String(r.due_date)) : null
    const daysOverdue = dueDate
      ? Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / 86400000))
      : 0
    return {
      id: String(r.id ?? ''),
      contract_no: String(r.contract_no ?? ''),
      location_name: String(r.location_name ?? ''),
      village_name: String(r.village_name ?? ''),
      province: String(r.province ?? ''),
      customer_name: String(r.customer_name ?? r.customer_company_name ?? '-'),
      payment_type: String(r.payment_type ?? ''),
      billing_period: String(r.billing_period ?? ''),
      due_date: String(r.due_date ?? ''),
      net_amount: Number(r.net_amount ?? 0),
      amount_paid: Number(r.amount_paid ?? 0),
      balance_amount: Number(r.balance_amount ?? 0),
      status: String(r.status ?? ''),
      days_overdue: daysOverdue,
    }
  })
}

// ----------------------------------------------------------------
// 4. งานเปิดสาขาตาม Stage
// ----------------------------------------------------------------
export async function getOpeningStageReportAction(
  filters: ReportFilters
): Promise<OpeningStageRow[]> {
  await requireUser()
  const supabase = await createClient()

  let q = supabase
    .from('v_opening_project_progress')
    .select(
      'project_no, contract_no, location_name, current_stage_name, target_open_date, status, total_tasks, completed_tasks, remaining_tasks'
    )
    .not('status', 'in', '("opened","cancelled")')
    .order('target_open_date', { ascending: true })
    .limit(200)

  if (filters.status) q = q.eq('status', filters.status)

  const { data } = await q
  return (data ?? []).map((r: Record<string, unknown>) => ({
    project_no: String(r.project_no ?? ''),
    contract_no: String(r.contract_no ?? ''),
    location_name: String(r.location_name ?? ''),
    current_stage_name: r.current_stage_name ? String(r.current_stage_name) : null,
    target_open_date: r.target_open_date ? String(r.target_open_date) : null,
    status: String(r.status ?? ''),
    total_tasks: Number(r.total_tasks ?? 0),
    completed_tasks: Number(r.completed_tasks ?? 0),
    remaining_tasks: Number(r.remaining_tasks ?? 0),
  }))
}

// ----------------------------------------------------------------
// 5. งานตามผู้รับผิดชอบ
// ----------------------------------------------------------------
export async function getTaskByAssigneeReportAction(
  filters: ReportFilters
): Promise<TaskByAssigneeRow[]> {
  await requireUser()
  const supabase = await createClient()

  let q = supabase
    .from('opening_tasks')
    .select(
      `
      task_name,
      due_date,
      status,
      profiles!opening_tasks_assigned_to_fkey (full_name),
      opening_projects (
        project_no,
        rental_contracts (
          locations (location_name)
        )
      )
    `
    )
    .not('status', 'in', '("skipped","cancelled")')
    .order('due_date', { ascending: true })
    .limit(300)

  if (filters.status) q = q.eq('status', filters.status)

  const { data } = await q
  return (data ?? []).map((t: Record<string, unknown>) => {
    const proj = t.opening_projects as Record<string, unknown> | null
    const loc = (proj?.rental_contracts as Record<string, unknown> | null)
      ?.locations as Record<string, unknown> | null
    const profile = t.profiles as Record<string, unknown> | null
    return {
      assigned_name: profile?.full_name ? String(profile.full_name) : 'ไม่ระบุ',
      task_name: String(t.task_name ?? ''),
      project_no: String(proj?.project_no ?? ''),
      location_name: String(loc?.location_name ?? '-'),
      due_date: t.due_date ? String(t.due_date) : null,
      status: String(t.status ?? ''),
    }
  })
}

// ----------------------------------------------------------------
// 6. ค่าเช่ารายเดือน (summary)
// ----------------------------------------------------------------
export async function getMonthlyRentReportAction(
  filters: ReportFilters
): Promise<MonthlyRentRow[]> {
  await requireUser()
  const supabase = await createClient()
  const range = buildDateRange(filters)

  let q = supabase
    .from('rent_payments')
    .select('payment_type, billing_period, net_amount, amount_paid, balance_amount')
    .limit(2000)

  if (range) {
    q = q.gte('billing_period', range.start).lte('billing_period', range.end)
  }

  const { data } = await q
  if (!data) return []

  // Group by year-month + payment_type
  const map = new Map<string, MonthlyRentRow>()
  for (const row of data as Record<string, unknown>[]) {
    const bp = String(row.billing_period ?? '')
    const pt = String(row.payment_type ?? '')
    const d = new Date(bp)
    const key = `${d.getFullYear()}-${d.getMonth() + 1}-${pt}`
    const existing = map.get(key) ?? {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      payment_type: pt,
      total_records: 0,
      total_net_amount: 0,
      total_paid: 0,
      total_balance: 0,
    }
    existing.total_records += 1
    existing.total_net_amount += Number(row.net_amount ?? 0)
    existing.total_paid += Number(row.amount_paid ?? 0)
    existing.total_balance += Number(row.balance_amount ?? 0)
    map.set(key, existing)
  }

  return Array.from(map.values()).sort(
    (a, b) => a.year - b.year || a.month - b.month || a.payment_type.localeCompare(b.payment_type)
  )
}

// ----------------------------------------------------------------
// 7. ค่าเช่าตามสถานที่
// ----------------------------------------------------------------
export async function getRentByLocationReportAction(
  filters: ReportFilters
): Promise<RentByLocationRow[]> {
  await requireUser()
  const supabase = await createClient()
  const range = buildDateRange(filters)

  let q = supabase
    .from('rent_payments')
    .select(
      `
      payment_type,
      net_amount,
      amount_paid,
      balance_amount,
      billing_period,
      rental_contracts (
        contract_no,
        locations (
          location_code,
          location_name,
          village_name,
          province
        )
      )
    `
    )
    .limit(2000)

  if (range) {
    q = q.gte('billing_period', range.start).lte('billing_period', range.end)
  }

  const { data } = await q
  if (!data) return []

  // Group by location + payment_type
  const map = new Map<string, RentByLocationRow>()
  for (const row of data as Record<string, unknown>[]) {
    const contract = row.rental_contracts as Record<string, unknown> | null
    const loc = contract?.locations as Record<string, unknown> | null
    const locationCode = String(loc?.location_code ?? '')
    const pt = String(row.payment_type ?? '')
    const key = `${locationCode}-${pt}`

    if (filters.province && loc?.province !== filters.province) continue

    const existing = map.get(key) ?? {
      location_code: locationCode,
      location_name: String(loc?.location_name ?? ''),
      village_name: String(loc?.village_name ?? ''),
      province: String(loc?.province ?? ''),
      contract_no: String(contract?.contract_no ?? ''),
      payment_type: pt,
      total_records: 0,
      total_net_amount: 0,
      total_paid: 0,
      total_balance: 0,
    }
    existing.total_records += 1
    existing.total_net_amount += Number(row.net_amount ?? 0)
    existing.total_paid += Number(row.amount_paid ?? 0)
    existing.total_balance += Number(row.balance_amount ?? 0)
    map.set(key, existing)
  }

  return Array.from(map.values()).sort((a, b) =>
    a.location_name.localeCompare(b.location_name)
  )
}

// ----------------------------------------------------------------
// Helper: get provinces list for filter dropdown
// ----------------------------------------------------------------
export async function getProvincesAction(): Promise<string[]> {
  await requireUser()
  const supabase = await createClient()
  const { data } = await supabase
    .from('locations')
    .select('province')
    .not('province', 'is', null)
  if (!data) return []
  const provinces = [...new Set(data.map((r) => r.province as string).filter(Boolean))]
  return provinces.sort()
}
