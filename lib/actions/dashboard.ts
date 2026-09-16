'use server'

import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/route-guard'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------
export interface RentalStats {
  totalLeads: number
  negotiatingLeads: number
  activeContracts: number
  inProgressProjects: number
  readyToOpenProjects: number
}

export interface RentPaymentStats {
  payablePending: number
  payablePendingAmount: number
  receivablePending: number
  receivablePendingAmount: number
  payableOverdue: number
  payableOverdueAmount: number
  receivableOverdue: number
  receivableOverdueAmount: number
}

export interface TaskStats {
  dueToday: number
  dueSoon: number   // within 7 days
  overdue: number
}

export interface DashboardData {
  rental: RentalStats
  rent: RentPaymentStats
  tasks: TaskStats
  recentPayments: RecentPayment[]
  activeProjects: ActiveProject[]
  dueTasks: DueTask[]
}

export interface RecentPayment {
  id: string
  contract_no: string
  location_name: string
  payment_type: string
  billing_period: string
  due_date: string
  net_amount: number
  amount_paid: number
  balance_amount: number
  status: string
}

export interface ActiveProject {
  id: string
  project_no: string
  contract_no: string
  location_name: string
  target_open_date: string | null
  status: string
  current_stage_name: string | null
  total_tasks: number
  completed_tasks: number
}

export interface DueTask {
  id: string
  task_name: string
  opening_project_id: string
  project_no: string
  location_name: string
  due_date: string
  status: string
  assigned_name: string | null
}

// ----------------------------------------------------------------
// Main fetch
// ----------------------------------------------------------------
export async function getDashboardDataAction(): Promise<DashboardData> {
  await requireUser()
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)
  const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const [
    leadsRes,
    contractsRes,
    projectsRes,
    rentPaymentsRes,
    tasksRes,
    recentPaymentsRes,
    activeProjectsRes,
    dueTasksRes,
  ] = await Promise.all([
    // Lead stats
    supabase
      .from('rental_leads')
      .select('status')
      .not('status', 'in', '("cancelled","lost","converted")'),

    // Active contracts
    supabase
      .from('rental_contracts')
      .select('id', { count: 'exact', head: true })
      .in('status', ['active', 'expiring']),

    // Opening projects
    supabase
      .from('opening_projects')
      .select('status')
      .not('status', 'in', '("opened","cancelled")'),

    // Rent payment stats
    supabase
      .from('rent_payments')
      .select('payment_type, status, net_amount, balance_amount')
      .in('status', ['pending', 'partial', 'overdue']),

    // Task stats
    supabase
      .from('opening_tasks')
      .select('due_date, status')
      .not('status', 'in', '("done","skipped","cancelled")'),

    // Recent overdue/pending payments (top 8)
    supabase
      .from('v_rent_payment_summary')
      .select(
        'id, contract_no, location_name, payment_type, billing_period, due_date, net_amount, amount_paid, balance_amount, status'
      )
      .in('status', ['overdue', 'pending', 'partial'])
      .order('due_date', { ascending: true })
      .limit(8),

    // Active opening projects
    supabase
      .from('v_opening_project_progress')
      .select(
        'id, project_no, contract_no, location_name, target_open_date, status, current_stage_name, total_tasks, completed_tasks'
      )
      .not('status', 'in', '("opened","cancelled")')
      .order('target_open_date', { ascending: true })
      .limit(6),

    // Due tasks
    supabase
      .from('opening_tasks')
      .select(
        `
        id,
        task_name,
        opening_project_id,
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
      .not('status', 'in', '("done","skipped","cancelled")')
      .not('due_date', 'is', null)
      .lte('due_date', in7Days)
      .order('due_date', { ascending: true })
      .limit(10),
  ])

  // ---- Rental stats ----
  const leads = leadsRes.data ?? []
  const rental: RentalStats = {
    totalLeads: leads.length,
    negotiatingLeads: leads.filter((l) =>
      ['new', 'contacting', 'negotiating', 'follow_up'].includes(l.status)
    ).length,
    activeContracts: contractsRes.count ?? 0,
    inProgressProjects: (projectsRes.data ?? []).filter((p) => p.status === 'in_progress').length,
    readyToOpenProjects: (projectsRes.data ?? []).filter((p) => p.status === 'ready_to_open').length,
  }

  // ---- Rent payment stats ----
  const payments = rentPaymentsRes.data ?? []
  const rent: RentPaymentStats = {
    payablePending: payments.filter(
      (p) => p.payment_type === 'payable' && ['pending', 'partial'].includes(p.status)
    ).length,
    payablePendingAmount: payments
      .filter((p) => p.payment_type === 'payable' && ['pending', 'partial'].includes(p.status))
      .reduce((s, p) => s + Number(p.balance_amount), 0),
    receivablePending: payments.filter(
      (p) => p.payment_type === 'receivable' && ['pending', 'partial'].includes(p.status)
    ).length,
    receivablePendingAmount: payments
      .filter((p) => p.payment_type === 'receivable' && ['pending', 'partial'].includes(p.status))
      .reduce((s, p) => s + Number(p.balance_amount), 0),
    payableOverdue: payments.filter(
      (p) => p.payment_type === 'payable' && p.status === 'overdue'
    ).length,
    payableOverdueAmount: payments
      .filter((p) => p.payment_type === 'payable' && p.status === 'overdue')
      .reduce((s, p) => s + Number(p.balance_amount), 0),
    receivableOverdue: payments.filter(
      (p) => p.payment_type === 'receivable' && p.status === 'overdue'
    ).length,
    receivableOverdueAmount: payments
      .filter((p) => p.payment_type === 'receivable' && p.status === 'overdue')
      .reduce((s, p) => s + Number(p.balance_amount), 0),
  }

  // ---- Task stats ----
  const taskRows = tasksRes.data ?? []
  const tasks: TaskStats = {
    dueToday: taskRows.filter((t) => t.due_date === today).length,
    dueSoon: taskRows.filter(
      (t) => t.due_date && t.due_date > today && t.due_date <= in7Days
    ).length,
    overdue: taskRows.filter((t) => t.due_date && t.due_date < today).length,
  }

  // ---- Recent payments ----
  const recentPayments: RecentPayment[] = (recentPaymentsRes.data ?? []).map(
    (p: Record<string, unknown>) => ({
      id: String(p.id ?? ''),
      contract_no: String(p.contract_no ?? ''),
      location_name: String(p.location_name ?? ''),
      payment_type: String(p.payment_type ?? ''),
      billing_period: String(p.billing_period ?? ''),
      due_date: String(p.due_date ?? ''),
      net_amount: Number(p.net_amount ?? 0),
      amount_paid: Number(p.amount_paid ?? 0),
      balance_amount: Number(p.balance_amount ?? 0),
      status: String(p.status ?? ''),
    })
  )

  // ---- Active projects ----
  const activeProjects: ActiveProject[] = (activeProjectsRes.data ?? []).map(
    (p: Record<string, unknown>) => ({
      id: String(p.id ?? ''),
      project_no: String(p.project_no ?? ''),
      contract_no: String(p.contract_no ?? ''),
      location_name: String(p.location_name ?? ''),
      target_open_date: p.target_open_date ? String(p.target_open_date) : null,
      status: String(p.status ?? ''),
      current_stage_name: p.current_stage_name ? String(p.current_stage_name) : null,
      total_tasks: Number(p.total_tasks ?? 0),
      completed_tasks: Number(p.completed_tasks ?? 0),
    })
  )

  // ---- Due tasks ----
  const dueTasks: DueTask[] = (dueTasksRes.data ?? []).map((t: Record<string, unknown>) => {
    const proj = t.opening_projects as Record<string, unknown> | null
    const contract = proj?.rental_contracts as Record<string, unknown> | null
    const loc = contract?.locations as Record<string, unknown> | null
    const profile = t.profiles as Record<string, unknown> | null
    return {
      id: String(t.id ?? ''),
      task_name: String(t.task_name ?? ''),
      opening_project_id: String(t.opening_project_id ?? ''),
      project_no: String(proj?.project_no ?? ''),
      location_name: String(loc?.location_name ?? '-'),
      due_date: String(t.due_date ?? ''),
      status: String(t.status ?? ''),
      assigned_name: profile?.full_name ? String(profile.full_name) : null,
    }
  })

  return { rental, rent, tasks, recentPayments, activeProjects, dueTasks }
}
