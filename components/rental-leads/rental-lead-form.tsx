'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Save, Trash2, Loader2, Home, DollarSign, CheckSquare, Clock, Building } from 'lucide-react'
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
import {
  createRentalLeadAction,
  updateRentalLeadAction,
  deleteRentalLeadAction,
} from '@/lib/actions/rental-leads'
import type { Customer, Landlord, Location } from '@/lib/types/master-data'
import type { UserProfile, UserRole } from '@/lib/types/auth'
import { hasFullAccess, canWrite } from '@/lib/auth/permissions'

const TM30_TAG = '[แจ้งที่พักอาศัยคนต่างด้าว (ตม.30)]'

interface RentalLeadFormProps {
  initialData?: RentalLead
  locations: Pick<Location, 'id' | 'location_code' | 'location_name' | 'province'>[]
  customers: Pick<Customer, 'id' | 'customer_code' | 'name' | 'company_name'>[]
  landlords: Pick<Landlord, 'id' | 'landlord_code' | 'name' | 'company_name'>[]
  staffProfiles: Pick<UserProfile, 'id' | 'full_name' | 'email'>[]
  userRole: UserRole
}

export function RentalLeadForm({
  initialData,
  locations,
  customers,
  landlords,
  staffProfiles,
  userRole,
}: RentalLeadFormProps) {
  const router = useRouter()
  const isEdit = Boolean(initialData)
  const allowEdit = canWrite(userRole)
  const allowDelete = hasFullAccess(userRole) && isEdit

  const [isSubmitting, startTransition] = React.useTransition()
  const [serverError, setServerError] = React.useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const [needForeignResident, setNeedForeignResident] = React.useState<boolean>(() => {
    const rawNote = initialData?.note || ''
    return rawNote.includes(TM30_TAG) || rawNote.includes('แจ้งที่พักอาศัยคนต่างด้าว')
  })

  const {
    register,
    handleSubmit,
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
      status: (initialData?.status as LeadStatus) ?? 'new',
      assigned_to: initialData?.assigned_to ?? '',
      next_follow_up_date: initialData?.next_follow_up_date ?? '',
      note: (initialData?.note ?? '').replace(TM30_TAG, '').trim(),
    },
  })

  const onSubmit = (values: RentalLeadFormValues) => {
    if (!allowEdit) return
    setServerError(null)

    startTransition(async () => {
      const cleanNote = (values.note || '').replace(TM30_TAG, '').trim()
      const finalNote = needForeignResident
        ? (cleanNote ? `${cleanNote}\n${TM30_TAG}` : TM30_TAG)
        : cleanNote

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

      router.push(isEdit && initialData ? `/rental-leads/${initialData.id}` : '/rental-leads')
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
          <Link href={isEdit ? `/rental-leads/${initialData?.id}` : '/rental-leads'}>
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-slate-500 hover:text-slate-900">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {isEdit ? 'แก้ไขข้อมูลประเภทงาน' : 'เพิ่มประเภทงานใหม่'}
            </h1>
            <p className="text-xs text-slate-500">
              {isEdit
                ? `รหัสประเภทงาน (Lead): ${initialData?.lead_no}`
                : 'กรอกรายละเอียดเพื่อเริ่มต้นติดตามโอกาสและเจรจาพื้นที่'}
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
            ลบประเภทงาน
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
              ข้อมูลประเภทงาน
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="lead_name">ชื่อประเภทงาน / โครงการ *</Label>
                <Input
                  id="lead_name"
                  placeholder="เช่น เช่าพื้นที่เปิดสาขาใหม่ - อาคารสยามสแควร์วัน"
                  disabled={!allowEdit}
                  {...register('lead_name')}
                />
                {errors.lead_name && (
                  <p className="text-xs text-red-500">{errors.lead_name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lead_no">รหัสประเภทงาน (Lead)</Label>
                <Input
                  id="lead_no"
                  placeholder="เช่น LEAD-001 (ปล่อยว่างให้ระบบสร้างอัตโนมัติ)"
                  disabled={!allowEdit}
                  {...register('lead_no')}
                />
                {errors.lead_no && (
                  <p className="text-xs text-red-500">{errors.lead_no.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="source">วัตถุประสงค์</Label>
                <Select id="source" disabled={!allowEdit} {...register('source')}>
                  <option value="">-- เลือกวัตถุประสงค์ --</option>
                  <option value="เช่าเพื่อกิจการของบริษัท">เช่าเพื่อกิจการของบริษัท</option>
                  <option value="เช่าซื้อ">เช่าซื้อ</option>
                  <option value="เช่าระยะยาว">เช่าระยะยาว</option>
                  <option value="ขายของ">ขายของ</option>
                  {initialData?.source && !['เช่าเพื่อกิจการของบริษัท', 'เช่าซื้อ', 'เช่าระยะยาว', 'ขายของ'].includes(initialData.source) && (
                    <option value={initialData.source}>{initialData.source}</option>
                  )}
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="assigned_to">ผู้รับผิดชอบ</Label>
                <Select id="assigned_to" disabled={!allowEdit} {...register('assigned_to')}>
                  <option value="">-- เลือกผู้รับผิดชอบ --</option>
                  {staffProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name || p.email}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status">สถานะ *</Label>
                <Select id="status" disabled={!allowEdit} {...register('status')}>
                  {Object.entries(LEAD_STATUS_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          {/* Section 2: Linked Master Data */}
          <div>
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
              ความเชื่อมโยงกับ Master Data
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="location_id">สถานที่ / สาขา</Label>
                <Select id="location_id" disabled={!allowEdit} {...register('location_id')}>
                  <option value="">-- เลือกสถานที่ --</option>
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
                <Label htmlFor="customer_id">ลูกค้า (ผู้เช่า)</Label>
                <Select id="customer_id" disabled={!allowEdit} {...register('customer_id')}>
                  <option value="">-- เลือกลูกค้า --</option>
                  {customers.map((cust) => (
                    <option key={cust.id} value={cust.id}>
                      {cust.name || cust.company_name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="landlord_id">ผู้ให้เช่า (เจ้าของพื้นที่)</Label>
                <Select id="landlord_id" disabled={!allowEdit} {...register('landlord_id')}>
                  <option value="">-- เลือกผู้ให้เช่า --</option>
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
          <div>
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              ข้อเสนอทางการเงิน (Proposed Pricing)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="proposed_monthly_rent">ค่าเช่าเสนอ (บาท/เดือน)</Label>
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
                <Label htmlFor="proposed_deposit_amount">เงินประกัน / มัดจำ (บาท)</Label>
                <Input
                  id="proposed_deposit_amount"
                  type="number"
                  placeholder="0.00"
                  disabled={!allowEdit}
                  {...register('proposed_deposit_amount')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="proposed_advance_rent_amount">ค่าเช่าล่วงหน้า (บาท)</Label>
                <Input
                  id="proposed_advance_rent_amount"
                  type="number"
                  placeholder="0.00"
                  disabled={!allowEdit}
                  {...register('proposed_advance_rent_amount')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="proposed_service_amount">ค่าบริการส่วนกลาง (บาท/เดือน)</Label>
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

          {/* Section 4: Target Dates & Next Follow-up */}
          <div>
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              กำหนดการและวันนัดหมาย
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="first_contact_date">วันที่ติดต่อครั้งแรก</Label>
                <Input
                  id="first_contact_date"
                  type="date"
                  disabled={!allowEdit}
                  {...register('first_contact_date')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="expected_start_date">คาดว่าจะเริ่มสัญญา</Label>
                <Input
                  id="expected_start_date"
                  type="date"
                  disabled={!allowEdit}
                  {...register('expected_start_date')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="expected_open_date">เป้าหมายเปิดสาขา</Label>
                <Input
                  id="expected_open_date"
                  type="date"
                  disabled={!allowEdit}
                  {...register('expected_open_date')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="next_follow_up_date">นัดหมายติดตามผลถัดไป</Label>
                <Input
                  id="next_follow_up_date"
                  type="date"
                  disabled={!allowEdit}
                  className="border-amber-300 bg-amber-50/30"
                  {...register('next_follow_up_date')}
                />
              </div>
            </div>
          </div>

          {/* Section 5: Registration Requirements (Checkboxes) */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-indigo-500" />
              รายการดำเนินการทางทะเบียนและเอกสาร
            </h2>

            {/* หมวดที่ 1: สำหรับสาขา */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <Building className="h-3.5 w-3.5 text-slate-500" />
                <span>สำหรับสาขา / สถานประกอบการ</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    disabled={!allowEdit}
                    className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    {...register('need_branch_registration')}
                  />
                  <span className="text-xs font-medium text-slate-700">ต้องจดทะเบียนสาขา</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    disabled={!allowEdit}
                    className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    {...register('need_vat_registration')}
                  />
                  <span className="text-xs font-medium text-slate-700">ต้องจดภาษีมูลค่าเพิ่ม (VAT)</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    disabled={!allowEdit}
                    className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    {...register('need_employer_change')}
                  />
                  <span className="text-xs font-medium text-slate-700">ต้องเปลี่ยนนายจ้างประกันสังคม</span>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    disabled={!allowEdit}
                    className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    {...register('need_signboard')}
                  />
                  <span className="text-xs font-medium text-slate-700">ต้องขออนุญาตติดตั้งป้ายร้าน</span>
                </label>
              </div>
            </div>

            {/* หมวดที่ 2: สำหรับบ้าน / ที่พักอาศัย */}
            <div className="space-y-2 pt-2 border-t border-dashed border-slate-200">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <Home className="h-3.5 w-3.5 text-amber-600" />
                <span>สำหรับบ้าน / ที่พักอาศัย</span>
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
                    <span className="text-xs font-semibold text-slate-800">แจ้งที่พักอาศัยคนต่างด้าว</span>
                    <p className="text-[10px] text-slate-500">แจ้ง ตม.30 ภายใน 24 ชม.</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Section 6: Notes */}
          <div>
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
              หมายเหตุเพิ่มเติม
            </h2>
            <Textarea
              id="note"
              placeholder="เงื่อนไขพิเศษ ข้อกำหนดเจ้าของพื้นที่ หรือประวัติการพูดคุยเบื้องต้น..."
              rows={3}
              disabled={!allowEdit}
              {...register('note')}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Link href={isEdit ? `/rental-leads/${initialData?.id}` : '/rental-leads'}>
            <Button type="button" variant="outline">
              ยกเลิก
            </Button>
          </Link>
          {allowEdit && (
            <Button type="submit" disabled={isSubmitting} className="gap-2 min-w-[120px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isEdit ? 'บันทึกการแก้ไข' : 'บันทึกงานเช่า'}
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
        title="ยืนยันการลบข้อมูลประเภทงาน"
        description={`คุณแน่ใจหรือไม่ว่าต้องการลบประเภทงาน "${initialData?.lead_name}"? ข้อมูลการเจรจาทั้งหมดจะถูกลบไปด้วย และไม่สามารถกู้คืนได้`}
        confirmText="ลบประเภทงาน"
        loading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
