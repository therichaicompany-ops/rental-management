'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useI18n } from '@/lib/i18n/context'
import { W } from '@/lib/i18n/labels'
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
              {isEdit ? tx({ th: 'แก้ไขข้อมูลสถานที่', en: 'Edit Location', my: 'နေရာ အချက်အလက် ပြင်ဆင်ရန်' }) : tx({ th: 'เพิ่มสถานที่ใหม่', en: 'New Location', my: 'နေရာ အသစ်ထည့်ရန်' })}
            </h1>
            <p className="text-xs text-slate-500">
              {isEdit
                ? `${tx({ th: 'รหัส', en: 'Code', my: 'ကုဒ်' })}: ${initialData?.location_code || initialData?.id}`
                : tx({ th: 'กรอกข้อมูลรายละเอียดสถานที่และเลือกผู้ให้เช่าเพื่อบันทึกเข้าระบบ', en: 'Enter location details and select landlord to save to system', my: 'နေရာအချက်အလက်များနှင့် အိမ်ရှင်ကို ရွေးချယ်ဖြည့်စွက်ပါ' })}
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
            {tx({ th: 'ลบสถานที่', en: 'Delete Location', my: 'နေရာ ဖျက်ပစ်ပါ' })}
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
              {tx({ th: 'ข้อมูลสถานที่และผู้ให้เช่า', en: 'Location & Landlord Info', my: 'နေရာနှင့် အိမ်ရှင် အချက်အလက်' })}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="location_name">{tx({ th: 'ชื่อสถานที่ / สาขา', en: 'Location / Branch Name', my: 'နေရာ / ဆိုင်ခွဲ အမည်' })} *</Label>
                <Input
                  id="location_name"
                  placeholder={tx({ th: 'เช่น สาขาสยามสแควร์, สาขาเซ็นทรัลลาดพร้าว', en: 'e.g. Siam Square Branch, Central Ladprao Branch', my: 'ဥပမာ ဆိုင်ခွဲအမည်' })}
                  disabled={!allowEdit}
                  {...register('location_name')}
                />
                {errors.location_name && (
                  <p className="text-xs text-red-500">{errors.location_name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="location_code">{tx({ th: 'รหัสสถานที่', en: 'Location Code', my: 'နေရာကုဒ်' })}</Label>
                <Input
                  id="location_code"
                  placeholder={tx({ th: 'เช่น LOC-001 (ปล่อยว่างให้ระบบสร้างอัตโนมัติ)', en: 'e.g. LOC-001 (Auto-generated if blank)', my: 'ဥပမာ LOC-001 (လွတ်ထားပါက အလိုအလျောက် သတ်မှတ်မည်)' })}
                  disabled={!allowEdit}
                  {...register('location_code')}
                />
                {errors.location_code && (
                  <p className="text-xs text-red-500">{errors.location_code.message}</p>
                )}
              </div>

              {/* Landlord selection dropdown */}
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="landlord_id">{t.landlords.title} ({tx(W.landlord)})</Label>
                <Select
                  id="landlord_id"
                  disabled={!allowEdit}
                  {...register('landlord_id')}
                >
                  <option value="">-- {tx({ th: 'ไม่ระบุผู้ให้เช่า / เลือกล่วงหน้า', en: 'Unassigned / Select Landlord', my: 'အိမ်ရှင် မသတ်မှတ်ရသေး' })} --</option>
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
              {tx({ th: 'ที่ตั้งและที่อยู่', en: 'Address & Position', my: 'တည်နေရာနှင့် လိပ်စာ' })}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="house_no">{tx({ th: 'เลขที่', en: 'House/Building No.', my: 'အမှတ်' })}</Label>
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
                <Label htmlFor="room_no">{tx({ th: 'ห้อง / ยูนิตเลขที่', en: 'Room / Unit No.', my: 'အခန်း / ယူနစ်အမှတ်' })}</Label>
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
                <Label htmlFor="village_name">{tx({ th: 'ชื่ออาคาร / หมู่บ้าน / ศูนย์การค้า', en: 'Building / Village / Mall', my: 'အဆောက်အအုံ / ရွာ / ကုန်တိုက်' })}</Label>
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
                <Label htmlFor="address">{tx({ th: 'ที่อยู่ (ถนน / ซอย)', en: 'Address (Road / Soi)', my: 'လိပ်စာ (လမ်း / လမ်းသွယ်)' })}</Label>
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
                <Label htmlFor="subdistrict">{tx({ th: 'ตำบล / แขวง', en: 'Sub-district', my: 'ရပ်ကွက်' })}</Label>
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
                <Label htmlFor="district">{tx({ th: 'อำเภอ / เขต', en: 'District', my: 'မြို့နယ်' })}</Label>
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
                <Label htmlFor="province">{tx({ th: 'จังหวัด', en: 'Province', my: 'တိုင်းဒေသကြီး/ပြည်နယ်' })}</Label>
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
                <Label htmlFor="postal_code">{tx({ th: 'รหัสไปรษณีย์', en: 'Postal Code', my: 'စာတိုက်သင်္ကေတ' })}</Label>
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
              {tx({ th: 'พิกัดและแผนที่ Google Maps', en: 'Google Maps & GPS Coordinates', my: 'Google Maps နှင့် သြဒီနိတ်များ' })}
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
                      {tx({ th: 'เปิดดูพิกัดบน Google Maps', en: 'Open in Google Maps', my: 'Google Maps တွင် ဖွင့်ရန်' })}
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
                  <Label htmlFor="latitude">{tx({ th: 'Latitude (ละติจูด)', en: 'Latitude', my: 'လတ္တီတွဒ် (Latitude)' })}</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    placeholder={tx({ th: 'เช่น 13.7462', en: 'e.g. 13.7462', my: 'ဥပမာ 13.7462' })}
                    disabled={!allowEdit}
                    {...register('latitude')}
                  />
                  {errors.latitude && (
                    <p className="text-xs text-red-500">{errors.latitude.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="longitude">{tx({ th: 'Longitude (ลองจิจูด)', en: 'Longitude', my: 'လောင်ဂျီတွဒ် (Longitude)' })}</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    placeholder={tx({ th: 'เช่น 100.5348', en: 'e.g. 100.5348', my: 'ဥပမာ 100.5348' })}
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
              {tx({ th: 'หมายเหตุ', en: 'Notes', my: 'မှတ်ချက်' })}
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
                  {isEdit ? tx({ th: 'บันทึกการแก้ไข', en: 'Save Changes', my: 'ပြင်ဆင်မှု သိမ်းဆည်းရန်' }) : tx({ th: 'บันทึกข้อมูล', en: 'Save Location', my: 'တည်နေရာ သိမ်းဆည်းရန်' })}
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
        title={tx({ th: 'ยืนยันการลบข้อมูลสถานที่', en: 'Confirm Deleting Location', my: 'ဖျက်ပစ်ရန် အတည်ပြုပါ' })}
        description={`คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลสถานที่ "${initialData?.location_name}"? การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
        confirmText={tx({ th: 'ลบข้อมูล', en: 'Delete', my: 'ဖျက်ပစ်ပါ' })}
        loading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
