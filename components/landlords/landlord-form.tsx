'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useI18n } from '@/lib/i18n/context'
import { W } from '@/lib/i18n/labels'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Save, Trash2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  landlordSchema,
  type LandlordFormValues,
  type Landlord,
} from '@/lib/types/master-data'
import {
  createLandlordAction,
  updateLandlordAction,
  deleteLandlordAction,
} from '@/lib/actions/landlords'
import type { UserRole } from '@/lib/types/auth'
import { hasFullAccess, canWrite } from '@/lib/auth/permissions'

interface LandlordFormProps {
  initialData?: Landlord
  userRole: UserRole
}

export function LandlordForm({ initialData, userRole }: LandlordFormProps) {
  const { t, locale, tx } = useI18n()
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [serverError, setServerError] = React.useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const isEdit = Boolean(initialData)
  const allowEdit = canWrite(userRole)
  const allowDelete = isEdit && hasFullAccess(userRole)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LandlordFormValues>({
    resolver: zodResolver(landlordSchema),
    defaultValues: {
      landlord_code: initialData?.landlord_code ?? '',
      name: initialData?.name ?? '',
      company_name: initialData?.company_name ?? '',
      tax_id: initialData?.tax_id ?? '',
      contact_name: initialData?.contact_name ?? '',
      phone: initialData?.phone ?? '',
      email: initialData?.email ?? '',
      address: initialData?.address ?? '',
      bank_name: initialData?.bank_name ?? '',
      bank_account_name: initialData?.bank_account_name ?? '',
      bank_account_number: initialData?.bank_account_number ?? '',
      note: initialData?.note ?? '',
    },
  })

  const onSubmit = (values: LandlordFormValues) => {
    if (!allowEdit) return
    setServerError(null)

    startTransition(async () => {
      let res
      if (isEdit && initialData) {
        res = await updateLandlordAction(initialData.id, values)
      } else {
        res = await createLandlordAction(values)
      }

      if (!res.success) {
        setServerError(res.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
        return
      }

      router.push('/landlords')
      router.refresh()
    })
  }

  const handleDelete = async () => {
    if (!initialData || !allowDelete) return
    setIsDeleting(true)
    setServerError(null)

    try {
      const res = await deleteLandlordAction(initialData.id)
      if (!res.success) {
        setServerError(res.error || 'ไม่สามารถลบข้อมูลได้')
        setIsDeleting(false)
        setShowDeleteConfirm(false)
        return
      }
      router.push('/landlords')
      router.refresh()
    } catch {
      setServerError('เกิดข้อผิดพลาดในการลบข้อมูล')
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Top bar with back button & title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/landlords">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-slate-500 hover:text-slate-900">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {isEdit ? tx({ th: 'แก้ไขข้อมูลผู้ให้เช่า', en: 'Edit Landlord', my: 'အိမ်ရှင် အချက်အလက် ပြင်ဆင်ရန်' }) : tx({ th: 'เพิ่มผู้ให้เช่าใหม่', en: 'New Landlord', my: 'အိမ်ရှင် အသစ်ထည့်ရန်' })}
            </h1>
            <p className="text-xs text-slate-500">
              {isEdit
                ? `${tx({ th: 'รหัส', en: 'Code', my: 'ကုဒ်' })}: ${initialData?.landlord_code || initialData?.id}`
                : tx({ th: 'กรอกข้อมูลรายละเอียดผู้ให้เช่าและบัญชีธนาคารเพื่อบันทึกเข้าระบบ', en: 'Fill landlord details and bank account to save to system', my: 'အိမ်ရှင်အချက်အလက်များနှင့် ဘဏ်စာရင်းကို ဖြည့်သွင်းပါ' })}
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
            {tx({ th: 'ลบผู้ให้เช่า', en: 'Delete Landlord', my: 'အိမ်ရှင် ဖျက်ပစ်ပါ' })}
          </Button>
        )}
      </div>

      {serverError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {serverError}
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          {/* Section: Basic Info */}
          <div>
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
              {tx({ th: 'ข้อมูลทั่วไป', en: 'General Information', my: 'အထွေထွေ အချက်အလက်' })}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="landlord_code">{tx({ th: 'รหัสผู้ให้เช่า', en: 'Landlord Code', my: 'အိမ်ရှင်ကုဒ်' })}</Label>
                <Input
                  id="landlord_code"
                  placeholder={tx({ th: 'เช่น LL-001 (ปล่อยว่างให้ระบบสร้างอัตโนมัติ)', en: 'e.g. LL-001 (Auto-generated if blank)', my: 'ဥပမာ LL-001 (လွတ်ထားပါက အလိုအလျောက် သတ်မှတ်မည်)' })}
                  disabled={!allowEdit}
                  {...register('landlord_code')}
                />
                {errors.landlord_code && (
                  <p className="text-xs text-red-500">{errors.landlord_code.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tax_id">{tx({ th: 'เลขประจำตัวผู้เสียภาษี', en: 'Tax ID', my: 'အခွန်မှတ်ပုံတင်အမှတ်' })}</Label>
                <Input
                  id="tax_id"
                  placeholder="เลข 13 หลัก"
                  maxLength={13}
                  disabled={!allowEdit}
                  {...register('tax_id')}
                />
                {errors.tax_id && (
                  <p className="text-xs text-red-500">{errors.tax_id.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name">{tx({ th: 'ชื่อผู้ให้เช่า (บุคคล)', en: 'Landlord Name (Individual)', my: 'အိမ်ရှင်အမည် (ပုဂ္ဂိုလ်)' })} *</Label>
                <Input
                  id="name"
                  placeholder="เช่น นายประเสริฐ มั่งคั่ง"
                  disabled={!allowEdit}
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="company_name">{tx({ th: 'ชื่อบริษัท / นิติบุคคล (ถ้ามี)', en: 'Company / Corporate Name (if any)', my: 'ကုမ္ပဏီအမည် (ရှိလျှင်)' })}</Label>
                <Input
                  id="company_name"
                  placeholder="เช่น บริษัท มั่งคั่ง พร็อพเพอร์ตี้ จำกัด"
                  disabled={!allowEdit}
                  {...register('company_name')}
                />
                {errors.company_name && (
                  <p className="text-xs text-red-500">{errors.company_name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contact_name">{tx({ th: 'ชื่อผู้ประสานงาน / ผู้จัดการพื้นที่', en: 'Coordinator / Property Manager', my: 'ဆက်သွယ်ရန်ပုဂ္ဂိုလ် / မန်နေဂျာ' })}</Label>
                <Input
                  id="contact_name"
                  placeholder="เช่น คุณกมลวรรณ"
                  disabled={!allowEdit}
                  {...register('contact_name')}
                />
                {errors.contact_name && (
                  <p className="text-xs text-red-500">{errors.contact_name.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Contact Details */}
          <div>
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
              {tx({ th: 'ช่องทางการติดต่อ', en: 'Contact Information', my: 'ဆက်သွယ်ရန် အချက်အလက်' })}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone">{tx({ th: 'เบอร์โทรศัพท์', en: 'Phone Number', my: 'ဖုန်းနံပါတ်' })}</Label>
                <Input
                  id="phone"
                  placeholder="เช่น 089-999-8888"
                  disabled={!allowEdit}
                  {...register('phone')}
                />
                {errors.phone && (
                  <p className="text-xs text-red-500">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">{tx({ th: 'อีเมล', en: 'Email', my: 'အီးမေးလ်' })}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="เช่น landlord@example.com"
                  disabled={!allowEdit}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Bank Account Details */}
          <div>
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
              {tx({ th: 'ข้อมูลบัญชีธนาคารสำหรับโอนค่าเช่า', en: 'Bank Account for Rent Transfer', my: 'ငှားရမ်းခလွှဲရန် ဘဏ်အကောင့် အချက်အလက်' })}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="bank_name">{tx({ th: 'ธนาคาร', en: 'Bank Name', my: 'ဘဏ်အမည်' })}</Label>
                <Input
                  id="bank_name"
                  placeholder="เช่น กสิกรไทย, กรุงเทพ, ไทยพาณิชย์"
                  disabled={!allowEdit}
                  {...register('bank_name')}
                />
                {errors.bank_name && (
                  <p className="text-xs text-red-500">{errors.bank_name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bank_account_name">{tx({ th: 'ชื่อบัญชี', en: 'Account Name', my: 'ဘဏ်အကောင့်အမည်' })}</Label>
                <Input
                  id="bank_account_name"
                  placeholder="เช่น นายประเสริฐ มั่งคั่ง"
                  disabled={!allowEdit}
                  {...register('bank_account_name')}
                />
                {errors.bank_account_name && (
                  <p className="text-xs text-red-500">{errors.bank_account_name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bank_account_number">{tx({ th: 'เลขที่บัญชี', en: 'Account Number', my: 'ဘဏ်အကောင့်နံပါတ်' })}</Label>
                <Input
                  id="bank_account_number"
                  placeholder="เช่น 123-4-56789-0"
                  disabled={!allowEdit}
                  {...register('bank_account_number')}
                />
                {errors.bank_account_number && (
                  <p className="text-xs text-red-500">{errors.bank_account_number.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Address & Notes */}
          <div>
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
              {tx({ th: 'ที่อยู่และหมายเหตุ', en: 'Address & Notes', my: 'လိပ်စာနှင့် မှတ်ချက်' })}
            </h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="address">{tx({ th: 'ที่อยู่ผู้ให้เช่า', en: 'Landlord Address', my: 'အိမ်ရှင်လိပ်စာ' })}</Label>
                <Textarea
                  id="address"
                  placeholder="เลขที่ อาคาร ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
                  rows={3}
                  disabled={!allowEdit}
                  {...register('address')}
                />
                {errors.address && (
                  <p className="text-xs text-red-500">{errors.address.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="note">{tx({ th: 'หมายเหตุเพิ่มเติม', en: 'Additional Notes', my: 'နောက်ထပ် မှတ်ချက်များ' })}</Label>
                <Textarea
                  id="note"
                  placeholder="ข้อมูลหรือเงื่อนไขเฉพาะของผู้ให้เช่ารายนี้..."
                  rows={2}
                  disabled={!allowEdit}
                  {...register('note')}
                />
                {errors.note && (
                  <p className="text-xs text-red-500">{errors.note.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/landlords">
            <Button type="button" variant="outline">
              {t.common.cancel}
            </Button>
          </Link>
          {allowEdit && (
            <Button type="submit" disabled={isPending} className="gap-2 min-w-[120px]">
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {tx({ th: 'กำลังบันทึก...', en: 'Saving...', my: 'သိမ်းဆည်းနေသည်...' })}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isEdit ? tx({ th: 'บันทึกการแก้ไข', en: 'Save Changes', my: 'ပြင်ဆင်မှု သိမ်းဆည်းရန်' }) : tx({ th: 'บันทึกข้อมูล', en: 'Save Landlord', my: 'အိမ်ရှင် သိမ်းဆည်းရန်' })}
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
        title={tx({ th: 'ยืนยันการลบข้อมูลผู้ให้เช่า', en: 'Confirm Deleting Landlord', my: 'ဖျက်ပစ်ရန် အတည်ပြုပါ' })}
        description={`คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลผู้ให้เช่า "${
          initialData?.name || initialData?.company_name
        }"? การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
        confirmText={tx({ th: 'ลบข้อมูล', en: 'Delete', my: 'ဖျက်ပစ်ပါ' })}
        loading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
