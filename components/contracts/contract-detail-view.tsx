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
  User,
  ClipboardList,
  CheckCheck,
  Loader2,
  CircleDashed,
  ArrowRight,
} from 'lucide-react'
import {
  parseLeadMetadata,
  calculateMonthlyInstallment,
  getContractPartyRole,
} from '@/lib/utils/lead-metadata'
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
  cleanupWrongPaymentTypesAction,
} from '@/lib/actions/contracts'
import { DocumentSection } from '@/components/documents/document-section'
import type { OpeningProjectWithRelations } from '@/lib/types/opening'
import {
  STAGE_DEFINITIONS,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_BADGE_VARIANTS,
  TASK_STATUS_LABELS,
} from '@/lib/types/opening'

interface ContractDetailViewProps {
  contract: ContractWithRelations
  userRole: UserRole
  openingProject?: OpeningProjectWithRelations | null
}

export function ContractDetailView({ contract, userRole, openingProject }: ContractDetailViewProps) {
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

  const allPayments = contract.rent_payments || []

  const rawNote = contract.note || contract.rental_leads?.note || ''
  const { cleanNote, hasForeignResident, financial, isHouse: metaIsHouse } = React.useMemo(
    () => parseLeadMetadata(rawNote),
    [rawNote]
  )

  const locName = contract.locations?.location_name || ''
  const isBranchLocation =
    locName.includes('สาขา') || locName.toLowerCase().includes('branch')

  const isBranchByFlags =
    Boolean(contract.need_branch_registration) ||
    Boolean(contract.need_vat_registration) ||
    Boolean(contract.need_signboard) ||
    Boolean(contract.need_employer_change) ||
    Boolean(contract.need_excise_permit)

  const isHouse =
    financial.property_type === 'house'
      ? true
      : financial.property_type === 'branch'
      ? false
      : isBranchLocation || isBranchByFlags
      ? false
      : Boolean(financial.property_price) ||
        Boolean(financial.down_payment) ||
        rawNote.includes('ประเภท: บ้าน') ||
        rawNote.includes('เช่าซื้อ') ||
        locName.toLowerCase().includes('sense') ||
        locName.toLowerCase().includes('house') ||
        (locName.toLowerCase().includes('บ้าน') && !locName.includes('สาขา'))

  // Determine contract party role (บริษัทเช่ากับเจ้าของ vs ลูกค้าเช่ากับบริษัท)
  const partyRole = React.useMemo(() => {
    return getContractPartyRole(
      financial,
      isHouse,
      Boolean(contract.landlord_id),
      Boolean(contract.customer_id),
      rawNote
    )
  }, [financial, isHouse, contract.landlord_id, contract.customer_id, rawNote])

  // Filter payments strictly by contract direction:
  // - "บริษัทเช่ากับเจ้าของ": ONLY 'payable' (จ่ายเจ้าของ)
  // - "ลูกค้าเช่ากับบริษัท": ONLY 'receivable' (รับจากลูกค้า)
  const displayPayments = React.useMemo(() => {
    return allPayments.filter((p) => p.payment_type === partyRole)
  }, [allPayments, partyRole])

  const mismatchedPayments = React.useMemo(() => {
    return allPayments.filter((p) => p.payment_type !== partyRole)
  }, [allPayments, partyRole])

  const [isCleaning, setIsCleaning] = React.useState(false)
  const handleCleanupMismatched = async () => {
    setIsCleaning(true)
    const res = await cleanupWrongPaymentTypesAction(contract.id, partyRole)
    setIsCleaning(false)
    if (res.success) {
      setGenerateMsg({
        type: 'success',
        text: `ลบงวดชำระที่ไม่เกี่ยวข้องเรียบร้อยแล้ว จำนวน ${res.deletedCount || 0} งวด`,
      })
      router.refresh()
    } else {
      setGenerateMsg({
        type: 'error',
        text: res.error || 'เกิดข้อผิดพลาดในการล้างงวดชำระ',
      })
    }
  }

  // Payments summary based on relevant displayPayments
  const paidCount = displayPayments.filter((p) => getEffectivePaymentStatus(p) === 'paid').length
  const overdueCount = displayPayments.filter((p) => getEffectivePaymentStatus(p) === 'overdue').length
  const pendingCount = displayPayments.filter((p) => ['pending', 'partial'].includes(getEffectivePaymentStatus(p))).length

  const propertyPrice = Number(financial.property_price) || 0
  const downPayment = Number(financial.down_payment) || Number(contract.deposit_amount) || 0

  // Total rent/installment paid from relevant payments only
  const totalRentPaid = React.useMemo(() => {
    return displayPayments.reduce((sum, p) => {
      const amountPaid = Number(p.amount_paid) || 0
      if (amountPaid > 0) return sum + amountPaid
      if (p.status === 'paid') return sum + (Number(p.net_amount) || 0)
      return sum
    }, 0)
  }, [displayPayments])

  // Current outstanding balance for House: Property Price - Down Payment - Total Rent Paid
  const currentOutstandingBalance = propertyPrice > 0
    ? Math.max(0, propertyPrice - downPayment - totalRentPaid)
    : 0

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
        text: res.message || `สร้างและอัปเดตงวดการชำระเงินเรียบร้อยแล้ว`,
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
              {isHouse ? (
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-800 border-amber-300 text-xs font-semibold flex items-center gap-1"
                >
                  <Home className="h-3 w-3 text-amber-600" />
                  บ้าน / เช่าซื้อ
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-sky-50 text-sky-800 border-sky-300 text-xs font-semibold flex items-center gap-1"
                >
                  <Building2 className="h-3 w-3 text-sky-600" />
                  สาขา / สถานประกอบการ
                </Badge>
              )}
              {partyRole === 'payable' ? (
                <Badge
                  variant="outline"
                  className="bg-indigo-50 text-indigo-800 border-indigo-300 text-xs font-semibold flex items-center gap-1"
                >
                  <Building className="h-3 w-3 text-indigo-600" />
                  บริษัทเช่ากับเจ้าของ (จ่ายเจ้าของ)
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-teal-50 text-teal-800 border-teal-300 text-xs font-semibold flex items-center gap-1"
                >
                  <User className="h-3 w-3 text-teal-600" />
                  ลูกค้าเช่ากับบริษัท (รับจากลูกค้า)
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              สถานที่: {contract.locations?.location_name || '-'} ({contract.locations?.province})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {allowWrite && !isHouse && ['agreed', 'active'].includes(contract.status) && (
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
      {isHouse && propertyPrice > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Card 1: ราคาบ้าน */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
              <Home className="h-3.5 w-3.5 text-amber-600" />
              ราคาบ้าน
            </span>
            <p className="text-xl font-bold text-slate-900 mt-1 font-mono">
              ฿{propertyPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-xs text-slate-400">
              {financial.interest_rate ? `ดอกเบี้ย ${financial.interest_rate}%` : ''}
              {financial.installment_years ? ` • ผ่อน ${financial.installment_years} ปี` : ''}
              {!financial.interest_rate && !financial.installment_years ? 'ราคาขายสัญญาเช่าซื้อ' : ''}
            </span>
          </div>

          {/* Card 2: เงินดาวน์ (แทนเงินมัดจำ/ล่วงหน้า) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-semibold text-slate-700">เงินดาวน์</span>
            <p className="text-xl font-bold text-amber-800 mt-1 font-mono">
              ฿{downPayment.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-xs text-slate-400">
              {downPayment > 0 ? 'ชำระเงินดาวน์เรียบร้อย' : 'ไม่มีเงินดาวน์ (฿0)'}
            </span>
          </div>

          {/* Card 3: หักค่าเช่าแต่ละเดือนที่ชำระแล้ว */}
          <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 shadow-sm space-y-1">
            <span className="text-xs font-semibold text-blue-800">หักค่าเช่าที่ชำระแล้ว</span>
            <p className="text-xl font-bold text-blue-900 mt-1 font-mono">
              ฿{totalRentPaid.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-xs text-blue-700">
              ค่างวด ฿{rentAmount.toLocaleString('th-TH')}/ด. (ชำระแล้ว {paidCount} งวด)
            </span>
          </div>

          {/* Card 4: ยอดคงเหลือปัจจุบัน */}
          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 shadow-sm space-y-1 ring-1 ring-emerald-300/60">
            <span className="text-xs font-bold text-emerald-800">ยอดคงเหลือปัจจุบัน</span>
            <p className="text-2xl font-black text-emerald-700 mt-1 font-mono">
              ฿{currentOutstandingBalance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-xs text-emerald-700 font-medium">
              ราคาบ้าน หักเงินดาวน์ และค่าเช่า
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {isHouse && propertyPrice === 0 && (
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50 flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  <strong>สัญญานี้เป็นประเภทบ้าน / ที่พักอาศัย:</strong> ยังไม่ได้ระบุราคาบ้านและเงินดาวน์ เพื่อคำนวณยอดคงเหลือปัจจุบัน
                </span>
              </div>
              {allowWrite && (
                <Button asChild size="sm" variant="outline" className="bg-white border-amber-300 text-amber-800 hover:bg-amber-100 text-xs h-7">
                  <Link href={`/contracts/${contract.id}/edit`}>
                    <Edit className="h-3 w-3 mr-1" />
                    ระบุราคาบ้านและเงินดาวน์
                  </Link>
                </Button>
              )}
            </div>
          )}

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
              <span className="text-xs font-medium text-slate-500">
                {isHouse ? 'เงินดาวน์ / มัดจำ' : 'เงินมัดจำ / ล่วงหน้า'}
              </span>
              <p className="text-xl font-bold text-slate-900 mt-1">
                ฿
                {(
                  Number(contract.deposit_amount || 0) + Number(contract.advance_rent_amount || 0)
                ).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </p>
              <span className="text-xs text-slate-400">
                {isHouse ? 'เงินดาวน์' : 'มัดจำ'} ฿{Number(contract.deposit_amount || 0).toLocaleString('th-TH')}
              </span>
            </div>
          </div>
        </div>
      )}

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

            {/* Registration & House Terms */}
            {(() => {
              const { cleanNote, hasForeignResident, financial } = parseLeadMetadata(contract.note)
              const estimatedInstallment = calculateMonthlyInstallment(
                financial.property_price,
                financial.down_payment,
                financial.interest_rate,
                financial.installment_years
              )
              const hasHouseTerms = Boolean(
                financial.property_price ||
                financial.down_payment ||
                financial.interest_rate ||
                financial.installment_years
              )

              return (
                <>
                  {hasHouseTerms && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-amber-900 font-semibold block text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <Home className="h-3.5 w-3.5 text-amber-600" />
                          ข้อเสนอสำหรับบ้าน / เช่าซื้อ:
                        </span>
                        {estimatedInstallment > 0 && (
                          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300">
                            ผ่อน ~฿{estimatedInstallment.toLocaleString('th-TH')}/เดือน
                          </span>
                        )}
                      </div>
                      <div className="rounded-lg bg-amber-50/50 p-2.5 border border-amber-200 text-xs space-y-1.5">
                        {financial.property_price && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">ราคาบ้าน:</span>
                            <span className="font-bold text-slate-900 font-mono">
                              ฿{Number(financial.property_price).toLocaleString('th-TH')}
                            </span>
                          </div>
                        )}
                        {financial.down_payment && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">เงินดาวน์:</span>
                            <span className="font-bold text-slate-900 font-mono">
                              ฿{Number(financial.down_payment).toLocaleString('th-TH')}
                            </span>
                          </div>
                        )}
                        {financial.interest_rate && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">อัตราดอกเบี้ย:</span>
                            <span className="font-semibold text-slate-900 font-mono">
                              {financial.interest_rate}% ต่อปี
                            </span>
                          </div>
                        )}
                        {financial.installment_years && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">ระยะเวลาการผ่อน:</span>
                            <span className="font-semibold text-slate-900 font-mono">
                              {financial.installment_years} ปี
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    <span className="text-slate-700 font-semibold block text-xs uppercase tracking-wider">
                      รายการที่ต้องดำเนินการทางทะเบียน & เอกสาร:
                    </span>

                    {!isHouse ? (
                      /* สำหรับสาขา / สถานประกอบการ */
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-700">
                          <Building2 className="h-3.5 w-3.5 text-sky-600" />
                          <span>สำหรับสาขา / สถานประกอบการ</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pl-2 border-l-2 border-sky-200">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs ${
                              contract.need_branch_registration ? 'text-emerald-700 font-medium' : 'text-slate-400'
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
                              contract.need_vat_registration ? 'text-emerald-700 font-medium' : 'text-slate-400'
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
                              contract.need_employer_change ? 'text-emerald-700 font-medium' : 'text-slate-400'
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
                              contract.need_signboard ? 'text-emerald-700 font-medium' : 'text-slate-400'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                contract.need_signboard ? 'bg-emerald-500' : 'bg-slate-300'
                              }`}
                            />
                            ป้ายโฆษณา/สาขา
                          </span>

                          <span
                            className={`inline-flex items-center gap-1.5 text-xs ${
                              contract.need_excise_permit ? 'text-emerald-700 font-medium' : 'text-slate-400'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                contract.need_excise_permit ? 'bg-emerald-500' : 'bg-slate-300'
                              }`}
                            />
                            ยื่นกรมสรรพสามิต
                          </span>

                          <span
                            className={`inline-flex items-center gap-1.5 text-xs ${
                              hasForeignResident ? 'text-emerald-700 font-medium' : 'text-slate-400'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                hasForeignResident ? 'bg-emerald-500' : 'bg-slate-300'
                              }`}
                            />
                            แจ้งคนต่างด้าว (ตม.30)
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* สำหรับบ้าน / ที่พักอาศัย */
                      <div className="space-y-1.5">
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
                    )}
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

      {/* ── Opening Project Status Section ── */}
      {!isHouse && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-sky-600" />
              <h2 className="text-sm font-bold text-slate-800">สถานะขั้นตอนการเปิดสาขา</h2>
              {openingProject && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    PROJECT_STATUS_BADGE_VARIANTS[
                      openingProject.status as keyof typeof PROJECT_STATUS_BADGE_VARIANTS
                    ]?.bg ?? 'bg-slate-100'
                  } ${
                    PROJECT_STATUS_BADGE_VARIANTS[
                      openingProject.status as keyof typeof PROJECT_STATUS_BADGE_VARIANTS
                    ]?.text ?? 'text-slate-700'
                  } ${
                    PROJECT_STATUS_BADGE_VARIANTS[
                      openingProject.status as keyof typeof PROJECT_STATUS_BADGE_VARIANTS
                    ]?.border ?? 'border-slate-200'
                  }`}
                >
                  {PROJECT_STATUS_LABELS[
                    openingProject.status as keyof typeof PROJECT_STATUS_LABELS
                  ] ?? openingProject.status}
                </span>
              )}
            </div>
            {openingProject ? (
              <Link
                href={`/opening/${openingProject.id}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-800 hover:underline transition-colors"
              >
                ดู/อัปเดตโครงการ <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              allowWrite && (
                <Link
                  href="/opening"
                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-800 hover:underline transition-colors"
                >
                  + สร้างโครงการเปิดสาขา
                </Link>
              )
            )}
          </div>

          <div className="p-5">
            {!openingProject ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CircleDashed className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm text-slate-500 font-medium">ยังไม่มีโครงการเปิดสาขา</p>
                <p className="text-xs text-slate-400 mt-1">
                  สร้างโครงการเพื่อติดตามสถานะขั้นตอนการเปิดสาขาทั้งหมด
                </p>
              </div>
            ) : (() => {
              // Build a map of stage_code → best task status
              const tasksByStage = new Map<string, { status: string; completed_at: string | null; updated_at: string }>()
              const tasks = (openingProject.opening_tasks ?? []) as Array<{
                status: string
                completed_at: string | null
                updated_at: string
                workflow_stages?: { stage_code: string; sequence: number } | null
              }>
              for (const t of tasks) {
                const code = t.workflow_stages?.stage_code
                if (!code) continue
                const existing = tasksByStage.get(code)
                // Prefer 'done' > 'in_progress' > 'waiting' > 'todo'
                const rank = (s: string) =>
                  s === 'done' ? 4 : s === 'in_progress' ? 3 : s === 'waiting' ? 2 : 1
                if (!existing || rank(t.status) > rank(existing.status)) {
                  tasksByStage.set(code, {
                    status: t.status,
                    completed_at: t.completed_at,
                    updated_at: t.updated_at,
                  })
                }
              }

              const formatDate = (iso: string | null | undefined) => {
                if (!iso) return null
                return new Date(iso).toLocaleDateString('th-TH', {
                  day: '2-digit', month: 'short', year: '2-digit',
                })
              }

              // Filter only relevant stages based on contract conditions
              const relevantStages = STAGE_DEFINITIONS.filter((def) => {
                if (!def.requiresCondition) return true
                if (def.requiresCondition === 'need_branch_registration') return Boolean(contract.need_branch_registration)
                if (def.requiresCondition === 'need_vat_registration') return Boolean(contract.need_vat_registration)
                if (def.requiresCondition === 'need_employer_change') return Boolean(contract.need_employer_change)
                if (def.requiresCondition === 'need_signboard') return Boolean(contract.need_signboard)
                if (def.requiresCondition === 'hasForeignResident') return hasForeignResident
                if (def.requiresCondition === 'need_excise_permit') return Boolean(contract.need_excise_permit)
                return false
              })

              return (
                <div className="space-y-1.5">
                  <p className="text-xs text-slate-500 mb-3">
                    โครงการ: <span className="font-semibold text-slate-700">{openingProject.project_no}</span>
                    {openingProject.updated_at && (
                      <span className="ml-2 text-slate-400">
                        · อัปเดต {formatDate(openingProject.updated_at)}
                      </span>
                    )}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                    {relevantStages.map((def) => {
                      const task = tasksByStage.get(def.code)
                      const status = task?.status ?? 'todo'
                      const dateStr = status === 'done'
                        ? formatDate(task?.completed_at ?? task?.updated_at)
                        : task && status !== 'todo'
                        ? formatDate(task.updated_at)
                        : null

                      return (
                        <div key={def.code} className="flex items-center gap-2">
                          {status === 'done' ? (
                            <CheckCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          ) : status === 'in_progress' ? (
                            <Loader2 className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          ) : status === 'waiting' ? (
                            <Clock className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                          ) : (
                            <CircleDashed className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                          )}
                          <span
                            className={`text-xs ${
                              status === 'done'
                                ? 'text-emerald-700 font-medium'
                                : status === 'in_progress'
                                ? 'text-amber-700 font-medium'
                                : status === 'waiting'
                                ? 'text-purple-600'
                                : 'text-slate-400'
                            }`}
                          >
                            {def.name}
                          </span>
                          {dateStr && (
                            <span className="text-[10px] text-slate-400 ml-auto shrink-0">{dateStr}</span>
                          )}
                          {!dateStr && status !== 'todo' && (
                            <span className="text-[10px] text-amber-500 ml-auto shrink-0">
                              {TASK_STATUS_LABELS[status as keyof typeof TASK_STATUS_LABELS] ?? status}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* Payment Schedule Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {mismatchedPayments.length > 0 && allowWrite && (
          <div className="px-5 py-3 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>
                พบงวดชำระประเภท &quot;{partyRole === 'payable' ? 'รับจากลูกค้า' : 'จ่ายเจ้าของ'}&quot; ซ้ำซ้อน {mismatchedPayments.length} งวด
                (ระบบแสดงเฉพาะ &quot;{partyRole === 'payable' ? 'จ่ายเจ้าของ' : 'รับจากลูกค้า'}&quot; ให้ตรงกับสัญญา)
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCleanupMismatched}
              disabled={isCleaning}
              className="text-amber-800 border-amber-300 hover:bg-amber-100 h-7 text-xs whitespace-nowrap self-end sm:self-auto"
            >
              {isCleaning ? 'กำลังล้างข้อมูล...' : 'ล้างงวดซ้ำซ้อนออกทันที'}
            </Button>
          </div>
        )}

        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                ตารางงวดชำระค่าเช่า (Payment Schedule)
              </h2>
              <Badge variant="secondary" className="text-xs">
                {displayPayments.length} งวด
              </Badge>
              <Badge
                variant="outline"
                className={`text-[11px] font-medium ${
                  partyRole === 'payable'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-teal-50 text-teal-700 border-teal-200'
                }`}
              >
                {partyRole === 'payable' ? 'จ่ายเจ้าของเท่านั้น' : 'รับจากลูกค้าเท่านั้น'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {partyRole === 'payable'
                ? 'งวดการชำระเงินตามระยะเวลาสัญญา: บริษัทจ่ายให้เจ้าของ (Payable)'
                : 'งวดการชำระเงินตามระยะเวลาสัญญา: รับเงินจากลูกค้า (Receivable)'}
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
        {displayPayments.length > 0 && (
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
        {displayPayments.length === 0 ? (
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
                {displayPayments.map((p) => {
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
