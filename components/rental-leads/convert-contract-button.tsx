'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FileCheck, CheckCircle2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { convertToContractAction } from '@/lib/actions/rental-leads'
import type { LeadStatus } from '@/lib/types/rental-leads'

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
        <span>ดูสัญญาเช่า {contractNo ? `(${contractNo})` : ''}</span>
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
        setErrorMsg(res.error || 'เกิดข้อผิดพลาดในการสร้างสัญญาเช่า')
        setShowConfirm(false)
        return
      }

      setShowConfirm(false)
      setSuccessMsg('สร้างสัญญาเช่าสำเร็จ!')
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
          สร้างสัญญาเช่า
        </Button>
        {errorMsg && <p className="text-xs text-red-600">{errorMsg}</p>}
        {successMsg && <p className="text-xs text-emerald-600">{successMsg}</p>}
      </div>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="ยืนยันการสร้างสัญญาเช่า"
        description="ระบบจะสร้างสัญญาเช่าฉบับร่าง (Draft) โดยคัดลอกข้อมูลสถานที่ ลูกค้า ผู้ให้เช่า และข้อเสนอค่าเช่าจากงานเช่านี้เข้าระบบสัญญาหลัก และจะเปลี่ยนสถานะของ Lead เป็น 'สร้างสัญญาแล้ว (converted)' โดยอัตโนมัติ"
        confirmText="ยืนยันสร้างสัญญา"
        variant="primary"
        loading={isPending}
        onConfirm={handleConvert}
      />
    </>
  )
}
