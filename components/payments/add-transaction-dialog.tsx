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
  const router = useRouter()
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

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
            บันทึกการชำระเงิน
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            บันทึกยอดเงินที่ชำระ สามารถชำระเต็มจำนวนหรือแบ่งชำระบางส่วนได้
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
                ยอดค้างชำระ: <strong>฿{balanceAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong>
              </span>
              <button
                type="button"
                onClick={() => setValue('amount', balanceAmount)}
                className="text-emerald-700 hover:text-emerald-900 font-semibold underline text-xs"
              >
                ชำระเต็มจำนวน
              </button>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              จำนวนเงินที่ชำระ (บาท) <span className="text-rose-500">*</span>
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
              วันที่และเวลาที่ทำรายการ <span className="text-rose-500">*</span>
            </label>
            <Input type="datetime-local" {...register('transaction_date')} />
            {errors.transaction_date && (
              <p className="text-xs text-rose-600 mt-1">{errors.transaction_date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              ช่องทางการชำระ <span className="text-rose-500">*</span>
            </label>
            <Select {...register('payment_method')}>
              {Object.entries(PAYMENT_METHOD_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              เลขที่อ้างอิง / เลขที่สลิปโอนเงิน
            </label>
            <Input
              placeholder="เช่น TXN20260315-001 หรือ เลขที่เช็ค"
              {...register('reference_no')}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              หมายเหตุการชำระเงิน
            </label>
            <Textarea
              rows={2}
              placeholder="เช่น ชำระค่าเช่างวดที่ 1/12 ผ่าน K-Bank"
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
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการชำระเงิน'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
