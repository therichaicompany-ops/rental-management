'use client'

import * as React from 'react'
import { Check, Clock } from 'lucide-react'
import type { WorkflowStageModel } from '@/lib/types/opening'
import { advanceProjectStageAction } from '@/lib/actions/opening'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface StageStepperProps {
  stages: WorkflowStageModel[]
  currentStageId: string | null
  projectId: string
  allowEdit?: boolean
}

export function StageStepper({
  stages,
  currentStageId,
  projectId,
  allowEdit = false,
}: StageStepperProps) {
  const [isPending, setIsPending] = React.useState(false)
  const [selectedStage, setSelectedStage] = React.useState<WorkflowStageModel | null>(null)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  const currentStage = stages.find((s) => s.id === currentStageId)
  const currentSeq = currentStage?.sequence ?? 1

  const handleStageClick = (stage: WorkflowStageModel) => {
    if (!allowEdit || stage.id === currentStageId) return
    setSelectedStage(stage)
  }

  const handleConfirmChange = async () => {
    if (!selectedStage) return
    setIsPending(true)
    setErrorMsg(null)

    const res = await advanceProjectStageAction(projectId, selectedStage.id)
    setIsPending(false)

    if (res.success) {
      setSelectedStage(null)
    } else {
      setErrorMsg(res.error || 'ไม่สามารถเปลี่ยนขั้นตอนได้')
    }
  }

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
          {errorMsg}
        </div>
      )}

      <div className="overflow-x-auto pb-4 pt-1">
        <div className="flex items-center min-w-[980px] px-2">
          {stages.map((stage, idx) => {
            const isCompleted = stage.sequence < currentSeq
            const isCurrent = stage.id === currentStageId

            return (
              <React.Fragment key={stage.id}>
                {/* Stage Node */}
                <div
                  onClick={() => handleStageClick(stage)}
                  className={`flex flex-col items-center group relative cursor-pointer ${
                    !allowEdit ? 'cursor-default' : ''
                  }`}
                  title={`${stage.sequence}. ${stage.stage_name} (${
                    isCompleted ? 'เสร็จสิ้นแล้ว' : isCurrent ? 'ขั้นตอนปัจจุบัน' : 'รอดำเนินการ'
                  })`}
                >
                  {/* Status Circle */}
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all shadow-sm ${
                      isCompleted
                        ? 'bg-emerald-500 text-white ring-4 ring-emerald-100'
                        : isCurrent
                        ? 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse'
                        : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4 stroke-[3]" />
                    ) : isCurrent ? (
                      <Clock className="h-4 w-4" />
                    ) : (
                      <span>{stage.sequence}</span>
                    )}
                  </div>

                  {/* Stage Label */}
                  <span
                    className={`mt-2 text-[11px] font-medium text-center whitespace-nowrap px-1 max-w-[85px] truncate transition-colors ${
                      isCurrent
                        ? 'text-amber-800 font-bold'
                        : isCompleted
                        ? 'text-slate-800 font-semibold'
                        : 'text-slate-400'
                    }`}
                  >
                    {stage.stage_name}
                  </span>

                  {/* Stage Code Tag */}
                  <span className="text-[9px] text-slate-400 font-mono tracking-tighter">
                    {stage.stage_code}
                  </span>
                </div>

                {/* Connecting Line */}
                {idx < stages.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 transition-colors ${
                      stage.sequence < currentSeq ? 'bg-emerald-400' : 'bg-slate-200'
                    }`}
                  />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Advance Stage Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(selectedStage)}
        onOpenChange={(open) => !open && setSelectedStage(null)}
        title="เปลี่ยนขั้นตอนโครงการเปิดสาขา"
        description={
          selectedStage
            ? `คุณต้องการเปลี่ยนขั้นตอนโครงการเป็น "${selectedStage.sequence}. ${selectedStage.stage_name}" ใช่หรือไม่?`
            : ''
        }
        confirmText="ยืนยันเปลี่ยนขั้นตอน"
        cancelText="ยกเลิก"
        variant="primary"
        loading={isPending}
        onConfirm={handleConfirmChange}
      />
    </div>
  )
}
