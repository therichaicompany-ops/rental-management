'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreditCard } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import {
  paymentTransactionSchema,
  type PaymentTransactionFormValues,
  PAYMENT_METHOD_LABELS,
} from '@/lib/types/contracts-payments'
import { addPaymentTransactionAction } from '@/lib/actions/payments'
import { useI18n } from '@/lib/i18n/context'
import type { Locale } from '@/lib/i18n/types'

const PAYMENT_METHOD_TRANSLATIONS: Record<Locale, Record<string, string>> = {
  th: {
    bank_transfer: 'โอนผ่านธนาคาร',
    cash: 'เงินสด',
    cheque: 'เช็ค',
    credit_card: 'บัตรเครดิต',
    other: 'อื่นๆ',
  },
  en: {
    bank_transfer: 'Bank Transfer',
    cash: 'Cash',
    cheque: 'Cheque',
    credit_card: 'Credit Card',
    other: 'Other',
  },
  my: {
    bank_transfer: 'ဘဏ်လွှဲ',
    cash: 'ငွေသား',
    cheque: 'ချက်လက်မှတ်',
    credit_card: 'ခရက်ဒစ်ကတ်',
    other: 'အခြား',
  },
}

interface AddTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rentPaymentId: string
  balanceAmount: number
}

export function AddTransactionDialog({
  open,
  onOpenChange,
  rentPaymentId,
  balanceAmount,
}: AddTransactionDialogProps) {
  const { t, locale } = useI18n()
  const router = useRouter()
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  const methodTranslations = PAYMENT_METHOD_TRANSLATIONS[locale] || PAYMENT_METHOD_LABELS

  // Default now formatted as YYYY-MM-DDTHH:mm
  const defaultDate = new Date().toISOString().slice(0, 16)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaymentTransactionFormValues>({
    resolver: zodResolver(paymentTransactionSchema),
    defaultValues: {
      rent_payment_id: rentPaymentId,
      transaction_date: defaultDate,
      amount: balanceAmount > 0 ? balanceAmount : 0,
      payment_method: 'bank_transfer',
      reference_no: '',
      note: '',
    },
  })

  // Reset when dialog opens or rentPaymentId/balanceAmount changes
  React.useEffect(() => {
    if (open) {
      setErrorMsg(null)
      reset({
        rent_payment_id: rentPaymentId,
        transaction_date: new Date().toISOString().slice(0, 16),
        amount: balanceAmount > 0 ? balanceAmount : 0,
        payment_method: 'bank_transfer',
        reference_no: '',
        note: '',
      })
    }
  }, [open, rentPaymentId, balanceAmount, reset])

  const onSubmit = async (values: PaymentTransactionFormValues) => {
    setErrorMsg(null)
    const res = await addPaymentTransactionAction(values)

    if (res.success) {
      onOpenChange(false)
      router.refresh()
    } else {
      setErrorMsg(res.error || 'เกิดข้อผิดพลาดในการบันทึกการชำระเงิน')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <CreditCard className="h-5 w-5 text-primary-600" />
            {t.payments.recordPayment}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {locale === 'th'
              ? 'บันทึกยอดเงินที่ชำระ สามารถชำระเต็มจำนวนหรือแบ่งชำระบางส่วนได้'
              : locale === 'my'
              ? 'ပေးချေသည့် ငွေပမာဏကို မှတ်တမ်းတင်ပါ'
              : 'Record payment transaction amount (full or partial)'}
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Quick Pay Balance Helper */}
          {balanceAmount > 0 && (
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-xs">
              <span className="text-emerald-800">
                {locale === 'th' ? 'ยอดค้างชำระ: ' : locale === 'my' ? 'ပေးရန်ကျန်ငွေ: ' : 'Balance Due: '}
                <strong>
                  {balanceAmount.toLocaleString(locale === 'th' ? 'th-TH' : locale === 'my' ? 'my-MM' : 'en-US', {
                    minimumFractionDigits: 2,
                  })}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => setValue('amount', balanceAmount)}
                className="text-emerald-700 hover:text-emerald-900 font-semibold underline text-xs"
              >
                {locale === 'th' ? 'ชำระเต็มจำนวน' : locale === 'my' ? 'အပြည့် ပေးချေမည်' : 'Pay in Full'}
              </button>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {t.payments.amount} <span className="text-rose-500">*</span>
            </label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              {...register('amount')}
            />
            {errors.amount && (
              <p className="text-xs text-rose-600 mt-1">{errors.amount.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {t.payments.paidDate} <span className="text-rose-500">*</span>
            </label>
            <Input type="datetime-local" {...register('transaction_date')} />
            {errors.transaction_date && (
              <p className="text-xs text-rose-600 mt-1">{errors.transaction_date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {t.payments.paymentMethod} <span className="text-rose-500">*</span>
            </label>
            <Select {...register('payment_method')}>
              {Object.entries(PAYMENT_METHOD_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {methodTranslations[val] ?? label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {locale === 'th' ? 'เลขที่อ้างอิง / เลขที่สลิปโอนเงิน' : locale === 'my' ? 'ရည်ညွှန်းနံပါတ် / ပြေစာနံပါတ်' : 'Reference No. / Slip No.'}
            </label>
            <Input
              placeholder={locale === 'th' ? 'เช่น TXN20260315-001 หรือ เลขที่เช็ค' : locale === 'my' ? 'ဥပမာ TXN20260315-001' : 'e.g. TXN20260315-001'}
              {...register('reference_no')}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              {locale === 'th' ? 'หมายเหตุการชำระเงิน' : locale === 'my' ? 'မှတ်ချက်' : 'Payment Notes'}
            </label>
            <Textarea
              rows={2}
              placeholder={locale === 'th' ? 'เช่น ชำระค่าเช่างวดที่ 1/12 ผ่าน K-Bank' : locale === 'my' ? 'မှတ်ချက် ရေးပါ...' : 'e.g. Rent payment period 1/12'}
              {...register('note')}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t.common.cancel}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              {isSubmitting ? t.common.saving : t.payments.recordPayment}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
