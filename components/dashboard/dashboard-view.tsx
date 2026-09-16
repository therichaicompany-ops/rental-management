'use client'

import Link from 'next/link'
import {
  Home,
  CreditCard,
  Building2,
  CalendarClock,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  CheckSquare,
  FileText,
} from 'lucide-react'
import { StatCard } from '@/components/dashboard/stat-card'
import { RentSummaryTable } from '@/components/dashboard/rent-summary-table'
import { OpeningSummaryTable } from '@/components/dashboard/opening-summary-table'
import { TaskDueList } from '@/components/dashboard/task-due-list'
import { useI18n } from '@/lib/i18n/context'
import type { DashboardData } from '@/lib/actions/dashboard'

interface DashboardViewProps {
  data: DashboardData
}

export function DashboardView({ data }: DashboardViewProps) {
  const { t } = useI18n()
  const { rental, rent, tasks, recentPayments, activeProjects, dueTasks } = data

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.dashboard.title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t.dashboard.subtitle}</p>
      </div>

      {/* ── Section 1: Rental / Leads ─────────────────────── */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          {t.nav.rentalLeads}
        </h2>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 xl:grid-cols-5">
          <StatCard
            title={t.rentalLeads.title}
            subtitle={t.dashboard.stats.activeLeads}
            value={rental.totalLeads}
            icon={Home}
            iconBg="bg-blue-50"
            iconColor="text-blue-500"
            href="/rental-leads"
          />
          <StatCard
            title={t.rentalLeads.stages.negotiating}
            subtitle={t.rentalLeads.stages.surveying}
            value={rental.negotiatingLeads}
            icon={FileText}
            iconBg="bg-indigo-50"
            iconColor="text-indigo-500"
            href="/rental-leads"
          />
          <StatCard
            title={t.contracts.statuses.active}
            subtitle={t.contracts.title}
            value={rental.activeContracts}
            icon={CheckSquare}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-500"
            href="/contracts"
          />
          <StatCard
            title={t.nav.opening}
            subtitle={t.dashboard.stats.openingProjects}
            value={rental.inProgressProjects}
            icon={Building2}
            iconBg="bg-violet-50"
            iconColor="text-violet-500"
            href="/opening"
          />
          <StatCard
            title={t.dashboard.stats.activeBranches}
            subtitle={t.opening.stages.s8}
            value={rental.readyToOpenProjects}
            icon={CalendarClock}
            iconBg="bg-amber-50"
            iconColor="text-amber-500"
            href="/opening"
          />
        </div>
      </div>

      {/* ── Section 2: Rent Payments ──────────────────────── */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          {t.nav.rentPayments}
        </h2>
        <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
          <StatCard
            title={t.payments.statuses.pending}
            subtitle={`${rent.payablePending} ${t.common.items}`}
            value={rent.payablePendingAmount}
            icon={ArrowUpCircle}
            iconBg="bg-orange-50"
            iconColor="text-orange-500"
            href="/rent-payments"
            formatAsCurrency
          />
          <StatCard
            title={t.payments.amount}
            subtitle={`${rent.receivablePending} ${t.common.items}`}
            value={rent.receivablePendingAmount}
            icon={ArrowDownCircle}
            iconBg="bg-cyan-50"
            iconColor="text-cyan-500"
            href="/rent-payments"
            formatAsCurrency
          />
          <StatCard
            title={t.payments.statuses.overdue}
            subtitle={`${rent.payableOverdue} ${t.common.items}`}
            value={rent.payableOverdueAmount}
            icon={AlertTriangle}
            iconBg="bg-red-50"
            iconColor="text-red-500"
            href="/rent-payments"
            formatAsCurrency
          />
          <StatCard
            title={t.dashboard.upcomingPayments}
            subtitle={`${rent.receivableOverdue} ${t.common.items}`}
            value={rent.receivableOverdueAmount}
            icon={CreditCard}
            iconBg="bg-rose-50"
            iconColor="text-rose-500"
            href="/rent-payments"
            formatAsCurrency
          />
        </div>
      </div>

      {/* ── Section 3: Tasks ──────────────────────────── */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          {t.dashboard.urgentTasks}
        </h2>
        <div className="grid gap-4 grid-cols-3">
          <StatCard
            title={t.calendar.today}
            subtitle={t.dashboard.urgentTasks}
            value={tasks.dueToday}
            icon={CalendarClock}
            iconBg="bg-orange-50"
            iconColor="text-orange-500"
          />
          <StatCard
            title={t.dashboard.dueWithinDays.replace('{days}', '7')}
            subtitle={t.calendar.week}
            value={tasks.dueSoon}
            icon={CheckSquare}
            iconBg="bg-yellow-50"
            iconColor="text-yellow-500"
          />
          <StatCard
            title={t.payments.statuses.overdue}
            subtitle={t.dashboard.overduePayments}
            value={tasks.overdue}
            icon={AlertTriangle}
            iconBg="bg-red-50"
            iconColor="text-red-500"
          />
        </div>
      </div>

      {/* ── Section 4: Tables ───────────────────────── */}
      <div className="grid gap-6 grid-cols-1 xl:grid-cols-3">
        {/* Rent payments */}
        <div className="xl:col-span-2 rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h3 className="font-semibold text-sm">{t.dashboard.rentSummary}</h3>
            <Link href="/rent-payments" className="text-xs text-primary hover:underline">
              {t.common.viewDetail} →
            </Link>
          </div>
          <RentSummaryTable payments={recentPayments} />
        </div>

        {/* Due tasks */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h3 className="font-semibold text-sm">{t.dashboard.urgentTasks}</h3>
            <Link href="/opening" className="text-xs text-primary hover:underline">
              {t.common.viewDetail} →
            </Link>
          </div>
          <div className="px-4 py-2">
            <TaskDueList tasks={dueTasks} />
          </div>
        </div>
      </div>

      {/* Opening projects */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-semibold text-sm">{t.dashboard.openingSummary}</h3>
          <Link href="/opening" className="text-xs text-primary hover:underline">
            {t.common.viewDetail} →
          </Link>
        </div>
        <OpeningSummaryTable projects={activeProjects} />
      </div>
    </div>
  )
}
