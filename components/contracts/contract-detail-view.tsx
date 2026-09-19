'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  CreditCard,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Landmark,
  Building2,
  Building,
  Home,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import type {
  ContractWithRelations,
  ContractStatus,
  RentPaymentStatus,
} from '@/lib/types/contracts-payments'
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_BADGE_VARIANTS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_BADGE_VARIANTS,
  getEffectivePaymentStatus,
} from '@/lib/types/contracts-payments'
import type { UserRole } from '@/lib/types/auth'
import { canWrite, hasFullAccess } from '@/lib/auth/permissions'
import {
  deleteContractAction,
  generatePaymentScheduleAction,
} from '@/lib/actions/contracts'
import { DocumentSection } from '@/components/documents/document-section'

interface ContractDetailViewProps {
  contract: ContractWithRelations
  userRole: UserRole
}

export function ContractDetailView({ contract, userRole }: ContractDetailViewProps) {
  const router = useRouter()
  const allowWrite = canWrite(userRole)
  const allowDelete = hasFullAccess(userRole)

  const [isDeleting, setIsDeleting] = React.useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [generateMsg, setGenerateMsg] = React.useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const badgeVariant =
    CONTRACT_STATUS_BADGE_VARIANTS[contract.status as ContractStatus] || {
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: 'border-slate-200',
    }

  const rentAmount = Number(contract.monthly_rent) || 0
  const serviceAmount = Number(contract.other_service_amount) || 0
  const grossMonthly = rentAmount + serviceAmount
  const whtRate = Number(contract.wht_rate) || 0
  const whtMonthly = contract.wht_enabled
    ? Math.round(rentAmount * (whtRate / 100) * 100) / 100
    : 0
  const netMonthly = grossMonthly - whtMonthly

  const payments = contract.rent_payments || []

  // Payments summary
  const paidCount = payments.filter((p) => getEffectivePaymentStatus(p) === 'paid').length
  const overdueCount = payments.filter((p) => getEffectivePaymentStatus(p) === 'overdue').length
  const pendingCount = payments.filter((p) => ['pending', 'partial'].includes(getEffectivePaymentStatus(p))).length

  const handleDelete = async () => {
    setIsDeleting(true)
    const res = await deleteContractAction(contract.id)
    setIsDeleting(false)

    if (res.success) {
      router.push('/contracts')
      router.refresh()
    } else {
      setGenerateMsg({ type: 'error', text: res.error || 'เกิดข้อผิดพลาดในการลบสัญญา' })
      setShowDeleteConfirm(false)
    }
  }

  const handleGenerateSchedule = async () => {
    setIsGenerating(true)
    setGenerateMsg(null)

    const res = await generatePaymentScheduleAction(contract.id)
    setIsGenerating(false)

    if (res.success) {
      setGenerateMsg({
        type: 'success',
        text: `สร้างงวดการชำระเงินเรียบร้อยแล้ว จำนวน ${res.count || 0} งวด`,
      })
      router.refresh()
    } else {
      setGenerateMsg({
        type: 'error',
        text: res.error || 'เกิดข้อผิดพลาดในการสร้างงวดค่าเช่า',
      })
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="h-9 w-9 p-0">
            <Link href="/contracts">
              <ArrowLeft className="h-5 w-5 text-slate-500" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {contract.contract_no}
              </h1>
              <Badge
                variant="outline"
                className={`${badgeVariant.bg} ${badgeVariant.text} ${badgeVariant.border} text-xs font-semibold`}
              >
                {CONTRACT_STATUS_LABELS[contract.status as ContractStatus] || contract.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              สถานที่: {contract.locations?.location_name || '-'} ({contract.locations?.province})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {allowWrite && ['agreed', 'active'].includes(contract.status) && (
            <Button asChild size="sm" className="bg-primary-600 hover:bg-primary-700 text-white">
              <Link href="/opening">
                <Building2 className="mr-1.5 h-3.5 w-3.5" />
                โครงการเปิดสาขา
              </Link>
            </Button>
          )}

          {allowWrite && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/contracts/${contract.id}/edit`}>
                <Edit className="mr-2 h-4 w-4 text-slate-500" />
                แก้ไขสัญญา
              </Link>
            </Button>
          )}

          {allowDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              ลบสัญญา
            </Button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {generateMsg && (
        <div
          className={`p-4 rounded-lg text-sm flex items-center justify-between ${
            generateMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{generateMsg.text}</span>
          <button
            onClick={() => setGenerateMsg(null)}
            className="font-bold ml-2 text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* Financial Highlight Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">ค่าเช่าต่อเดือน</span>
          <p className="text-xl font-bold text-slate-900 mt-1">
            ฿{rentAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </p>
          {serviceAmount > 0 && (
            <span className="text-xs text-slate-400">
              + บริการ ฿{serviceAmount.toLocaleString('th-TH')}
            </span>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">ภาษีหัก ณ ที่จ่าย</span>
          <p className="text-xl font-bold text-sky-700 mt-1">
            {contract.wht_enabled ? `${whtRate}%` : 'ไม่มี'}
          </p>
          <span className="text-xs text-slate-400">
            {contract.wht_enabled
              ? `- ฿${whtMonthly.toLocaleString('th-TH', { minimumFractionDigits: 2 })}/ด.`
              : 'ไม่ได้หักภาษี'}
          </span>
        </div>

        <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 shadow-sm">
          <span className="text-xs font-medium text-emerald-700">ยอดสุทธิต่อเดือน (Net)</span>
          <p className="text-xl font-bold text-emerald-700 mt-1">
            ฿{netMonthly.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-emerald-600">
            กำหนดชำระทุกวันที่ {contract.payment_due_day || 5}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500">เงินมัดจำ / ล่วงหน้า</span>
          <p className="text-xl font-bold text-slate-900 mt-1">
            ฿
            {(
              Number(contract.deposit_amount || 0) + Number(contract.advance_rent_amount || 0)
            ).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-xs text-slate-400">
            มัดจำ ฿{Number(contract.deposit_amount || 0).toLocaleString('th-TH')}
          </span>
        </div>
      </div>

      {/* Two Column Layout: Contract Info & Parties */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: General & Duration */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary-600" />
            ข้อมูลระยะเวลาสัญญาและสถานที่
          </h2>

          <div className="grid grid-cols-2 gap-y-3 text-xs">
            <div>
              <span className="text-slate-400 block">วันที่ทำสัญญา:</span>
              <span className="font-medium text-slate-800">
                {contract.contract_date
                  ? new Date(contract.contract_date).toLocaleDateString('th-TH')
                  : '-'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block">กำหนดชำระเงิน:</span>
              <span className="font-medium text-slate-800">
                ทุกวันที่ {contract.payment_due_day || 5} ของเดือน
              </span>
            </div>

            <div>
              <span className="text-slate-400 block">วันเริ่มต้นสัญญา:</span>
              <span className="font-medium text-emerald-700 font-semibold">
                {contract.start_date
                  ? new Date(contract.start_date).toLocaleDateString('th-TH')
                  : '-'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block">วันสิ้นสุดสัญญา:</span>
              <span className="font-medium text-rose-700 font-semibold">
                {contract.end_date
                  ? new Date(contract.end_date).toLocaleDateString('th-TH')
                  : '-'}
              </span>
            </div>

            <div className="col-span-2 pt-2 border-t border-slate-100">
              <span className="text-slate-400 block">สถานที่ / สาขา:</span>
              <span className="font-medium text-slate-900 text-sm">
                {contract.locations?.location_name}
              </span>
              <span className="text-slate-500 block">
                รหัส: {contract.locations?.location_code} | จังหวัด:{' '}
                {contract.locations?.province} {contract.locations?.district}
              </span>
            </div>

            {contract.rental_leads && (
              <div className="col-span-2 pt-2 border-t border-slate-100">
                <span className="text-slate-400 block">ลีดที่เกี่ยวข้อง:</span>
                <Link
                  href={`/rental-leads/${contract.rental_leads.id}`}
                  className="text-primary-600 hover:underline flex items-center gap-1 font-medium"
                >
                  [{contract.rental_leads.lead_no}] {contract.rental_leads.lead_name}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right: Parties & Branch Setup */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Landmark className="h-4 w-4 text-primary-600" />
            ข้อมูลคู่สัญญา & การเปิดสาขา
          </h2>

          <div className="space-y-3 text-xs">
            {contract.landlords && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold text-indigo-700 uppercase block mb-1">
                  ผู้ให้เช่า (Landlord)
                </span>
                <p className="font-medium text-slate-900">
                  {contract.landlords.name || contract.landlords.company_name}
                </p>
                {contract.landlords.phone && (
                  <p className="text-slate-500">โทร: {contract.landlords.phone}</p>
                )}
                {contract.landlords.bank_account_number && (
                  <p className="text-slate-600 font-mono mt-1">
                    บัญชี: {contract.landlords.bank_name || 'ธนาคาร'}{' '}
                    {contract.landlords.bank_account_number}
                  </p>
                )}
              </div>
            )}

            {contract.customers && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold text-teal-700 uppercase block mb-1">
                  ลูกค้า / ผู้เช่า (Customer)
                </span>
                <p className="font-medium text-slate-900">
                  {contract.customers.name || contract.customers.company_name}
                </p>
                {contract.customers.phone && (
                  <p className="text-slate-500">โทร: {contract.customers.phone}</p>
                )}
              </div>
            )}

            {/* Registration Checklist */}
            {(() => {
              const TM30_TAG = '[แจ้งที่พักอาศัยคนต่างด้าว (ตม.30)]'
              const hasForeignResident =
                contract.note?.includes(TM30_TAG) ||
                contract.note?.includes('แจ้งที่พักอาศัยคนต่างด้าว')
              const cleanNote = contract.note
                ? contract.note.replace(new RegExp(`\\s*\\${TM30_TAG}\\s*`, 'g'), '').trim()
                : ''

              return (
                <>
                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    <span className="text-slate-700 font-semibold block text-xs uppercase tracking-wider">
                      รายการที่ต้องดำเนินการทางทะเบียน & เอกสาร:
                    </span>

                    {/* สำหรับสาขา */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                        <Building className="h-3.5 w-3.5" />
                        <span>สำหรับสาขา / สถานประกอบการ</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pl-2 border-l-2 border-slate-100">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs ${
                            contract.need_branch_registration ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              contract.need_branch_registration ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                          />
                          จดทะเบียนสาขา
                        </span>

                        <span
                          className={`inline-flex items-center gap-1.5 text-xs ${
                            contract.need_vat_registration ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              contract.need_vat_registration ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                          />
                          จดทะเบียน VAT
                        </span>

                        <span
                          className={`inline-flex items-center gap-1.5 text-xs ${
                            contract.need_employer_change ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              contract.need_employer_change ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                          />
                          เปลี่ยนนายจ้าง
                        </span>

                        <span
                          className={`inline-flex items-center gap-1.5 text-xs ${
                            contract.need_signboard ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              contract.need_signboard ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                          />
                          ป้ายโฆษณา/สาขา
                        </span>
                      </div>
                    </div>

                    {/* สำหรับบ้าน */}
                    <div className="space-y-1.5 pt-1.5 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
                        <Home className="h-3.5 w-3.5 text-amber-600" />
                        <span>สำหรับบ้าน / ที่พักอาศัย</span>
                      </div>
                      <div className="pl-2 border-l-2 border-amber-200">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs ${
                            hasForeignResident ? 'text-amber-800 font-medium' : 'text-slate-400'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              hasForeignResident ? 'bg-amber-500' : 'bg-slate-300'
                            }`}
                          />
                          แจ้งที่พักอาศัยคนต่างด้าว (ตม.30)
                        </span>
                      </div>
                    </div>
                  </div>

                  {cleanNote && (
                    <div className="pt-2 border-t border-slate-100 text-slate-600">
                      <span className="text-slate-400 block mb-1">หมายเหตุ:</span>
                      <p className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 whitespace-pre-wrap text-xs">
                        {cleanNote}
                      </p>
                    </div>
                  )}
                </>
              )
            })()}
          </div>
        </div>
      </div>

      {/* Payment Schedule Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                ตารางงวดชำระค่าเช่า (Payment Schedule)
              </h2>
              <Badge variant="secondary" className="text-xs">
                {payments.length} งวด
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              งวดการชำระเงินตามระยะเวลาสัญญา ทั้งบริษัทจ่ายให้เจ้าของ หรือรับจากลูกค้า
            </p>
          </div>

          <div className="flex items-center gap-2">
            {allowWrite && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateSchedule}
                disabled={isGenerating}
                className="bg-primary-50 border-primary-200 text-primary-700 hover:bg-primary-100"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? 'กำลังสร้างงวด...' : 'สร้างงวดค่าเช่าอัตโนมัติ'}
              </Button>
            )}
          </div>
        </div>

        {/* Schedule Summary Tabs/Badges */}
        {payments.length > 0 && (
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              ชำระแล้ว: {paidCount} งวด
            </span>
            <span className="flex items-center gap-1.5 text-rose-700 font-medium">
              <AlertTriangle className="h-3.5 w-3.5" />
              ค้างชำระ: {overdueCount} งวด
            </span>
            <span className="flex items-center gap-1.5 text-blue-700 font-medium">
              <Clock className="h-3.5 w-3.5" />
              รอชำระ: {pendingCount} งวด
            </span>
          </div>
        )}

        {/* Payments Table */}
        {payments.length === 0 ? (
          <div className="p-8 text-center">
            <CreditCard className="mx-auto h-8 w-8 text-slate-300" />
            <h3 className="mt-2 text-sm font-semibold text-slate-800">
              ยังไม่มีงวดชำระในสัญญานี้
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              กดปุ่ม &quot;สร้างงวดค่าเช่าอัตโนมัติ&quot; ด้านบนเพื่อคำนวณและสร้างงวดตามระยะเวลาสัญญา {contract.start_date} ถึง {contract.end_date}
            </p>
            {allowWrite && (
              <Button
                size="sm"
                onClick={handleGenerateSchedule}
                disabled={isGenerating}
                className="mt-4 bg-primary-600 hover:bg-primary-700 text-white"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                สร้างงวดค่าเช่าอัตโนมัติ
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">งวดเดือน</th>
                  <th className="px-4 py-3">ประเภท</th>
                  <th className="px-4 py-3">วันครบกำหนด</th>
                  <th className="px-4 py-3 text-right">ยอดก่อนหัก (Gross)</th>
                  <th className="px-4 py-3 text-right">หัก ณ ที่จ่าย (WHT)</th>
                  <th className="px-4 py-3 text-right">ยอดสุทธิ (Net)</th>
                  <th className="px-4 py-3 text-right">ชำระแล้ว</th>
                  <th className="px-4 py-3 text-right">คงเหลือ</th>
                  <th className="px-4 py-3 text-center">สถานะ</th>
                  <th className="px-4 py-3 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {payments.map((p) => {
                  const effStatus = getEffectivePaymentStatus(p)
                  const pBadge =
                    PAYMENT_STATUS_BADGE_VARIANTS[effStatus] || {
                      bg: 'bg-slate-100',
                      text: 'text-slate-600',
                      border: 'border-slate-200',
                    }

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                        {p.billing_period}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${
                            p.payment_type === 'payable'
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'bg-teal-50 text-teal-700'
                          }`}
                        >
                          {p.payment_type === 'payable' ? 'จ่ายเจ้าของ' : 'รับจากลูกค้า'}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        {new Date(p.due_date).toLocaleDateString('th-TH')}
                      </td>

                      <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                        ฿{Number(p.gross_amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-4 py-3 text-right text-sky-700 whitespace-nowrap">
                        {Number(p.wht_amount) > 0
                          ? `-฿${Number(p.wht_amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`
                          : '-'}
                      </td>

                      <td className="px-4 py-3 text-right font-bold text-slate-900 whitespace-nowrap">
                        ฿{Number(p.net_amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-4 py-3 text-right text-emerald-600 font-medium whitespace-nowrap">
                        ฿{Number(p.amount_paid).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">
                        <span
                          className={
                            Number(p.balance_amount) > 0 ? 'text-rose-600' : 'text-slate-400'
                          }
                        >
                          ฿
                          {Number(p.balance_amount).toLocaleString('th-TH', {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`${pBadge.bg} ${pBadge.text} ${pBadge.border} text-[10px] font-medium`}
                        >
                          {PAYMENT_STATUS_LABELS[effStatus] || effStatus}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                        >
                          <Link href={`/rent-payments/${p.id}`}>
                            บันทึกชำระ / ดูสลิป
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
        )}
      </div>

      {/* Documents */}
      <DocumentSection
        entityType="contract"
        entityId={contract.id}
        userRole={userRole}
        defaultDocumentType="RENTAL_CONTRACT"
        title="เอกสารแนบ (Contract)"
      />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
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
