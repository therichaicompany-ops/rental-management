'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Save, Trash2, Loader2, MapPin, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  locationSchema,
  type LocationFormValues,
  type Location,
  type Landlord,
} from '@/lib/types/master-data'
import {
  createLocationAction,
  updateLocationAction,
  deleteLocationAction,
} from '@/lib/actions/locations'
import type { UserRole } from '@/lib/types/auth'
import { hasFullAccess, canWrite } from '@/lib/auth/permissions'

interface LocationFormProps {
  initialData?: Location
  landlords: Pick<Landlord, 'id' | 'name' | 'company_name'>[]
  userRole: UserRole
}

export function LocationForm({ initialData, landlords, userRole }: LocationFormProps) {
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
    watch,
    formState: { errors },
  } = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      location_code: initialData?.location_code ?? '',
      location_name: initialData?.location_name ?? '',
      house_no: initialData?.house_no ?? '',
      room_no: initialData?.room_no ?? '',
      village_name: initialData?.village_name ?? '',
      address: initialData?.address ?? '',
      subdistrict: initialData?.subdistrict ?? '',
      district: initialData?.district ?? '',
      province: initialData?.province ?? '',
      postal_code: initialData?.postal_code ?? '',
      google_maps_url: initialData?.google_maps_url ?? '',
      latitude: initialData?.latitude ?? null,
      longitude: initialData?.longitude ?? null,
      landlord_id: initialData?.landlord_id ?? '',
      note: initialData?.note ?? '',
    },
  })

  const googleMapsUrl = watch('google_maps_url')

  const onSubmit = (values: LocationFormValues) => {
    if (!allowEdit) return
    setServerError(null)

    startTransition(async () => {
      let res
      if (isEdit && initialData) {
        res = await updateLocationAction(initialData.id, values)
      } else {
        res = await createLocationAction(values)
      }

      if (!res.success) {
        setServerError(res.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
        return
      }

      router.push('/locations')
      router.refresh()
    })
  }

  const handleDelete = async () => {
    if (!initialData || !allowDelete) return
    setIsDeleting(true)
    setServerError(null)

    try {
      const res = await deleteLocationAction(initialData.id)
      if (!res.success) {
        setServerError(res.error || 'ไม่สามารถลบข้อมูลได้')
        setIsDeleting(false)
        setShowDeleteConfirm(false)
        return
      }
      router.push('/locations')
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
          <Link href="/locations">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-slate-500 hover:text-slate-900">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {isEdit ? 'แก้ไขข้อมูลสถานที่' : 'เพิ่มสถานที่ใหม่'}
            </h1>
            <p className="text-xs text-slate-500">
              {isEdit
                ? `รหัส: ${initialData?.location_code || initialData?.id}`
                : 'กรอกข้อมูลรายละเอียดสถานที่และเลือกผู้ให้เช่าเพื่อบันทึกเข้าระบบ'}
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
            ลบสถานที่
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
              ข้อมูลสถานที่และผู้ให้เช่า
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="location_name">ชื่อสถานที่ / สาขา *</Label>
                <Input
                  id="location_name"
                  placeholder="เช่น สาขาสยามสแควร์, สาขาเซ็นทรัลลาดพร้าว"
                  disabled={!allowEdit}
                  {...register('location_name')}
                />
                {errors.location_name && (
                  <p className="text-xs text-red-500">{errors.location_name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="location_code">รหัสสถานที่</Label>
                <Input
                  id="location_code"
                  placeholder="เช่น LOC-001 (ปล่อยว่างให้ระบบสร้างอัตโนมัติ)"
                  disabled={!allowEdit}
                  {...register('location_code')}
                />
                {errors.location_code && (
                  <p className="text-xs text-red-500">{errors.location_code.message}</p>
                )}
              </div>

              {/* Landlord selection dropdown */}
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="landlord_id">ผู้ให้เช่า (Landlord)</Label>
                <Select
                  id="landlord_id"
                  disabled={!allowEdit}
                  {...register('landlord_id')}
                >
                  <option value="">-- ไม่ระบุผู้ให้เช่า / เลือกล่วงหน้า --</option>
                  {landlords.map((ll) => (
                    <option key={ll.id} value={ll.id}>
                      {ll.name || ll.company_name}
                      {ll.company_name && ll.name ? ` (${ll.company_name})` : ''}
                    </option>
                  ))}
                </Select>
                {errors.landlord_id && (
                  <p className="text-xs text-red-500">{errors.landlord_id.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Address Details */}
          <div>
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
              ที่ตั้งและที่อยู่
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="house_no">เลขที่</Label>
                <Input
                  id="house_no"
                  placeholder="เช่น 123/45"
                  disabled={!allowEdit}
                  {...register('house_no')}
                />
                {errors.house_no && (
                  <p className="text-xs text-red-500">{errors.house_no.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="room_no">ห้อง / ยูนิตเลขที่</Label>
                <Input
                  id="room_no"
                  placeholder="เช่น ชั้น 2 ห้อง 201"
                  disabled={!allowEdit}
                  {...register('room_no')}
                />
                {errors.room_no && (
                  <p className="text-xs text-red-500">{errors.room_no.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="village_name">ชื่ออาคาร / หมู่บ้าน / ศูนย์การค้า</Label>
                <Input
                  id="village_name"
                  placeholder="เช่น อาคารพร้อมสุข, เดอะมอลล์"
                  disabled={!allowEdit}
                  {...register('village_name')}
                />
                {errors.village_name && (
                  <p className="text-xs text-red-500">{errors.village_name.message}</p>
                )}
              </div>

              <div className="space-y-1.5 md:col-span-3">
                <Label htmlFor="address">ที่อยู่ (ถนน / ซอย)</Label>
                <Input
                  id="address"
                  placeholder="เช่น ถนนพระราม 4 แขวงลุมพินี"
                  disabled={!allowEdit}
                  {...register('address')}
                />
                {errors.address && (
                  <p className="text-xs text-red-500">{errors.address.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="subdistrict">ตำบล / แขวง</Label>
                <Input
                  id="subdistrict"
                  placeholder="เช่น ปทุมวัน"
                  disabled={!allowEdit}
                  {...register('subdistrict')}
                />
                {errors.subdistrict && (
                  <p className="text-xs text-red-500">{errors.subdistrict.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="district">อำเภอ / เขต</Label>
                <Input
                  id="district"
                  placeholder="เช่น ปทุมวัน"
                  disabled={!allowEdit}
                  {...register('district')}
                />
                {errors.district && (
                  <p className="text-xs text-red-500">{errors.district.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="province">จังหวัด</Label>
                <Input
                  id="province"
                  placeholder="เช่น กรุงเทพมหานคร"
                  disabled={!allowEdit}
                  {...register('province')}
                />
                {errors.province && (
                  <p className="text-xs text-red-500">{errors.province.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="postal_code">รหัสไปรษณีย์</Label>
                <Input
                  id="postal_code"
                  placeholder="เช่น 10330"
                  maxLength={5}
                  disabled={!allowEdit}
                  {...register('postal_code')}
                />
                {errors.postal_code && (
                  <p className="text-xs text-red-500">{errors.postal_code.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Map & Coordinates */}
          <div>
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
              พิกัดและแผนที่ Google Maps
            </h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="google_maps_url">Google Maps URL</Label>
                  {googleMapsUrl && (
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 hover:underline"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      เปิดดูพิกัดบน Google Maps
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <Input
                  id="google_maps_url"
                  placeholder="เช่น https://maps.google.com/?q=..."
                  disabled={!allowEdit}
                  {...register('google_maps_url')}
                />
                {errors.google_maps_url && (
                  <p className="text-xs text-red-500">{errors.google_maps_url.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="latitude">Latitude (ละติจูด)</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    placeholder="เช่น 13.7462"
                    disabled={!allowEdit}
                    {...register('latitude')}
                  />
                  {errors.latitude && (
                    <p className="text-xs text-red-500">{errors.latitude.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="longitude">Longitude (ลองจิจูด)</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    placeholder="เช่น 100.5348"
                    disabled={!allowEdit}
                    {...register('longitude')}
                  />
                  {errors.longitude && (
                    <p className="text-xs text-red-500">{errors.longitude.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Notes */}
          <div>
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
              หมายเหตุ
            </h2>
            <div className="space-y-1.5">
              <Textarea
                id="note"
                placeholder="รายละเอียดเพิ่มเติม การเดินทาง จุดสังเกต..."
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

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/locations">
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
        title="ยืนยันการลบข้อมูลสถานที่"
        description={`คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลสถานที่ "${initialData?.location_name}"? การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
        confirmText="ลบข้อมูล"
        loading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
