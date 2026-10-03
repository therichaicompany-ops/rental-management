'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FileCheck, CheckCircle2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { convertToContractAction } from '@/lib/actions/rental-leads'
import type { LeadStatus } from '@/lib/types/rental-leads'
import { useI18n } from '@/lib/i18n/context'

interface ConvertContractButtonProps {
  leadId: string
  status: LeadStatus
  allowConvert: boolean
  hasExistingContract?: boolean
  contractNo?: string
  contractId?: string
}

export function ConvertContractButton({
  leadId,
  status,
  allowConvert,
  hasExistingContract = false,
  contractNo,
  contractId,
}: ConvertContractButtonProps) {
  const router = useRouter()
  const { tx } = useI18n()
  const [showConfirm, setShowConfirm] = React.useState(false)
  const [isPending, startTransition] = React.useTransition()
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null)

  // If already has contract tied to this lead
  if (hasExistingContract) {
    return (
      <Link
        href={contractId ? `/contracts/${contractId}` : '/contracts'}
        className="inline-flex items-center gap-2 rounded-lg bg-teal-50 border border-teal-200 px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100 transition-colors shadow-sm"
      >
        <CheckCircle2 className="h-4 w-4 text-teal-600" />
        <span>
          {tx({ th: 'ดูสัญญาเช่า', en: 'View Lease Contract', my: 'အငှားစာချုပ်ကြည့်ရန်' })}
          {contractNo ? ` (${contractNo})` : ''}
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-teal-600" />
      </Link>
    )
  }

  // Only allow converting if agreed or converted (without contract yet)
  if (status !== 'agreed' && status !== 'converted') {
    return null
  }

  if (!allowConvert) {
    return null
  }

  const handleConvert = () => {
    setErrorMsg(null)
    setSuccessMsg(null)

    startTransition(async () => {
      const res = await convertToContractAction(leadId)
      if (!res.success) {
        setErrorMsg(res.error || tx({ th: 'เกิดข้อผิดพลาดในการสร้างสัญญาเช่า', en: 'Failed to create lease contract', my: 'အငှားစာချုပ် ဖန်တီးရာတွင် အမှားဖြစ်ပေါ်ပါသည်' }))
        setShowConfirm(false)
        return
      }

      setShowConfirm(false)
      setSuccessMsg(tx({ th: 'สร้างสัญญาเช่าสำเร็จ!', en: 'Contract created successfully!', my: 'စာချုပ်ကို အောင်မြင်စွာ ဖန်တီးပြီးပါပြီ!' }))
      const createdContract = res.data as { id?: string } | undefined
      if (createdContract?.id) {
        router.push(`/contracts/${createdContract.id}`)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <>
      <div className="flex flex-col items-end gap-1">
        <Button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm font-semibold"
        >
          <FileCheck className="h-4 w-4" />
          {tx({ th: 'สร้างสัญญาเช่า', en: 'Create Contract', my: 'စာချုပ်ဖန်တီးမည်' })}
        </Button>
        {errorMsg && <p className="text-xs text-red-600">{errorMsg}</p>}
        {successMsg && <p className="text-xs text-emerald-600">{successMsg}</p>}
      </div>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title={tx({ th: 'ยืนยันการสร้างสัญญาเช่า', en: 'Confirm Lease Contract Creation', my: 'အငှားစာချုပ်ဖန်တီးရန် အတည်ပြုပါ' })}
        description={tx({
          th: "ระบบจะสร้างสัญญาเช่าฉบับร่าง (Draft) โดยคัดลอกข้อมูลสถานที่ ลูกค้า ผู้ให้เช่า และข้อเสนอค่าเช่าจากงานเช่านี้เข้าระบบสัญญาหลัก และจะเปลี่ยนสถานะของ Lead เป็น 'สร้างสัญญาแล้ว (converted)' โดยอัตโนมัติ",
          en: "The system will generate a Draft contract copying location, customer, landlord, and negotiated rent from this lead into the contracts system, and update the lead status to 'converted'.",
          my: "စနစ်သည် ဤအခွင့်အလမ်းမှ တည်နေရာ၊ ဖောက်သည်၊ အိမ်ရှင်နှင့် ညှိနှိုင်းရရှိသော အငှားခများကို အသုံးပြု၍ စာချုပ်မူကြမ်း (Draft) ကို အလိုအလျောက် ဖန်တီးပေးမည်ဖြစ်ပြီး အခြေအနေကို 'converted' သို့ ပြောင်းလဲပေးမည်ဖြစ်သည်။",
        })}
        confirmText={tx({ th: 'ยืนยันสร้างสัญญา', en: 'Confirm Creation', my: 'ဖန်တီးရန် အတည်ပြုပါ' })}
        cancelText={tx({ th: 'ยกเลิก', en: 'Cancel', my: 'ပယ်ဖျက်မည်' })}
        variant="primary"
        loading={isPending}
        onConfirm={handleConvert}
      />
    </>
  )
}
