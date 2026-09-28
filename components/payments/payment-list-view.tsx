'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Search,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
  ExternalLink,
  Building2,
  Home,
  ChevronDown,
  ChevronUp,
  Clock,
  Phone,
  Landmark,
  FileText,
  Layers,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import type {
  RentPaymentWithRelations,
  RentPaymentStatus,
} from '@/lib/types/contracts-payments'
import {
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_BADGE_VARIANTS,
  getEffectivePaymentStatus,
} from '@/lib/types/contracts-payments'
import type { UserRole } from '@/lib/types/auth'
import { isHouseRecord } from '@/lib/utils/lead-metadata'
import { useI18n } from '@/lib/i18n/context'

interface PaymentListViewProps {
  payments: RentPaymentWithRelations[]
  userRole?: UserRole
}

type ViewMode = 'by_property' | 'by_installment' | 'all_periods'
type OverdueFilterType = 'all' | 'branch' | 'house' | 'payable' | 'receivable'

interface OverduePropertySummary {
  contractId: string
  contractNo: string
  isHouse: boolean
  propertyName: string
  province: string
  paymentType: 'payable' | 'receivable'
  counterpartyName: string
  counterpartyPhone?: string | null
  bankName?: string | null
  bankAccountNumber?: string | null
  overduePayments: RentPaymentWithRelations[]
  totalOverdueBalance: number
  totalGrossOverdue: number
  overdueCount: number
  totalContractInstallments: number
  earliestDueDate: string
  latestDueDate: string
  maxDaysOverdue: number
}

function calculateDaysOverdue(dueDateStr: string): number {
  if (!dueDateStr) return 0
  const dueDate = new Date(dueDateStr).getTime()
  const today = new Date().setHours(0, 0, 0, 0)
  const diff = today - dueDate
  return diff > 0 ? Math.floor(diff / (1000 * 60 * 60 * 24)) : 0
}

export function PaymentListView({ payments, userRole }: PaymentListViewProps) {
  const { t, locale } = useI18n()
  const intlLocale = locale === 'en' ? 'en-US' : locale === 'my' ? 'my-MM' : 'th-TH'

  // Safety filter for operation role
  const safePayments = React.useMemo(() => {
    if (userRole === 'operation') {
      return payments.filter((p) => !isHouseRecord(p.rental_contracts))
    }
    return payments
  }, [payments, userRole])

  // View state: Default to 'by_property' (focusing on Overdue Houses / Branches)
  const [viewMode, setViewMode] = React.useState<ViewMode>('by_property')
  const [overdueFilter, setOverdueFilter] = React.useState<OverdueFilterType>('all')
  const [searchTerm, setSearchTerm] = React.useState('')
  const [periodFilter, setPeriodFilter] = React.useState<string>('all')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')

  // Set of expanded property contract IDs in card view
  const [expandedContractIds, setExpandedContractIds] = React.useState<Set<string>>(new Set())

  const togglePropertyExpand = (contractId: string) => {
    setExpandedContractIds((prev) => {
      const next = new Set(prev)
      if (next.has(contractId)) {
        next.delete(contractId)
      } else {
        next.add(contractId)
      }
      return next
    })
  }

  const expandAll = (ids: string[]) => {
    setExpandedContractIds(new Set(ids))
  }

  const collapseAll = () => {
    setExpandedContractIds(new Set())
  }

  const getPaymentStatusLabel = (status: string): string => {
    const map: Record<string, string> = {
      pending: t.payments.statuses.pending,
      partial: t.payments.statuses.partial,
      overdue: t.payments.statuses.overdue,
      paid: t.payments.statuses.paid,
    }
    return map[status] ?? (PAYMENT_STATUS_LABELS[status as RentPaymentStatus] || status)
  }

  // 1. Group overdue payments by Contract (House or Branch)
  const overdueProperties = React.useMemo<OverduePropertySummary[]>(() => {
    const map = new Map<string, {
      contract: RentPaymentWithRelations['rental_contracts']
      overdueList: RentPaymentWithRelations[]
      allList: RentPaymentWithRelations[]
    }>()

    safePayments.forEach((p) => {
      const contract = p.rental_contracts
      const contractId = contract?.id || p.contract_id || 'unknown'

      if (!map.has(contractId)) {
        map.set(contractId, { contract, overdueList: [], allList: [] })
      }
      const entry = map.get(contractId)!
      entry.allList.push(p)

      const effStatus = getEffectivePaymentStatus(p)
      if (effStatus === 'overdue') {
        entry.overdueList.push(p)
      }
    })

    const summaries: OverduePropertySummary[] = []

    map.forEach((entry, contractId) => {
      if (entry.overdueList.length === 0) return // Only include properties with overdue payments!

      const contract = entry.contract
      const isHouse = isHouseRecord(contract)
      if (userRole === 'operation' && isHouse) return

      // Sort overdue payments by due_date ascending (oldest overdue first)
      const sortedOverdue = [...entry.overdueList].sort((a, b) => {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      })

      let totalOverdueBalance = 0
      let totalGrossOverdue = 0
      let maxDays = 0

      sortedOverdue.forEach((p) => {
        totalOverdueBalance += Number(p.balance_amount) || 0
        totalGrossOverdue += Number(p.net_amount) || 0
        const days = calculateDaysOverdue(p.due_date)
        if (days > maxDays) maxDays = days
      })

      const locationName = contract?.locations?.location_name || '-'
      const province = contract?.locations?.province || ''
      const paymentType = sortedOverdue[0]?.payment_type || 'receivable'

      let counterpartyName = '-'
      let counterpartyPhone: string | null = null
      let bankName: string | null = null
      let bankAccountNumber: string | null = null

      if (contract?.landlords) {
        counterpartyName = contract.landlords.name || contract.landlords.company_name || '-'
        counterpartyPhone = contract.landlords.phone || null
        bankName = contract.landlords.bank_name || null
        bankAccountNumber = contract.landlords.bank_account_number || null
      } else if (contract?.customers) {
        counterpartyName = contract.customers.name || contract.customers.company_name || '-'
        counterpartyPhone = contract.customers.phone || null
      }

      summaries.push({
        contractId,
        contractNo: contract?.contract_no || 'ไม่ระบุเลขที่สัญญา',
        isHouse,
        propertyName: locationName,
        province,
        paymentType,
        counterpartyName,
        counterpartyPhone,
        bankName,
        bankAccountNumber,
        overduePayments: sortedOverdue,
        totalOverdueBalance,
        totalGrossOverdue,
        overdueCount: sortedOverdue.length,
        totalContractInstallments: entry.allList.length,
        earliestDueDate: sortedOverdue[0]?.due_date || '',
        latestDueDate: sortedOverdue[sortedOverdue.length - 1]?.due_date || '',
        maxDaysOverdue: maxDays,
      })
    })

    // Sort by largest overdue debt first
    return summaries.sort((a, b) => b.totalOverdueBalance - a.totalOverdueBalance)
  }, [safePayments, userRole])

  // Auto-expand all properties on initial load if <= 5
  React.useEffect(() => {
    if (overdueProperties.length > 0 && expandedContractIds.size === 0) {
      setExpandedContractIds(new Set(overdueProperties.map((p) => p.contractId)))
    }
  }, [overdueProperties])

  // Extract distinct billing periods
  const billingPeriods = React.useMemo(() => {
    const set = new Set<string>()
    safePayments.forEach((p) => {
      if (p.billing_period) set.add(p.billing_period)
    })
    return Array.from(set).sort().reverse()
  }, [safePayments])

  // Global KPIs
  const kpis = React.useMemo(() => {
    let overdueTotal = 0
    let overdueCount = 0
    let overduePayableTotal = 0
    let overdueReceivableTotal = 0
    let branchOverdueCount = 0
    let houseOverdueCount = 0

    overdueProperties.forEach((prop) => {
      if (prop.isHouse) {
        houseOverdueCount += 1
      } else {
        branchOverdueCount += 1
      }
    })

    safePayments.forEach((p) => {
      const balance = Number(p.balance_amount) || 0
      const effStatus = getEffectivePaymentStatus(p)

      if (effStatus === 'overdue') {
        overdueTotal += balance
        overdueCount += 1
        if (p.payment_type === 'payable') {
          overduePayableTotal += balance
        } else {
          overdueReceivableTotal += balance
        }
      }
    })

    return {
      overdueTotal,
      overdueCount,
      overduePropertiesCount: overdueProperties.length,
      branchOverdueCount,
      houseOverdueCount,
      overduePayableTotal,
      overdueReceivableTotal,
    }
  }, [safePayments, overdueProperties])

  // Filtered Overdue Properties (for 'by_property' view)
  const filteredOverdueProperties = React.useMemo(() => {
    return overdueProperties.filter((prop) => {
      // 1. Filter Tab
      if (overdueFilter === 'branch' && prop.isHouse) return false
      if (overdueFilter === 'house' && !prop.isHouse) return false
      if (overdueFilter === 'payable' && prop.paymentType !== 'payable') return false
      if (overdueFilter === 'receivable' && prop.paymentType !== 'receivable') return false

      // 2. Search Term
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const match =
          prop.contractNo.toLowerCase().includes(term) ||
          prop.propertyName.toLowerCase().includes(term) ||
          prop.province.toLowerCase().includes(term) ||
          prop.counterpartyName.toLowerCase().includes(term) ||
          (prop.counterpartyPhone && prop.counterpartyPhone.includes(term)) ||
          prop.overduePayments.some((p) => p.billing_period.toLowerCase().includes(term))

        if (!match) return false
      }

      return true
    })
  }, [overdueProperties, overdueFilter, searchTerm])

  // Filtered Overdue Installments (for 'by_installment' view)
  const filteredOverdueInstallments = React.useMemo(() => {
    return safePayments.filter((p) => {
      const effStatus = getEffectivePaymentStatus(p)
      if (effStatus !== 'overdue') return false

      const isHouse = isHouseRecord(p.rental_contracts)
      if (overdueFilter === 'branch' && isHouse) return false
      if (overdueFilter === 'house' && !isHouse) return false
      if (overdueFilter === 'payable' && p.payment_type !== 'payable') return false
      if (overdueFilter === 'receivable' && p.payment_type !== 'receivable') return false

      if (periodFilter !== 'all' && p.billing_period !== periodFilter) return false

      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const contractNo = p.rental_contracts?.contract_no?.toLowerCase() || ''
        const locName = p.rental_contracts?.locations?.location_name?.toLowerCase() || ''
        const custName = p.rental_contracts?.customers?.name?.toLowerCase() || ''
        const landName = p.rental_contracts?.landlords?.name?.toLowerCase() || ''
        const period = p.billing_period?.toLowerCase() || ''

        const match =
          contractNo.includes(term) ||
          locName.includes(term) ||
          custName.includes(term) ||
          landName.includes(term) ||
          period.includes(term)

        if (!match) return false
      }

      return true
    })
  }, [safePayments, overdueFilter, periodFilter, searchTerm])

  // All Installments (for 'all_periods' audit view)
  const filteredAllInstallments = React.useMemo(() => {
    return safePayments.filter((p) => {
      const effStatus = getEffectivePaymentStatus(p)

      if (statusFilter !== 'all' && effStatus !== statusFilter) return false
      if (periodFilter !== 'all' && p.billing_period !== periodFilter) return false

      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const contractNo = p.rental_contracts?.contract_no?.toLowerCase() || ''
        const locName = p.rental_contracts?.locations?.location_name?.toLowerCase() || ''
        const custName = p.rental_contracts?.customers?.name?.toLowerCase() || ''
        const landName = p.rental_contracts?.landlords?.name?.toLowerCase() || ''
        const period = p.billing_period?.toLowerCase() || ''

        const match =
          contractNo.includes(term) ||
          locName.includes(term) ||
          custName.includes(term) ||
          landName.includes(term) ||
          period.includes(term)

        if (!match) return false
      }

      return true
    })
  }, [safePayments, statusFilter, periodFilter, searchTerm])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {t.payments.title}
            </h1>
            <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200 text-xs px-2 py-0.5">
              ค้างชำระ / ชำระล่าช้า
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {t.payments.subtitle}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setViewMode('by_property')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              viewMode === 'by_property'
                ? 'bg-white text-primary-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            ตามบ้าน / สาขาที่ค้าง
            {kpis.overduePropertiesCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                {kpis.overduePropertiesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setViewMode('by_installment')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              viewMode === 'by_installment'
                ? 'bg-white text-primary-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            ตามงวดที่ค้าง
            {kpis.overdueCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                {kpis.overdueCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setViewMode('all_periods')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              viewMode === 'all_periods'
                ? 'bg-white text-primary-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            แสดงงวดทั้งหมด ({safePayments.length})
          </button>
        </div>
      </div>

      {/* Info Banner reminding that full recurring schedule is inside contracts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900">
        <div className="flex items-start sm:items-center gap-2">
          <span className="p-1 rounded bg-amber-200 text-amber-800 font-bold shrink-0">💡</span>
          <div>
            <span className="font-semibold">ระบบคัดกรองเฉพาะบ้านหรือสาขาที่มีการค้างชำระ / ชำระล่าช้า</span>
            <span className="text-amber-700 ml-1">
              เพื่อให้เจ้าหน้าที่ติดตามทวงถามและบันทึกรับ-จ่ายเงินได้รวดเร็ว (สำหรับตาราง 36 งวดปกติทั้งหมด สามารถดูได้ในเมนู
            </span>{' '}
            <Link href="/contracts" className="font-semibold underline hover:text-amber-950">
              สัญญาเช่า
            </Link>
            )
          </div>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-7 text-xs bg-white text-amber-900 border-amber-300 hover:bg-amber-100 shrink-0 self-start sm:self-auto"
        >
          <Link href="/contracts">
            <FileText className="h-3.5 w-3.5 mr-1" />
            ไปที่สัญญาเช่า
          </Link>
        </Button>
      </div>

      {/* KPI Overdue Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overdue Total Debt */}
        <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700">ยอดค้างชำระรวม</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-700 mt-2">
            ฿{kpis.overdueTotal.toLocaleString(intlLocale, { minimumFractionDigits: 2 })}
          </p>
          <div className="text-[11px] text-rose-600 mt-1 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500" />
            {kpis.overdueCount} งวดที่เลยกำหนดชำระ
          </div>
        </div>

        {/* Overdue Properties Count */}
        <div className="bg-orange-50/80 border border-orange-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-orange-700">บ้าน / สาขาที่ค้างชำระ</span>
            <Building2 className="h-4 w-4 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-orange-800 mt-2">
            {kpis.overduePropertiesCount}{' '}
            <span className="text-sm font-normal text-orange-600">แห่ง/หลัง</span>
          </p>
          <div className="text-[11px] text-orange-700 mt-1 flex items-center gap-1">
            <span>สาขา: {kpis.branchOverdueCount}</span>
            {userRole !== 'operation' && (
              <>
                <span>•</span>
                <span>บ้าน: {kpis.houseOverdueCount}</span>
              </>
            )}
          </div>
        </div>

        {/* Overdue Receivable (from Customer) */}
        <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-teal-800">ค้างรับจากลูกค้า</span>
            <ArrowDownLeft className="h-4 w-4 text-teal-600" />
          </div>
          <p className="text-xl font-bold text-teal-800 mt-2">
            ฿{kpis.overdueReceivableTotal.toLocaleString(intlLocale, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-teal-600">ลูกค้าค้างชำระค่าเช่าบริษัท</span>
        </div>

        {/* Overdue Payable (to Landlord) */}
        <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-800">ค้างจ่ายผู้ให้เช่า</span>
            <ArrowUpRight className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="text-xl font-bold text-indigo-800 mt-2">
            ฿{kpis.overduePayableTotal.toLocaleString(intlLocale, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-indigo-600">บริษัทต้องชำระให้เจ้าของ</span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="space-y-3">
        {/* Quick Filter Tabs */}
        {viewMode !== 'all_periods' ? (
          <div className="flex items-center justify-between border-b border-slate-200 overflow-x-auto pb-px">
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setOverdueFilter('all')}
                className={`px-3.5 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                  overdueFilter === 'all'
                    ? 'border-rose-600 text-rose-700 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                ทั้งหมดที่ค้าง ({overdueProperties.length} แห่ง)
              </button>

              <button
                type="button"
                onClick={() => setOverdueFilter('branch')}
                className={`px-3.5 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                  overdueFilter === 'branch'
                    ? 'border-sky-600 text-sky-700 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                🏢 เฉพาะสาขา ({kpis.branchOverdueCount})
              </button>

              {userRole !== 'operation' && (
                <button
                  type="button"
                  onClick={() => setOverdueFilter('house')}
                  className={`px-3.5 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                    overdueFilter === 'house'
                      ? 'border-amber-600 text-amber-700 font-semibold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🏠 เฉพาะบ้าน ({kpis.houseOverdueCount})
                </button>
              )}

              <button
                type="button"
                onClick={() => setOverdueFilter('receivable')}
                className={`px-3.5 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                  overdueFilter === 'receivable'
                    ? 'border-teal-600 text-teal-700 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                📥 ค้างรับจากลูกค้า
              </button>

              <button
                type="button"
                onClick={() => setOverdueFilter('payable')}
                className={`px-3.5 py-2 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                  overdueFilter === 'payable'
                    ? 'border-indigo-600 text-indigo-700 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                📤 ค้างจ่ายผู้ให้เช่า
              </button>
            </div>

            {viewMode === 'by_property' && overdueProperties.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
                <button
                  type="button"
                  onClick={() => expandAll(overdueProperties.map((p) => p.contractId))}
                  className="hover:text-primary-600 hover:underline px-2 py-1"
                >
                  คลี่ดูทั้งหมด
                </button>
                <span>|</span>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="hover:text-primary-600 hover:underline px-2 py-1"
                >
                  พับเก็บทั้งหมด
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex border-b border-slate-200 overflow-x-auto pb-px">
            <span className="px-3.5 py-2 text-xs font-semibold text-slate-800 border-b-2 border-primary-600">
              ตารางงวดชำระทั้งหมด ({safePayments.length} งวด)
            </span>
          </div>
        )}

        {/* Search Bar & Secondary Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="ค้นหา (เลขที่สัญญา, ชื่อสาขา/บ้าน, ผู้เช่า, ผู้ให้เช่า, เบอร์โทร, จังหวัด)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white text-xs h-9"
            />
          </div>

          {billingPeriods.length > 0 && viewMode !== 'by_property' && (
            <select
              aria-label="Filter billing period"
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 h-9"
            >
              <option value="all">ทุกงวดเดือน</option>
              {billingPeriods.map((bp) => (
                <option key={bp} value={bp}>
                  งวด {bp}
                </option>
              ))}
            </select>
          )}

          {viewMode === 'all_periods' && (
            <select
              aria-label="Filter payment status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 h-9"
            >
              <option value="all">ทุกสถานะงวด</option>
              {Object.entries(PAYMENT_STATUS_LABELS).map(([val]) => (
                <option key={val} value={val}>
                  {getPaymentStatusLabel(val)}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ========================================================
          VIEW MODE 1: Grouped by House / Branch (Default)
          ======================================================== */}
      {viewMode === 'by_property' && (
        <div className="space-y-4">
          {filteredOverdueProperties.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {searchTerm || overdueFilter !== 'all'
                  ? 'ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา'
                  : 'ยอดเยี่ยม! ไม่มีบ้านหรือสาขาที่ค้างชำระ'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                {searchTerm || overdueFilter !== 'all'
                  ? 'กรุณาลองล้างคำค้นหาหรือเปลี่ยนตัวกรองเพื่อดูรายการค้างชำระอื่นๆ'
                  : 'ทุกบ้านและทุกสาขาชำระเงินตามกำหนดเวลาเรียบร้อยแล้ว ไม่มียอดหนี้ค้างชำระในระบบ'}
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <Link href="/contracts">ดูสัญญาเช่าทั้งหมด</Link>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setViewMode('all_periods')}
                  className="text-xs"
                >
                  แสดงงวดทั้งหมด
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOverdueProperties.map((prop) => {
                const isExpanded = expandedContractIds.has(prop.contractId)

                return (
                  <div
                    key={prop.contractId}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:border-slate-300 transition-colors"
                  >
                    {/* Card Header & Property Summary */}
                    <div className="p-4 sm:p-5">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        {/* Left: Badges, Title, Location */}
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Property Type Badge */}
                            {prop.isHouse ? (
                              <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-xs px-2.5 py-0.5 flex items-center gap-1 font-semibold">
                                <Home className="h-3 w-3 text-amber-600" />
                                บ้าน / ที่พักอาศัย
                              </Badge>
                            ) : (
                              <Badge className="bg-sky-50 text-sky-800 border-sky-200 text-xs px-2.5 py-0.5 flex items-center gap-1 font-semibold">
                                <Building2 className="h-3 w-3 text-sky-600" />
                                สาขา / สถานประกอบการ
                              </Badge>
                            )}

                            {/* Direction Badge */}
                            <Badge
                              className={`text-xs px-2 py-0.5 font-medium ${
                                prop.paymentType === 'payable'
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  : 'bg-teal-50 text-teal-700 border-teal-200'
                              }`}
                            >
                              {prop.paymentType === 'payable'
                                ? '📤 จ่ายเจ้าของ (Payable)'
                                : '📥 รับจากลูกค้า (Receivable)'}
                            </Badge>

                            {/* Contract No Link */}
                            <Link
                              href={`/contracts/${prop.contractId}`}
                              className="text-xs font-semibold text-primary-700 hover:text-primary-800 hover:underline flex items-center gap-1 ml-1"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              {prop.contractNo}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </div>

                          <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                              {prop.propertyName}
                            </h2>
                            {prop.province && (
                              <span className="text-xs text-slate-500 font-medium">
                                ({prop.province})
                              </span>
                            )}
                          </div>

                          {/* Counterparty & Contact */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-0.5">
                            <div className="flex items-center gap-1">
                              <span className="text-slate-400">
                                {prop.paymentType === 'payable' ? 'ผู้ให้เช่า:' : 'ผู้เช่า/ลูกค้า:'}
                              </span>
                              <span className="font-semibold text-slate-800">
                                {prop.counterpartyName}
                              </span>
                            </div>

                            {prop.counterpartyPhone && (
                              <div className="flex items-center gap-1 text-slate-500 font-mono">
                                <Phone className="h-3 w-3 text-slate-400" />
                                <a
                                  href={`tel:${prop.counterpartyPhone}`}
                                  className="hover:text-primary-600 hover:underline"
                                >
                                  {prop.counterpartyPhone}
                                </a>
                              </div>
                            )}

                            {prop.bankAccountNumber && (
                              <div className="flex items-center gap-1 text-slate-500">
                                <Landmark className="h-3 w-3 text-slate-400" />
                                <span>{prop.bankName || 'ธนาคาร'}:</span>
                                <span className="font-mono font-medium text-slate-700">
                                  {prop.bankAccountNumber}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: Overdue Amount, Counts & Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                          {/* Financial Impact */}
                          <div className="text-left lg:text-right">
                            <div className="text-[11px] text-rose-600 font-semibold flex items-center lg:justify-end gap-1">
                              <AlertTriangle className="h-3 w-3 text-rose-500" />
                              ค้างชำระ {prop.overdueCount} งวด
                              <span className="text-slate-400 font-normal">
                                (จากทั้งหมด {prop.totalContractInstallments} งวด)
                              </span>
                            </div>
                            <div className="text-2xl font-black text-rose-600 tracking-tight">
                              ฿{prop.totalOverdueBalance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              เลยกำหนดสูงสุด{' '}
                              <span className="font-bold text-rose-700">
                                {prop.maxDaysOverdue} วัน
                              </span>
                            </div>
                          </div>

                          {/* Accordion and Details Buttons */}
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => togglePropertyExpand(prop.contractId)}
                              className={`h-9 px-3 text-xs font-semibold transition-all ${
                                isExpanded
                                  ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="h-3.5 w-3.5 mr-1" />
                                  ซ่อนงวดที่ค้าง
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-3.5 w-3.5 mr-1" />
                                  คลี่ดูงวดที่ค้าง ({prop.overdueCount})
                                </>
                              )}
                            </Button>

                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="h-9 px-3 text-xs bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                            >
                              <Link href={`/contracts/${prop.contractId}`}>
                                ดูสัญญาเช่า
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Table of Overdue Installments */}
                    {isExpanded && (
                      <div className="border-t border-slate-200 bg-slate-50/70 p-3 sm:p-4">
                        <div className="mb-2 flex items-center justify-between text-xs text-slate-600">
                          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-rose-500" />
                            รายการงวดที่ค้างชำระ ({prop.overduePayments.length} งวด):
                          </span>
                          <span className="text-[11px] text-slate-400">
                            คลิก &quot;บันทึกการชำระ / สลิป&quot; เพื่ออัปเดตยอดหรือแนบหลักฐานการโอน
                          </span>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                                <tr>
                                  <th className="px-3 py-2.5">งวดเดือน</th>
                                  <th className="px-3 py-2.5">วันครบกำหนด</th>
                                  <th className="px-3 py-2.5">ล่าช้า</th>
                                  <th className="px-3 py-2.5 text-right">ยอดที่ต้องชำระ</th>
                                  <th className="px-3 py-2.5 text-right">ชำระแล้ว</th>
                                  <th className="px-3 py-2.5 text-right">ยอดค้างชำระ</th>
                                  <th className="px-3 py-2.5 text-center">สถานะ</th>
                                  <th className="px-3 py-2.5 text-right">จัดการ</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-slate-700">
                                {prop.overduePayments.map((p) => {
                                  const days = calculateDaysOverdue(p.due_date)
                                  const balance = Number(p.balance_amount) || 0

                                  return (
                                    <tr
                                      key={p.id}
                                      className="hover:bg-rose-50/30 transition-colors"
                                    >
                                      {/* Billing Period */}
                                      <td className="px-3 py-2.5 font-bold text-slate-900 whitespace-nowrap">
                                        <Link
                                          href={`/rent-payments/${p.id}`}
                                          className="text-primary-600 hover:underline flex items-center gap-1"
                                        >
                                          <Calendar className="h-3 w-3 text-slate-400" />
                                          {p.billing_period}
                                        </Link>
                                      </td>

                                      {/* Due Date */}
                                      <td className="px-3 py-2.5 whitespace-nowrap text-slate-600">
                                        {new Date(p.due_date).toLocaleDateString('th-TH')}
                                      </td>

                                      {/* Days Overdue */}
                                      <td className="px-3 py-2.5 whitespace-nowrap">
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded px-1.5 py-0.5">
                                          <Clock className="h-2.5 w-2.5" />
                                          เลยกำหนด {days} วัน
                                        </span>
                                      </td>

                                      {/* Net Amount */}
                                      <td className="px-3 py-2.5 text-right font-medium text-slate-800 whitespace-nowrap">
                                        ฿{Number(p.net_amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                      </td>

                                      {/* Paid Amount */}
                                      <td className="px-3 py-2.5 text-right text-emerald-600 whitespace-nowrap">
                                        ฿{Number(p.amount_paid).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                      </td>

                                      {/* Balance */}
                                      <td className="px-3 py-2.5 text-right font-bold text-rose-600 whitespace-nowrap">
                                        ฿{balance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                      </td>

                                      {/* Status */}
                                      <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                        <Badge
                                          variant="outline"
                                          className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-semibold"
                                        >
                                          {getPaymentStatusLabel('overdue')}
                                        </Badge>
                                      </td>

                                      {/* Action */}
                                      <td className="px-3 py-2.5 text-right whitespace-nowrap">
                                        <Button
                                          asChild
                                          variant="outline"
                                          size="sm"
                                          className="h-7 px-2.5 text-xs text-rose-700 bg-rose-50/60 border-rose-200 hover:bg-rose-100"
                                        >
                                          <Link href={`/rent-payments/${p.id}`}>
                                            บันทึกการชำระ / สลิป
                                            <ExternalLink className="ml-1 h-3 w-3" />
                                          </Link>
                                        </Button>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          VIEW MODE 2: List by Overdue Installments (Flat Table)
          ======================================================== */}
      {viewMode === 'by_installment' && (
        <div className="space-y-4">
          {filteredOverdueInstallments.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                ไม่พบงวดค้างชำระตามเงื่อนไข
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                ไม่พบรายการงวดที่ค้างชำระที่ตรงกับตัวกรองที่เลือก
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                    <tr>
                      <th className="px-4 py-3">งวดเดือน</th>
                      <th className="px-4 py-3">บ้าน / สาขา & สัญญา</th>
                      <th className="px-4 py-3">ประเภท</th>
                      <th className="px-4 py-3">คู่สัญญา</th>
                      <th className="px-4 py-3">วันครบกำหนด & ล่าช้า</th>
                      <th className="px-4 py-3 text-right">ยอดที่ต้องชำระ</th>
                      <th className="px-4 py-3 text-right">ชำระแล้ว</th>
                      <th className="px-4 py-3 text-right">ยอดคงค้าง</th>
                      <th className="px-4 py-3 text-center">สถานะ</th>
                      <th className="px-4 py-3 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredOverdueInstallments.map((p) => {
                      const contract = p.rental_contracts
                      const isHouse = isHouseRecord(contract)
                      const days = calculateDaysOverdue(p.due_date)
                      const balance = Number(p.balance_amount) || 0

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                            <Link
                              href={`/rent-payments/${p.id}`}
                              className="text-primary-600 hover:underline"
                            >
                              {p.billing_period}
                            </Link>
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              {isHouse ? (
                                <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0">
                                  🏠 บ้าน
                                </Badge>
                              ) : (
                                <Badge className="bg-sky-50 text-sky-700 border-sky-200 text-[10px] px-1.5 py-0">
                                  🏢 สาขา
                                </Badge>
                              )}
                              <span className="font-semibold text-slate-800">
                                {contract?.locations?.location_name || '-'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {contract ? (
                                <Link
                                  href={`/contracts/${contract.id}`}
                                  className="hover:text-primary-600 hover:underline"
                                >
                                  {contract.contract_no}
                                </Link>
                              ) : (
                                '-'
                              )}
                              {contract?.locations?.province && ` (${contract.locations.province})`}
                            </div>
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium ${
                                p.payment_type === 'payable'
                                  ? 'bg-indigo-50 text-indigo-700'
                                  : 'bg-teal-50 text-teal-700'
                              }`}
                            >
                              {p.payment_type === 'payable' ? 'จ่ายเจ้าของ' : 'รับจากลูกค้า'}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            {contract?.landlords ? (
                              <div>
                                <span className="text-slate-800 font-medium block truncate max-w-[140px]">
                                  {contract.landlords.name || contract.landlords.company_name}
                                </span>
                                {contract.landlords.phone && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {contract.landlords.phone}
                                  </span>
                                )}
                              </div>
                            ) : contract?.customers ? (
                              <div>
                                <span className="text-slate-800 font-medium block truncate max-w-[140px]">
                                  {contract.customers.name || contract.customers.company_name}
                                </span>
                                {contract.customers.phone && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {contract.customers.phone}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-slate-700 font-medium">
                              {new Date(p.due_date).toLocaleDateString('th-TH')}
                            </div>
                            <span className="text-[10px] text-rose-600 font-semibold">
                              เลยกำหนด {days} วัน
                            </span>
                          </td>

                          <td className="px-4 py-3 text-right font-bold text-slate-900 whitespace-nowrap">
                            ฿{Number(p.net_amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </td>

                          <td className="px-4 py-3 text-right text-emerald-600 font-medium whitespace-nowrap">
                            ฿{Number(p.amount_paid).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </td>

                          <td className="px-4 py-3 text-right font-bold text-rose-600 whitespace-nowrap">
                            ฿{balance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </td>

                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <Badge
                              variant="outline"
                              className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] font-medium"
                            >
                              {getPaymentStatusLabel('overdue')}
                            </Badge>
                          </td>

                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="h-7 px-2.5 text-xs text-rose-700 bg-rose-50/50 border-rose-200 hover:bg-rose-100"
                            >
                              <Link href={`/rent-payments/${p.id}`}>
                                บันทึกการจ่าย
                                <ExternalLink className="ml-1 h-3 w-3" />
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          VIEW MODE 3: All Installments (Full Schedule Audit)
          ======================================================== */}
      {viewMode === 'all_periods' && (
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
            <span>
              ℹ️ หน้านี้แสดงงวดชำระทั้งหมดในระบบ ({filteredAllInstallments.length} รายการ) ทั้งงวดที่ชำระแล้ว งวดรอชำระในอนาคต และงวดค้างชำระ
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setViewMode('by_property')}
              className="text-xs h-7 bg-white text-primary-700 border-primary-200 hover:bg-primary-50"
            >
              กลับไปดูเฉพาะที่ค้างชำระ
            </Button>
          </div>

          {filteredAllInstallments.length === 0 ? (
            <EmptyState
              title={t.common.noData}
              message={t.common.noDataDesc}
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                    <tr>
                      <th className="px-4 py-3">{t.payments.paymentMonth}</th>
                      <th className="px-4 py-3">{t.contracts.title} & {t.locations.title}</th>
                      <th className="px-4 py-3">{t.common.status}</th>
                      <th className="px-4 py-3">{t.landlords.title} / {t.customers.title}</th>
                      <th className="px-4 py-3">{t.payments.dueDate}</th>
                      <th className="px-4 py-3 text-right">{t.payments.amount}</th>
                      <th className="px-4 py-3 text-right">{t.payments.paidAmount}</th>
                      <th className="px-4 py-3 text-right">{t.payments.remainingAmount}</th>
                      <th className="px-4 py-3 text-center">{t.common.status}</th>
                      <th className="px-4 py-3 text-right">{t.common.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredAllInstallments.map((p) => {
                      const effectiveStatus = getEffectivePaymentStatus(p)
                      const badgeVariant =
                        PAYMENT_STATUS_BADGE_VARIANTS[effectiveStatus] || {
                          bg: 'bg-slate-100',
                          text: 'text-slate-600',
                          border: 'border-slate-200',
                        }

                      const contract = p.rental_contracts
                      const balance = Number(p.balance_amount) || 0

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                            <Link
                              href={`/rent-payments/${p.id}`}
                              className="text-primary-600 hover:underline"
                            >
                              {p.billing_period}
                            </Link>
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-800">
                              {contract ? (
                                <Link
                                  href={`/contracts/${contract.id}`}
                                  className="hover:text-primary-600 hover:underline"
                                >
                                  {contract.contract_no}
                                </Link>
                              ) : (
                                '-'
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[160px]">
                              {contract?.locations?.location_name} ({contract?.locations?.province})
                            </div>
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium ${
                                p.payment_type === 'payable'
                                  ? 'bg-indigo-50 text-indigo-700'
                                  : 'bg-teal-50 text-teal-700'
                              }`}
                            >
                              {p.payment_type === 'payable' ? 'จ่ายเจ้าของ' : 'รับจากลูกค้า'}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            {contract?.landlords ? (
                              <div>
                                <span className="text-slate-800 font-medium block truncate max-w-[140px]">
                                  {contract.landlords.name || contract.landlords.company_name}
                                </span>
                                {contract.landlords.bank_account_number && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {contract.landlords.bank_name || 'ธ.'}{' '}
                                    {contract.landlords.bank_account_number}
                                  </span>
                                )}
                              </div>
                            ) : contract?.customers ? (
                              <div>
                                <span className="text-slate-800 font-medium block truncate max-w-[140px]">
                                  {contract.customers.name || contract.customers.company_name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                            {new Date(p.due_date).toLocaleDateString('th-TH')}
                          </td>

                          <td className="px-4 py-3 text-right font-bold text-slate-900 whitespace-nowrap">
                            ฿{Number(p.net_amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </td>

                          <td className="px-4 py-3 text-right text-emerald-600 font-medium whitespace-nowrap">
                            ฿{Number(p.amount_paid).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </td>

                          <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">
                            <span className={balance > 0 ? 'text-rose-600' : 'text-slate-400'}>
                              ฿{balance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <Badge
                              variant="outline"
                              className={`${badgeVariant.bg} ${badgeVariant.text} ${badgeVariant.border} text-[10px] font-medium`}
                            >
                              {getPaymentStatusLabel(effectiveStatus)}
                            </Badge>
                          </td>

                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="h-7 px-2.5 text-xs text-primary-700 bg-primary-50/50 border-primary-200 hover:bg-primary-100"
                            >
                              <Link href={`/rent-payments/${p.id}`}>
                                {t.payments.recordPayment}
                                <ExternalLink className="ml-1 h-3 w-3" />
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
