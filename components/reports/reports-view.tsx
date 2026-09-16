'use client'

import * as React from 'react'
import {
  Download,
  Loader2,
  ChevronDown,
  Filter,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  getPayableReportAction,
  getReceivableReportAction,
  getOverdueReportAction,
  getOpeningStageReportAction,
  getTaskByAssigneeReportAction,
  getMonthlyRentReportAction,
  getRentByLocationReportAction,
  type ReportFilters,
  type PaymentReportRow,
  type OverdueReportRow,
  type OpeningStageRow,
  type TaskByAssigneeRow,
  type MonthlyRentRow,
  type RentByLocationRow,
} from '@/lib/actions/reports'

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------
const THAI_MONTHS_SHORT = [
  '', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
]

function baht(n: number): string {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

function fmtDate(s: string | null): string {
  if (!s) return '-'
  const d = new Date(s)
  return `${d.getDate()} ${THAI_MONTHS_SHORT[d.getMonth() + 1]} ${d.getFullYear() + 543}`
}

// ----------------------------------------------------------------
// CSV Export
// ----------------------------------------------------------------
function exportCsv(headers: string[], rows: string[][]): void {
  const bom = '\uFEFF'
  const content =
    bom +
    [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `report_${Date.now()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ----------------------------------------------------------------
// Status label helpers
// ----------------------------------------------------------------
const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'รอชำระ',
  partial: 'บางส่วน',
  overdue: 'ค้างชำระ',
  paid: 'ชำระแล้ว',
  cancelled: 'ยกเลิก',
  waived: 'ยกเว้น',
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  partial: 'bg-blue-50 text-blue-700 border-blue-200',
  overdue: 'bg-red-50 text-red-700 border-red-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-slate-50 text-slate-500 border-slate-100',
  waived: 'bg-violet-50 text-violet-600 border-violet-200',
}

const OPENING_STATUS_LABELS: Record<string, string> = {
  not_started: 'ยังไม่เริ่ม',
  in_progress: 'กำลังดำเนินการ',
  on_hold: 'พักไว้',
  ready_to_open: 'พร้อมเปิด',
  opened: 'เปิดแล้ว',
  cancelled: 'ยกเลิก',
}

const TASK_STATUS_LABELS: Record<string, string> = {
  todo: 'รอทำ',
  in_progress: 'กำลังทำ',
  waiting: 'รอ',
  done: 'เสร็จ',
  skipped: 'ข้าม',
  cancelled: 'ยกเลิก',
}

// ----------------------------------------------------------------
// Tabs
// ----------------------------------------------------------------
const TABS = [
  { id: 'payable', label: 'บริษัทต้องจ่าย' },
  { id: 'receivable', label: 'ลูกค้าต้องจ่าย' },
  { id: 'overdue', label: 'ค้างชำระ' },
  { id: 'opening_stage', label: 'เปิดสาขาตาม Stage' },
  { id: 'task_assignee', label: 'งานตามผู้รับผิดชอบ' },
  { id: 'monthly', label: 'ค่าเช่ารายเดือน' },
  { id: 'by_location', label: 'ค่าเช่าตามสถานที่' },
] as const

type TabId = (typeof TABS)[number]['id']

// ----------------------------------------------------------------
// Filter Bar
// ----------------------------------------------------------------
interface FilterBarProps {
  filters: ReportFilters
  provinces: string[]
  onChange: (f: ReportFilters) => void
  onReset: () => void
  showStatus?: boolean
  statusOptions?: { value: string; label: string }[]
}

function FilterBar({
  filters,
  provinces,
  onChange,
  onReset,
  showStatus,
  statusOptions,
}: FilterBarProps) {
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  return (
    <div className="flex flex-wrap gap-2 items-end">
      {/* Year */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">ปี</label>
        <select
          id="filter-year"
          value={filters.year ?? ''}
          onChange={(e) => onChange({ ...filters, year: e.target.value ? Number(e.target.value) : undefined })}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">ทุกปี</option>
          {years.map((y) => (
            <option key={y} value={y}>{y + 543}</option>
          ))}
        </select>
      </div>

      {/* Month */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">เดือน</label>
        <select
          id="filter-month"
          value={filters.month ?? ''}
          onChange={(e) => onChange({ ...filters, month: e.target.value ? Number(e.target.value) : undefined })}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">ทุกเดือน</option>
          {THAI_MONTHS_SHORT.slice(1).map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </select>
      </div>

      {/* Province */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">จังหวัด</label>
        <select
          id="filter-province"
          value={filters.province ?? ''}
          onChange={(e) => onChange({ ...filters, province: e.target.value || undefined })}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">ทุกจังหวัด</option>
          {provinces.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Status */}
      {showStatus && statusOptions && (
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">สถานะ</label>
          <select
            id="filter-status"
            value={filters.status ?? ''}
            onChange={(e) => onChange({ ...filters, status: e.target.value || undefined })}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">ทุกสถานะ</option>
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Clear */}
      <Button
        id="report-filter-clear"
        variant="ghost"
        size="sm"
        onClick={onReset}
        className="gap-1.5 text-muted-foreground hover:text-foreground h-9"
      >
        <X className="h-3.5 w-3.5" />
        ล้าง
      </Button>
    </div>
  )
}

// ----------------------------------------------------------------
// Payment table (shared by payable/receivable)
// ----------------------------------------------------------------
function PaymentTable({ rows, onExport }: { rows: PaymentReportRow[]; onExport: () => void }) {
  const total = rows.reduce(
    (s, r) => ({ net: s.net + r.net_amount, paid: s.paid + r.amount_paid, bal: s.bal + r.balance_amount }),
    { net: 0, paid: 0, bal: 0 }
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{rows.length} รายการ</span>
        <Button id="export-payment" variant="outline" size="sm" className="gap-2" onClick={onExport}>
          <Download className="h-3.5 w-3.5" /> Export CSV
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">สัญญา</th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground hidden md:table-cell">สถานที่</th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground hidden lg:table-cell">จังหวัด</th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground hidden xl:table-cell">งวด</th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground hidden md:table-cell">ครบกำหนด</th>
              <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">ยอดสุทธิ</th>
              <th className="px-3 py-2.5 text-right font-medium text-muted-foreground hidden sm:table-cell">ชำระแล้ว</th>
              <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">คงเหลือ</th>
              <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-muted-foreground text-sm">
                  ไม่พบข้อมูล
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2 font-medium">{r.contract_no}</td>
                  <td className="px-3 py-2 hidden md:table-cell text-muted-foreground max-w-[140px] truncate">{r.location_name}</td>
                  <td className="px-3 py-2 hidden lg:table-cell text-muted-foreground">{r.province || '-'}</td>
                  <td className="px-3 py-2 hidden xl:table-cell text-muted-foreground text-xs">{r.billing_period.slice(0, 7)}</td>
                  <td className="px-3 py-2 hidden md:table-cell text-muted-foreground text-xs">{fmtDate(r.due_date)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{baht(r.net_amount)}</td>
                  <td className="px-3 py-2 text-right tabular-nums hidden sm:table-cell text-emerald-600">{baht(r.amount_paid)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold">{baht(r.balance_amount)}</td>
                  <td className="px-3 py-2 text-center">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${PAYMENT_STATUS_COLORS[r.status] ?? PAYMENT_STATUS_COLORS.pending}`}
                    >
                      {PAYMENT_STATUS_LABELS[r.status] ?? r.status}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t bg-muted/40 font-semibold">
                <td className="px-3 py-2.5" colSpan={5}>รวม ({rows.length} รายการ)</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{baht(total.net)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums hidden sm:table-cell text-emerald-600">{baht(total.paid)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{baht(total.bal)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------
// Main ReportsView
// ----------------------------------------------------------------
interface ReportsViewProps {
  provinces: string[]
}

const DEFAULT_FILTERS: ReportFilters = {
  year: new Date().getFullYear(),
}

export function ReportsView({ provinces }: ReportsViewProps) {
  const [activeTab, setActiveTab] = React.useState<TabId>('payable')
  const [filters, setFilters] = React.useState<ReportFilters>(DEFAULT_FILTERS)
  const [loading, setLoading] = React.useState(false)

  // Data states
  const [payableRows, setPayableRows] = React.useState<PaymentReportRow[]>([])
  const [receivableRows, setReceivableRows] = React.useState<PaymentReportRow[]>([])
  const [overdueRows, setOverdueRows] = React.useState<OverdueReportRow[]>([])
  const [openingRows, setOpeningRows] = React.useState<OpeningStageRow[]>([])
  const [taskRows, setTaskRows] = React.useState<TaskByAssigneeRow[]>([])
  const [monthlyRows, setMonthlyRows] = React.useState<MonthlyRentRow[]>([])
  const [locationRows, setLocationRows] = React.useState<RentByLocationRow[]>([])

  // Fetch on tab or filter change
  React.useEffect(() => {
    setLoading(true)
    const f = filters

    const fetchers: Record<TabId, () => Promise<void>> = {
      payable: async () => setPayableRows(await getPayableReportAction(f)),
      receivable: async () => setReceivableRows(await getReceivableReportAction(f)),
      overdue: async () => setOverdueRows(await getOverdueReportAction(f)),
      opening_stage: async () => setOpeningRows(await getOpeningStageReportAction(f)),
      task_assignee: async () => setTaskRows(await getTaskByAssigneeReportAction(f)),
      monthly: async () => setMonthlyRows(await getMonthlyRentReportAction(f)),
      by_location: async () => setLocationRows(await getRentByLocationReportAction(f)),
    }

    fetchers[activeTab]().finally(() => setLoading(false))
  }, [activeTab, filters])

  function resetFilters() {
    setFilters(DEFAULT_FILTERS)
  }

  // ----------------------------------------------------------------
  // Tab content renderers
  // ----------------------------------------------------------------
  function renderPayable() {
    return (
      <PaymentTable
        rows={payableRows}
        onExport={() =>
          exportCsv(
            ['สัญญา', 'สถานที่', 'จังหวัด', 'งวด', 'ครบกำหนด', 'ยอดสุทธิ', 'ชำระแล้ว', 'คงเหลือ', 'สถานะ'],
            payableRows.map((r) => [
              r.contract_no, r.location_name, r.province,
              r.billing_period.slice(0, 7), r.due_date,
              String(r.net_amount), String(r.amount_paid), String(r.balance_amount), r.status,
            ])
          )
        }
      />
    )
  }

  function renderReceivable() {
    return (
      <PaymentTable
        rows={receivableRows}
        onExport={() =>
          exportCsv(
            ['สัญญา', 'สถานที่', 'จังหวัด', 'งวด', 'ครบกำหนด', 'ยอดสุทธิ', 'ชำระแล้ว', 'คงเหลือ', 'สถานะ'],
            receivableRows.map((r) => [
              r.contract_no, r.location_name, r.province,
              r.billing_period.slice(0, 7), r.due_date,
              String(r.net_amount), String(r.amount_paid), String(r.balance_amount), r.status,
            ])
          )
        }
      />
    )
  }

  function renderOverdue() {
    const total = overdueRows.reduce((s, r) => s + r.balance_amount, 0)
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">{overdueRows.length} รายการ · ค้างรวม {baht(total)} บาท</span>
          <Button
            id="export-overdue"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() =>
              exportCsv(
                ['สัญญา', 'สถานที่', 'จังหวัด', 'ประเภท', 'งวด', 'ครบกำหนด', 'เกินกำหนด (วัน)', 'คงเหลือ'],
                overdueRows.map((r) => [
                  r.contract_no, r.location_name, r.province,
                  r.payment_type, r.billing_period.slice(0, 7), r.due_date,
                  String(r.days_overdue), String(r.balance_amount),
                ])
              )
            }
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">สัญญา</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground hidden md:table-cell">สถานที่</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground hidden sm:table-cell">ประเภท</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground hidden lg:table-cell">ครบกำหนด</th>
                <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">เกินกำหนด</th>
                <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">คงเหลือ (฿)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {overdueRows.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground text-sm">ไม่พบรายการค้างชำระ 🎉</td></tr>
              ) : overdueRows.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2 font-medium">{r.contract_no}</td>
                  <td className="px-3 py-2 hidden md:table-cell text-muted-foreground max-w-[140px] truncate">{r.location_name}</td>
                  <td className="px-3 py-2 hidden sm:table-cell text-muted-foreground text-xs">{r.payment_type === 'payable' ? 'จ่าย' : 'รับ'}</td>
                  <td className="px-3 py-2 hidden lg:table-cell text-muted-foreground text-xs">{fmtDate(r.due_date)}</td>
                  <td className="px-3 py-2 text-right">
                    <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-200">
                      {r.days_overdue} วัน
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums text-red-600">{baht(r.balance_amount)}</td>
                </tr>
              ))}
            </tbody>
            {overdueRows.length > 0 && (
              <tfoot>
                <tr className="border-t bg-muted/40 font-semibold">
                  <td className="px-3 py-2.5" colSpan={5}>รวม ({overdueRows.length})</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-red-600">{baht(total)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    )
  }

  function renderOpeningStage() {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">{openingRows.length} โครงการ</span>
          <Button
            id="export-opening"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() =>
              exportCsv(
                ['โครงการ', 'สัญญา', 'สถานที่', 'Stage', 'วันเปิดร้าน', 'สถานะ', 'งานทั้งหมด', 'เสร็จแล้ว', 'คงเหลือ'],
                openingRows.map((r) => [
                  r.project_no, r.contract_no, r.location_name,
                  r.current_stage_name ?? '-', r.target_open_date ?? '-', r.status,
                  String(r.total_tasks), String(r.completed_tasks), String(r.remaining_tasks),
                ])
              )
            }
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">โครงการ</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground hidden md:table-cell">สถานที่</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground hidden lg:table-cell">Stage</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground hidden lg:table-cell">วันเปิดร้าน</th>
                <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">ความคืบหน้า</th>
                <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {openingRows.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground text-sm">ไม่พบข้อมูล</td></tr>
              ) : openingRows.map((r, idx) => {
                const pct = r.total_tasks > 0 ? Math.round((r.completed_tasks / r.total_tasks) * 100) : 0
                return (
                  <tr key={idx} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2 font-medium">{r.project_no}</td>
                    <td className="px-3 py-2 hidden md:table-cell text-muted-foreground max-w-[140px] truncate">{r.location_name}</td>
                    <td className="px-3 py-2 hidden lg:table-cell text-muted-foreground text-xs">{r.current_stage_name ?? '-'}</td>
                    <td className="px-3 py-2 hidden lg:table-cell text-muted-foreground text-xs">{fmtDate(r.target_open_date)}</td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{r.completed_tasks}/{r.total_tasks}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Badge variant="outline" className="text-[10px]">
                        {OPENING_STATUS_LABELS[r.status] ?? r.status}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  function renderTaskAssignee() {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">{taskRows.length} งาน</span>
          <Button
            id="export-task"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() =>
              exportCsv(
                ['ผู้รับผิดชอบ', 'งาน', 'โครงการ', 'สถานที่', 'ครบกำหนด', 'สถานะ'],
                taskRows.map((r) => [
                  r.assigned_name, r.task_name, r.project_no,
                  r.location_name, r.due_date ?? '-', r.status,
                ])
              )
            }
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">ผู้รับผิดชอบ</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">งาน</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground hidden md:table-cell">สถานที่</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground hidden lg:table-cell">ครบกำหนด</th>
                <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {taskRows.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">ไม่พบข้อมูล</td></tr>
              ) : taskRows.map((r, idx) => (
                <tr key={idx} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2 font-medium">{r.assigned_name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.task_name}</td>
                  <td className="px-3 py-2 hidden md:table-cell text-muted-foreground max-w-[120px] truncate">{r.location_name}</td>
                  <td className="px-3 py-2 hidden lg:table-cell text-muted-foreground text-xs">{fmtDate(r.due_date)}</td>
                  <td className="px-3 py-2 text-center">
                    <Badge variant="outline" className="text-[10px]">
                      {TASK_STATUS_LABELS[r.status] ?? r.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  function renderMonthly() {
    const totalNet = monthlyRows.reduce((s, r) => s + r.total_net_amount, 0)
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">{monthlyRows.length} รายการ</span>
          <Button
            id="export-monthly"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() =>
              exportCsv(
                ['ปี', 'เดือน', 'ประเภท', 'จำนวน', 'ยอดสุทธิ', 'ชำระแล้ว', 'คงเหลือ'],
                monthlyRows.map((r) => [
                  String(r.year + 543), THAI_MONTHS_SHORT[r.month],
                  r.payment_type, String(r.total_records),
                  String(r.total_net_amount), String(r.total_paid), String(r.total_balance),
                ])
              )
            }
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">ปี-เดือน</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">ประเภท</th>
                <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">จำนวน</th>
                <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">ยอดสุทธิ</th>
                <th className="px-3 py-2.5 text-right font-medium text-muted-foreground hidden sm:table-cell">ชำระแล้ว</th>
                <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">คงเหลือ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {monthlyRows.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground text-sm">ไม่พบข้อมูล</td></tr>
              ) : monthlyRows.map((r, idx) => (
                <tr key={idx} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2 font-medium tabular-nums">
                    {r.year + 543}-{THAI_MONTHS_SHORT[r.month]}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {r.payment_type === 'payable' ? 'บริษัทจ่าย' : 'ลูกค้าจ่าย'}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.total_records}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{baht(r.total_net_amount)}</td>
                  <td className="px-3 py-2 text-right tabular-nums hidden sm:table-cell text-emerald-600">{baht(r.total_paid)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold">{baht(r.total_balance)}</td>
                </tr>
              ))}
            </tbody>
            {monthlyRows.length > 0 && (
              <tfoot>
                <tr className="border-t bg-muted/40 font-semibold">
                  <td className="px-3 py-2.5" colSpan={3}>รวม</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{baht(totalNet)}</td>
                  <td className="px-3 py-2.5 hidden sm:table-cell text-right tabular-nums text-emerald-600">
                    {baht(monthlyRows.reduce((s, r) => s + r.total_paid, 0))}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {baht(monthlyRows.reduce((s, r) => s + r.total_balance, 0))}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    )
  }

  function renderByLocation() {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">{locationRows.length} สถานที่</span>
          <Button
            id="export-location"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() =>
              exportCsv(
                ['รหัส', 'สถานที่', 'หมู่บ้าน', 'จังหวัด', 'สัญญา', 'ประเภท', 'จำนวน', 'ยอดสุทธิ', 'คงเหลือ'],
                locationRows.map((r) => [
                  r.location_code, r.location_name, r.village_name, r.province,
                  r.contract_no, r.payment_type,
                  String(r.total_records), String(r.total_net_amount), String(r.total_balance),
                ])
              )
            }
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">สถานที่</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground hidden md:table-cell">จังหวัด</th>
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground hidden sm:table-cell">ประเภท</th>
                <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">จำนวน</th>
                <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">ยอดสุทธิ</th>
                <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">คงเหลือ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {locationRows.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground text-sm">ไม่พบข้อมูล</td></tr>
              ) : locationRows.map((r, idx) => (
                <tr key={idx} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2">
                    <p className="font-medium truncate max-w-[160px]">{r.location_name}</p>
                    <p className="text-xs text-muted-foreground">{r.location_code}</p>
                  </td>
                  <td className="px-3 py-2 hidden md:table-cell text-muted-foreground">{r.province || '-'}</td>
                  <td className="px-3 py-2 hidden sm:table-cell text-muted-foreground text-xs">
                    {r.payment_type === 'payable' ? 'บริษัทจ่าย' : 'ลูกค้าจ่าย'}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.total_records}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{baht(r.total_net_amount)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold">{baht(r.total_balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const contentMap: Record<TabId, () => React.ReactNode> = {
    payable: renderPayable,
    receivable: renderReceivable,
    overdue: renderOverdue,
    opening_stage: renderOpeningStage,
    task_assignee: renderTaskAssignee,
    monthly: renderMonthly,
    by_location: renderByLocation,
  }

  // Filter options per tab
  const showStatus = ['payable', 'receivable', 'opening_stage', 'task_assignee'].includes(activeTab)
  const statusOptions = activeTab === 'payable' || activeTab === 'receivable'
    ? Object.entries(PAYMENT_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))
    : activeTab === 'opening_stage'
    ? Object.entries(OPENING_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))
    : Object.entries(TASK_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground text-sm mt-0.5">รายงานและสรุปข้อมูล</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b pb-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            id={`report-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className={[
              'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px',
              activeTab === tab.id
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-card shadow-sm p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
          <Filter className="h-4 w-4" />
          ตัวกรอง
        </div>
        <FilterBar
          filters={filters}
          provinces={provinces}
          onChange={setFilters}
          onReset={resetFilters}
          showStatus={showStatus}
          statusOptions={statusOptions}
        />
      </div>

      {/* Content */}
      <div className="rounded-xl border bg-card shadow-sm p-5">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">กำลังโหลดรายงาน...</span>
          </div>
        ) : (
          contentMap[activeTab]()
        )}
      </div>
    </div>
  )
}

// keep ChevronDown in imports for future use
void ChevronDown
