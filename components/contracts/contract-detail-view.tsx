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
  CONTRACT_STATUS_BADGE_VARIANTS,
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
  PROJECT_STATUS_BADGE_VARIANTS,
} from '@/lib/types/opening'
import { useI18n } from '@/lib/i18n/context'
import { labelOf } from '@/lib/i18n/tx'
import {
  CONTRACT_STATUS_TRI,
  PAYMENT_STATUS_TRI,
  PAYMENT_TYPE_TRI,
  PROJECT_STATUS_TRI,
  TASK_STATUS_TRI,
  STAGE_NAME_TRI,
  W,
} from '@/lib/i18n/labels'

interface ContractDetailViewProps {
  contract: ContractWithRelations
  userRole: UserRole
  openingProject?: OpeningProjectWithRelations | null
}

export function ContractDetailView({ contract, userRole, openingProject }: ContractDetailViewProps) {
  const router = useRouter()
  const { tx, locale, intl } = useI18n()
  const money = (n: number, frac = 2) =>
    n.toLocaleString(intl, { minimumFractionDigits: frac })
  const dateStr = (s: string | null | undefined) => (s ? new Date(s).toLocaleDateString(intl) : '-')
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
        text: tx({
          th: `ลบงวดชำระที่ไม่เกี่ยวข้องเรียบร้อยแล้ว จำนวน ${res.deletedCount || 0} งวด`,
          en: `Removed ${res.deletedCount || 0} unrelated installments`,
          my: `မသက်ဆိုင်သော အရစ် ${res.deletedCount || 0} ခု ဖျက်ပြီးပါပြီ`,
        }),
      })
      router.refresh()
    } else {
      setGenerateMsg({
        type: 'error',
        text: res.error || tx({ th: 'เกิดข้อผิดพลาดในการล้างงวดชำระ', en: 'Error cleaning up installments', my: 'အရစ်များ ရှင်းလင်းရာတွင် အမှားဖြစ်ပွား' }),
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
      setGenerateMsg({ type: 'error', text: res.error || tx({ th: 'เกิดข้อผิดพลาดในการลบสัญญา', en: 'Error deleting contract', my: 'စာချုပ်ဖျက်ရာတွင် အမှားဖြစ်ပွား' }) })
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
        text: res.message || tx({ th: 'สร้างและอัปเดตงวดการชำระเงินเรียบร้อยแล้ว', en: 'Payment schedule generated successfully', my: 'ငွေပေးချေမှု အရစ်ဇယား ဖန်တီးပြီးပါပြီ' }),
      })
      router.refresh()
    } else {
      setGenerateMsg({
        type: 'error',
        text: res.error || tx({ th: 'เกิดข้อผิดพลาดในการสร้างงวดค่าเช่า', en: 'Error generating rent schedule', my: 'ငှားခအရစ် ဖန်တီးရာတွင် အမှားဖြစ်ပွား' }),
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
                {labelOf(CONTRACT_STATUS_TRI, contract.status, locale)}
              </Badge>
              {isHouse ? (
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-800 border-amber-300 text-xs font-semibold flex items-center gap-1"
                >
                  <Home className="h-3 w-3 text-amber-600" />
                  {tx(W.house)}
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-sky-50 text-sky-800 border-sky-300 text-xs font-semibold flex items-center gap-1"
                >
                  <Building2 className="h-3 w-3 text-sky-600" />
                  {tx(W.branch)}
                </Badge>
              )}
              {partyRole === 'payable' ? (
                <Badge
                  variant="outline"
                  className="bg-indigo-50 text-indigo-800 border-indigo-300 text-xs font-semibold flex items-center gap-1"
                >
                  <Building className="h-3 w-3 text-indigo-600" />
                  {tx({ th: 'บริษัทเช่ากับเจ้าของ (จ่ายเจ้าของ)', en: 'Company rents from owner (Pay owner)', my: 'ကုမ္ပဏီက ပိုင်ရှင်ထံမှ ငှား (ပိုင်ရှင်ထံပေး)' })}
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-teal-50 text-teal-800 border-teal-300 text-xs font-semibold flex items-center gap-1"
                >
                  <User className="h-3 w-3 text-teal-600" />
                  {tx({ th: 'ลูกค้าเช่ากับบริษัท (รับจากลูกค้า)', en: 'Customer rents from company (Receive)', my: 'ဖောက်သည်က ကုမ္ပဏီထံမှ ငှား (လက်ခံ)' })}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {tx(W.location)}: {contract.locations?.location_name || '-'} ({contract.locations?.province})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {allowWrite && !isHouse && ['agreed', 'active'].includes(contract.status) && (
            <Button asChild size="sm" className="bg-primary-600 hover:bg-primary-700 text-white">
              <Link href="/opening">
                <Building2 className="mr-1.5 h-3.5 w-3.5" />
                {tx({ th: 'โครงการเปิดสาขา', en: 'Branch Opening Project', my: 'ဆိုင်ခွဲဖွင့် စီမံကိန်း' })}
              </Link>
            </Button>
          )}

          {allowWrite && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/contracts/${contract.id}/edit`}>
                <Edit className="mr-2 h-4 w-4 text-slate-500" />
                {tx({ th: 'แก้ไขสัญญา', en: 'Edit Contract', my: 'စာချုပ်ပြင်ဆင်' })}
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
              {tx({ th: 'ลบสัญญา', en: 'Delete Contract', my: 'စာချုပ်ဖျက်' })}
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
              {tx({ th: 'ราคาบ้าน', en: 'House Price', my: 'အိမ်ဈေးနှုန်း' })}
            </span>
            <p className="text-xl font-bold text-slate-900 mt-1 font-mono">
              ฿{money(propertyPrice)}
            </p>
            <span className="text-xs text-slate-400">
              {financial.interest_rate ? `${tx({ th: 'ดอกเบี้ย', en: 'Interest', my: 'အတိုး' })} ${financial.interest_rate}%` : ''}
              {financial.installment_years ? ` • ${tx({ th: 'ผ่อน', en: 'Installment', my: 'အရစ်ကျ' })} ${financial.installment_years} ${tx(W.years)}` : ''}
              {!financial.interest_rate && !financial.installment_years ? tx({ th: 'ราคาขายสัญญาเช่าซื้อ', en: 'Hire-purchase price', my: 'အရစ်ကျဝယ် ဈေးနှုန်း' }) : ''}
            </span>
          </div>

          {/* Card 2: เงินดาวน์ (แทนเงินมัดจำ/ล่วงหน้า) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-semibold text-slate-700">{tx({ th: 'เงินดาวน์', en: 'Down Payment', my: 'ကြိုတင်ငွေ' })}</span>
            <p className="text-xl font-bold text-amber-800 mt-1 font-mono">
              ฿{money(downPayment)}
            </p>
            <span className="text-xs text-slate-400">
              {downPayment > 0
                ? tx({ th: 'ชำระเงินดาวน์เรียบร้อย', en: 'Down payment received', my: 'ကြိုတင်ငွေ ပေးချေပြီး' })
                : tx({ th: 'ไม่มีเงินดาวน์ (฿0)', en: 'No down payment (฿0)', my: 'ကြိုတင်ငွေ မရှိ (฿0)' })}
            </span>
          </div>

          {/* Card 3: หักค่าเช่าแต่ละเดือนที่ชำระแล้ว */}
          <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 shadow-sm space-y-1">
            <span className="text-xs font-semibold text-blue-800">{tx({ th: 'หักค่าเช่าที่ชำระแล้ว', en: 'Rent Paid (Deducted)', my: 'ပေးချေပြီး ငှားခ (နုတ်ယူ)' })}</span>
            <p className="text-xl font-bold text-blue-900 mt-1 font-mono">
              ฿{money(totalRentPaid)}
            </p>
            <span className="text-xs text-blue-700">
              {tx({ th: 'ค่างวด', en: 'Installment', my: 'အရစ်ကြေး' })} ฿{money(rentAmount, 0)}{tx(W.perMonth)} ({tx({ th: 'ชำระแล้ว', en: 'paid', my: 'ပေးပြီး' })} {paidCount} {tx(W.installments)})
            </span>
          </div>

          {/* Card 4: ยอดคงเหลือปัจจุบัน */}
          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 shadow-sm space-y-1 ring-1 ring-emerald-300/60">
            <span className="text-xs font-bold text-emerald-800">{tx({ th: 'ยอดคงเหลือปัจจุบัน', en: 'Current Outstanding Balance', my: 'လက်ရှိ ကျန်ငွေ' })}</span>
            <p className="text-2xl font-black text-emerald-700 mt-1 font-mono">
              ฿{money(currentOutstandingBalance)}
            </p>
            <span className="text-xs text-emerald-700 font-medium">
              {tx({ th: 'ราคาบ้าน หักเงินดาวน์ และค่าเช่า', en: 'House price minus down payment and rent paid', my: 'အိမ်ဈေး ထဲမှ ကြိုတင်ငွေနှင့် ငှားခ နုတ်ပြီး' })}
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
                  <strong>{tx({ th: 'สัญญานี้เป็นประเภทบ้าน / ที่พักอาศัย:', en: 'This is a house / residential contract:', my: 'ဤစာချုပ်သည် အိမ် / နေထိုင်ရာ အမျိုးအစား ဖြစ်သည်:' })}</strong>{' '}
                  {tx({ th: 'ยังไม่ได้ระบุราคาบ้านและเงินดาวน์ เพื่อคำนวณยอดคงเหลือปัจจุบัน', en: 'house price and down payment are not set, so the outstanding balance cannot be calculated', my: 'ကျန်ငွေ တွက်ချက်ရန် အိမ်ဈေးနှင့် ကြိုတင်ငွေ မသတ်မှတ်ရသေးပါ' })}
                </span>
              </div>
              {allowWrite && (
                <Button asChild size="sm" variant="outline" className="bg-white border-amber-300 text-amber-800 hover:bg-amber-100 text-xs h-7">
                  <Link href={`/contracts/${contract.id}/edit`}>
                    <Edit className="h-3 w-3 mr-1" />
                    {tx({ th: 'ระบุราคาบ้านและเงินดาวน์', en: 'Set price & down payment', my: 'ဈေးနှင့် ကြိုတင်ငွေ သတ်မှတ်' })}
                  </Link>
                </Button>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-medium text-slate-500">{tx({ th: 'ค่าเช่าต่อเดือน', en: 'Monthly Rent', my: 'လစဉ်ငှားခ' })}</span>
              <p className="text-xl font-bold text-slate-900 mt-1">
                ฿{money(rentAmount)}
              </p>
              {serviceAmount > 0 && (
                <span className="text-xs text-slate-400">
                  + {tx({ th: 'บริการ', en: 'Service', my: 'ဝန်ဆောင်ခ' })} ฿{money(serviceAmount, 0)}
                </span>
              )}
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-medium text-slate-500">{tx({ th: 'ภาษีหัก ณ ที่จ่าย', en: 'Withholding Tax', my: 'ဖြတ်တောက်ခွန် (WHT)' })}</span>
              <p className="text-xl font-bold text-sky-700 mt-1">
                {contract.wht_enabled ? `${whtRate}%` : tx({ th: 'ไม่มี', en: 'None', my: 'မရှိ' })}
              </p>
              <span className="text-xs text-slate-400">
                {contract.wht_enabled
                  ? `- ฿${money(whtMonthly)}${tx(W.perMonth)}`
                  : tx({ th: 'ไม่ได้หักภาษี', en: 'No tax withheld', my: 'အခွန်မဖြတ်ပါ' })}
              </span>
            </div>

            <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 shadow-sm">
              <span className="text-xs font-medium text-emerald-700">{tx({ th: 'ยอดสุทธิต่อเดือน (Net)', en: 'Net per Month', my: 'လစဉ် အသားတင် (Net)' })}</span>
              <p className="text-xl font-bold text-emerald-700 mt-1">
                ฿{money(netMonthly)}
              </p>
              <span className="text-xs text-emerald-600">
                {tx({ th: 'กำหนดชำระทุกวันที่', en: 'Due every month on day', my: 'လစဉ် ပေးချေရမည့်ရက်' })} {contract.payment_due_day || 5}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-xs font-medium text-slate-500">
                {isHouse
                  ? tx({ th: 'เงินดาวน์ / มัดจำ', en: 'Down Payment / Deposit', my: 'ကြိုတင်ငွေ / စရံ' })
                  : tx({ th: 'เงินมัดจำ / ล่วงหน้า', en: 'Deposit / Advance', my: 'စရံ / ကြိုတင်ငှားခ' })}
              </span>
              <p className="text-xl font-bold text-slate-900 mt-1">
                ฿
                {money(Number(contract.deposit_amount || 0) + Number(contract.advance_rent_amount || 0))}
              </p>
              <span className="text-xs text-slate-400">
                {isHouse
                  ? tx({ th: 'เงินดาวน์', en: 'Down payment', my: 'ကြိုတင်ငွေ' })
                  : tx({ th: 'มัดจำ', en: 'Deposit', my: 'စရံ' })}{' '}
                ฿{money(Number(contract.deposit_amount || 0), 0)}
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
            {tx({ th: 'ข้อมูลระยะเวลาสัญญาและสถานที่', en: 'Contract Period & Location', my: 'စာချုပ်ကာလနှင့် နေရာ' })}
          </h2>

          <div className="grid grid-cols-2 gap-y-3 text-xs">
            <div>
              <span className="text-slate-400 block">{tx({ th: 'วันที่ทำสัญญา:', en: 'Contract Date:', my: 'စာချုပ်ချုပ်သည့်ရက်:' })}</span>
              <span className="font-medium text-slate-800">
                {dateStr(contract.contract_date)}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block">{tx({ th: 'กำหนดชำระเงิน:', en: 'Payment Due:', my: 'ပေးချေရမည့်ရက်:' })}</span>
              <span className="font-medium text-slate-800">
                {tx({ th: `ทุกวันที่ ${contract.payment_due_day || 5} ของเดือน`, en: `Day ${contract.payment_due_day || 5} of every month`, my: `လစဉ် ${contract.payment_due_day || 5} ရက်နေ့` })}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block">{tx({ th: 'วันเริ่มต้นสัญญา:', en: 'Start Date:', my: 'စတင်ရက်:' })}</span>
              <span className="font-medium text-emerald-700 font-semibold">
                {dateStr(contract.start_date)}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block">{tx({ th: 'วันสิ้นสุดสัญญา:', en: 'End Date:', my: 'ပြီးဆုံးရက်:' })}</span>
              <span className="font-medium text-rose-700 font-semibold">
                {dateStr(contract.end_date)}
              </span>
            </div>

            <div className="col-span-2 pt-2 border-t border-slate-100">
              <span className="text-slate-400 block">{tx({ th: 'สถานที่ / สาขา:', en: 'Location / Branch:', my: 'နေရာ / ဆိုင်ခွဲ:' })}</span>
              <span className="font-medium text-slate-900 text-sm">
                {contract.locations?.location_name}
              </span>
              <span className="text-slate-500 block">
                {tx({ th: 'รหัส', en: 'Code', my: 'ကုဒ်' })}: {contract.locations?.location_code} | {tx({ th: 'จังหวัด', en: 'Province', my: 'ခရိုင်' })}:{' '}
                {contract.locations?.province} {contract.locations?.district}
              </span>
            </div>

            {contract.rental_leads && (
              <div className="col-span-2 pt-2 border-t border-slate-100">
                <span className="text-slate-400 block">{tx({ th: 'ลีดที่เกี่ยวข้อง:', en: 'Related Lead:', my: 'ဆက်စပ် Lead:' })}</span>
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
            {tx({ th: 'ข้อมูลคู่สัญญา & การเปิดสาขา', en: 'Parties & Branch Setup', my: 'စာချုပ်ဝင်များနှင့် ဆိုင်ခွဲဖွင့်ခြင်း' })}
          </h2>

          <div className="space-y-3 text-xs">
            {contract.landlords && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold text-indigo-700 uppercase block mb-1">
                  {tx({ th: 'ผู้ให้เช่า (Landlord)', en: 'Landlord', my: 'အိမ်ရှင် (Landlord)' })}
                </span>
                <p className="font-medium text-slate-900">
                  {contract.landlords.name || contract.landlords.company_name}
                </p>
                {contract.landlords.phone && (
                  <p className="text-slate-500">{tx(W.phone)}: {contract.landlords.phone}</p>
                )}
                {contract.landlords.bank_account_number && (
                  <p className="text-slate-600 font-mono mt-1">
                    {tx({ th: 'บัญชี', en: 'Account', my: 'အကောင့်' })}: {contract.landlords.bank_name || tx({ th: 'ธนาคาร', en: 'Bank', my: 'ဘဏ်' })}{' '}
                    {contract.landlords.bank_account_number}
                  </p>
                )}
              </div>
            )}

            {contract.customers && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold text-teal-700 uppercase block mb-1">
                  {tx({ th: 'ลูกค้า / ผู้เช่า (Customer)', en: 'Customer / Tenant', my: 'ဖောက်သည် / အိမ်ငှား' })}
                </span>
                <p className="font-medium text-slate-900">
                  {contract.customers.name || contract.customers.company_name}
                </p>
                {contract.customers.phone && (
                  <p className="text-slate-500">{tx(W.phone)}: {contract.customers.phone}</p>
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
                          {tx({ th: 'ข้อเสนอสำหรับบ้าน / เช่าซื้อ:', en: 'House / Hire-purchase Terms:', my: 'အိမ် / အရစ်ကျဝယ် အဆိုပြုချက်:' })}
                        </span>
                        {estimatedInstallment > 0 && (
                          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300">
                            {tx({ th: 'ผ่อน', en: 'Installment', my: 'အရစ်ကျ' })} ~฿{money(estimatedInstallment, 0)}{tx(W.perMonth)}
                          </span>
                        )}
                      </div>
                      <div className="rounded-lg bg-amber-50/50 p-2.5 border border-amber-200 text-xs space-y-1.5">
                        {financial.property_price && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">{tx({ th: 'ราคาบ้าน:', en: 'House Price:', my: 'အိမ်ဈေး:' })}</span>
                            <span className="font-bold text-slate-900 font-mono">
                              ฿{money(Number(financial.property_price), 0)}
                            </span>
                          </div>
                        )}
                        {financial.down_payment && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">{tx({ th: 'เงินดาวน์:', en: 'Down Payment:', my: 'ကြိုတင်ငွေ:' })}</span>
                            <span className="font-bold text-slate-900 font-mono">
                              ฿{money(Number(financial.down_payment), 0)}
                            </span>
                          </div>
                        )}
                        {financial.interest_rate && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">{tx({ th: 'อัตราดอกเบี้ย:', en: 'Interest Rate:', my: 'အတိုးနှုန်း:' })}</span>
                            <span className="font-semibold text-slate-900 font-mono">
                              {financial.interest_rate}% {tx({ th: 'ต่อปี', en: 'p.a.', my: 'တစ်နှစ်လျှင်' })}
                            </span>
                          </div>
                        )}
                        {financial.installment_years && (
                          <div className="flex justify-between">
                            <span className="text-slate-600">{tx({ th: 'ระยะเวลาการผ่อน:', en: 'Installment Period:', my: 'အရစ်ကျကာလ:' })}</span>
                            <span className="font-semibold text-slate-900 font-mono">
                              {financial.installment_years} {tx(W.years)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    <span className="text-slate-700 font-semibold block text-xs uppercase tracking-wider">
                      {tx({ th: 'รายการที่ต้องดำเนินการทางทะเบียน & เอกสาร:', en: 'Required Registrations & Documents:', my: 'လိုအပ်သော မှတ်ပုံတင်ခြင်းနှင့် စာရွက်စာတမ်းများ:' })}
                    </span>

                    {!isHouse ? (
                      /* สำหรับสาขา / สถานประกอบการ */
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-700">
                          <Building2 className="h-3.5 w-3.5 text-sky-600" />
                          <span>{tx({ th: 'สำหรับสาขา / สถานประกอบการ', en: 'For Branch / Business', my: 'ဆိုင်ခွဲ / လုပ်ငန်းဌာန အတွက်' })}</span>
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
                            {tx({ th: 'จดทะเบียนสาขา', en: 'Branch Registration', my: 'ဆိုင်ခွဲ မှတ်ပုံတင်' })}
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
                            {tx({ th: 'จดทะเบียน VAT', en: 'VAT Registration', my: 'VAT မှတ်ပုံတင်' })}
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
                            {tx({ th: 'เปลี่ยนนายจ้าง', en: 'Employer Change', my: 'အလုပ်ရှင်ပြောင်း' })}
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
                            {tx({ th: 'ป้ายโฆษณา/สาขา', en: 'Signboard', my: 'ဆိုင်းဘုတ်' })}
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
                            {tx({ th: 'ยื่นกรมสรรพสามิต', en: 'Excise Permit', my: 'ယစ်မျိုးခွန် လိုင်စင်' })}
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
                            {tx({ th: 'แจ้งคนต่างด้าว (ตม.30)', en: 'Foreigner Notification (TM.30)', my: 'နိုင်ငံခြားသား အကြောင်းကြားစာ (TM.30)' })}
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* สำหรับบ้าน / ที่พักอาศัย */
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
                          <Home className="h-3.5 w-3.5 text-amber-600" />
                          <span>{tx({ th: 'สำหรับบ้าน / ที่พักอาศัย', en: 'For House / Residence', my: 'အိမ် / နေထိုင်ရာ အတွက်' })}</span>
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
                            {tx({ th: 'แจ้งที่พักอาศัยคนต่างด้าว (ตม.30)', en: 'Foreigner Residence Notification (TM.30)', my: 'နိုင်ငံခြားသား နေထိုင်ရာ အကြောင်းကြားစာ (TM.30)' })}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {cleanNote && (
                    <div className="pt-2 border-t border-slate-100 text-slate-600">
                      <span className="text-slate-400 block mb-1">{tx(W.note)}:</span>
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
              <h2 className="text-sm font-bold text-slate-800">{tx({ th: 'สถานะขั้นตอนการเปิดสาขา', en: 'Branch Opening Progress', my: 'ဆိုင်ခွဲဖွင့်ခြင်း အခြေအနေ' })}</h2>
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
                  {labelOf(PROJECT_STATUS_TRI, openingProject.status, locale)}
                </span>
              )}
            </div>
            {openingProject ? (
              <Link
                href={`/opening/${openingProject.id}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-800 hover:underline transition-colors"
              >
                {tx({ th: 'ดู/อัปเดตโครงการ', en: 'View / Update Project', my: 'စီမံကိန်း ကြည့်/ပြင်' })} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              allowWrite && (
                <Link
                  href="/opening"
                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-800 hover:underline transition-colors"
                >
                  + {tx({ th: 'สร้างโครงการเปิดสาขา', en: 'Create Opening Project', my: 'ဆိုင်ခွဲဖွင့် စီမံကိန်း ဖန်တီး' })}
                </Link>
              )
            )}
          </div>

          <div className="p-5">
            {!openingProject ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CircleDashed className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm text-slate-500 font-medium">{tx({ th: 'ยังไม่มีโครงการเปิดสาขา', en: 'No opening project yet', my: 'ဆိုင်ခွဲဖွင့် စီမံကိန်း မရှိသေးပါ' })}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {tx({ th: 'สร้างโครงการเพื่อติดตามสถานะขั้นตอนการเปิดสาขาทั้งหมด', en: 'Create a project to track all branch opening steps', my: 'ဆိုင်ခွဲဖွင့်ခြင်း အဆင့်အားလုံးကို ခြေရာခံရန် စီမံကိန်း ဖန်တီးပါ' })}
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
                return new Date(iso).toLocaleDateString(intl, {
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
                    {tx({ th: 'โครงการ', en: 'Project', my: 'စီမံကိန်း' })}: <span className="font-semibold text-slate-700">{openingProject.project_no}</span>
                    {openingProject.updated_at && (
                      <span className="ml-2 text-slate-400">
                        · {tx({ th: 'อัปเดต', en: 'Updated', my: 'ပြင်ဆင်ချိန်' })} {formatDate(openingProject.updated_at)}
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
                            {labelOf(STAGE_NAME_TRI, def.code, locale) || def.name}
                          </span>
                          {dateStr && (
                            <span className="text-[10px] text-slate-400 ml-auto shrink-0">{dateStr}</span>
                          )}
                          {!dateStr && status !== 'todo' && (
                            <span className="text-[10px] text-amber-500 ml-auto shrink-0">
                              {labelOf(TASK_STATUS_TRI, status, locale)}
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
                {tx({
                  th: `พบงวดชำระประเภท "${partyRole === 'payable' ? 'รับจากลูกค้า' : 'จ่ายเจ้าของ'}" ซ้ำซ้อน ${mismatchedPayments.length} งวด (ระบบแสดงเฉพาะ "${partyRole === 'payable' ? 'จ่ายเจ้าของ' : 'รับจากลูกค้า'}" ให้ตรงกับสัญญา)`,
                  en: `Found ${mismatchedPayments.length} mismatched "${partyRole === 'payable' ? 'From Customer' : 'Pay Owner'}" installments (only "${partyRole === 'payable' ? 'Pay Owner' : 'From Customer'}" is shown to match this contract)`,
                  my: `မကိုက်ညီသော "${partyRole === 'payable' ? 'ဖောက်သည်ထံမှလက်ခံ' : 'ပိုင်ရှင်ထံပေးချေ'}" အရစ် ${mismatchedPayments.length} ခု တွေ့ရှိသည် (စာချုပ်နှင့်ကိုက်ညီရန် "${partyRole === 'payable' ? 'ပိုင်ရှင်ထံပေးချေ' : 'ဖောက်သည်ထံမှလက်ခံ'}" ကိုသာ ပြသသည်)`,
                })}
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCleanupMismatched}
              disabled={isCleaning}
              className="text-amber-800 border-amber-300 hover:bg-amber-100 h-7 text-xs whitespace-nowrap self-end sm:self-auto"
            >
              {isCleaning
                ? tx({ th: 'กำลังล้างข้อมูล...', en: 'Cleaning up...', my: 'ရှင်းလင်းနေသည်...' })
                : tx({ th: 'ล้างงวดซ้ำซ้อนออกทันที', en: 'Remove mismatched installments', my: 'မကိုက်ညီသော အရစ်များ ဖယ်ရှား' })}
            </Button>
          </div>
        )}

        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                {tx({ th: 'ตารางงวดชำระค่าเช่า (Payment Schedule)', en: 'Payment Schedule', my: 'ငှားခ ပေးချေမှု ဇယား' })}
              </h2>
              <Badge variant="secondary" className="text-xs">
                {displayPayments.length} {tx(W.installments)}
              </Badge>
              <Badge
                variant="outline"
                className={`text-[11px] font-medium ${
                  partyRole === 'payable'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-teal-50 text-teal-700 border-teal-200'
                }`}
              >
                {partyRole === 'payable'
                  ? tx({ th: 'จ่ายเจ้าของเท่านั้น', en: 'Pay owner only', my: 'ပိုင်ရှင်ထံပေးချေမှုသာ' })
                  : tx({ th: 'รับจากลูกค้าเท่านั้น', en: 'From customer only', my: 'ဖောက်သည်ထံမှ လက်ခံမှုသာ' })}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {partyRole === 'payable'
                ? tx({ th: 'งวดการชำระเงินตามระยะเวลาสัญญา: บริษัทจ่ายให้เจ้าของ (Payable)', en: 'Installments over the contract term: company pays owner (Payable)', my: 'စာချုပ်ကာလအတွင်း အရစ်များ: ကုမ္ပဏီမှ ပိုင်ရှင်ထံ ပေးချေ (Payable)' })
                : tx({ th: 'งวดการชำระเงินตามระยะเวลาสัญญา: รับเงินจากลูกค้า (Receivable)', en: 'Installments over the contract term: received from customer (Receivable)', my: 'စာချုပ်ကာလအတွင်း အရစ်များ: ဖောက်သည်ထံမှ လက်ခံ (Receivable)' })}
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
                {isGenerating
                  ? tx({ th: 'กำลังสร้างงวด...', en: 'Generating...', my: 'ဖန်တီးနေသည်...' })
                  : tx({ th: 'สร้างงวดค่าเช่าอัตโนมัติ', en: 'Auto-generate Schedule', my: 'အရစ်ဇယား အလိုအလျောက် ဖန်တီး' })}
              </Button>
            )}
          </div>
        </div>

        {/* Schedule Summary Tabs/Badges */}
        {displayPayments.length > 0 && (
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {tx({ th: 'ชำระแล้ว', en: 'Paid', my: 'ပေးပြီး' })}: {paidCount} {tx(W.installments)}
            </span>
            <span className="flex items-center gap-1.5 text-rose-700 font-medium">
              <AlertTriangle className="h-3.5 w-3.5" />
              {tx({ th: 'ค้างชำระ', en: 'Overdue', my: 'ရက်လွန်' })}: {overdueCount} {tx(W.installments)}
            </span>
            <span className="flex items-center gap-1.5 text-blue-700 font-medium">
              <Clock className="h-3.5 w-3.5" />
              {tx({ th: 'รอชำระ', en: 'Pending', my: 'စောင့်ဆဲ' })}: {pendingCount} {tx(W.installments)}
            </span>
          </div>
        )}

        {/* Payments Table */}
        {displayPayments.length === 0 ? (
          <div className="p-8 text-center">
            <CreditCard className="mx-auto h-8 w-8 text-slate-300" />
            <h3 className="mt-2 text-sm font-semibold text-slate-800">
              {tx({ th: 'ยังไม่มีงวดชำระในสัญญานี้', en: 'No installments for this contract yet', my: 'ဤစာချုပ်အတွက် အရစ်များ မရှိသေးပါ' })}
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              {tx({
                th: `กดปุ่ม "สร้างงวดค่าเช่าอัตโนมัติ" ด้านบนเพื่อคำนวณและสร้างงวดตามระยะเวลาสัญญา ${contract.start_date} ถึง ${contract.end_date}`,
                en: `Click "Auto-generate Schedule" above to create installments for the contract term ${contract.start_date} to ${contract.end_date}`,
                my: `စာချုပ်ကာလ ${contract.start_date} မှ ${contract.end_date} အတွက် အရစ်များ ဖန်တီးရန် အပေါ်ရှိ "အရစ်ဇယား အလိုအလျောက် ဖန်တီး" ကို နှိပ်ပါ`,
              })}
            </p>
            {allowWrite && (
              <Button
                size="sm"
                onClick={handleGenerateSchedule}
                disabled={isGenerating}
                className="mt-4 bg-primary-600 hover:bg-primary-700 text-white"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                {tx({ th: 'สร้างงวดค่าเช่าอัตโนมัติ', en: 'Auto-generate Schedule', my: 'အရစ်ဇယား အလိုအလျောက် ဖန်တီး' })}
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">{tx({ th: 'งวดเดือน', en: 'Period', my: 'ကာလ' })}</th>
                  <th className="px-4 py-3">{tx({ th: 'ประเภท', en: 'Type', my: 'အမျိုးအစား' })}</th>
                  <th className="px-4 py-3">{tx({ th: 'วันครบกำหนด', en: 'Due Date', my: 'နောက်ဆုံးရက်' })}</th>
                  <th className="px-4 py-3 text-right">{tx({ th: 'ยอดก่อนหัก (Gross)', en: 'Gross', my: 'စုစုပေါင်း (Gross)' })}</th>
                  <th className="px-4 py-3 text-right">{tx({ th: 'หัก ณ ที่จ่าย (WHT)', en: 'WHT', my: 'ဖြတ်တောက်ခွန် (WHT)' })}</th>
                  <th className="px-4 py-3 text-right">{tx({ th: 'ยอดสุทธิ (Net)', en: 'Net', my: 'အသားတင် (Net)' })}</th>
                  <th className="px-4 py-3 text-right">{tx({ th: 'ชำระแล้ว', en: 'Paid', my: 'ပေးပြီး' })}</th>
                  <th className="px-4 py-3 text-right">{tx({ th: 'คงเหลือ', en: 'Balance', my: 'ကျန်ငွေ' })}</th>
                  <th className="px-4 py-3 text-center">{tx({ th: 'สถานะ', en: 'Status', my: 'အခြေအနေ' })}</th>
                  <th className="px-4 py-3 text-right">{tx({ th: 'จัดการ', en: 'Actions', my: 'လုပ်ဆောင်ချက်' })}</th>
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
                          {labelOf(PAYMENT_TYPE_TRI, p.payment_type, locale)}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        {dateStr(p.due_date)}
                      </td>

                      <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                        ฿{money(Number(p.gross_amount))}
                      </td>

                      <td className="px-4 py-3 text-right text-sky-700 whitespace-nowrap">
                        {Number(p.wht_amount) > 0
                          ? `-฿${money(Number(p.wht_amount))}`
                          : '-'}
                      </td>

                      <td className="px-4 py-3 text-right font-bold text-slate-900 whitespace-nowrap">
                        ฿{money(Number(p.net_amount))}
                      </td>

                      <td className="px-4 py-3 text-right text-emerald-600 font-medium whitespace-nowrap">
                        ฿{money(Number(p.amount_paid))}
                      </td>

                      <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">
                        <span
                          className={
                            Number(p.balance_amount) > 0 ? 'text-rose-600' : 'text-slate-400'
                          }
                        >
                          ฿
                          {money(Number(p.balance_amount))}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`${pBadge.bg} ${pBadge.text} ${pBadge.border} text-[10px] font-medium`}
                        >
                          {labelOf(PAYMENT_STATUS_TRI, effStatus, locale)}
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
                            {tx({ th: 'บันทึกชำระ / ดูสลิป', en: 'Record / View Slip', my: 'ပေးချေမှုမှတ်တမ်း / ပြေစာကြည့်' })}
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
        title={tx({ th: 'เอกสารแนบ (Contract)', en: 'Attachments (Contract)', my: 'ပူးတွဲစာရွက်များ (စာချုပ်)' })}
      />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={tx({ th: 'ยืนยันการลบสัญญาเช่า', en: 'Confirm Contract Deletion', my: 'စာချုပ်ဖျက်ရန် အတည်ပြု' })}
        description={tx({
          th: 'คุณแน่ใจหรือไม่ว่าต้องการลบสัญญานี้? ข้อมูลนี้จะไม่สามารถกู้คืนได้ และหากมีงวดชำระเงินผูกอยู่จะไม่สามารถลบได้',
          en: 'Are you sure you want to delete this contract? This cannot be undone, and contracts with linked payments cannot be deleted.',
          my: 'ဤစာချုပ်ကို ဖျက်ရန် သေချာပါသလား? ပြန်လည်ရယူ၍ မရပါ၊ ငွေပေးချေမှုများ ချိတ်ဆက်ထားပါက ဖျက်၍မရပါ။',
        })}
        confirmText={tx({ th: 'ยืนยันลบ', en: 'Delete', my: 'ဖျက်မည်' })}
        cancelText={tx({ th: 'ยกเลิก', en: 'Cancel', my: 'မလုပ်တော့' })}
        variant="danger"
        loading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
