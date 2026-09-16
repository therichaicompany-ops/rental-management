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
  CONTRACT_STATUS_LABELS,
} from '@/lib/types/contracts-payments'
import type { UserProfile } from '@/lib/types/auth'
import { createContractAction, updateContractAction } from '@/lib/actions/contracts'

interface ContractFormProps {
  initialData?: ContractWithRelations | null
  locations: { id: string; location_name: string; location_code: string; province: string }[]
  landlords: { id: string; name: string; company_name: string | null; landlord_code: string }[]
  customers: { id: string; name: string; company_name: string | null; customer_code: string }[]
  leads?: { id: string; lead_no: string; lead_name: string }[]
  staffProfiles?: Pick<UserProfile, 'id' | 'full_name' | 'email'>[]
}

export function ContractForm({
  initialData,
  locations,
  landlords,
  customers,
  leads = [],
  staffProfiles = [],
}: ContractFormProps) {
  const router = useRouter()
  const isEdit = Boolean(initialData)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

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
    assigned_to: initialData?.assigned_to || '',
    note: initialData?.note || '',
  }

  const {
    register,
    handleSubmit,
    watch,
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
      if (isEdit && initialData) {
        const res = await updateContractAction(initialData.id, values)
        if (!res.success) {
          setErrorMsg(res.error || 'เกิดข้อผิดพลาดในการอัปเดตสัญญา')
          return
        }
        router.push(`/contracts/${initialData.id}`)
      } else {
        const res = await createContractAction(values)
        if (!res.success) {
          setErrorMsg(res.error || 'เกิดข้อผิดพลาดในการสร้างสัญญา')
          return
        }
        const createdId = (res.data as { id?: string })?.id
        router.push(createdId ? `/contracts/${createdId}` : '/contracts')
      }
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่คาดคิด'
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
              {isEdit ? `แก้ไขสัญญา: ${initialData?.contract_no}` : 'สร้างสัญญาเช่าใหม่'}
            </h1>
            <p className="text-xs text-slate-500">
              กรอกข้อมูลสัญญาเช่า เงื่อนไขทางการเงิน และการหักภาษี ณ ที่จ่าย
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" type="button">
            <Link href={isEdit && initialData ? `/contracts/${initialData.id}` : '/contracts'}>
              ยกเลิก
            </Link>
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary-600 hover:bg-primary-700 text-white min-w-[120px]"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกสัญญา'}
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
              ข้อมูลทั่วไปของสัญญา
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  เลขที่สัญญา (Contract No.)
                </label>
                <Input
                  placeholder="ระบบจะสร้างให้อัตโนมัติหากเว้นว่าง"
                  {...register('contract_no')}
                />
                {errors.contract_no && (
                  <p className="text-xs text-rose-600 mt-1">{errors.contract_no.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  วันที่ทำสัญญา
                </label>
                <Input type="date" {...register('contract_date')} />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  สถานที่ / สาขา <span className="text-rose-500">*</span>
                </label>
                <Select {...register('location_id')}>
                  <option value="">-- เลือกสถานที่ / สาขา --</option>
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
                  ผู้ให้เช่า (Landlord)
                </label>
                <Select {...register('landlord_id')}>
                  <option value="">-- ไม่ระบุ --</option>
                  {landlords.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name || l.company_name} [{l.landlord_code}]
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ลูกค้า / ผู้เช่า (Customer)
                </label>
                <Select {...register('customer_id')}>
                  <option value="">-- ไม่ระบุ --</option>
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
                    เชื่อมโยงกับ Lead การเจรจา (ถ้ามี)
                  </label>
                  <Select {...register('lead_id')}>
                    <option value="">-- ไม่เชื่อมโยง --</option>
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
              ระยะเวลาสัญญาและงวดชำระ
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  วันเริ่มต้นสัญญา <span className="text-rose-500">*</span>
                </label>
                <Input type="date" {...register('start_date')} />
                {errors.start_date && (
                  <p className="text-xs text-rose-600 mt-1">{errors.start_date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  วันสิ้นสุดสัญญา <span className="text-rose-500">*</span>
                </label>
                <Input type="date" {...register('end_date')} />
                {errors.end_date && (
                  <p className="text-xs text-rose-600 mt-1">{errors.end_date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  วันครบกำหนดชำระทุกเดือน (วันที่)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="เช่น 5 หรือ 25"
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
              เงื่อนไขทางการเงินและภาษีหัก ณ ที่จ่าย
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ค่าเช่าต่อเดือน (บาท) <span className="text-rose-500">*</span>
                </label>
                <Input type="number" step="0.01" min="0" {...register('monthly_rent')} />
                {errors.monthly_rent && (
                  <p className="text-xs text-rose-600 mt-1">{errors.monthly_rent.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ค่าบริการอื่นๆ ต่อเดือน (บาท)
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
                  เงินมัดจำ/ประกัน (บาท)
                </label>
                <Input type="number" step="0.01" min="0" {...register('deposit_amount')} />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ค่าเช่าล่วงหน้า (บาท)
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
                    หักภาษี ณ ที่จ่าย (Withholding Tax - WHT)
                  </label>
                </div>

                {watchedWhtEnabled && (
                  <div className="pl-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        อัตราภาษีหัก ณ ที่จ่าย (%)
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
                        (อัตราปกติ: ค่าเช่าอสังหาริมทรัพย์ 5%, ค่าบริการ 3%)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Branch Checklist & Additional */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">
              การดำเนินการเปิดสาขา & หมายเหตุ
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-700 p-2 rounded-lg border border-slate-100 bg-slate-50/50">
                <input
                  type="checkbox"
                  {...register('need_branch_registration')}
                  className="rounded border-slate-300 text-primary-600"
                />
                <span>ต้องจดทะเบียนเปิดสาขา</span>
              </label>

              <label className="flex items-center gap-2 text-sm text-slate-700 p-2 rounded-lg border border-slate-100 bg-slate-50/50">
                <input
                  type="checkbox"
                  {...register('need_vat_registration')}
                  className="rounded border-slate-300 text-primary-600"
                />
                <span>ต้องจดทะเบียนภาษีมูลค่าเพิ่ม (VAT)</span>
              </label>

              <label className="flex items-center gap-2 text-sm text-slate-700 p-2 rounded-lg border border-slate-100 bg-slate-50/50">
                <input
                  type="checkbox"
                  {...register('need_employer_change')}
                  className="rounded border-slate-300 text-primary-600"
                />
                <span>ต้องขึ้นทะเบียน/เปลี่ยนนายจ้าง</span>
              </label>

              <label className="flex items-center gap-2 text-sm text-slate-700 p-2 rounded-lg border border-slate-100 bg-slate-50/50">
                <input
                  type="checkbox"
                  {...register('need_signboard')}
                  className="rounded border-slate-300 text-primary-600"
                />
                <span>ต้องขออนุญาตป้ายโฆษณา/ป้ายสาขา</span>
              </label>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                หมายเหตุเพิ่มเติม
              </label>
              <Textarea
                rows={3}
                placeholder="ระบุข้อตกลงพิเศษ หรือรายละเอียดการส่งมอบพื้นที่..."
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
              สถานะและผู้รับผิดชอบ
            </h2>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                สถานะสัญญา
              </label>
              <Select {...register('status')}>
                {Object.entries(CONTRACT_STATUS_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>

            {staffProfiles.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ผู้รับผิดชอบสัญญา
                </label>
                <Select {...register('assigned_to')}>
                  <option value="">-- ไม่ระบุผู้รับผิดชอบ --</option>
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
                สรุปประมาณการค่างวดรายเดือน
              </h3>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>ค่าเช่ารายเดือน:</span>
                <span className="font-semibold text-white">
                  ฿{Number(watchedRent).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {Number(watchedService) > 0 && (
                <div className="flex justify-between">
                  <span>ค่าบริการอื่นๆ:</span>
                  <span className="font-semibold text-white">
                    ฿{Number(watchedService).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              <div className="flex justify-between border-t border-slate-700/60 pt-2 text-slate-200">
                <span>ยอดรวมก่อนหัก (Gross):</span>
                <span className="font-bold text-white">
                  ฿{calcGross.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between text-rose-300">
                <span className="flex items-center gap-1">
                  <span>หัก ณ ที่จ่าย (WHT {watchedWhtEnabled ? `${watchedWhtRate}%` : '0%'}):</span>
                </span>
                <span className="font-semibold">
                  - ฿{calcWht.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between border-t border-slate-700 pt-3 text-emerald-400 font-bold text-sm">
                <span>ยอดสุทธิต่อเดือน (Net):</span>
                <span>
                  ฿{calcNet.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 border-t border-slate-700/60 pt-3 leading-relaxed">
              * การคำนวณข้างต้นจะถูกนำไปใช้เป็นค่าเริ่มต้นสำหรับตารางงวดชำระค่าเช่า (Payment Schedule) อัตโนมัติ
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
