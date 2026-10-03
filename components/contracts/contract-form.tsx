'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  Save,
  Calendar,
  DollarSign,
  FileText,
  Calculator,
  Building,
  Home,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import {
  rentalContractSchema,
  type RentalContractFormValues,
  type ContractWithRelations,
  type ContractStatus,
} from '@/lib/types/contracts-payments'
import type { UserProfile, UserRole } from '@/lib/types/auth'
import { createContractAction, updateContractAction } from '@/lib/actions/contracts'
import { useI18n } from '@/lib/i18n/context'
import { labelOf } from '@/lib/i18n/tx'
import { CONTRACT_STATUS_TRI, W } from '@/lib/i18n/labels'
import {
  parseLeadMetadata,
  buildLeadMetadataNote,
  calculateMonthlyInstallment,
  type LeadFinancialTerms,
  type ContractPartyRole,
} from '@/lib/utils/lead-metadata'

interface ContractFormProps {
  initialData?: ContractWithRelations | null
  locations: { id: string; location_name: string; location_code: string; province: string }[]
  landlords: { id: string; name: string; company_name: string | null; landlord_code: string }[]
  customers: { id: string; name: string; company_name: string | null; customer_code: string }[]
  leads?: { id: string; lead_no: string; lead_name: string }[]
  staffProfiles?: Pick<UserProfile, 'id' | 'full_name' | 'email'>[]
  userRole?: UserRole
}

export function ContractForm({
  initialData,
  locations,
  landlords,
  customers,
  leads = [],
  staffProfiles = [],
  userRole,
}: ContractFormProps) {
  const router = useRouter()
  const { tx, locale, intl } = useI18n()
  const money = (n: number, frac = 2) =>
    n.toLocaleString(intl, { minimumFractionDigits: frac })
  const isEdit = Boolean(initialData)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const isOperation = userRole === 'operation'

  const TM30_TAG = '[แจ้งที่พักอาศัยคนต่างด้าว (ตม.30)]'

  const parsedMeta = React.useMemo(
    () => parseLeadMetadata(initialData?.note),
    [initialData?.note]
  )

  const [propertyType, setPropertyType] = React.useState<'house' | 'branch'>(() => {
    if (isOperation) return 'branch'
    if (parsedMeta.financial.property_type) return parsedMeta.financial.property_type

    const locName = initialData?.locations?.location_name || ''
    const isBranchLoc = locName.includes('สาขา') || locName.toLowerCase().includes('branch')
    const isBranchFlags =
      Boolean(initialData?.need_branch_registration) ||
      Boolean(initialData?.need_vat_registration) ||
      Boolean(initialData?.need_signboard) ||
      Boolean(initialData?.need_employer_change) ||
      Boolean(initialData?.need_excise_permit)

    if (isBranchLoc || isBranchFlags) {
      return 'branch'
    }

    if (
      parsedMeta.isHouse ||
      locName.toLowerCase().includes('sense') ||
      locName.toLowerCase().includes('house') ||
      (locName.toLowerCase().includes('บ้าน') && !locName.includes('สาขา'))
    ) {
      return 'house'
    }
    return 'branch'
  })

  const [contractPartyRole, setContractPartyRole] = React.useState<ContractPartyRole>(() => {
    if (parsedMeta.financial.contract_party_role) {
      return parsedMeta.financial.contract_party_role
    }
    if (parsedMeta.isHouse || propertyType === 'house') {
      return 'payable'
    }
    return 'payable'
  })

  const [propertyPrice, setPropertyPrice] = React.useState<number | null>(
    parsedMeta.financial.property_price ?? null
  )
  const [downPayment, setDownPayment] = React.useState<number | null>(
    parsedMeta.financial.down_payment ?? (initialData ? Number(initialData.deposit_amount) : null)
  )
  const [interestRate, setInterestRate] = React.useState<number | null>(
    parsedMeta.financial.interest_rate ?? null
  )
  const [installmentYears, setInstallmentYears] = React.useState<number | null>(
    parsedMeta.financial.installment_years ?? null
  )

  const estimatedMonthlyInstallment = React.useMemo(() => {
    return calculateMonthlyInstallment(
      propertyPrice,
      downPayment,
      interestRate,
      installmentYears
    )
  }, [propertyPrice, downPayment, interestRate, installmentYears])

  const [needForeignResident, setNeedForeignResident] = React.useState<boolean>(() => {
    return (
      parsedMeta.hasForeignResident ||
      initialData?.note?.includes(TM30_TAG) ||
      initialData?.note?.includes('แจ้งที่พักอาศัยคนต่างด้าว') ||
      false
    )
  })

  const defaultValues: RentalContractFormValues = {
    contract_no: initialData?.contract_no || '',
    lead_id: initialData?.lead_id || '',
    location_id: initialData?.location_id || (locations[0]?.id ?? ''),
    customer_id: initialData?.customer_id || '',
    landlord_id: initialData?.landlord_id || '',
    contract_date: initialData?.contract_date || new Date().toISOString().split('T')[0],
    start_date: initialData?.start_date || '',
    end_date: initialData?.end_date || '',
    monthly_rent: initialData ? Number(initialData.monthly_rent) : 0,
    deposit_amount: initialData ? Number(initialData.deposit_amount) : 0,
    advance_rent_amount: initialData ? Number(initialData.advance_rent_amount) : 0,
    other_service_amount: initialData ? Number(initialData.other_service_amount) : 0,
    payment_due_day: initialData?.payment_due_day ?? 5,
    wht_enabled: initialData?.wht_enabled ?? false,
    wht_rate: initialData ? Number(initialData.wht_rate) : 5,
    recurring_rent_enabled: initialData?.recurring_rent_enabled ?? true,
    status: (initialData?.status as ContractStatus) || 'draft',
    need_branch_registration: initialData?.need_branch_registration ?? true,
    need_vat_registration: initialData?.need_vat_registration ?? false,
    need_employer_change: initialData?.need_employer_change ?? false,
    need_signboard: initialData?.need_signboard ?? true,
    need_excise_permit: initialData?.need_excise_permit ?? false,
    assigned_to: initialData?.assigned_to || '',
    note: parsedMeta.cleanNote,
  }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RentalContractFormValues>({
    resolver: zodResolver(rentalContractSchema),
    defaultValues,
  })

  // Watch for calculation preview
  const watchedRent = watch('monthly_rent') || 0
  const watchedService = watch('other_service_amount') || 0
  const watchedWhtEnabled = watch('wht_enabled')
  const watchedWhtRate = watch('wht_rate') || 0

  const calcGross = Number(watchedRent) + Number(watchedService)
  const calcWht = watchedWhtEnabled
    ? Math.round(Number(watchedRent) * (Number(watchedWhtRate) / 100) * 100) / 100
    : 0
  const calcNet = calcGross - calcWht

  const onSubmit = async (values: RentalContractFormValues) => {
    setErrorMsg(null)
    try {
      const isHouseType = propertyType === 'house'
      const financialTerms: LeadFinancialTerms = {
        property_type: propertyType,
        contract_party_role: contractPartyRole,
        property_price: isHouseType ? propertyPrice : null,
        down_payment: isHouseType ? downPayment : null,
        interest_rate: isHouseType ? interestRate : null,
        installment_years: isHouseType ? installmentYears : null,
        payment_due_day: Number(values.payment_due_day) || 5,
        contract_end_date: values.end_date || null,
      }

      const finalNote = buildLeadMetadataNote(
        values.note || '',
        needForeignResident,
        financialTerms
      )

      const payload: RentalContractFormValues = {
        ...values,
        deposit_amount: propertyType === 'house' && downPayment !== null ? downPayment : values.deposit_amount,
        need_branch_registration: propertyType === 'house' ? false : values.need_branch_registration,
        need_vat_registration: propertyType === 'house' ? false : values.need_vat_registration,
        need_employer_change: propertyType === 'house' ? false : values.need_employer_change,
        need_signboard: propertyType === 'house' ? false : values.need_signboard,
        need_excise_permit: propertyType === 'house' ? false : values.need_excise_permit,
        note: finalNote || null,
      }

      if (isEdit && initialData) {
        const res = await updateContractAction(initialData.id, payload)
        if (!res.success) {
          setErrorMsg(res.error || tx({ th: 'เกิดข้อผิดพลาดในการอัปเดตสัญญา', en: 'Error updating contract', my: 'စာချုပ်ပြင်ဆင်ရာတွင် အမှားဖြစ်ပွား' }))
          return
        }
        router.push(`/contracts/${initialData.id}`)
      } else {
        const res = await createContractAction(payload)
        if (!res.success) {
          setErrorMsg(res.error || tx({ th: 'เกิดข้อผิดพลาดในการสร้างสัญญา', en: 'Error creating contract', my: 'စာချုပ်ဖန်တီးရာတွင် အမှားဖြစ်ပွား' }))
          return
        }
        const createdId = (res.data as { id?: string })?.id
        router.push(createdId ? `/contracts/${createdId}` : '/contracts')
      }
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : tx(W.saveError)
      setErrorMsg(msg)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="h-9 w-9 p-0">
            <Link href={isEdit && initialData ? `/contracts/${initialData.id}` : '/contracts'}>
              <ArrowLeft className="h-5 w-5 text-slate-500" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {isEdit
                ? `${tx({ th: 'แก้ไขสัญญา', en: 'Edit Contract', my: 'စာချုပ်ပြင်ဆင်' })}: ${initialData?.contract_no}`
                : tx({ th: 'สร้างสัญญาเช่าใหม่', en: 'New Rental Contract', my: 'ငှားရမ်းစာချုပ်အသစ် ဖန်တီး' })}
            </h1>
            <p className="text-xs text-slate-500">
              {tx({
                th: 'กรอกข้อมูลสัญญาเช่า เงื่อนไขทางการเงิน และการหักภาษี ณ ที่จ่าย',
                en: 'Enter contract details, financial terms, and withholding tax settings',
                my: 'စာချုပ်အချက်အလက်၊ ငွေကြေးသတ်မှတ်ချက်နှင့် အခွန်ဖြတ်တောက်မှု ထည့်သွင်းပါ',
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" type="button">
            <Link href={isEdit && initialData ? `/contracts/${initialData.id}` : '/contracts'}>
              {tx({ th: 'ยกเลิก', en: 'Cancel', my: 'မလုပ်တော့' })}
            </Link>
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary-600 hover:bg-primary-700 text-white min-w-[120px]"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting
              ? tx({ th: 'กำลังบันทึก...', en: 'Saving...', my: 'သိမ်းဆည်းနေသည်...' })
              : tx({ th: 'บันทึกสัญญา', en: 'Save Contract', my: 'စာချုပ်သိမ်းမည်' })}
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main 2 Columns: Form Fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: General Info */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary-600" />
              {tx({ th: 'ข้อมูลทั่วไปของสัญญา', en: 'General Information', my: 'စာချုပ် အထွေထွေ အချက်အလက်' })}
            </h2>

            {/* Property Type Selector: House vs Branch */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                {tx({ th: 'รูปแบบสัญญา / ประเภทสถานที่', en: 'Contract Model / Property Type', my: 'စာချုပ်ပုံစံ / နေရာအမျိုးအစား' })} <span className="text-rose-500">*</span>
              </label>
              <div className={`grid ${isOperation ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'} gap-3`}>
                {!isOperation && (
                  <button
                    type="button"
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
                        {tx({ th: 'เช่าซื้อ, ซื้อบ้าน, แจ้ง ตม.30', en: 'Hire-purchase, House, TM.30', my: 'အရစ်ကျဝယ်၊ အိမ်၊ TM.30 အကြောင်းကြား' })}
                      </div>
                    </div>
                  </button>
                )}

                <button
                  type="button"
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
                      {tx({ th: 'เช่าเพื่อธุรกิจ, เปิดสาขาบริษัท', en: 'Commercial lease, company branch', my: 'စီးပွားရေးငှားရမ်းမှု၊ ဆိုင်ခွဲဖွင့်' })}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Contract Direction / Party Role Selector */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                {tx({ th: 'รูปแบบคู่สัญญาและทิศทางการชำระ (Payment Direction)', en: 'Contract Parties & Payment Direction', my: 'စာချုပ်ဝင်များနှင့် ပေးချေမှု ဦးတည်ချက်' })} <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setContractPartyRole('payable')}
                  className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    contractPartyRole === 'payable'
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm ring-2 ring-indigo-300'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Building className={`h-5 w-5 shrink-0 mt-0.5 ${contractPartyRole === 'payable' ? 'text-white' : 'text-indigo-500'}`} />
                  <div>
                    <div className="text-xs font-bold">{tx({ th: 'บริษัทเช่ากับเจ้าของ (รายจ่าย)', en: 'Company rents from Owner (Payable)', my: 'ကုမ္ပဏီက ပိုင်ရှင်ထံမှ ငှား (အသုံးစရိတ်)' })}</div>
                    <div className={`text-[11px] mt-0.5 leading-relaxed ${contractPartyRole === 'payable' ? 'text-indigo-100' : 'text-slate-500'}`}>
                      {tx({ th: 'บริษัทจ่ายค่าเช่าให้เจ้าของ (ตารางค่างวด: มีเฉพาะ "จ่ายเจ้าของ")', en: 'Company pays rent to owner (Schedule: Pay Owner only)', my: 'ကုမ္ပဏီက ပိုင်ရှင်ထံ ငှားခပေး (ဇယား: ပိုင်ရှင်ထံပေး သာ)' })}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setContractPartyRole('receivable')}
                  className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    contractPartyRole === 'receivable'
                      ? 'bg-teal-600 text-white border-teal-700 shadow-sm ring-2 ring-teal-300'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <User className={`h-5 w-5 shrink-0 mt-0.5 ${contractPartyRole === 'receivable' ? 'text-white' : 'text-teal-500'}`} />
                  <div>
                    <div className="text-xs font-bold">{tx({ th: 'ลูกค้าเช่ากับบริษัท (รายรับ)', en: 'Customer rents from Company (Receivable)', my: 'ဖောက်သည်က ကုမ္ပဏီထံမှ ငှား (ဝင်ငွေ)' })}</div>
                    <div className={`text-[11px] mt-0.5 leading-relaxed ${contractPartyRole === 'receivable' ? 'text-teal-100' : 'text-slate-500'}`}>
                      {tx({ th: 'ลูกค้านำส่งค่าเช่าให้บริษัท (ตารางค่างวด: มีเฉพาะ "รับจากลูกค้า")', en: 'Customer pays rent to company (Schedule: From Customer only)', my: 'ဖောက်သည်က ကုမ္ပဏီထံ ငှားခပေး (ဇယား: ဖောက်သည်ထံမှလက်ခံ သာ)' })}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {tx({ th: 'เลขที่สัญญา (Contract No.)', en: 'Contract No.', my: 'စာချုပ်နံပါတ်' })}
                </label>
                <Input
                  placeholder={tx({ th: 'ระบบจะสร้างให้อัตโนมัติหากเว้นว่าง', en: 'Auto-generated if left blank', my: 'လွတ်ထားပါက အလိုအလျောက် သတ်မှတ်မည်' })}
                  {...register('contract_no')}
                />
                {errors.contract_no && (
                  <p className="text-xs text-rose-600 mt-1">{errors.contract_no.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {tx({ th: 'วันที่ทำสัญญา', en: 'Contract Date', my: 'စာချုပ်ရက်စွဲ' })}
                </label>
                <Input type="date" {...register('contract_date')} />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {tx(W.location)} <span className="text-rose-500">*</span>
                </label>
                <Select {...register('location_id')}>
                  <option value="">-- {tx({ th: 'เลือกสถานที่ / สาขา', en: 'Select Location / Branch', my: 'နေရာ / ဆိုင်ခွဲ ရွေးပါ' })} --</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.location_name} ({loc.province}) [{loc.location_code}]
                    </option>
                  ))}
                </Select>
                {errors.location_id && (
                  <p className="text-xs text-rose-600 mt-1">{errors.location_id.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {tx({ th: 'ผู้ให้เช่า (Landlord)', en: 'Landlord', my: 'အိမ်ရှင် (Landlord)' })}
                </label>
                <Select {...register('landlord_id')}>
                  <option value="">-- {tx({ th: 'ไม่ระบุ', en: 'Not specified', my: 'မဖော်ပြထား' })} --</option>
                  {landlords.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name || l.company_name} [{l.landlord_code}]
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {tx({ th: 'ลูกค้า / ผู้เช่า (Customer)', en: 'Customer / Tenant', my: 'ဖောက်သည် / အိမ်ငှား' })}
                </label>
                <Select {...register('customer_id')}>
                  <option value="">-- {tx({ th: 'ไม่ระบุ', en: 'Not specified', my: 'မဖော်ပြထား' })} --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.company_name} [{c.customer_code}]
                    </option>
                  ))}
                </Select>
              </div>

              {leads.length > 0 && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {tx({ th: 'เชื่อมโยงกับ Lead การเจรจา (ถ้ามี)', en: 'Link with Rental Lead (optional)', my: 'ညှိနှိုင်း Lead နှင့် ချိတ်ဆက်မည် (ရှိပါက)' })}
                  </label>
                  <Select {...register('lead_id')}>
                    <option value="">-- {tx({ th: 'ไม่เชื่อมโยง', en: 'No link', my: 'မချိတ်ဆက်ပါ' })} --</option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        [{l.lead_no}] {l.lead_name}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Contract Duration */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary-600" />
              {tx({ th: 'ระยะเวลาสัญญาและงวดชำระ', en: 'Contract Duration & Due Date', my: 'စာချုပ်ကာလနှင့် ပေးချေရက်' })}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {tx({ th: 'วันเริ่มต้นสัญญา', en: 'Start Date', my: 'စတင်ရက်' })} <span className="text-rose-500">*</span>
                </label>
                <Input type="date" {...register('start_date')} />
                {errors.start_date && (
                  <p className="text-xs text-rose-600 mt-1">{errors.start_date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {tx({ th: 'วันสิ้นสุดสัญญา', en: 'End Date', my: 'ပြီးဆုံးရက်' })} <span className="text-rose-500">*</span>
                </label>
                <Input type="date" {...register('end_date')} />
                {errors.end_date && (
                  <p className="text-xs text-rose-600 mt-1">{errors.end_date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {tx({ th: 'วันครบกำหนดชำระทุกเดือน (วันที่)', en: 'Monthly Due Day (Day of Month)', my: 'လစဉ် ပေးချေရမည့်ရက်' })}
                </label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  placeholder={tx({ th: 'เช่น 5 หรือ 25', en: 'e.g. 5 or 25', my: 'ဥပမာ ၅ သို့မဟုတ် ၂၅' })}
                  {...register('payment_due_day')}
                />
                {errors.payment_due_day && (
                  <p className="text-xs text-rose-600 mt-1">
                    {errors.payment_due_day.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Financial & WHT */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary-600" />
              {tx({ th: 'เงื่อนไขทางการเงินและภาษีหัก ณ ที่จ่าย', en: 'Financial Terms & WHT', my: 'ငွေကြေးသတ်မှတ်ချက်နှင့် အခွန်ဖြတ်တောက်မှု' })}
            </h2>

            {/* House Terms block */}
            <div className={`p-4 rounded-xl border ${propertyType === 'house' ? 'bg-amber-50/50 border-amber-200 ring-1 ring-amber-300' : 'bg-slate-50 border-slate-200'} space-y-3`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                  <Home className="h-4 w-4 text-amber-600" />
                  {tx({ th: 'ข้อเสนอสำหรับบ้าน / เช่าซื้อ (ราคาบ้าน, เงินดาวน์, ดอกเบี้ย, ระยะเวลาผ่อน)', en: 'House / Hire-purchase Terms (Price, Down Payment, Interest, Period)', my: 'အိမ် / အရစ်ကျဝယ် သတ်မှတ်ချက် (ဈေး၊ ကြိုတင်ငွေ၊ အတိုး၊ ကာလ)' })}
                </span>
                {estimatedMonthlyInstallment > 0 && (
                  <span className="text-xs font-medium text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-300">
                    {tx({ th: 'ยอดผ่อนคำนวณได้:', en: 'Est. installment:', my: 'တွက်ချက်ထားသော အရစ်:' })} <strong className="font-bold">฿{money(estimatedMonthlyInstallment, 0)}</strong> {tx(W.perMonth)}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">{tx({ th: 'ราคาบ้าน (บาท)', en: 'House Price (THB)', my: 'အိမ်ဈေး (ဘတ်)' })}</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="3500000"
                    value={propertyPrice !== null && propertyPrice !== undefined ? propertyPrice : ''}
                    onChange={(e) => setPropertyPrice(e.target.value ? Number(e.target.value) : null)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">{tx({ th: 'เงินดาวน์ (บาท)', en: 'Down Payment (THB)', my: 'ကြိုတင်ငွေ (ဘတ်)' })}</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="500000"
                    value={downPayment !== null && downPayment !== undefined ? downPayment : ''}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : null
                      setDownPayment(val)
                      if (val !== null) setValue('deposit_amount', val)
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">{tx({ th: 'อัตราดอกเบี้ย (% ต่อปี)', en: 'Interest Rate (% p.a.)', my: 'အတိုးနှုန်း (တစ်နှစ်လျှင် %)' })}</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="5.0"
                    value={interestRate !== null && interestRate !== undefined ? interestRate : ''}
                    onChange={(e) => setInterestRate(e.target.value ? Number(e.target.value) : null)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">{tx({ th: 'ระยะเวลาผ่อน (ปี)', en: 'Installment Period (Years)', my: 'အရစ်ကျကာလ (နှစ်)' })}</label>
                  <Input
                    type="number"
                    placeholder="30"
                    value={installmentYears !== null && installmentYears !== undefined ? installmentYears : ''}
                    onChange={(e) => setInstallmentYears(e.target.value ? Number(e.target.value) : null)}
                  />
                </div>
              </div>

              {estimatedMonthlyInstallment > 0 && (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-amber-200/50">
                  <span className="text-slate-500">{tx({ th: 'สามารถนำค่างวดประมาณการไปใส่เป็นค่าเช่าต่อเดือนได้', en: 'Apply estimated installment as monthly rent', my: 'ခန့်မှန်းအရစ်ကို လစဉ်ငှားခအဖြစ် အသုံးပြုနိုင်ပါသည်' })}</span>
                  <button
                    type="button"
                    onClick={() => setValue('monthly_rent', estimatedMonthlyInstallment)}
                    className="text-primary-600 hover:text-primary-700 font-semibold underline cursor-pointer"
                  >
                    {tx({ th: 'ใช้ค่างวดนี้เป็นค่าเช่าต่อเดือน', en: 'Use this as monthly rent', my: 'ဤအရစ်ကို လစဉ်ငှားခအဖြစ် သုံးမည်' })} (฿{money(estimatedMonthlyInstallment, 0)})
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {propertyType === 'house'
                    ? tx({ th: 'ค่างวดผ่อน / ค่าเช่าต่อเดือน (บาท)', en: 'Installment / Monthly Rent (THB)', my: 'အရစ်ကြေး / လစဉ်ငှားခ (ဘတ်)' })
                    : tx({ th: 'ค่าเช่าต่อเดือน (บาท)', en: 'Monthly Rent (THB)', my: 'လစဉ်ငှားခ (ဘတ်)' })}{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <Input type="number" step="0.01" min="0" {...register('monthly_rent')} />
                {errors.monthly_rent && (
                  <p className="text-xs text-rose-600 mt-1">{errors.monthly_rent.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {tx({ th: 'ค่าบริการอื่นๆ ต่อเดือน (บาท)', en: 'Other Monthly Service (THB)', my: 'အခြားလစဉ် ဝန်ဆောင်ခ (ဘတ်)' })}
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('other_service_amount')}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {propertyType === 'house'
                    ? tx({ th: 'เงินดาวน์ / มัดจำ (บาท)', en: 'Down Payment / Deposit (THB)', my: 'ကြိုတင်ငွေ / စရံ (ဘတ်)' })
                    : tx({ th: 'เงินมัดจำ/ประกัน (บาท)', en: 'Security Deposit (THB)', my: 'စရံငွေ / အာမခံငွေ (ဘတ်)' })}
                </label>
                <Input type="number" step="0.01" min="0" {...register('deposit_amount')} />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {tx({ th: 'ค่าเช่าล่วงหน้า (บาท)', en: 'Advance Rent (THB)', my: 'ကြိုတင်ငှားခ (ဘတ်)' })}
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('advance_rent_amount')}
                />
              </div>

              {/* WHT Settings */}
              <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="checkbox"
                    id="wht_enabled"
                    {...register('wht_enabled')}
                    className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label htmlFor="wht_enabled" className="text-sm font-medium text-slate-800">
                    {tx({ th: 'หักภาษี ณ ที่จ่าย (Withholding Tax - WHT)', en: 'Withholding Tax (WHT)', my: 'ဖြတ်တောက်ခွန် (Withholding Tax - WHT)' })}
                  </label>
                </div>

                {watchedWhtEnabled && (
                  <div className="pl-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        {tx({ th: 'อัตราภาษีหัก ณ ที่จ่าย (%)', en: 'WHT Rate (%)', my: 'ဖြတ်တောက်ခွန်နှုန်း (%)' })}
                      </label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          placeholder="5"
                          {...register('wht_rate')}
                        />
                        <span className="text-sm text-slate-500">%</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        ({tx({ th: 'อัตราปกติ: ค่าเช่าอสังหาริมทรัพย์ 5%, ค่าบริการ 3%', en: 'Standard rates: Property rent 5%, Service 3%', my: 'ပုံမှန်နှုန်း: အိမ်ခြံမြေငှား 5%, ဝန်ဆောင်ခ 3%' })})
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Registration Checklist & Additional */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-500" />
              {tx({ th: 'การดำเนินการทางทะเบียน & เอกสาร', en: 'Registrations & Documentation', my: 'မှတ်ပုံတင်ခြင်းနှင့် စာရွက်စာတမ်းများ' })}
            </h2>

            {/* สำหรับสาขา */}
            {propertyType !== 'house' && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Building className="h-3.5 w-3.5 text-slate-500" />
                  <span>{tx({ th: 'สำหรับสาขา / สถานประกอบการ', en: 'For Branch / Business', my: 'ဆိုင်ခွဲ / လုပ်ငန်းဌာန အတွက်' })}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 text-sm text-slate-700 p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      {...register('need_branch_registration')}
                      className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span>{tx({ th: 'ต้องจดทะเบียนเปิดสาขา', en: 'Requires Branch Registration', my: 'ဆိုင်ခွဲမှတ်ပုံတင်ရန် လိုအပ်' })}</span>
                  </label>

                  <label className="flex items-center gap-2 text-sm text-slate-700 p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      {...register('need_vat_registration')}
                      className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span>{tx({ th: 'ต้องจดทะเบียนภาษีมูลค่าเพิ่ม (VAT)', en: 'Requires VAT Registration', my: 'VAT မှတ်ပုံတင်ရန် လိုအပ်' })}</span>
                  </label>

                  <label className="flex items-center gap-2 text-sm text-slate-700 p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      {...register('need_employer_change')}
                      className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span>{tx({ th: 'ต้องขึ้นทะเบียน/เปลี่ยนนายจ้าง', en: 'Requires Employer Change', my: 'အလုပ်ရှင်ပြောင်းလဲရန် လိုအပ်' })}</span>
                  </label>

                  <label className="flex items-center gap-2 text-sm text-slate-700 p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      {...register('need_signboard')}
                      className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span>{tx({ th: 'ต้องขออนุญาตป้ายโฆษณา/ป้ายสาขา', en: 'Requires Signboard Permit', my: 'ဆိုင်းဘုတ်လိုင်စင် လျှောက်ရန် လိုအပ်' })}</span>
                  </label>

                  <label className="flex items-center gap-2 text-sm text-slate-700 p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      {...register('need_excise_permit')}
                      className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span>{tx({ th: 'ต้องยื่นขออนุญาตกรมสรรพสามิต (เหล้า/ยาสูบ)', en: 'Requires Excise Permit (Liquor/Tobacco)', my: 'ယစ်မျိုးခွန်လိုင်စင် (အရက်/ဆေးလိပ်) လိုအပ်' })}</span>
                  </label>

                  <label className="flex items-center gap-2 text-sm text-slate-700 p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 cursor-pointer hover:bg-slate-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={needForeignResident}
                      onChange={(e) => setNeedForeignResident(e.target.checked)}
                      className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div>
                      <span className="font-medium text-slate-800">{tx({ th: 'แจ้งที่พักอาศัยคนต่างด้าว', en: 'Foreign Resident Notification', my: 'နိုင်ငံခြားသား နေထိုင်ရာ အကြောင်းကြားစာ' })}</span>
                      <span className="block text-[11px] text-slate-500">{tx({ th: 'แจ้ง ตม.30 ภายใน 24 ชม.', en: 'TM.30 within 24h', my: '၂၄ နာရီအတွင်း TM.30 တင်ပြ' })}</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* สำหรับบ้าน */}
            {propertyType === 'house' && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Home className="h-3.5 w-3.5 text-amber-600" />
                  <span>{tx(W.houseResidential)}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2.5 text-sm text-slate-700 p-2.5 rounded-lg border border-amber-200 bg-amber-50/40 cursor-pointer hover:bg-amber-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={needForeignResident}
                      onChange={(e) => setNeedForeignResident(e.target.checked)}
                      className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <span className="font-medium text-slate-800">{tx({ th: 'แจ้งที่พักอาศัยคนต่างด้าว', en: 'Foreign Resident Notification', my: 'နိုင်ငံခြားသား နေထိုင်ရာ အကြောင်းကြားစာ' })}</span>
                      <span className="block text-[11px] text-amber-800">{tx({ th: 'แจ้ง ตม.30 ภายใน 24 ชม.', en: 'TM.30 within 24h', my: '၂၄ နာရီအတွင်း TM.30 တင်ပြ' })}</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            <div className="pt-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {tx({ th: 'หมายเหตุเพิ่มเติม', en: 'Additional Notes', my: 'နောက်ထပ် မှတ်ချက်များ' })}
              </label>
              <Textarea
                rows={3}
                placeholder={tx({ th: 'ระบุข้อตกลงพิเศษ หรือรายละเอียดการส่งมอบพื้นที่...', en: 'Special terms or handover details...', my: 'အထူးသဘောတူညီချက်များ သို့မဟုတ် နေရာလွှဲပြောင်းမှု အသေးစိတ်...' })}
                {...register('note')}
              />
            </div>
          </div>
        </div>

        {/* Right Sidebar: Real-time Calculation & Status */}
        <div className="space-y-6">
          {/* Status & Assignment */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
              {tx({ th: 'สถานะและผู้รับผิดชอบ', en: 'Status & Assignment', my: 'အခြေအနေနှင့် တာဝန်ခံ' })}
            </h2>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {tx({ th: 'สถานะสัญญา', en: 'Contract Status', my: 'စာချုပ်အခြေအနေ' })}
              </label>
              <Select {...register('status')}>
                {Object.entries(CONTRACT_STATUS_TRI).map(([val, tri]) => (
                  <option key={val} value={val}>
                    {labelOf(CONTRACT_STATUS_TRI, val, locale)}
                  </option>
                ))}
              </Select>
            </div>

            {staffProfiles.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {tx({ th: 'ผู้รับผิดชอบสัญญา', en: 'Assigned To', my: 'တာဝန်ခံ' })}
                </label>
                <Select {...register('assigned_to')}>
                  <option value="">-- {tx({ th: 'ไม่ระบุผู้รับผิดชอบ', en: 'Unassigned', my: 'တာဝန်ခံ မသတ်မှတ်' })} --</option>
                  {staffProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name || p.email || p.id}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </div>

          {/* Real-time Calculation Summary Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-xl shadow-md space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-700 pb-3">
              <Calculator className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-semibold tracking-wide">
                {tx({ th: 'สรุปประมาณการค่างวดรายเดือน', en: 'Estimated Monthly Breakdown', my: 'လစဉ်ခန့်မှန်းခြေ အကျဉ်းချုပ်' })}
              </h3>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>{tx({ th: 'ค่าเช่ารายเดือน:', en: 'Monthly Rent:', my: 'လစဉ်ငှားခ:' })}</span>
                <span className="font-semibold text-white">
                  ฿{money(Number(watchedRent))}
                </span>
              </div>

              {Number(watchedService) > 0 && (
                <div className="flex justify-between">
                  <span>{tx({ th: 'ค่าบริการอื่นๆ:', en: 'Other Service:', my: 'အခြားဝန်ဆောင်ခ:' })}</span>
                  <span className="font-semibold text-white">
                    ฿{money(Number(watchedService))}
                  </span>
                </div>
              )}

              <div className="flex justify-between border-t border-slate-700/60 pt-2 text-slate-200">
                <span>{tx({ th: 'ยอดรวมก่อนหัก (Gross):', en: 'Gross Total:', my: 'စုစုပေါင်း (Gross):' })}</span>
                <span className="font-bold text-white">
                  ฿{money(calcGross)}
                </span>
              </div>

              <div className="flex justify-between text-rose-300">
                <span className="flex items-center gap-1">
                  <span>{tx({ th: 'หัก ณ ที่จ่าย', en: 'WHT', my: 'ဖြတ်တောက်ခွန်' })} ({watchedWhtEnabled ? `${watchedWhtRate}%` : '0%'}):</span>
                </span>
                <span className="font-semibold">
                  - ฿{money(calcWht)}
                </span>
              </div>

              <div className="flex justify-between border-t border-slate-700 pt-3 text-emerald-400 font-bold text-sm">
                <span>{tx({ th: 'ยอดสุทธิต่อเดือน (Net):', en: 'Net per Month:', my: 'လစဉ် အသားတင် (Net):' })}</span>
                <span>
                  ฿{money(calcNet)}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 border-t border-slate-700/60 pt-3 leading-relaxed">
              * {tx({
                th: 'การคำนวณข้างต้นจะถูกนำไปใช้เป็นค่าเริ่มต้นสำหรับตารางงวดชำระค่าเช่า (Payment Schedule) อัตโนมัติ',
                en: 'This calculation will be used as the default for the automated Payment Schedule.',
                my: 'အထက်ပါတွက်ချက်မှုကို ငွေပေးချေမှုဇယား (Payment Schedule) အတွက် မူလအဖြစ် အသုံးပြုပါမည်။',
              })}
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
