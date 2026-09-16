'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
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
              {isEdit ? 'แก้ไขข้อมูลผู้ให้เช่า' : 'เพิ่มผู้ให้เช่าใหม่'}
            </h1>
            <p className="text-xs text-slate-500">
              {isEdit
                ? `รหัส: ${initialData?.landlord_code || initialData?.id}`
                : 'กรอกข้อมูลรายละเอียดผู้ให้เช่าและบัญชีธนาคารเพื่อบันทึกเข้าระบบ'}
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
            ลบผู้ให้เช่า
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
              ข้อมูลทั่วไป
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="landlord_code">รหัสผู้ให้เช่า</Label>
                <Input
                  id="landlord_code"
                  placeholder="เช่น LL-001 (ปล่อยว่างให้ระบบสร้างอัตโนมัติ)"
                  disabled={!allowEdit}
                  {...register('landlord_code')}
                />
                {errors.landlord_code && (
                  <p className="text-xs text-red-500">{errors.landlord_code.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tax_id">เลขประจำตัวผู้เสียภาษี</Label>
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
                <Label htmlFor="name">ชื่อผู้ให้เช่า (บุคคล) *</Label>
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
                <Label htmlFor="company_name">ชื่อบริษัท / นิติบุคคล (ถ้ามี)</Label>
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
                <Label htmlFor="contact_name">ชื่อผู้ติดต่อ / ผู้จัดการพื้นที่</Label>
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
              ช่องทางการติดต่อ
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
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
                <Label htmlFor="email">อีเมล</Label>
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
              ข้อมูลบัญชีธนาคารสำหรับโอนค่าเช่า
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="bank_name">ธนาคาร</Label>
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
                <Label htmlFor="bank_account_name">ชื่อบัญชี</Label>
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
                <Label htmlFor="bank_account_number">เลขที่บัญชี</Label>
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
              ที่อยู่และหมายเหตุ
            </h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="address">ที่อยู่ผู้ให้เช่า</Label>
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
                <Label htmlFor="note">หมายเหตุเพิ่มเติม</Label>
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
              ยกเลิก
            </Button>
          </Link>
          {allowEdit && (
            <Button type="submit" disabled={isPending} className="gap-2 min-w-[120px]">
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isEdit ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
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
        title="ยืนยันการลบข้อมูลผู้ให้เช่า"
        description={`คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลผู้ให้เช่า "${
          initialData?.name || initialData?.company_name
        }"? การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
        confirmText="ลบข้อมูล"
        loading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
