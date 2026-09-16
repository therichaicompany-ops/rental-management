import type { Metadata } from 'next'
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
import { getDashboardDataAction } from '@/lib/actions/dashboard'
import { StatCard } from '@/components/dashboard/stat-card'
import { RentSummaryTable } from '@/components/dashboard/rent-summary-table'
import { OpeningSummaryTable } from '@/components/dashboard/opening-summary-table'
import { TaskDueList } from '@/components/dashboard/task-due-list'

export const metadata: Metadata = {
  title: 'Dashboard | ระบบบริหารงานเช่าและเปิดสาขา',
  description: 'ภาพรวมของระบบบริหารงานเช่าและเปิดสาขา',
}

export default async function DashboardPage() {
  const data = await getDashboardDataAction()
  const { rental, rent, tasks, recentPayments, activeProjects, dueTasks } = data

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm">ภาพรวมของระบบบริหารงานเช่าและเปิดสาขา</p>
      </div>

      {/* ── Section 1: งานเช่า ─────────────────────── */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          งานเช่า
        </h2>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 xl:grid-cols-5">
          <StatCard
            title="งานเช่าทั้งหมด"
            subtitle="Lead ที่ยังดำเนินการ"
            value={rental.totalLeads}
            icon={Home}
            iconBg="bg-blue-50"
            iconColor="text-blue-500"
            href="/rental-leads"
          />
          <StatCard
            title="กำลังเจรจา"
            subtitle="Lead รอตัดสินใจ"
            value={rental.negotiatingLeads}
            icon={FileText}
            iconBg="bg-indigo-50"
            iconColor="text-indigo-500"
            href="/rental-leads"
          />
          <StatCard
            title="ทำสัญญาแล้ว"
            subtitle="สัญญา Active"
            value={rental.activeContracts}
            icon={CheckSquare}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-500"
            href="/contracts"
          />
          <StatCard
            title="เปิดสาขา"
            subtitle="โครงการกำลังดำเนินการ"
            value={rental.inProgressProjects}
            icon={Building2}
            iconBg="bg-violet-50"
            iconColor="text-violet-500"
            href="/opening"
          />
          <StatCard
            title="พร้อมเปิดร้าน"
            subtitle="รอเปิดสาขา"
            value={rental.readyToOpenProjects}
            icon={CalendarClock}
            iconBg="bg-amber-50"
            iconColor="text-amber-500"
            href="/opening"
          />
        </div>
      </div>

      {/* ── Section 2: ค่าเช่า ──────────────────────── */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          ค่าเช่า
        </h2>
        <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="บริษัทต้องจ่าย"
            subtitle={`${rent.payablePending} รายการ รอชำระ`}
            value={rent.payablePendingAmount}
            icon={ArrowUpCircle}
            iconBg="bg-orange-50"
            iconColor="text-orange-500"
            href="/rent-payments"
            formatAsCurrency
          />
          <StatCard
            title="ลูกค้าต้องจ่าย"
            subtitle={`${rent.receivablePending} รายการ รอชำระ`}
            value={rent.receivablePendingAmount}
            icon={ArrowDownCircle}
            iconBg="bg-cyan-50"
            iconColor="text-cyan-500"
            href="/rent-payments"
            formatAsCurrency
          />
          <StatCard
            title="ค้างจ่าย"
            subtitle={`${rent.payableOverdue} รายการ เกินกำหนด`}
            value={rent.payableOverdueAmount}
            icon={AlertTriangle}
            iconBg="bg-red-50"
            iconColor="text-red-500"
            href="/rent-payments"
            formatAsCurrency
          />
          <StatCard
            title="ค้างรับ"
            subtitle={`${rent.receivableOverdue} รายการ เกินกำหนด`}
            value={rent.receivableOverdueAmount}
            icon={CreditCard}
            iconBg="bg-rose-50"
            iconColor="text-rose-500"
            href="/rent-payments"
            formatAsCurrency
          />
        </div>
      </div>

      {/* ── Section 3: งาน ──────────────────────────── */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          งาน
        </h2>
        <div className="grid gap-4 grid-cols-3">
          <StatCard
            title="ครบกำหนดวันนี้"
            subtitle="ต้องดำเนินการวันนี้"
            value={tasks.dueToday}
            icon={CalendarClock}
            iconBg="bg-orange-50"
            iconColor="text-orange-500"
          />
          <StatCard
            title="ใกล้ครบกำหนด"
            subtitle="ภายใน 7 วัน"
            value={tasks.dueSoon}
            icon={CheckSquare}
            iconBg="bg-yellow-50"
            iconColor="text-yellow-500"
          />
          <StatCard
            title="Overdue"
            subtitle="เกินกำหนดแล้ว"
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
            <h3 className="font-semibold text-sm">ค่าเช่าที่รอชำระ / ค้างชำระ</h3>
            <Link href="/rent-payments" className="text-xs text-primary hover:underline">
              ดูทั้งหมด →
            </Link>
          </div>
          <RentSummaryTable payments={recentPayments} />
        </div>

        {/* Due tasks */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h3 className="font-semibold text-sm">งานที่ใกล้ครบกำหนด</h3>
            <Link href="/opening" className="text-xs text-primary hover:underline">
              ดูทั้งหมด →
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
          <h3 className="font-semibold text-sm">โครงการเปิดสาขา</h3>
          <Link href="/opening" className="text-xs text-primary hover:underline">
            ดูทั้งหมด →
          </Link>
        </div>
        <OpeningSummaryTable projects={activeProjects} />
      </div>
    </div>
  )
}
