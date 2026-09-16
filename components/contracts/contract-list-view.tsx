'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  Eye,
  Trash2,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import type { ContractWithRelations, ContractStatus } from '@/lib/types/contracts-payments'
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_BADGE_VARIANTS,
} from '@/lib/types/contracts-payments'
import type { UserRole } from '@/lib/types/auth'
import { canWrite, hasFullAccess } from '@/lib/auth/permissions'
import { deleteContractAction } from '@/lib/actions/contracts'

interface ContractListViewProps {
  contracts: ContractWithRelations[]
  userRole: UserRole
}

export function ContractListView({ contracts, userRole }: ContractListViewProps) {
  const router = useRouter()
  const allowWrite = canWrite(userRole)
  const allowDelete = hasFullAccess(userRole)

  const [searchTerm, setSearchTerm] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)

  // KPI Metrics
  const stats = React.useMemo(() => {
    const total = contracts.length
    const active = contracts.filter((c) => c.status === 'active').length
    const pending = contracts.filter((c) => ['draft', 'negotiating', 'agreed'].includes(c.status)).length
    const expiringOrExpired = contracts.filter((c) => ['expiring', 'expired'].includes(c.status)).length
    const totalRent = contracts
      .filter((c) => c.status === 'active')
      .reduce((sum, c) => sum + (Number(c.monthly_rent) || 0), 0)

    return { total, active, pending, expiringOrExpired, totalRent }
  }, [contracts])

  // Filtered List
  const filteredContracts = React.useMemo(() => {
    return contracts.filter((c) => {
      // 1. Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const contractNo = c.contract_no?.toLowerCase() || ''
        const locName = c.locations?.location_name?.toLowerCase() || ''
        const locCode = c.locations?.location_code?.toLowerCase() || ''
        const custName = c.customers?.name?.toLowerCase() || c.customers?.company_name?.toLowerCase() || ''
        const landName = c.landlords?.name?.toLowerCase() || c.landlords?.company_name?.toLowerCase() || ''

        const match =
          contractNo.includes(term) ||
          locName.includes(term) ||
          locCode.includes(term) ||
          custName.includes(term) ||
          landName.includes(term)

        if (!match) return false
      }

      // 2. Status filter
      if (statusFilter !== 'all' && c.status !== statusFilter) {
        return false
      }

      return true
    })
  }, [contracts, searchTerm, statusFilter])

  const handleDelete = async () => {
    if (!deletingId) return
    setIsDeleting(true)
    setDeleteError(null)

    const res = await deleteContractAction(deletingId)
    setIsDeleting(false)

    if (res.success) {
      setDeletingId(null)
      router.refresh()
    } else {
      setDeleteError(res.error || 'เกิดข้อผิดพลาดในการลบสัญญา')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            สัญญาเช่า (Rental Contracts)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            จัดการสัญญาเช่าสาขาและพื้นที่ คำนวณภาษีหัก ณ ที่จ่าย และเงื่อนไขการเช่า
          </p>
        </div>

        {allowWrite && (
          <Button asChild className="bg-primary-600 hover:bg-primary-700 text-white shrink-0">
            <Link href="/contracts/new">
              <Plus className="mr-2 h-4 w-4" />
              สร้างสัญญาเช่าใหม่
            </Link>
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">สัญญาทั้งหมด</span>
            <FileText className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.total}</p>
          <span className="text-xs text-slate-400">ฉบับในระบบ</span>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700">มีผลบังคับใช้ (Active)</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">{stats.active}</p>
          <span className="text-xs text-emerald-600">
            ค่าเช่ารวม ฿{stats.totalRent.toLocaleString('th-TH')}/ด.
          </span>
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700">ร่าง / อยู่ระหว่างเจรจา</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2">{stats.pending}</p>
          <span className="text-xs text-amber-600">รอดำเนินการ</span>
        </div>

        <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-700">ใกล้หมด / หมดอายุ</span>
            <AlertCircle className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-700 mt-2">{stats.expiringOrExpired}</p>
          <span className="text-xs text-rose-600">ต้องตรวจสอบต่อสัญญา</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="ค้นหาเลขที่สัญญา, สถานที่, ผู้เช่า หรือผู้ให้เช่า..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            aria-label="กรองสถานะสัญญา"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">สถานะทั้งหมด</option>
            {Object.entries(CONTRACT_STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Delete Error Alert */}
      {deleteError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm flex items-center justify-between">
          <span>{deleteError}</span>
          <button
            onClick={() => setDeleteError(null)}
            className="text-rose-500 hover:text-rose-700 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Contract List / Table */}
      {filteredContracts.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            title="ไม่พบข้อมูลสัญญาเช่า"
            message={
              searchTerm || statusFilter !== 'all'
                ? 'ไม่พบสัญญาที่ตรงกับเงื่อนไขการค้นหา ลองปรับตัวกรองใหม่'
                : 'ยังไม่มีสัญญาเช่าในระบบ เริ่มต้นสร้างสัญญาเช่าฉบับแรกได้เลย'
            }
          />
          {allowWrite && (
            <div className="flex justify-center">
              <Button asChild className="bg-primary-600 hover:bg-primary-700 text-white">
                <Link href="/contracts/new">
                  <Plus className="mr-2 h-4 w-4" />
                  สร้างสัญญาเช่าใหม่
                </Link>
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">เลขที่สัญญา</th>
                  <th className="px-4 py-3">สถานที่ / สาขา</th>
                  <th className="px-4 py-3">คู่สัญญา</th>
                  <th className="px-4 py-3">ระยะเวลาสัญญา</th>
                  <th className="px-4 py-3 text-right">ค่าเช่าต่อเดือน</th>
                  <th className="px-4 py-3 text-center">หัก ณ ที่จ่าย</th>
                  <th className="px-4 py-3 text-center">สถานะ</th>
                  <th className="px-4 py-3 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredContracts.map((contract) => {
                  const badgeVariant =
                    CONTRACT_STATUS_BADGE_VARIANTS[contract.status as ContractStatus] || {
                      bg: 'bg-slate-100',
                      text: 'text-slate-600',
                      border: 'border-slate-200',
                    }

                  return (
                    <tr key={contract.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Contract No */}
                      <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                        <Link
                          href={`/contracts/${contract.id}`}
                          className="text-primary-600 hover:text-primary-700 font-semibold hover:underline"
                        >
                          {contract.contract_no}
                        </Link>
                        {contract.contract_date && (
                          <div className="text-xs text-slate-400">
                            ทำสัญญา {new Date(contract.contract_date).toLocaleDateString('th-TH')}
                          </div>
                        )}
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">
                          {contract.locations?.location_name || '-'}
                        </div>
                        <div className="text-xs text-slate-400">
                          {contract.locations?.province}
                          {contract.locations?.location_code
                            ? ` (${contract.locations.location_code})`
                            : ''}
                        </div>
                      </td>

                      {/* Party (Landlord or Customer) */}
                      <td className="px-4 py-3">
                        {contract.landlords ? (
                          <div>
                            <span className="text-xs text-indigo-600 font-semibold uppercase block">
                              ผู้ให้เช่า
                            </span>
                            <span className="text-slate-800">
                              {contract.landlords.name || contract.landlords.company_name}
                            </span>
                          </div>
                        ) : contract.customers ? (
                          <div>
                            <span className="text-xs text-teal-600 font-semibold uppercase block">
                              ผู้เช่า
                            </span>
                            <span className="text-slate-800">
                              {contract.customers.name || contract.customers.company_name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Duration */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">
                        {contract.start_date && contract.end_date ? (
                          <>
                            <div>
                              เริ่ม: {new Date(contract.start_date).toLocaleDateString('th-TH')}
                            </div>
                            <div>
                              ถึง: {new Date(contract.end_date).toLocaleDateString('th-TH')}
                            </div>
                          </>
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* Monthly Rent */}
                      <td className="px-4 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">
                        ฿{Number(contract.monthly_rent).toLocaleString('th-TH')}
                        {Number(contract.other_service_amount) > 0 && (
                          <div className="text-xs font-normal text-slate-400">
                            +บริการ ฿
                            {Number(contract.other_service_amount).toLocaleString('th-TH')}
                          </div>
                        )}
                      </td>

                      {/* WHT */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {contract.wht_enabled ? (
                          <span className="inline-flex items-center rounded-md bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-700/10">
                            {contract.wht_rate}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">ไม่มี</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`${badgeVariant.bg} ${badgeVariant.text} ${badgeVariant.border} text-xs font-medium`}
                        >
                          {CONTRACT_STATUS_LABELS[contract.status as ContractStatus] || contract.status}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-slate-500 hover:text-primary-600"
                            title="ดูรายละเอียด"
                          >
                            <Link href={`/contracts/${contract.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>

                          {allowDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingId(contract.id)}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600"
                              title="ลบสัญญา"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(deletingId)}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="ยืนยันการลบสัญญาเช่า"
        description="คุณแน่ใจหรือไม่ว่าต้องการลบสัญญานี้? ข้อมูลนี้จะไม่สามารถกู้คืนได้ และหากมีงวดชำระเงินผูกอยู่จะไม่สามารถลบได้"
        confirmText="ยืนยันลบ"
        cancelText="ยกเลิก"
        variant="danger"
        loading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
