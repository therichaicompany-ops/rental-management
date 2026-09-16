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
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_BADGE_VARIANTS,
  PAYMENT_METHOD_LABELS,
} from '@/lib/types/contracts-payments'
import type { UserRole } from '@/lib/types/auth'
import { canWrite } from '@/lib/auth/permissions'
import { deletePaymentTransactionAction } from '@/lib/actions/payments'

interface PaymentDetailViewProps {
  payment: RentPaymentWithRelations
  userRole: UserRole
}

export function PaymentDetailView({ payment, userRole }: PaymentDetailViewProps) {
  const router = useRouter()
  const allowWrite = canWrite(userRole)

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [deletingTxId, setDeletingTxId] = React.useState<string | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  const badgeVariant =
    PAYMENT_STATUS_BADGE_VARIANTS[payment.status as RentPaymentStatus] || {
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
      setErrorMsg(res.error || 'เกิดข้อผิดพลาดในการลบรายการ')
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
                งวดประจำเดือน {payment.billing_period}
              </h1>
              <Badge
                variant="outline"
                className={`${badgeVariant.bg} ${badgeVariant.text} ${badgeVariant.border} text-xs font-semibold`}
              >
                {PAYMENT_STATUS_LABELS[payment.status as RentPaymentStatus] || payment.status}
              </Badge>
              <span
                className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                  payment.payment_type === 'payable'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'bg-teal-50 text-teal-700'
                }`}
              >
                {payment.payment_type === 'payable' ? 'บริษัทจ่ายเจ้าของ' : 'ลูกค้าจ่ายบริษัท'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              สัญญา:{' '}
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
              | สถานที่: {contract?.locations?.location_name || '-'}
            </p>
          </div>
        </div>

        {allowWrite && balance > 0 && (
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            บันทึกการชำระเงิน
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
            ความคืบหน้าการชำระเงิน ({percentPaid}%)
          </span>
          <span className="text-slate-500">
            ชำระแล้ว ฿{paid.toLocaleString('th-TH', { minimumFractionDigits: 2 })} จาก ฿
            {net.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
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
          <span className="text-[11px] font-medium text-slate-500">ค่าเช่า</span>
          <p className="text-base font-bold text-slate-900 mt-1">
            ฿{Number(payment.rent_amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </p>
          {Number(payment.service_amount) > 0 && (
            <span className="text-[10px] text-slate-400">
              +บริการ ฿{Number(payment.service_amount).toLocaleString('th-TH')}
            </span>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-medium text-slate-500">ยอดรวมก่อนหัก (Gross)</span>
          <p className="text-base font-bold text-slate-900 mt-1">
            ฿{Number(payment.gross_amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-medium text-slate-500">หัก ณ ที่จ่าย (WHT)</span>
          <p className="text-base font-bold text-sky-700 mt-1">
            -฿{Number(payment.wht_amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 shadow-sm">
          <span className="text-[11px] font-medium text-emerald-800">ยอดสุทธิ (Net)</span>
          <p className="text-base font-bold text-emerald-700 mt-1">
            ฿{net.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div
          className={`p-4 rounded-xl border shadow-sm ${
            balance > 0
              ? 'bg-rose-50/60 border-rose-100 text-rose-800'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <span className="text-[11px] font-medium">ยอดคงเหลือค้างชำระ</span>
          <p
            className={`text-base font-bold mt-1 ${
              balance > 0 ? 'text-rose-700' : 'text-slate-500'
            }`}
          >
            ฿{balance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Contract & Bank Details Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary-600" />
            ข้อมูลกำหนดเวลา
          </h2>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">งวดประจำเดือน:</span>
              <span className="font-semibold text-slate-800">{payment.billing_period}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">วันครบกำหนดชำระ:</span>
              <span className="font-semibold text-rose-700">
                {new Date(payment.due_date).toLocaleDateString('th-TH')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">สัญญาเช่า:</span>
              <span className="font-medium text-slate-800">
                {contract ? contract.contract_no : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">สถานที่:</span>
              <span className="font-medium text-slate-800">
                {contract?.locations?.location_name} ({contract?.locations?.province})
              </span>
            </div>
            {payment.payment_note && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 block mb-1">หมายเหตุงวดชำระ:</span>
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
            ข้อมูลการโอนเงินและคู่สัญญา
          </h2>

          {contract?.landlords && (
            <div className="space-y-2 text-xs">
              <span className="text-xs font-semibold text-indigo-700 uppercase block">
                ผู้ให้เช่า (ผู้รับเงินโอน)
              </span>
              <p className="text-sm font-medium text-slate-900">
                {contract.landlords.name || contract.landlords.company_name}
              </p>
              {contract.landlords.bank_account_number ? (
                <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 space-y-1">
                  <div className="text-indigo-900 font-semibold">
                    ธนาคาร: {contract.landlords.bank_name || '-'}
                  </div>
                  <div className="font-mono text-base font-bold text-indigo-700 select-all">
                    {contract.landlords.bank_account_number}
                  </div>
                  <span className="text-[10px] text-indigo-500 block">
                    (คลิกหรือแตะเพื่อคัดลอกเลขบัญชี)
                  </span>
                </div>
              ) : (
                <p className="text-slate-400 italic">ไม่ได้ระบุเลขที่บัญชีธนาคาร</p>
              )}
            </div>
          )}

          {contract?.customers && (
            <div className="space-y-2 text-xs">
              <span className="text-xs font-semibold text-teal-700 uppercase block">
                ลูกค้า / ผู้เช่า (ผู้ชำระเงิน)
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
              ประวัติการชำระเงิน (Transactions)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              รายการชำระเงินสำหรับงวดนี้ สามารถแบ่งชำระเป็นหลายครั้งได้
            </p>
          </div>

          {allowWrite && balance > 0 && (
            <Button
              size="sm"
              onClick={() => setIsDialogOpen(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              เพิ่มรายการชำระ
            </Button>
          )}
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center">
            <CreditCard className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-700">ยังไม่มีรายการชำระเงิน</p>
            <p className="text-xs text-slate-400">
              เมื่อมีการโอนเงินหรือรับชำระ สามารถกดบันทึกการชำระเงินได้ทันที
            </p>
            {allowWrite && (
              <Button
                size="sm"
                onClick={() => setIsDialogOpen(true)}
                className="mt-4 bg-primary-600 hover:bg-primary-700 text-white"
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                บันทึกการชำระเงินแรก
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">วันที่ / เวลาทำรายการ</th>
                  <th className="px-4 py-3 text-right">จำนวนเงิน</th>
                  <th className="px-4 py-3">ช่องทางชำระ</th>
                  <th className="px-4 py-3">เลขที่อ้างอิง / สลิป</th>
                  <th className="px-4 py-3">ผู้บันทึก</th>
                  <th className="px-4 py-3">หมายเหตุ</th>
                  {allowWrite && <th className="px-4 py-3 text-right">จัดการ</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                      {new Date(tx.transaction_date).toLocaleString('th-TH')}
                    </td>

                    <td className="px-4 py-3 text-right font-bold text-emerald-600 whitespace-nowrap">
                      ฿{Number(tx.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                        {PAYMENT_METHOD_LABELS[tx.payment_method] || tx.payment_method}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
                      {tx.reference_no || '-'}
                    </td>

                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {tx.profiles?.full_name || tx.profiles?.email || '-'}
                    </td>

                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                      {tx.note || '-'}
                    </td>

                    {allowWrite && (
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingTxId(tx.id)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                          title="ลบรายการชำระนี้"
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
        title="ยืนยันการลบรายการชำระเงิน"
        description="คุณแน่ใจหรือไม่ว่าต้องการลบรายการชำระเงินนี้? ยอดเงินที่ชำระและสถานะของงวดนี้จะถูกคำนวณใหม่โดยอัตโนมัติ"
        confirmText="ยืนยันลบ"
        cancelText="ยกเลิก"
        variant="danger"
        loading={isDeleting}
        onConfirm={handleDeleteTransaction}
      />
    </div>
  )
}
