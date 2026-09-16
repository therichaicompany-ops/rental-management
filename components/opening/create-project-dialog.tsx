'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Building2 } from 'lucide-react'
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
  openingProjectSchema,
  type OpeningProjectFormValues,
  PROJECT_STATUS_LABELS,
} from '@/lib/types/opening'
import type { UserProfile } from '@/lib/types/auth'
import { createOpeningProjectAction } from '@/lib/actions/opening'

interface EligibleContract {
  id: string
  contract_no: string
  status: string
  locations?: {
    location_name: string
    province: string
  } | null
}

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contracts: EligibleContract[]
  staffProfiles?: Pick<UserProfile, 'id' | 'full_name' | 'email'>[]
  defaultContractId?: string
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  contracts,
  staffProfiles = [],
  defaultContractId = '',
}: CreateProjectDialogProps) {
  const router = useRouter()
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OpeningProjectFormValues>({
    resolver: zodResolver(openingProjectSchema),
    defaultValues: {
      contract_id: defaultContractId,
      project_no: '',
      target_open_date: '',
      assigned_to: '',
      status: 'in_progress',
      note: '',
    },
  })

  React.useEffect(() => {
    if (open) {
      setErrorMsg(null)
      reset({
        contract_id: defaultContractId,
        project_no: '',
        target_open_date: '',
        assigned_to: '',
        status: 'in_progress',
        note: '',
      })
    }
  }, [open, defaultContractId, reset])

  const onSubmit = async (values: OpeningProjectFormValues) => {
    setErrorMsg(null)
    const res = await createOpeningProjectAction(values)

    if (res.success) {
      onOpenChange(false)
      const createdId = (res.data as { id?: string })?.id
      if (createdId) {
        router.push(`/opening/${createdId}`)
      } else {
        router.refresh()
      }
    } else {
      setErrorMsg(res.error || 'เกิดข้อผิดพลาดในการสร้างโครงการ')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900">
            <Building2 className="h-5 w-5 text-primary-600" />
            สร้างโครงการเปิดสาขาใหม่
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            สร้างโครงการเพื่อติดตาม 13 ขั้นตอนการเปิดสาขาและสร้างงานย่อยอัตโนมัติตามสัญญา
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              สัญญาเช่าที่เกี่ยวข้อง <span className="text-rose-500">*</span>
            </label>
            <Select {...register('contract_id')}>
              <option value="">-- เลือกสัญญาเช่า (สถานะ Agreed / Active) --</option>
              {contracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.contract_no} - {c.locations?.location_name} ({c.locations?.province})
                </option>
              ))}
            </Select>
            {errors.contract_id && (
              <p className="text-xs text-rose-600 mt-1">{errors.contract_id.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              รหัสโครงการ (Project No.)
            </label>
            <Input
              placeholder="ปล่อยว่างเพื่อให้ระบบสร้างให้อัตโนมัติ"
              {...register('project_no')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                วันเป้าหมายเปิดสาขา (Target Open Date)
              </label>
              <Input type="date" {...register('target_open_date')} />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                สถานะโครงการ
              </label>
              <Select {...register('status')}>
                {Object.entries(PROJECT_STATUS_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {staffProfiles.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ผู้รับผิดชอบโครงการ
              </label>
              <Select {...register('assigned_to')}>
                <option value="">-- ไม่ระบุผู้รับผิดชอบ --</option>
                {staffProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name || p.email}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              หมายเหตุโครงการ
            </label>
            <Textarea
              rows={2}
              placeholder="ระบุข้อกำหนดเพิ่มเติม หรือเป้าหมายในการเปิดสาขานี้..."
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
              {isSubmitting ? 'กำลังสร้าง...' : 'สร้างโครงการเปิดสาขา'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
