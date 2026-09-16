'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'primary'
  loading?: boolean
  onConfirm: () => void | Promise<void>
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'ยืนยันการลบ',
  cancelText = 'ยกเลิก',
  variant = 'danger',
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={loading ? undefined : onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-slate-200 bg-white p-6 shadow-xl rounded-xl duration-200 animate-in fade-in-0 zoom-in-95">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 flex-shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="space-y-1 text-left flex-1">
              <DialogPrimitive.Title className="text-base font-semibold text-slate-900 leading-none">
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-sm text-slate-500 mt-1 leading-relaxed">
                {description}
              </DialogPrimitive.Description>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-4 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {cancelText}
            </Button>
            <Button
              type="button"
              variant={variant === 'danger' ? 'destructive' : 'default'}
              onClick={onConfirm}
              disabled={loading}
              className="min-w-[100px]"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {confirmText}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
