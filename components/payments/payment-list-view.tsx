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

import { useI18n } from '@/lib/i18n/context'

interface PaymentListViewProps {
  payments: RentPaymentWithRelations[]
  userRole?: UserRole
}

type TabType = 'all' | 'payable' | 'receivable' | 'overdue' | 'paid'

export function PaymentListView({ payments }: PaymentListViewProps) {
  const { t, locale } = useI18n()
  const intlLocale = locale === 'en' ? 'en-US' : locale === 'my' ? 'my-MM' : 'th-TH'

  const [activeTab, setActiveTab] = React.useState<TabType>('all')
  const [searchTerm, setSearchTerm] = React.useState('')
  const [periodFilter, setPeriodFilter] = React.useState<string>('all')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')

  const getPaymentStatusLabel = (status: string): string => {
    const map: Record<string, string> = {
      pending: t.payments.statuses.pending,
      partial: t.payments.statuses.partial,
      overdue: t.payments.statuses.overdue,
      paid: t.payments.statuses.paid,
    }
    return map[status] ?? (PAYMENT_STATUS_LABELS[status as RentPaymentStatus] || status)
  }

  // Extract distinct billing periods
  const billingPeriods = React.useMemo(() => {
    const set = new Set<string>()
    payments.forEach((p) => {
      if (p.billing_period) set.add(p.billing_period)
    })
    return Array.from(set).sort().reverse()
  }, [payments])

  // KPIs
  const kpis = React.useMemo(() => {
    let overdueTotal = 0
    let overdueCount = 0
    let payableTotal = 0
    let receivableTotal = 0
    let paidTotal = 0

    payments.forEach((p) => {
      const net = Number(p.net_amount) || 0
      const balance = Number(p.balance_amount) || 0
      const paid = Number(p.amount_paid) || 0
      const effStatus = getEffectivePaymentStatus(p)

      if (effStatus === 'overdue') {
        overdueTotal += balance
        overdueCount += 1
      }

      if (p.payment_type === 'payable') {
        payableTotal += net
      } else {
        receivableTotal += net
      }

      paidTotal += paid
    })

    return { overdueTotal, overdueCount, payableTotal, receivableTotal, paidTotal }
  }, [payments])

  // Filtered payments
  const filteredPayments = React.useMemo(() => {
    return payments.filter((p) => {
      const effStatus = getEffectivePaymentStatus(p)

      // 1. Tab filter
      if (activeTab === 'payable' && p.payment_type !== 'payable') return false
      if (activeTab === 'receivable' && p.payment_type !== 'receivable') return false
      if (activeTab === 'overdue' && effStatus !== 'overdue') return false
      if (activeTab === 'paid' && effStatus !== 'paid') return false

      // 2. Billing Period filter
      if (periodFilter !== 'all' && p.billing_period !== periodFilter) {
        return false
      }

      // 3. Status filter
      if (statusFilter !== 'all' && effStatus !== statusFilter) {
        return false
      }

      // 4. Search term
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
  }, [payments, activeTab, periodFilter, statusFilter, searchTerm])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t.payments.title}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t.payments.subtitle}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700">{t.payments.statuses.overdue}</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-xl font-bold text-rose-700 mt-2">
            ฿{kpis.overdueTotal.toLocaleString(intlLocale, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-rose-600">{kpis.overdueCount} {t.common.items}</span>
        </div>

        <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-700">{t.payments.statuses.pending}</span>
            <ArrowUpRight className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="text-xl font-bold text-indigo-700 mt-2">
            ฿{kpis.payableTotal.toLocaleString(intlLocale, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-indigo-600">{t.landlords.title}</span>
        </div>

        <div className="bg-teal-50/60 border border-teal-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-teal-700">{t.customers.title}</span>
            <ArrowDownLeft className="h-4 w-4 text-teal-500" />
          </div>
          <p className="text-xl font-bold text-teal-700 mt-2">
            ฿{kpis.receivableTotal.toLocaleString(intlLocale, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-teal-600">{t.customers.title}</span>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">{t.payments.statuses.paid}</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-emerald-700 mt-2">
            ฿{kpis.paidTotal.toLocaleString(intlLocale, { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-emerald-600">{t.payments.statuses.paid}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'all'
              ? 'border-primary-600 text-primary-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t.common.all} ({payments.length})
        </button>

        <button
          onClick={() => setActiveTab('payable')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'payable'
              ? 'border-indigo-600 text-indigo-700 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t.landlords.title} ({payments.filter((p) => p.payment_type === 'payable').length})
        </button>

        <button
          onClick={() => setActiveTab('receivable')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'receivable'
              ? 'border-teal-600 text-teal-700 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t.customers.title} ({payments.filter((p) => p.payment_type === 'receivable').length})
        </button>

        <button
          onClick={() => setActiveTab('overdue')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'overdue'
              ? 'border-rose-600 text-rose-700 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t.payments.statuses.overdue} ({kpis.overdueCount})
        </button>

        <button
          onClick={() => setActiveTab('paid')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'paid'
              ? 'border-emerald-600 text-emerald-700 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          {t.payments.statuses.paid} ({payments.filter((p) => getEffectivePaymentStatus(p) === 'paid').length})
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={`${t.common.search} (${t.contracts.contractNumber}, ${t.locations.title})...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>

        {billingPeriods.length > 0 && (
          <select
            aria-label="Filter billing period"
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">{t.common.all} ({t.payments.paymentMonth})</option>
            {billingPeriods.map((bp) => (
              <option key={bp} value={bp}>
                {bp}
              </option>
            ))}
          </select>
        )}

        <select
          aria-label="Filter payment status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">{t.common.all} ({t.common.status})</option>
          {Object.entries(PAYMENT_STATUS_LABELS).map(([val]) => (
            <option key={val} value={val}>
              {getPaymentStatusLabel(val)}
            </option>
          ))}
        </select>
      </div>

      {/* Payments Table */}
      {filteredPayments.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            title={t.common.noData}
            message={t.common.noDataDesc}
          />
          <div className="flex justify-center">
            <Button asChild className="bg-primary-600 hover:bg-primary-700 text-white">
              <Link href="/contracts">{t.contracts.title}</Link>
            </Button>
          </div>
        </div>
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
                {filteredPayments.map((p) => {
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
                      {/* Period */}
                      <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                        <Link
                          href={`/rent-payments/${p.id}`}
                          className="text-primary-600 hover:underline"
                        >
                          {p.billing_period}
                        </Link>
                      </td>

                      {/* Contract & Location */}
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

                      {/* Type */}
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

                      {/* Counterparty */}
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

                      {/* Due Date */}
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        {new Date(p.due_date).toLocaleDateString('th-TH')}
                      </td>

                      {/* Net */}
                      <td className="px-4 py-3 text-right font-bold text-slate-900 whitespace-nowrap">
                        ฿{Number(p.net_amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Amount Paid */}
                      <td className="px-4 py-3 text-right text-emerald-600 font-medium whitespace-nowrap">
                        ฿{Number(p.amount_paid).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Balance */}
                      <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">
                        <span className={balance > 0 ? 'text-rose-600' : 'text-slate-400'}>
                          ฿{balance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`${badgeVariant.bg} ${badgeVariant.text} ${badgeVariant.border} text-[10px] font-medium`}
                        >
                          {getPaymentStatusLabel(effectiveStatus)}
                        </Badge>
                      </td>

                      {/* Action */}
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
  )
}
