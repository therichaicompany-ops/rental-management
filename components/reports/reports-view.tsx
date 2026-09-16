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

import { useI18n } from '@/lib/i18n/context'
import type { Locale } from '@/lib/i18n/types'

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------
const MONTHS_SHORT: Record<Locale, string[]> = {
  th: ['', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'],
  en: ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  my: ['', 'ဇန်', 'ဖေ', 'မတ်', 'ဧ', 'မေ', 'ဇွန်', 'ဇူ', 'သြ', 'စက်', 'အောက်', 'နို', 'ဒီ'],
}

function baht(n: number, loc: Locale = 'th'): string {
  const l = loc === 'th' ? 'th-TH' : loc === 'my' ? 'my-MM' : 'en-US'
  return new Intl.NumberFormat(l, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

function fmtDate(s: string | null, loc: Locale = 'th'): string {
  if (!s) return '-'
  const d = new Date(s)
  const months = MONTHS_SHORT[loc] || MONTHS_SHORT.th
  const year = loc === 'th' ? d.getFullYear() + 543 : d.getFullYear()
  return `${d.getDate()} ${months[d.getMonth() + 1]} ${year}`
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
const PAYMENT_STATUS_TRANSLATIONS: Record<Locale, Record<string, string>> = {
  th: {
    pending: 'รอชำระ',
    partial: 'บางส่วน',
    overdue: 'ค้างชำระ',
    paid: 'ชำระแล้ว',
    cancelled: 'ยกเลิก',
    waived: 'ยกเว้น',
  },
  en: {
    pending: 'Pending',
    partial: 'Partial',
    overdue: 'Overdue',
    paid: 'Paid',
    cancelled: 'Cancelled',
    waived: 'Waived',
  },
  my: {
    pending: 'စောင့်ဆိုင်းဆဲ',
    partial: 'တစ်စိတ်တစ်ပိုင်း',
    overdue: 'ရက်လွန်',
    paid: 'ပေးချေပြီး',
    cancelled: 'ပယ်ဖျက်ပြီး',
    waived: 'ကင်းလွတ်ခွင့်',
  },
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  partial: 'bg-blue-50 text-blue-700 border-blue-200',
  overdue: 'bg-red-50 text-red-700 border-red-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-slate-50 text-slate-500 border-slate-100',
  waived: 'bg-violet-50 text-violet-600 border-violet-200',
}

const OPENING_STATUS_TRANSLATIONS: Record<Locale, Record<string, string>> = {
  th: {
    not_started: 'ยังไม่เริ่ม',
    in_progress: 'กำลังดำเนินการ',
    on_hold: 'พักไว้',
    ready_to_open: 'พร้อมเปิด',
    opened: 'เปิดแล้ว',
    cancelled: 'ยกเลิก',
  },
  en: {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    on_hold: 'On Hold',
    ready_to_open: 'Ready to Open',
    opened: 'Opened',
    cancelled: 'Cancelled',
  },
  my: {
    not_started: 'မစတင်ရသေး',
    in_progress: 'လုပ်ဆောင်ဆဲ',
    on_hold: 'ဆိုင်းငံ့ထား',
    ready_to_open: 'ဖွင့်လှစ်ရန် အဆင်သင့်',
    opened: 'ဖွင့်လှစ်ပြီး',
    cancelled: 'ပယ်ဖျက်ပြီး',
  },
}

const TASK_STATUS_TRANSLATIONS: Record<Locale, Record<string, string>> = {
  th: {
    todo: 'รอทำ',
    in_progress: 'กำลังทำ',
    waiting: 'รอ',
    done: 'เสร็จ',
    skipped: 'ข้าม',
    cancelled: 'ยกเลิก',
  },
  en: {
    todo: 'To Do',
    in_progress: 'In Progress',
    waiting: 'Waiting',
    done: 'Done',
    skipped: 'Skipped',
    cancelled: 'Cancelled',
  },
  my: {
    todo: 'လုပ်ဆောင်ရန်',
    in_progress: 'လုပ်ဆောင်ဆဲ',
    waiting: 'စောင့်ဆိုင်းဆဲ',
    done: 'ပြီးစီး',
    skipped: 'ကျော်သွားသည်',
    cancelled: 'ပယ်ဖျက်ပြီး',
  },
}

// ----------------------------------------------------------------
// Tabs
// ----------------------------------------------------------------
const TAB_KEYS = [
  'payable',
  'receivable',
  'overdue',
  'opening_stage',
  'task_assignee',
  'monthly',
  'by_location',
] as const

type TabId = (typeof TAB_KEYS)[number]

const TAB_TRANSLATIONS: Record<Locale, Record<TabId, string>> = {
  th: {
    payable: 'บริษัทต้องจ่าย',
    receivable: 'ลูกค้าต้องจ่าย',
    overdue: 'ค้างชำระ',
    opening_stage: 'เปิดสาขาตาม Stage',
    task_assignee: 'งานตามผู้รับผิดชอบ',
    monthly: 'ค่าเช่ารายเดือน',
    by_location: 'ค่าเช่าตามสถานที่',
  },
  en: {
    payable: 'Payable',
    receivable: 'Receivable',
    overdue: 'Overdue',
    opening_stage: 'Opening by Stage',
    task_assignee: 'Tasks by Assignee',
    monthly: 'Monthly Rent',
    by_location: 'Rent by Location',
  },
  my: {
    payable: 'ကုမ္ပဏီ ပေးချေရန်',
    receivable: 'ဖောက်သည် ပေးချေရန်',
    overdue: 'ရက်လွန်ငွေ',
    opening_stage: 'အဆင့်လိုက် ဆိုင်ခွဲဖွင့်လှစ်ခြင်း',
    task_assignee: 'တာဝန်ခံအလိုက် လုပ်ငန်းများ',
    monthly: 'လစဉ် အိမ်ငှားခ',
    by_location: 'နေရာအလိုက် အိမ်ငှားခ',
  },
}

const THAI_MONTHS_SHORT = MONTHS_SHORT.th
const PAYMENT_STATUS_LABELS = PAYMENT_STATUS_TRANSLATIONS.th
const OPENING_STATUS_LABELS = OPENING_STATUS_TRANSLATIONS.th
const TASK_STATUS_LABELS: Record<string, string> = TASK_STATUS_TRANSLATIONS.th
interface TabItem {
  id: TabId
  label: string
}
const TABS: TabItem[] = TAB_KEYS.map((id) => ({
  id,
  label: TAB_TRANSLATIONS.th[id],
}))

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
  locale?: Locale
}

function FilterBar({
  filters,
  provinces,
  onChange,
  onReset,
  showStatus,
  statusOptions,
  locale = 'th',
}: FilterBarProps) {
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)
  const months = MONTHS_SHORT[locale] || MONTHS_SHORT.th
  const yearLabel = locale === 'th' ? 'ปี' : locale === 'my' ? 'ခုနှစ်' : 'Year'
  const allYearsLabel = locale === 'th' ? 'ทุกปี' : locale === 'my' ? 'နှစ်အားလုံး' : 'All years'
  const monthLabel = locale === 'th' ? 'เดือน' : locale === 'my' ? 'လ' : 'Month'
  const allMonthsLabel = locale === 'th' ? 'ทุกเดือน' : locale === 'my' ? 'လအားလုံး' : 'All months'
  const provinceLabel = locale === 'th' ? 'จังหวัด' : locale === 'my' ? 'ပြည်နယ်/တိုင်း' : 'Province'
  const allProvincesLabel = locale === 'th' ? 'ทุกจังหวัด' : locale === 'my' ? 'တိုင်းအားလုံး' : 'All provinces'
  const statusLabel = locale === 'th' ? 'สถานะ' : locale === 'my' ? 'အခြေအနေ' : 'Status'
  const allStatusesLabel = locale === 'th' ? 'ทุกสถานะ' : locale === 'my' ? 'အခြေအနေအားလုံး' : 'All statuses'
  const clearLabel = locale === 'th' ? 'ล้าง' : locale === 'my' ? 'ရှင်းရန်' : 'Reset'

  return (
    <div className="flex flex-wrap gap-2 items-end">
      {/* Year */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">{yearLabel}</label>
        <select
          id="filter-year"
          value={filters.year ?? ''}
          onChange={(e) => onChange({ ...filters, year: e.target.value ? Number(e.target.value) : undefined })}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">{allYearsLabel}</option>
          {years.map((y) => (
            <option key={y} value={y}>{locale === 'th' ? y + 543 : y}</option>
          ))}
        </select>
      </div>

      {/* Month */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">{monthLabel}</label>
        <select
          id="filter-month"
          value={filters.month ?? ''}
          onChange={(e) => onChange({ ...filters, month: e.target.value ? Number(e.target.value) : undefined })}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">{allMonthsLabel}</option>
          {months.slice(1).map((m: string, i: number) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </select>
      </div>

      {/* Province */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">{provinceLabel}</label>
        <select
          id="filter-province"
          value={filters.province ?? ''}
          onChange={(e) => onChange({ ...filters, province: e.target.value || undefined })}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">{allProvincesLabel}</option>
          {provinces.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Status */}
      {showStatus && statusOptions && (
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">{statusLabel}</label>
          <select
            id="filter-status"
            value={filters.status ?? ''}
            onChange={(e) => onChange({ ...filters, status: e.target.value || undefined })}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">{allStatusesLabel}</option>
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
        {clearLabel}
      </Button>
    </div>
  )
}

// ----------------------------------------------------------------
// Payment table (shared by payable/receivable)
// ----------------------------------------------------------------
interface PaymentTableProps {
  rows: PaymentReportRow[]
  onExport: () => void
  locale?: Locale
  paymentLabels?: Record<string, string>
}

function PaymentTable({
  rows,
  onExport,
  locale = 'th',
  paymentLabels = PAYMENT_STATUS_LABELS,
}: PaymentTableProps) {
  const total = rows.reduce(
    (s, r) => ({ net: s.net + r.net_amount, paid: s.paid + r.amount_paid, bal: s.bal + r.balance_amount }),
    { net: 0, paid: 0, bal: 0 }
  )

  const itemsCountText = locale === 'th' ? `${rows.length} รายการ` : locale === 'my' ? `${rows.length} ခု` : `${rows.length} items`
  const noDataText = locale === 'th' ? 'ไม่พบข้อมูล' : locale === 'my' ? 'ဒေတာ မရှိပါ' : 'No data found'
  const colContract = locale === 'th' ? 'สัญญา' : locale === 'my' ? 'စာချုပ်' : 'Contract'
  const colLocation = locale === 'th' ? 'สถานที่' : locale === 'my' ? 'နေရာ' : 'Location'
  const colProvince = locale === 'th' ? 'จังหวัด' : locale === 'my' ? 'ပြည်နယ်/တိုင်း' : 'Province'
  const colPeriod = locale === 'th' ? 'งวด' : locale === 'my' ? 'ကာလ' : 'Period'
  const colDue = locale === 'th' ? 'ครบกำหนด' : locale === 'my' ? 'ရက်စွဲ' : 'Due Date'
  const colNet = locale === 'th' ? 'ยอดสุทธิ' : locale === 'my' ? 'စုစုပေါင်း' : 'Net'
  const colPaid = locale === 'th' ? 'ชำระแล้ว' : locale === 'my' ? 'ပေးချေပြီး' : 'Paid'
  const colBal = locale === 'th' ? 'คงเหลือ' : locale === 'my' ? 'ကျန်ငွေ' : 'Balance'
  const colStatus = locale === 'th' ? 'สถานะ' : locale === 'my' ? 'အခြေအနေ' : 'Status'
  const colTotal = locale === 'th' ? `รวม (${rows.length} รายการ)` : locale === 'my' ? `စုစုပေါင်း (${rows.length} ခု)` : `Total (${rows.length} items)`

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{itemsCountText}</span>
        <Button id="export-payment" variant="outline" size="sm" className="gap-2" onClick={onExport}>
          <Download className="h-3.5 w-3.5" /> Export CSV
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">{colContract}</th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground hidden md:table-cell">{colLocation}</th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground hidden lg:table-cell">{colProvince}</th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground hidden xl:table-cell">{colPeriod}</th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground hidden md:table-cell">{colDue}</th>
              <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">{colNet}</th>
              <th className="px-3 py-2.5 text-right font-medium text-muted-foreground hidden sm:table-cell">{colPaid}</th>
              <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">{colBal}</th>
              <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">{colStatus}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-muted-foreground text-sm">
                  {noDataText}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2 font-medium">{r.contract_no}</td>
                  <td className="px-3 py-2 hidden md:table-cell text-muted-foreground max-w-[140px] truncate">{r.location_name}</td>
                  <td className="px-3 py-2 hidden lg:table-cell text-muted-foreground">{r.province || '-'}</td>
                  <td className="px-3 py-2 hidden xl:table-cell text-muted-foreground text-xs">{r.billing_period.slice(0, 7)}</td>
                  <td className="px-3 py-2 hidden md:table-cell text-muted-foreground text-xs">{fmtDate(r.due_date, locale)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{baht(r.net_amount, locale)}</td>
                  <td className="px-3 py-2 text-right tabular-nums hidden sm:table-cell text-emerald-600">{baht(r.amount_paid, locale)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold">{baht(r.balance_amount, locale)}</td>
                  <td className="px-3 py-2 text-center">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${PAYMENT_STATUS_COLORS[r.status] ?? PAYMENT_STATUS_COLORS.pending}`}
                    >
                      {paymentLabels[r.status] ?? r.status}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t bg-muted/40 font-semibold">
                <td className="px-3 py-2.5" colSpan={5}>{colTotal}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{baht(total.net, locale)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums hidden sm:table-cell text-emerald-600">{baht(total.paid, locale)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{baht(total.bal, locale)}</td>
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
  const { t, locale } = useI18n()
  const months = MONTHS_SHORT[locale] || MONTHS_SHORT.th
  const tabTranslations = TAB_TRANSLATIONS[locale] || TAB_TRANSLATIONS.th
  const paymentLabels: Record<string, string> = PAYMENT_STATUS_TRANSLATIONS[locale] || PAYMENT_STATUS_LABELS
  const openingLabels: Record<string, string> = OPENING_STATUS_TRANSLATIONS[locale] || OPENING_STATUS_LABELS
  const taskLabels: Record<string, string> = TASK_STATUS_TRANSLATIONS[locale] || TASK_STATUS_LABELS

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
        locale={locale}
        paymentLabels={paymentLabels}
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
        locale={locale}
        paymentLabels={paymentLabels}
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
  const statusOptions: { value: string; label: string }[] =
    activeTab === 'payable' || activeTab === 'receivable'
      ? Object.entries(paymentLabels).map(([v, l]) => ({ value: v, label: String(l) }))
      : activeTab === 'opening_stage'
      ? Object.entries(openingLabels).map(([v, l]) => ({ value: v, label: String(l) }))
      : Object.entries(taskLabels).map(([v, l]) => ({ value: v, label: String(l) }))

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.reports.title}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{t.reports.subtitle}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b pb-0">
        {TABS.map((tab: TabItem) => (
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
            {tabTranslations[tab.id] ?? tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-card shadow-sm p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
          <Filter className="h-4 w-4" />
          {t.common.filter}
        </div>
        <FilterBar
          filters={filters}
          provinces={provinces}
          onChange={setFilters}
          onReset={resetFilters}
          showStatus={showStatus}
          statusOptions={statusOptions}
          locale={locale}
        />
      </div>

      {/* Content */}
      <div className="rounded-xl border bg-card shadow-sm p-5">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">{t.common.loading}</span>
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
