'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Plus,
  CreditCard,
  Calendar,
  Landmark,
  Trash2,
  Receipt,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { AddTransactionDialog } from './add-transaction-dialog'
import type {
  RentPaymentWithRelations,
  RentPaymentStatus,
} from '@/lib/types/contracts-payments'
import {
  PAYMENT_STATUS_BADGE_VARIANTS,
  getEffectivePaymentStatus,
} from '@/lib/types/contracts-payments'
import type { UserRole } from '@/lib/types/auth'
import { canWrite } from '@/lib/auth/permissions'
import { deletePaymentTransactionAction } from '@/lib/actions/payments'
import { useI18n } from '@/lib/i18n/context'
import { labelOf } from '@/lib/i18n/tx'
import {
  PAYMENT_STATUS_TRI,
  PAYMENT_TYPE_TRI,
  PAYMENT_METHOD_TRI,
  W,
} from '@/lib/i18n/labels'

interface PaymentDetailViewProps {
  payment: RentPaymentWithRelations
  userRole: UserRole
}

export function PaymentDetailView({ payment, userRole }: PaymentDetailViewProps) {
  const router = useRouter()
  const { tx, locale, intl } = useI18n()
  const money = (n: number, frac = 2) =>
    n.toLocaleString(intl, { minimumFractionDigits: frac })
  const dateStr = (s: string | null | undefined) => (s ? new Date(s).toLocaleDateString(intl) : '-')
  const dateTimeStr = (s: string | null | undefined) => (s ? new Date(s).toLocaleString(intl) : '-')
  const allowWrite = canWrite(userRole)

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [deletingTxId, setDeletingTxId] = React.useState<string | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  const effectiveStatus = getEffectivePaymentStatus(payment)
  const badgeVariant =
    PAYMENT_STATUS_BADGE_VARIANTS[effectiveStatus] || {
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: 'border-slate-200',
    }

  const net = Number(payment.net_amount) || 0
  const paid = Number(payment.amount_paid) || 0
  const balance = Number(payment.balance_amount) || 0
  const percentPaid = net > 0 ? Math.min(100, Math.round((paid / net) * 100)) : 0

  const contract = payment.rental_contracts
  const transactions = payment.payment_transactions || []

  const handleDeleteTransaction = async () => {
    if (!deletingTxId) return
    setIsDeleting(true)
    setErrorMsg(null)

    const res = await deletePaymentTransactionAction(deletingTxId, payment.id)
    setIsDeleting(false)

    if (res.success) {
      setDeletingTxId(null)
      router.refresh()
    } else {
      setErrorMsg(res.error || tx({ th: 'เกิดข้อผิดพลาดในการลบรายการ', en: 'Error deleting transaction', my: 'ငွေပေးချေမှုမှတ်တမ်း ဖျက်ရာတွင် အမှားဖြစ်ပွား' }))
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="h-9 w-9 p-0">
            <Link href="/rent-payments">
              <ArrowLeft className="h-5 w-5 text-slate-500" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {tx({ th: 'งวดประจำเดือน', en: 'Billing Period', my: 'လစဉ်ကာလ' })} {payment.billing_period}
              </h1>
              <Badge
                variant="outline"
                className={`${badgeVariant.bg} ${badgeVariant.text} ${badgeVariant.border} text-xs font-semibold`}
              >
                {labelOf(PAYMENT_STATUS_TRI, effectiveStatus, locale)}
              </Badge>
              <span
                className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                  payment.payment_type === 'payable'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'bg-teal-50 text-teal-700'
                }`}
              >
                {labelOf(PAYMENT_TYPE_TRI, payment.payment_type, locale)}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {tx({ th: 'สัญญา', en: 'Contract', my: 'စာချုပ်' })}:{' '}
              {contract ? (
                <Link
                  href={`/contracts/${contract.id}`}
                  className="text-primary-600 hover:underline font-medium"
                >
                  {contract.contract_no}
                </Link>
              ) : (
                '-'
              )}{' '}
              | {tx(W.location)}: {contract?.locations?.location_name || '-'}
            </p>
          </div>
        </div>

        {allowWrite && balance > 0 && (
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            {tx({ th: 'บันทึกการชำระเงิน', en: 'Record Payment', my: 'ပေးချေမှုမှတ်တမ်းတင်' })}
          </Button>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Progress & Quick Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700">
            {tx({ th: 'ความคืบหน้าการชำระเงิน', en: 'Payment Progress', my: 'ပေးချေမှု တိုးတက်မှု' })} ({percentPaid}%)
          </span>
          <span className="text-slate-500">
            {tx({ th: 'ชำระแล้ว', en: 'Paid', my: 'ပေးချေပြီး' })} ฿{money(paid)} {tx({ th: 'จาก', en: 'of', my: 'အနက်' })} ฿
            {money(net)}
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${
              percentPaid >= 100
                ? 'bg-emerald-500'
                : percentPaid > 0
                ? 'bg-amber-500'
                : 'bg-slate-300'
            }`}
            style={{ width: `${percentPaid}%` }}
          />
        </div>
      </div>

      {/* Financial Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-medium text-slate-500">{tx({ th: 'ค่าเช่า', en: 'Rent Amount', my: 'ငှားခ' })}</span>
          <p className="text-base font-bold text-slate-900 mt-1">
            ฿{money(Number(payment.rent_amount))}
          </p>
          {Number(payment.service_amount) > 0 && (
            <span className="text-[10px] text-slate-400">
              +{tx({ th: 'บริการ', en: 'Service', my: 'ဝန်ဆောင်ခ' })} ฿{money(Number(payment.service_amount), 0)}
            </span>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-medium text-slate-500">{tx({ th: 'ยอดรวมก่อนหัก (Gross)', en: 'Gross Amount', my: 'စုစုပေါင်း (Gross)' })}</span>
          <p className="text-base font-bold text-slate-900 mt-1">
            ฿{money(Number(payment.gross_amount))}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-medium text-slate-500">{tx({ th: 'หัก ณ ที่จ่าย (WHT)', en: 'Withholding Tax', my: 'ဖြတ်တောက်ခွန် (WHT)' })}</span>
          <p className="text-base font-bold text-sky-700 mt-1">
            -฿{money(Number(payment.wht_amount))}
          </p>
        </div>

        <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 shadow-sm">
          <span className="text-[11px] font-medium text-emerald-800">{tx({ th: 'ยอดสุทธิ (Net)', en: 'Net Amount', my: 'အသားတင် (Net)' })}</span>
          <p className="text-base font-bold text-emerald-700 mt-1">
            ฿{money(net)}
          </p>
        </div>

        <div
          className={`p-4 rounded-xl border shadow-sm ${
            balance > 0
              ? 'bg-rose-50/60 border-rose-100 text-rose-800'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <span className="text-[11px] font-medium">{tx({ th: 'ยอดคงเหลือค้างชำระ', en: 'Outstanding Balance', my: 'ကျန်ရှိငွေ' })}</span>
          <p
            className={`text-base font-bold mt-1 ${
              balance > 0 ? 'text-rose-700' : 'text-slate-500'
            }`}
          >
            ฿{money(balance)}
          </p>
        </div>
      </div>

      {/* Contract & Bank Details Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary-600" />
            {tx({ th: 'ข้อมูลกำหนดเวลา', en: 'Schedule Information', my: 'အချိန်ဇယား အချက်အလက်' })}
          </h2>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">{tx({ th: 'งวดประจำเดือน:', en: 'Billing Period:', my: 'လစဉ်ကာလ:' })}</span>
              <span className="font-semibold text-slate-800">{payment.billing_period}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{tx({ th: 'วันครบกำหนดชำระ:', en: 'Due Date:', my: 'နောက်ဆုံးပေးရက်:' })}</span>
              <span className="font-semibold text-rose-700">
                {dateStr(payment.due_date)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{tx({ th: 'สัญญาเช่า:', en: 'Contract:', my: 'စာချုပ်:' })}</span>
              <span className="font-medium text-slate-800">
                {contract ? contract.contract_no : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">{tx({ th: 'สถานที่:', en: 'Location:', my: 'နေရာ:' })}</span>
              <span className="font-medium text-slate-800">
                {contract?.locations?.location_name} ({contract?.locations?.province})
              </span>
            </div>
            {payment.payment_note && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 block mb-1">{tx({ th: 'หมายเหตุงวดชำระ:', en: 'Installment Note:', my: 'အရစ်မှတ်ချက်:' })}</span>
                <p className="text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                  {payment.payment_note}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Counterparty & Bank Account */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Landmark className="h-4 w-4 text-primary-600" />
            {tx({ th: 'ข้อมูลการโอนเงินและคู่สัญญา', en: 'Payment Transfer & Parties', my: 'ငွေလွှဲနှင့် စာချုပ်ဝင်များ အချက်အလက်' })}
          </h2>

          {contract?.landlords && (
            <div className="space-y-2 text-xs">
              <span className="text-xs font-semibold text-indigo-700 uppercase block">
                {tx({ th: 'ผู้ให้เช่า (ผู้รับเงินโอน)', en: 'Landlord (Payee)', my: 'အိမ်ရှင် (ငွေလက်ခံသူ)' })}
              </span>
              <p className="text-sm font-medium text-slate-900">
                {contract.landlords.name || contract.landlords.company_name}
              </p>
              {contract.landlords.bank_account_number ? (
                <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 space-y-1">
                  <div className="text-indigo-900 font-semibold">
                    {tx({ th: 'ธนาคาร', en: 'Bank', my: 'ဘဏ်' })}: {contract.landlords.bank_name || '-'}
                  </div>
                  <div className="font-mono text-base font-bold text-indigo-700 select-all">
                    {contract.landlords.bank_account_number}
                  </div>
                  <span className="text-[10px] text-indigo-500 block">
                    ({tx({ th: 'คลิกหรือแตะเพื่อคัดลอกเลขบัญชี', en: 'Click to copy account number', my: 'အကောင့်နံပါတ်ကူးယူရန် နှိပ်ပါ' })})
                  </span>
                </div>
              ) : (
                <p className="text-slate-400 italic">{tx({ th: 'ไม่ได้ระบุเลขที่บัญชีธนาคาร', en: 'No bank account specified', my: 'ဘဏ်အကောင့်နံပါတ် မဖော်ပြထားပါ' })}</p>
              )}
            </div>
          )}

          {contract?.customers && (
            <div className="space-y-2 text-xs">
              <span className="text-xs font-semibold text-teal-700 uppercase block">
                {tx({ th: 'ลูกค้า / ผู้เช่า (ผู้ชำระเงิน)', en: 'Customer / Tenant (Payer)', my: 'ဖောက်သည် / အိမ်ငှား (ငွေပေးချေသူ)' })}
              </span>
              <p className="text-sm font-medium text-slate-900">
                {contract.customers.name || contract.customers.company_name}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Transactions List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary-600" />
              {tx({ th: 'ประวัติการชำระเงิน (Transactions)', en: 'Payment Transactions', my: 'ငွေပေးချေမှု မှတ်တမ်းများ' })}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {tx({ th: 'รายการชำระเงินสำหรับงวดนี้ สามารถแบ่งชำระเป็นหลายครั้งได้', en: 'Payments recorded for this period. Partial payments are supported.', my: 'ဤကာလအတွက် ပေးချေမှုများ။ အရစ်ခွဲပေးချေမှု ပြုလုပ်နိုင်သည်။' })}
            </p>
          </div>

          {allowWrite && balance > 0 && (
            <Button
              size="sm"
              onClick={() => setIsDialogOpen(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              {tx({ th: 'เพิ่มรายการชำระ', en: 'Add Payment', my: 'ပေးချေမှု ထည့်မည်' })}
            </Button>
          )}
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center">
            <CreditCard className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-700">{tx({ th: 'ยังไม่มีรายการชำระเงิน', en: 'No payments recorded yet', my: 'ငွေပေးချေမှုမှတ်တမ်း မရှိသေးပါ' })}</p>
            <p className="text-xs text-slate-400">
              {tx({ th: 'เมื่อมีการโอนเงินหรือรับชำระ สามารถกดบันทึกการชำระเงินได้ทันที', en: 'Record payments whenever a transfer or cash is received.', my: 'ငွေလွှဲ သို့မဟုတ် လက်ခံရရှိပါက ချက်ချင်း မှတ်တမ်းတင်နိုင်ပါသည်။' })}
            </p>
            {allowWrite && (
              <Button
                size="sm"
                onClick={() => setIsDialogOpen(true)}
                className="mt-4 bg-primary-600 hover:bg-primary-700 text-white"
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                {tx({ th: 'บันทึกการชำระเงินแรก', en: 'Record First Payment', my: 'ပထမဆုံး ပေးချေမှု မှတ်တမ်းတင်' })}
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">{tx({ th: 'วันที่ / เวลาทำรายการ', en: 'Transaction Date/Time', my: 'ရက်စွဲ / အချိန်' })}</th>
                  <th className="px-4 py-3 text-right">{tx({ th: 'จำนวนเงิน', en: 'Amount', my: 'ပမာဏ' })}</th>
                  <th className="px-4 py-3">{tx({ th: 'ช่องทางชำระ', en: 'Method', my: 'ပေးချေနည်းလမ်း' })}</th>
                  <th className="px-4 py-3">{tx({ th: 'เลขที่อ้างอิง / สลิป', en: 'Ref / Slip', my: 'ကိုးကား / ပြေစာ' })}</th>
                  <th className="px-4 py-3">{tx({ th: 'ผู้บันทึก', en: 'Recorded By', my: 'မှတ်တမ်းတင်သူ' })}</th>
                  <th className="px-4 py-3">{tx(W.note)}</th>
                  {allowWrite && <th className="px-4 py-3 text-right">{tx({ th: 'จัดการ', en: 'Actions', my: 'လုပ်ဆောင်ချက်' })}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {transactions.map((txItem) => (
                  <tr key={txItem.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                      {dateTimeStr(txItem.transaction_date)}
                    </td>

                    <td className="px-4 py-3 text-right font-bold text-emerald-600 whitespace-nowrap">
                      ฿{money(Number(txItem.amount))}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                        {labelOf(PAYMENT_METHOD_TRI, txItem.payment_method, locale)}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
                      {txItem.reference_no || '-'}
                    </td>

                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {txItem.profiles?.full_name || txItem.profiles?.email || '-'}
                    </td>

                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                      {txItem.note || '-'}
                    </td>

                    {allowWrite && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingTxId(txItem.id)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                          title={tx({ th: 'ลบรายการชำระนี้', en: 'Delete this transaction', my: 'ဤပေးချေမှုကို ဖျက်မည်' })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Transaction Dialog */}
      <AddTransactionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        rentPaymentId={payment.id}
        balanceAmount={balance}
      />

      {/* Delete Transaction Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(deletingTxId)}
        onOpenChange={(open) => !open && setDeletingTxId(null)}
        title={tx({ th: 'ยืนยันการลบรายการชำระเงิน', en: 'Confirm Payment Deletion', my: 'ပေးချေမှုဖျက်ရန် အတည်ပြု' })}
        description={tx({
          th: 'คุณแน่ใจหรือไม่ว่าต้องการลบรายการชำระเงินนี้? ยอดเงินที่ชำระและสถานะของงวดนี้จะถูกคำนวณใหม่โดยอัตโนมัติ',
          en: 'Are you sure you want to delete this payment? The paid balance and period status will be recalculated automatically.',
          my: 'ဤငွေပေးချေမှုကို ဖျက်ရန် သေချာပါသလား? ပေးချေပြီးငွေနှင့် ကာလအခြေအနေကို အလိုအလျောက် ပြန်လည်တွက်ချက်ပါမည်။',
        })}
        confirmText={tx({ th: 'ยืนยันลบ', en: 'Delete', my: 'ဖျက်မည်' })}
        cancelText={tx({ th: 'ยกเลิก', en: 'Cancel', my: 'မလုပ်တော့' })}
        variant="danger"
        loading={isDeleting}
        onConfirm={handleDeleteTransaction}
      />
    </div>
  )
}
