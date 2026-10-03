'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  Save,
  Trash2,
  Loader2,
  Home,
  DollarSign,
  CheckSquare,
  Calendar,
  Clock,
  Building,
  User,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  rentalLeadSchema,
  type RentalLeadFormValues,
  type RentalLead,
  type LeadStatus,
} from '@/lib/types/rental-leads'
import { LEAD_STATUS_LABELS } from '@/lib/types/rental-leads'
import { useI18n } from '@/lib/i18n/context'
import { labelOf, LEAD_STATUS_TRI, W } from '@/lib/i18n/labels'
import {
  createRentalLeadAction,
  updateRentalLeadAction,
  deleteRentalLeadAction,
} from '@/lib/actions/rental-leads'
import type { Customer, Landlord, Location } from '@/lib/types/master-data'
import type { UserProfile, UserRole } from '@/lib/types/auth'
import { hasFullAccess, canWrite } from '@/lib/auth/permissions'

import {
  parseLeadMetadata,
  buildLeadMetadataNote,
  calculateMonthlyInstallment,
  type LeadFinancialTerms,
  type ContractPartyRole,
} from '@/lib/utils/lead-metadata'

interface RentalLeadFormProps {
  initialData?: RentalLead
  locations: Pick<Location, 'id' | 'location_code' | 'location_name' | 'province'>[]
  customers: Pick<Customer, 'id' | 'customer_code' | 'name' | 'company_name'>[]
  landlords: Pick<Landlord, 'id' | 'landlord_code' | 'name' | 'company_name'>[]
  staffProfiles: Pick<UserProfile, 'id' | 'full_name' | 'email'>[]
  userRole: UserRole
  onSuccess?: () => void
  onCancel?: () => void
}

export function RentalLeadForm({
  initialData,
  locations,
  customers,
  landlords,
  staffProfiles,
  userRole,
  onSuccess,
  onCancel,
}: RentalLeadFormProps) {
  const { t, locale, tx } = useI18n()
  const intlLocale = locale === 'en' ? 'en-US' : locale === 'my' ? 'my-MM' : 'th-TH'
  const router = useRouter()
  const isEdit = Boolean(initialData)
  const allowEdit = canWrite(userRole)
  const allowDelete = hasFullAccess(userRole) && isEdit

  const [isSubmitting, startTransition] = React.useTransition()
  const [serverError, setServerError] = React.useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Parse initial metadata from note
  const initialParsed = React.useMemo(
    () => parseLeadMetadata(initialData?.note),
    [initialData?.note]
  )

  const [needForeignResident, setNeedForeignResident] = React.useState<boolean>(
    initialParsed.hasForeignResident
  )

  const isOperation = userRole === 'operation'

  // Property type: House vs Branch
  const [propertyType, setPropertyType] = React.useState<'house' | 'branch'>(() => {
    if (isOperation) return 'branch'
    if (initialParsed.financial.property_type) return initialParsed.financial.property_type
    const leadName = initialData?.lead_name || ''
    if (leadName.includes('สาขา') || leadName.toLowerCase().includes('branch')) {
      return 'branch'
    }
    if (initialParsed.isHouse) return 'house'
    return 'branch'
  })

  const [contractPartyRole, setContractPartyRole] = React.useState<ContractPartyRole>(() => {
    if (initialParsed.financial.contract_party_role) {
      return initialParsed.financial.contract_party_role
    }
    if (initialParsed.isHouse || propertyType === 'house') {
      return 'payable'
    }
    return 'payable'
  })

  // Financial proposal for house / hire-purchase
  const [propertyPrice, setPropertyPrice] = React.useState<number | null>(
    initialParsed.financial.property_price ?? null
  )
  const [downPayment, setDownPayment] = React.useState<number | null>(
    initialParsed.financial.down_payment ?? null
  )
  const [interestRate, setInterestRate] = React.useState<number | null>(
    initialParsed.financial.interest_rate ?? null
  )
  const [installmentYears, setInstallmentYears] = React.useState<number | null>(
    initialParsed.financial.installment_years ?? null
  )

  // Payment due day (1-31)
  const [paymentDueDay, setPaymentDueDay] = React.useState<number | null>(
    initialParsed.financial.payment_due_day ?? null
  )

  // Contract end date
  const [contractEndDate, setContractEndDate] = React.useState<string | null>(
    initialParsed.financial.contract_end_date ?? null
  )

  // Live mortgage installment calculation
  const estimatedMonthlyInstallment = React.useMemo(() => {
    return calculateMonthlyInstallment(
      propertyPrice,
      downPayment,
      interestRate,
      installmentYears
    )
  }, [propertyPrice, downPayment, interestRate, installmentYears])

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RentalLeadFormValues>({
    resolver: zodResolver(rentalLeadSchema),
    defaultValues: {
      lead_no: initialData?.lead_no ?? '',
      lead_name: initialData?.lead_name ?? '',
      location_id: initialData?.location_id ?? '',
      customer_id: initialData?.customer_id ?? '',
      landlord_id: initialData?.landlord_id ?? '',
      source: initialData?.source ?? '',
      first_contact_date: initialData?.first_contact_date ?? '',
      expected_start_date: initialData?.expected_start_date ?? '',
      expected_open_date: initialData?.expected_open_date ?? '',
      proposed_monthly_rent: initialData?.proposed_monthly_rent ?? 0,
      proposed_deposit_amount: initialData?.proposed_deposit_amount ?? 0,
      proposed_advance_rent_amount: initialData?.proposed_advance_rent_amount ?? 0,
      proposed_service_amount: initialData?.proposed_service_amount ?? 0,
      need_branch_registration: initialData?.need_branch_registration ?? true,
      need_vat_registration: initialData?.need_vat_registration ?? false,
      need_employer_change: initialData?.need_employer_change ?? false,
      need_signboard: initialData?.need_signboard ?? true,
      need_excise_permit: initialData?.need_excise_permit ?? false,
      status: (initialData?.status as LeadStatus) ?? 'new',
      assigned_to: initialData?.assigned_to ?? '',
      next_follow_up_date: initialData?.next_follow_up_date ?? '',
      note: initialParsed.cleanNote,
    },
  })

  const onSubmit = (values: RentalLeadFormValues) => {
    if (!allowEdit) return
    setServerError(null)

    startTransition(async () => {
      const isHouseType = propertyType === 'house'
      const financialTerms: LeadFinancialTerms = {
        property_type: propertyType,
        contract_party_role: contractPartyRole,
        property_price: isHouseType ? propertyPrice : null,
        down_payment: isHouseType ? downPayment : null,
        interest_rate: isHouseType ? interestRate : null,
        installment_years: isHouseType ? installmentYears : null,
        payment_due_day: paymentDueDay,
        contract_end_date: contractEndDate,
      }

      const finalNote = buildLeadMetadataNote(
        values.note || '',
        needForeignResident,
        financialTerms
      )

      const submissionValues: RentalLeadFormValues = {
        ...values,
        note: finalNote || null,
      }

      let res
      if (isEdit && initialData) {
        res = await updateRentalLeadAction(initialData.id, submissionValues)
      } else {
        res = await createRentalLeadAction(submissionValues)
      }

      if (!res.success) {
        setServerError(res.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
        return
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push(isEdit && initialData ? `/rental-leads/${initialData.id}` : '/rental-leads')
      }
      router.refresh()
    })
  }

  const handleDelete = async () => {
    if (!initialData || !allowDelete) return
    setIsDeleting(true)
    setServerError(null)

    try {
      const res = await deleteRentalLeadAction(initialData.id)
      if (!res.success) {
        setServerError(res.error || 'ไม่สามารถลบข้อมูลได้')
        setIsDeleting(false)
        setShowDeleteConfirm(false)
        return
      }
      router.push('/rental-leads')
      router.refresh()
    } catch {
      setServerError('เกิดข้อผิดพลาดในการลบข้อมูล')
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onCancel ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-9 w-9 p-0 text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
            <Link href={isEdit ? `/rental-leads/${initialData?.id}` : '/rental-leads'}>
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-slate-500 hover:text-slate-900">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {isEdit ? tx({ th: 'แก้ไขข้อมูลประเภทงาน', en: 'Edit Rental Lead', my: 'ငှားရမ်းမှုအခွင့်အလမ်း ပြင်ဆင်ရန်' }) : tx({ th: 'เพิ่มประเภทงานใหม่', en: 'New Rental Lead', my: 'ငှားရမ်းမှုအခွင့်အလမ်း အသစ်' })}
            </h1>
            <p className="text-xs text-slate-500">
              {isEdit
                ? `${tx({ th: 'รหัสประเภทงาน (Lead)', en: 'Lead Code', my: 'အခွင့်အလမ်းကုဒ်' })}: ${initialData?.lead_no}`
                : tx({ th: 'กรอกรายละเอียดเพื่อเริ่มต้นติดตามโอกาสและเจรจาพื้นที่', en: 'Fill details to track pipeline and negotiations', my: 'အခွင့်အလမ်းနှင့် ညှိနှိုင်းမှုများကို ခြေရာခံရန် အချက်အလက်ဖြည့်ပါ' })}
            </p>
          </div>
        </div>

        {allowDelete && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-600 hover:bg-red-50 hover:text-red-700 gap-1.5"
          >
            <Trash2 className="h-4 w-4" />
            {tx({ th: 'ลบประเภทงาน', en: 'Delete Lead', my: 'ဖျက်ပစ်ပါ' })}
          </Button>
        )}
      </div>

      {serverError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {serverError}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          {/* Section 1: Lead General Info */}
          <div>
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Home className="h-4 w-4 text-primary-500" />
              {tx({ th: 'ข้อมูลประเภทงาน', en: 'Lead Information', my: 'အခွင့်အလမ်း အချက်အလက်' })}
            </h2>

            {/* Property Type Selector: House vs Branch */}
            <div className="mb-5 p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
              <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                {tx({ th: 'รูปแบบประเภทงาน / สถานที่', en: 'Property / Lead Type', my: 'နေရာ/အခွင့်အလမ်း အမျိုးအစား' })} <span className="text-rose-500">*</span>
              </Label>
              <div className={`grid ${isOperation ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'} gap-3 max-w-lg`}>
                {!isOperation && (
                  <button
                    type="button"
                    disabled={!allowEdit}
                    onClick={() => {
                      setPropertyType('house')
                      setContractPartyRole('payable')
                      setNeedForeignResident(true)
                    }}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      propertyType === 'house'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-sm ring-2 ring-amber-300'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Home className={`h-5 w-5 shrink-0 ${propertyType === 'house' ? 'text-white' : 'text-amber-500'}`} />
                    <div>
                      <div className="text-xs font-bold">{tx(W.houseResidential)}</div>
                      <div className={`text-[11px] ${propertyType === 'house' ? 'text-amber-100' : 'text-slate-400'}`}>
                        {tx({ th: 'เช่าซื้อ, ซื้อบ้าน, แจ้ง ตม.30', en: 'Hire-purchase, buy house, TM.30', my: 'အငှားဝယ်၊ အိမ်ဝယ်၊ TM.30' })}
                      </div>
                    </div>
                  </button>
                )}

                <button
                  type="button"
                  disabled={!allowEdit}
                  onClick={() => {
                    setPropertyType('branch')
                  }}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    propertyType === 'branch'
                      ? 'bg-primary-600 text-white border-primary-700 shadow-sm ring-2 ring-primary-300'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Building className={`h-5 w-5 shrink-0 ${propertyType === 'branch' ? 'text-white' : 'text-primary-500'}`} />
                  <div>
                    <div className="text-xs font-bold">{tx(W.branch)}</div>
                    <div className={`text-[11px] ${propertyType === 'branch' ? 'text-primary-100' : 'text-slate-400'}`}>
                      {tx({ th: 'เช่าเปิดสาขาธุรกิจ, จดทะเบียนนิติบุคคล', en: 'Business branch lease, company registration', my: 'လုပ်ငန်းဆိုင်ခွဲငှားရမ်းခြင်း၊ မှတ်ပုံတင်ခြင်း' })}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Contract Direction / Party Role Selector */}
            <div className="mb-5 p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
              <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                {tx({ th: 'รูปแบบคู่สัญญาและทิศทางการชำระ (Payment Direction)', en: 'Contract Direction & Payment Flow', my: 'စာချုပ်ပါပုဂ္ဂိုလ်နှင့် ငွေပေးချေမှု ဦးတည်ချက်' })} <span className="text-rose-500">*</span>
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                <button
                  type="button"
                  disabled={!allowEdit}
                  onClick={() => setContractPartyRole('payable')}
                  className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    contractPartyRole === 'payable'
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm ring-2 ring-indigo-300'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Building className={`h-5 w-5 shrink-0 mt-0.5 ${contractPartyRole === 'payable' ? 'text-white' : 'text-indigo-500'}`} />
                  <div>
                    <div className="text-xs font-bold">{tx({ th: 'บริษัทเช่ากับเจ้าของ (รายจ่าย)', en: 'Company leases from Landlord (Payable)', my: 'ကုမ္ပဏီမှ အိမ်ရှင်ထံမှငှား (အသုံးစရိတ်)' })}</div>
                    <div className={`text-[11px] mt-0.5 leading-relaxed ${contractPartyRole === 'payable' ? 'text-indigo-100' : 'text-slate-500'}`}>
                      {tx({ th: 'บริษัทจ่ายค่าเช่าให้เจ้าของ (ตารางค่างวด: มีเฉพาะ "จ่ายเจ้าของ")', en: 'Company pays rent to landlord (Schedule: "Payable" only)', my: 'ကုမ္ပဏီမှ အိမ်ရှင်သို့ ငှားရမ်းခပေးချေသည် (ဇယား: "ပေးရန်" သာ)' })}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={!allowEdit}
                  onClick={() => setContractPartyRole('receivable')}
                  className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    contractPartyRole === 'receivable'
                      ? 'bg-teal-600 text-white border-teal-700 shadow-sm ring-2 ring-teal-300'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <User className={`h-5 w-5 shrink-0 mt-0.5 ${contractPartyRole === 'receivable' ? 'text-white' : 'text-teal-500'}`} />
                  <div>
                    <div className="text-xs font-bold">{tx({ th: 'ลูกค้าเช่ากับบริษัท (รายรับ)', en: 'Customer leases from Company (Receivable)', my: 'ဖောက်သည်မှ ကုမ္ပဏီထံမှငှား (ဝင်ငွေ)' })}</div>
                    <div className={`text-[11px] mt-0.5 leading-relaxed ${contractPartyRole === 'receivable' ? 'text-teal-100' : 'text-slate-500'}`}>
                      {tx({ th: 'ลูกค้านำส่งค่าเช่าให้บริษัท (ตารางค่างวด: มีเฉพาะ "รับจากลูกค้า")', en: 'Customer pays rent to company (Schedule: "Receivable" only)', my: 'ဖောက်သည်မှ ကုမ္ပဏီသို့ ငှားရမ်းခပေးပို့သည် (ဇယား: "ရရန်" သာ)' })}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="lead_name">{tx({ th: 'ชื่อประเภทงาน / โครงการ', en: 'Lead / Project Name', my: 'အခွင့်အလမ်း / စီမံကိန်း အမည်' })} *</Label>
                <Input
                  id="lead_name"
                  placeholder={tx({ th: 'เช่น เช่าพื้นที่เปิดสาขาใหม่ - อาคารสยามสแควร์วัน', en: 'e.g. New Branch Lease - Siam Square One', my: 'ဥပမာ - ဆိုင်ခွဲအသစ် ငှားရမ်းခြင်း' })}
                  disabled={!allowEdit}
                  {...register('lead_name')}
                />
                {errors.lead_name && (
                  <p className="text-xs text-red-500">{errors.lead_name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lead_no">{tx({ th: 'รหัสประเภทงาน (Lead)', en: 'Lead Code', my: 'အခွင့်အလမ်းကုဒ်' })}</Label>
                <Input
                  id="lead_no"
                  placeholder={tx({ th: 'เช่น LEAD-001 (ปล่อยว่างให้ระบบสร้างอัตโนมัติ)', en: 'e.g. LEAD-001 (Auto-generated if blank)', my: 'ဥပမာ LEAD-001 (လွတ်ထားပါက အလိုအလျောက် သတ်မှတ်မည်)' })}
                  disabled={!allowEdit}
                  {...register('lead_no')}
                />
                {errors.lead_no && (
                  <p className="text-xs text-red-500">{errors.lead_no.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="source">{tx({ th: 'วัตถุประสงค์', en: 'Purpose / Source', my: 'ရည်ရွယ်ချက်' })}</Label>
                <Select id="source" disabled={!allowEdit} {...register('source')}>
                  <option value="">-- {tx({ th: 'เลือกวัตถุประสงค์', en: 'Select Purpose', my: 'ရည်ရွယ်ချက် ရွေးချယ်ပါ' })} --</option>
                  <option value="เช่าเพื่อกิจการของบริษัท">{tx({ th: 'เช่าเพื่อกิจการของบริษัท', en: 'Company Business Lease', my: 'ကုမ္ပဏီလုပ်ငန်းအတွက် ငှားရမ်းခြင်း' })}</option>
                  <option value="เช่าซื้อ">{tx({ th: 'เช่าซื้อ', en: 'Hire-Purchase', my: 'အငှားဝယ်' })}</option>
                  <option value="เช่าระยะยาว">{tx({ th: 'เช่าระยะยาว', en: 'Long-term Lease', my: 'ကာလရှည် ငှားရမ်းခြင်း' })}</option>
                  <option value="ขายของ">{tx({ th: 'ขายของ', en: 'Retail / Commercial', my: 'အရောင်းဆိုင်' })}</option>
                  {initialData?.source && !['เช่าเพื่อกิจการของบริษัท', 'เช่าซื้อ', 'เช่าระยะยาว', 'ขายของ'].includes(initialData.source) && (
                    <option value={initialData.source}>{initialData.source}</option>
                  )}
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="assigned_to">{tx({ th: 'ผู้รับผิดชอบ', en: 'Assigned To', my: 'တာဝန်ခံ' })}</Label>
                <Select id="assigned_to" disabled={!allowEdit} {...register('assigned_to')}>
                  <option value="">-- {tx({ th: 'เลือกผู้รับผิดชอบ', en: 'Select Assignee', my: 'တာဝန်ခံ ရွေးချယ်ပါ' })} --</option>
                  {staffProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name || p.email}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status">{t.common.status} *</Label>
                <Select id="status" disabled={!allowEdit} {...register('status')}>
                  {Object.entries(LEAD_STATUS_TRI).map(([val]) => (
                    <option key={val} value={val}>
                      {labelOf(LEAD_STATUS_TRI, val, locale)}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          {/* Section 2: Linked Master Data */}
          <div>
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
              {tx({ th: 'ความเชื่อมโยงกับข้อมูลหลัก (Master Data)', en: 'Linked Master Data', my: 'ပင်မအချက်အလက်များနှင့် ချိတ်ဆက်မှု' })}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="location_id">{t.locations.title} / {tx(W.branch)}</Label>
                <Select id="location_id" disabled={!allowEdit} {...register('location_id')}>
                  <option value="">-- {tx({ th: 'เลือกสถานที่', en: 'Select Location', my: 'နေရာ ရွေးချယ်ပါ' })} --</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.location_name} {loc.province ? `(${loc.province})` : ''}
                    </option>
                  ))}
                </Select>
                {errors.location_id && (
                  <p className="text-xs text-red-500">{errors.location_id.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="customer_id">{t.customers.title} ({tx(W.tenant)})</Label>
                <Select id="customer_id" disabled={!allowEdit} {...register('customer_id')}>
                  <option value="">-- {tx({ th: 'เลือกลูกค้า', en: 'Select Customer', my: 'ဖောက်သည် ရွေးချယ်ပါ' })} --</option>
                  {customers.map((cust) => (
                    <option key={cust.id} value={cust.id}>
                      {cust.name || cust.company_name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="landlord_id">{t.landlords.title} ({tx(W.landlord)})</Label>
                <Select id="landlord_id" disabled={!allowEdit} {...register('landlord_id')}>
                  <option value="">-- {tx({ th: 'เลือกผู้ให้เช่า', en: 'Select Landlord', my: 'အိမ်ရှင် ရွေးချယ်ပါ' })} --</option>
                  {landlords.map((ll) => (
                    <option key={ll.id} value={ll.id}>
                      {ll.name || ll.company_name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          {/* Section 3: Financial Proposals */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <span>{tx({ th: 'ข้อเสนอทางการเงิน (Proposed Pricing)', en: 'Proposed Financial Terms', my: 'ဘဏ္ဍာရေး အဆိုပြုချက်' })}</span>
              </div>
            </h2>

            {/* หมวดที่ 1: ค่าเช่า & ค่าบริการ */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700">
                {tx({ th: 'เงื่อนไขค่าเช่าและเงินประกัน', en: 'Rent & Deposit Terms', my: 'ငှားရမ်းခနှင့် အာမခံစပေါ် သတ်မှတ်ချက်များ' })}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="proposed_monthly_rent">{tx({ th: 'ค่าเช่าเสนอ (บาท/เดือน)', en: 'Proposed Rent (THB/month)', my: 'အဆိုပြုငှားခ (ဘတ်/လ)' })}</Label>
                  <Input
                    id="proposed_monthly_rent"
                    type="number"
                    placeholder="0.00"
                    disabled={!allowEdit}
                    {...register('proposed_monthly_rent')}
                  />
                  {errors.proposed_monthly_rent && (
                    <p className="text-xs text-red-500">{errors.proposed_monthly_rent.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="proposed_deposit_amount">{tx({ th: 'เงินประกัน / มัดจำ (บาท)', en: 'Deposit Amount (THB)', my: 'စပေါ် / အာမခံငွေ (ဘတ်)' })}</Label>
                  <Input
                    id="proposed_deposit_amount"
                    type="number"
                    placeholder="0.00"
                    disabled={!allowEdit}
                    {...register('proposed_deposit_amount')}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="proposed_advance_rent_amount">{tx({ th: 'ค่าเช่าล่วงหน้า (บาท)', en: 'Advance Rent (THB)', my: 'ကြိုတင်ပေးငှားခ (ဘတ်)' })}</Label>
                  <Input
                    id="proposed_advance_rent_amount"
                    type="number"
                    placeholder="0.00"
                    disabled={!allowEdit}
                    {...register('proposed_advance_rent_amount')}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="proposed_service_amount">{tx({ th: 'ค่าบริการส่วนกลาง (บาท/เดือน)', en: 'Service Fee (THB/month)', my: 'အများသုံးဝန်ဆောင်ခ (ဘတ်/လ)' })}</Label>
                  <Input
                    id="proposed_service_amount"
                    type="number"
                    placeholder="0.00"
                    disabled={!allowEdit}
                    {...register('proposed_service_amount')}
                  />
                </div>
              </div>
            </div>

            {/* หมวดที่ 2: สำหรับบ้าน / เช่าซื้อ (ราคาบ้าน, เงินดาวน์, ดอกเบี้ย, ระยะเวลาการผ่อน) */}
            {propertyType === 'house' && (
              <div className="space-y-2 pt-3 border-t border-dashed border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                    <Home className="h-3.5 w-3.5 text-amber-600" />
                    {tx({ th: 'สำหรับบ้าน / เช่าซื้อ (ราคาบ้าน, เงินดาวน์, ดอกเบี้ย, ระยะเวลาผ่อน)', en: 'For House / Hire-Purchase (Price, Down payment, Interest, Period)', my: 'အိမ် / အငှားဝယ် အတွက် (အိမ်တန်ဖိုး၊ စရန်၊ အတိုး၊ အရစ်ကာလ)' })}
                  </span>
                  {estimatedMonthlyInstallment > 0 && (
                    <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {tx({ th: 'ยอดผ่อนประมาณการ:', en: 'Est. Installment:', my: 'ခန့်မှန်းအရစ်ငွေ:' })} <strong className="font-semibold">฿{estimatedMonthlyInstallment.toLocaleString(intlLocale)}</strong> /{tx({ th: 'เดือน', en: 'mo', my: 'လ' })}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="property_price">{tx({ th: 'ราคาบ้าน (บาท)', en: 'Property Price (THB)', my: 'အိမ်တန်ဖိုး (ဘတ်)' })}</Label>
                    <Input
                      id="property_price"
                      type="number"
                      placeholder="0.00"
                      disabled={!allowEdit}
                      value={propertyPrice !== null && propertyPrice !== undefined ? propertyPrice : ''}
                      onChange={(e) => setPropertyPrice(e.target.value ? Number(e.target.value) : null)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="down_payment">{tx({ th: 'เงินดาวน์ (บาท)', en: 'Down Payment (THB)', my: 'စရန်ငွေ (ဘတ်)' })}</Label>
                    <Input
                      id="down_payment"
                      type="number"
                      placeholder="0.00"
                      disabled={!allowEdit}
                      value={downPayment !== null && downPayment !== undefined ? downPayment : ''}
                      onChange={(e) => setDownPayment(e.target.value ? Number(e.target.value) : null)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="interest_rate">{tx({ th: 'ดอกเบี้ย (% ต่อปี)', en: 'Interest Rate (% / year)', my: 'အတိုးနှုန်း (တစ်နှစ်လျှင် %)' })}</Label>
                    <Input
                      id="interest_rate"
                      type="number"
                      step="0.01"
                      placeholder="3.50"
                      disabled={!allowEdit}
                      value={interestRate !== null && interestRate !== undefined ? interestRate : ''}
                      onChange={(e) => setInterestRate(e.target.value ? Number(e.target.value) : null)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="installment_years">{tx({ th: 'ระยะเวลาการผ่อน (ปี)', en: 'Installment Period (Years)', my: 'အရစ်ကျကာလ (နှစ်)' })}</Label>
                    <Input
                      id="installment_years"
                      type="number"
                      placeholder="30"
                      disabled={!allowEdit}
                      value={installmentYears !== null && installmentYears !== undefined ? installmentYears : ''}
                      onChange={(e) => setInstallmentYears(e.target.value ? Number(e.target.value) : null)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Target Dates & Next Follow-up */}
          <div>
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              {tx({ th: 'กำหนดการและวันนัดหมาย', en: 'Schedule & Appointments', my: 'ရက်ချိန်းနှင့် အစီအစဉ်များ' })}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="first_contact_date">{tx({ th: 'วันที่ติดต่อครั้งแรก', en: 'First Contact Date', my: 'ပထမဆုံး ဆက်သွယ်သည့်ရက်' })}</Label>
                <Input
                  id="first_contact_date"
                  type="date"
                  disabled={!allowEdit}
                  {...register('first_contact_date')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="expected_start_date">{tx({ th: 'คาดว่าจะเริ่มสัญญา', en: 'Expected Start Date', my: 'စာချုပ်စတင်နိုင်မည့်ရက်' })}</Label>
                <Input
                  id="expected_start_date"
                  type="date"
                  disabled={!allowEdit}
                  {...register('expected_start_date')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contract_end_date">{tx({ th: 'วันที่ครบสัญญา', en: 'Contract End Date', my: 'စာချုပ်ကုန်ဆုံးရက်' })}</Label>
                <Input
                  id="contract_end_date"
                  type="date"
                  disabled={!allowEdit}
                  value={contractEndDate || ''}
                  onChange={(e) => setContractEndDate(e.target.value || null)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="next_follow_up_date">{tx({ th: 'นัดหมายติดตามผลถัดไป', en: 'Next Follow-up Date', my: 'နောက်တစ်ကြိမ် တွေ့ဆုံရက်' })}</Label>
                <Input
                  id="next_follow_up_date"
                  type="date"
                  disabled={!allowEdit}
                  className="border-amber-300 bg-amber-50/30"
                  {...register('next_follow_up_date')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="payment_due_day">{tx({ th: 'วันที่ครบกำหนดชำระ', en: 'Payment Due Day', my: 'ပေးချေရမည့်ရက်' })}</Label>
                <div className="relative">
                  <Input
                    id="payment_due_day"
                    type="number"
                    min={1}
                    max={31}
                    placeholder="เช่น 30"
                    disabled={!allowEdit}
                    value={paymentDueDay !== null && paymentDueDay !== undefined ? paymentDueDay : ''}
                    onChange={(e) => setPaymentDueDay(e.target.value ? Number(e.target.value) : null)}
                    className="pr-14 font-medium"
                  />
                  <span className="absolute right-2.5 top-2.5 text-xs text-slate-400 pointer-events-none">
                    {tx({ th: 'ของเดือน', en: 'of month', my: 'ရက်' })}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">{tx({ th: 'เช่น ทุกวันที่ 30 ของเดือน (1-31)', en: 'e.g. 30th of every month (1-31)', my: 'ဥပမာ လစဉ် ၃၀ ရက်နေ့ (၁-၃၁)' })}</p>
              </div>
            </div>
          </div>

          {/* Section 5: Registration Requirements (Checkboxes) */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-indigo-500" />
              {tx({ th: 'รายการดำเนินการทางทะเบียนและเอกสาร', en: 'Registration & Documentation Checklist', my: 'မှတ်ပုံတင်ခြင်းနှင့် စာရွက်စာတမ်းများ စာရင်း' })}
            </h2>

            {/* หมวดที่ 1: สำหรับสาขา */}
            {propertyType !== 'house' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Building className="h-3.5 w-3.5 text-slate-500" />
                  <span>{tx(W.branch)} / {tx({ th: 'สถานประกอบการ', en: 'Business Place', my: 'လုပ်ငန်းဌာန' })}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      disabled={!allowEdit}
                      className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      {...register('need_branch_registration')}
                    />
                    <span className="text-xs font-medium text-slate-700">{tx({ th: 'ต้องจดทะเบียนสาขา', en: 'Requires Branch Registration', my: 'ဆိုင်ခွဲမှတ်ပုံတင်ရန် လိုအပ်' })}</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      disabled={!allowEdit}
                      className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      {...register('need_vat_registration')}
                    />
                    <span className="text-xs font-medium text-slate-700">{tx({ th: 'ต้องจดภาษีมูลค่าเพิ่ม (VAT)', en: 'Requires VAT Registration', my: 'VAT မှတ်ပုံတင်ရန် လိုအပ်' })}</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      disabled={!allowEdit}
                      className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      {...register('need_employer_change')}
                    />
                    <span className="text-xs font-medium text-slate-700">{tx({ th: 'ต้องเปลี่ยนนายจ้างประกันสังคม', en: 'Requires SSO Employer Change', my: 'လူမှုဖူလုံရေး အလုပ်ရှင်ပြောင်းရန် လိုအပ်' })}</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      disabled={!allowEdit}
                      className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      {...register('need_signboard')}
                    />
                    <span className="text-xs font-medium text-slate-700">{tx({ th: 'ต้องขออนุญาตติดตั้งป้ายร้าน', en: 'Requires Signboard Permit', my: 'ဆိုင်းဘုတ်လိုင်စင် လိုအပ်' })}</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      disabled={!allowEdit}
                      className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      {...register('need_excise_permit')}
                    />
                    <span className="text-xs font-medium text-slate-700">{tx({ th: 'ต้องยื่นกรมสรรพสามิต (เหล้า/ยาสูบ)', en: 'Requires Excise Permit (Liquor/Tobacco)', my: 'ယစ်မျိုးခွန်လိုင်စင် (အရက်/ဆေးလိပ်) လိုအပ်' })}</span>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      disabled={!allowEdit}
                      checked={needForeignResident}
                      onChange={(e) => setNeedForeignResident(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-medium text-slate-700">{tx({ th: 'แจ้งที่พักอาศัยคนต่างด้าว', en: 'Foreign Resident Notification', my: 'နိုင်ငံခြားသား နေထိုင်ရာ အကြောင်းကြားစာ' })}</span>
                      <p className="text-[10px] text-slate-500">{tx({ th: 'แจ้ง ตม.30 ภายใน 24 ชม.', en: 'TM.30 within 24h', my: '၂၄ နာရီအတွင်း TM.30 တင်ပြ' })}</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* หมวดที่ 2: สำหรับบ้าน / ที่พักอาศัย */}
            {propertyType === 'house' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Home className="h-3.5 w-3.5 text-amber-600" />
                  <span>{tx(W.houseResidential)}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <label className="flex items-center gap-2.5 p-3 rounded-lg border border-amber-200 bg-amber-50/40 cursor-pointer hover:bg-amber-50 transition-colors">
                    <input
                      type="checkbox"
                      disabled={!allowEdit}
                      checked={needForeignResident}
                      onChange={(e) => setNeedForeignResident(e.target.checked)}
                      className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-slate-800">{tx({ th: 'แจ้งที่พักอาศัยคนต่างด้าว', en: 'Foreign Resident Notification', my: 'နိုင်ငံခြားသား နေထိုင်ရာ အကြောင်းကြားစာ' })}</span>
                      <p className="text-[10px] text-slate-500">{tx({ th: 'แจ้ง ตม.30 ภายใน 24 ชม.', en: 'TM.30 within 24h', my: '၂၄ နာရီအတွင်း TM.30 တင်ပြ' })}</p>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Section 6: Notes */}
          <div>
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
              {tx({ th: 'หมายเหตุเพิ่มเติม', en: 'Additional Notes', my: 'နောက်ထပ် မှတ်ချက်များ' })}
            </h2>
            <Textarea
              id="note"
              placeholder={tx({ th: 'เงื่อนไขพิเศษ ข้อกำหนดเจ้าของพื้นที่ หรือประวัติการพูดคุยเบื้องต้น...', en: 'Special terms, landlord requirements, or meeting history...', my: 'အထူးသတ်မှတ်ချက်များ သို့မဟုတ် ဆွေးနွေးမှုမှတ်တမ်း...' })}
              rows={3}
              disabled={!allowEdit}
              {...register('note')}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          {onCancel ? (
            <Button type="button" variant="outline" onClick={onCancel}>
              {t.common.cancel}
            </Button>
          ) : (
            <Link href={isEdit ? `/rental-leads/${initialData?.id}` : '/rental-leads'}>
              <Button type="button" variant="outline">
                {t.common.cancel}
              </Button>
            </Link>
          )}
          {allowEdit && (
            <Button type="submit" disabled={isSubmitting} className="gap-2 min-w-[120px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {tx({ th: 'กำลังบันทึก...', en: 'Saving...', my: 'သိမ်းဆည်းနေသည်...' })}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isEdit ? tx({ th: 'บันทึกการแก้ไข', en: 'Save Changes', my: 'ပြင်ဆင်မှု သိမ်းဆည်းရန်' }) : tx({ th: 'บันทึกงานเช่า', en: 'Save Lead', my: 'အခွင့်အလမ်း သိမ်းဆည်းရန်' })}
                </>
              )}
            </Button>
          )}
        </div>
      </form>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={tx({ th: 'ยืนยันการลบข้อมูลประเภทงาน', en: 'Confirm Deleting Lead', my: 'ဖျက်ပစ်ရန် အတည်ပြုပါ' })}
        description={tx({
          th: `คุณแน่ใจหรือไม่ว่าต้องการลบประเภทงาน "${initialData?.lead_name}"? ข้อมูลการเจรจาทั้งหมดจะถูกลบไปด้วย และไม่สามารถกู้คืนได้`,
          en: `Are you sure you want to delete lead "${initialData?.lead_name}"? All negotiation logs will be deleted permanently.`,
          my: `"${initialData?.lead_name}" ကို ဖျက်ရန် သေချာပါသလား? ညှိနှိုင်းမှုမှတ်တမ်းအားလုံး ပျက်ပြယ်သွားပါမည်။`
        })}
        confirmText={tx({ th: 'ลบประเภทงาน', en: 'Delete Lead', my: 'ဖျက်ပစ်ပါ' })}
        loading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
