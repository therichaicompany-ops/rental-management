'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X, Loader2, Save, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import {
  negotiationLogSchema,
  type NegotiationLogFormValues,
} from '@/lib/types/rental-leads'
import { createNegotiationLogAction } from '@/lib/actions/rental-leads'
import { useI18n } from '@/lib/i18n/context'

interface AddNegotiationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  leadId: string
}

export function AddNegotiationDialog({
  open,
  onOpenChange,
  leadId,
}: AddNegotiationDialogProps) {
  const { t, locale } = useI18n()
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const [serverError, setServerError] = React.useState<string | null>(null)

  // Default contact date to current local datetime string (YYYY-MM-DDTHH:mm)
  const nowStr = new Date().toISOString().slice(0, 16)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NegotiationLogFormValues>({
    resolver: zodResolver(negotiationLogSchema),
    defaultValues: {
      contact_date: nowStr,
      contact_method: 'phone',
      contact_person: '',
      contact_phone: '',
      monthly_rent: null,
      deposit_amount: null,
      advance_rent_amount: null,
      service_amount: null,
      negotiation_detail: '',
      result: '',
      next_action: '',
      next_follow_up_date: '',
    },
  })

  const onSubmit = (values: NegotiationLogFormValues) => {
    setServerError(null)

    startTransition(async () => {
      const res = await createNegotiationLogAction(leadId, values)
      if (!res.success) {
        setServerError(res.error || 'เกิดข้อผิดพลาดในการบันทึก')
        return
      }

      reset()
      onOpenChange(false)
      router.refresh()
    })
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl max-h-[90vh] overflow-y-auto translate-x-[-50%] translate-y-[-50%] gap-4 border border-slate-200 bg-white p-6 shadow-xl rounded-xl duration-200 animate-in fade-in-0 zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <DialogPrimitive.Title className="text-base font-semibold text-slate-900 leading-none">
                  {t.rentalLeads.addNegotiation}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-xs text-slate-500 mt-1">
                  {locale === 'th'
                    ? 'บันทึกประวัติการโทรคุย เสนอราคา หรือผลการติดตามงานเช่า'
                    : locale === 'my'
                    ? 'ဖုန်းခေါ်ဆိုမှု၊ ဈေးနှုန်းကမ်းလှမ်းမှု သို့မဟုတ် နောက်ဆက်တွဲ ရလဒ်များကို မှတ်တမ်းတင်ပါ'
                    : 'Record call history, price proposals, or follow-up results'}
                </DialogPrimitive.Description>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {serverError && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
              {serverError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-sm">
            {/* Row 1: Date & Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="contact_date">
                  {locale === 'th' ? 'วันและเวลาที่ติดต่อ *' : locale === 'my' ? 'ဆက်သွယ်သည့် ရက်စွဲနှင့် အချိန် *' : 'Contact Date & Time *'}
                </Label>
                <Input
                  id="contact_date"
                  type="datetime-local"
                  {...register('contact_date')}
                />
                {errors.contact_date && (
                  <p className="text-xs text-red-500">{errors.contact_date.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="contact_method">
                  {locale === 'th' ? 'ช่องทางการติดต่อ *' : locale === 'my' ? 'ဆက်သွယ်သည့် နည်းလမ်း *' : 'Contact Method *'}
                </Label>
                <Select id="contact_method" {...register('contact_method')}>
                  <option value="phone">📞 {locale === 'th' ? 'โทรศัพท์' : locale === 'my' ? 'ဖုန်း' : 'Phone'}</option>
                  <option value="line">💬 LINE</option>
                  <option value="onsite">🏢 {locale === 'th' ? 'ลงพื้นที่ / พบตัวจริง' : locale === 'my' ? 'နေရာသို့ သွားရောက်တွေ့ဆုံခြင်း' : 'On-site Meeting'}</option>
                  <option value="facebook">🌐 Facebook / Social</option>
                  <option value="email">✉️ {locale === 'th' ? 'อีเมล' : locale === 'my' ? 'အီးမေးလ်' : 'Email'}</option>
                  <option value="other">📌 {locale === 'th' ? 'ช่องทางอื่นๆ' : locale === 'my' ? 'အခြား နည်းလမ်း' : 'Other'}</option>
                </Select>
                {errors.contact_method && (
                  <p className="text-xs text-red-500">{errors.contact_method.message}</p>
                )}
              </div>
            </div>

            {/* Row 2: Contact Person & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="contact_person">
                  {locale === 'th' ? 'ชื่อผู้ที่คุยด้วย' : locale === 'my' ? 'ဆက်သွယ်ပြောဆိုသူ အမည်' : 'Contact Person'}
                </Label>
                <Input
                  id="contact_person"
                  placeholder={locale === 'th' ? 'เช่น เจ้าของตึก / ผู้จัดการพื้นที่' : locale === 'my' ? 'ဥပမာ အဆောက်အအုံပိုင်ရှင်' : 'e.g. Building Owner'}
                  {...register('contact_person')}
                />
                {errors.contact_person && (
                  <p className="text-xs text-red-500">{errors.contact_person.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="contact_phone">
                  {locale === 'th' ? 'เบอร์โทรศัพท์ที่ติดต่อ' : locale === 'my' ? 'ဆက်သွယ်ရန် ဖုန်းနံပါတ်' : 'Contact Phone'}
                </Label>
                <Input
                  id="contact_phone"
                  placeholder="081-234-5678"
                  {...register('contact_phone')}
                />
                {errors.contact_phone && (
                  <p className="text-xs text-red-500">{errors.contact_phone.message}</p>
                )}
              </div>
            </div>

            {/* Row 3: Pricing negotiated (Rent, Deposit) */}
            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200/80 space-y-2">
              <p className="text-xs font-semibold text-slate-700">
                {locale === 'th' ? 'ตัวเลขราคาที่เจรจาในรอบนี้ (ถ้ามีการต่อรอง)' : locale === 'my' ? 'ညှိနှိုင်းရရှိသော ဈေးနှုန်း (ရှိပါက)' : 'Negotiated Pricing (if any)'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="monthly_rent" className="text-xs">
                    {t.contracts.monthlyRent}
                  </Label>
                  <Input
                    id="monthly_rent"
                    type="number"
                    placeholder="27000"
                    {...register('monthly_rent')}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="deposit_amount" className="text-xs">
                    {t.contracts.depositAmount}
                  </Label>
                  <Input
                    id="deposit_amount"
                    type="number"
                    placeholder="54000"
                    {...register('deposit_amount')}
                  />
                </div>
              </div>
            </div>

            {/* Negotiation Detail */}
            <div className="space-y-1">
              <Label htmlFor="negotiation_detail">
                {locale === 'th' ? 'รายละเอียดการเจรจา *' : locale === 'my' ? 'ညှိနှိုင်းမှု အသေးစိတ် *' : 'Negotiation Details *'}
              </Label>
              <Textarea
                id="negotiation_detail"
                placeholder={locale === 'th' ? 'สรุปประเด็นที่คุย เช่น เจ้าของยินยอมลดค่าเช่า...' : locale === 'my' ? 'ညှိနှိုင်းမှု အသေးစိတ် ရေးပါ...' : 'Summary of discussion...'}
                rows={3}
                {...register('negotiation_detail')}
              />
              {errors.negotiation_detail && (
                <p className="text-xs text-red-500">{errors.negotiation_detail.message}</p>
              )}
            </div>

            {/* Row 4: Result & Next Action */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="result">
                  {locale === 'th' ? 'ผลการเจรจา / ข้อสรุป' : locale === 'my' ? 'ညှိနှိုင်းမှု ရလဒ် / ကောက်ချက်' : 'Result / Summary'}
                </Label>
                <Input
                  id="result"
                  placeholder={locale === 'th' ? 'เช่น ยอมรับข้อเสนอราคา' : locale === 'my' ? 'ဥပမာ ကမ်းလှမ်းချက် လက်ခံသည်' : 'e.g. Offer accepted'}
                  {...register('result')}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="next_action">
                  {locale === 'th' ? 'สิ่งที่ต้องทำต่อ (Next Action)' : locale === 'my' ? 'နောက်ထပ် လုပ်ဆောင်ရန် (Next Action)' : 'Next Action'}
                </Label>
                <Input
                  id="next_action"
                  placeholder={locale === 'th' ? 'เช่น ร่างสัญญาเช่า' : locale === 'my' ? 'ဥပမာ စာချုပ် ရေးဆွဲရန်' : 'e.g. Draft contract'}
                  {...register('next_action')}
                />
              </div>
            </div>

            {/* Next follow up date */}
            <div className="space-y-1">
              <Label htmlFor="next_follow_up_date">
                {locale === 'th' ? 'นัดหมายติดตามผลครั้งถัดไป' : locale === 'my' ? 'နောက်တစ်ကြိမ် တွေ့ဆုံ/ဆက်သွယ်မည့် ရက်စွဲ' : 'Next Follow-up Date'}
              </Label>
              <Input
                id="next_follow_up_date"
                type="date"
                {...register('next_follow_up_date')}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                {t.common.cancel}
              </Button>
              <Button type="submit" disabled={isPending} className="gap-2 min-w-[120px]">
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t.common.saving}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {t.common.save}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
