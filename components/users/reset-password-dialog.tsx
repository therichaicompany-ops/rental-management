'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, Eye, EyeOff, Loader2, ShieldAlert } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { type UserProfile } from '@/lib/types/auth'
import { resetUserPasswordAction } from '@/lib/actions/users'
import { useI18n } from '@/lib/i18n/context'

interface ResetPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserProfile | null
  onSuccess?: (message: string) => void
}

export function ResetPasswordDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: ResetPasswordDialogProps) {
  const { t, locale } = useI18n()
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setPassword('')
      setConfirmPassword('')
      setShowPassword(false)
      setShowConfirmPassword(false)
      setErrorMsg(null)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setErrorMsg(null)

    if (!password || password.length < 6) {
      setErrorMsg(
        locale === 'th'
          ? 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร'
          : locale === 'my'
          ? 'စကားဝှက်အသစ်သည် အနည်းဆုံး ၆ လုံး ရှိရမည်'
          : 'New password must be at least 6 characters'
      )
      return
    }

    if (password !== confirmPassword) {
      setErrorMsg(
        locale === 'th'
          ? 'รหัสผ่านทั้งสองช่องไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง'
          : locale === 'my'
          ? 'စကားဝှက်များ မတူညီပါ၊ ကျေးဇူးပြု၍ ပြန်လည်စစ်ဆေးပါ'
          : 'Passwords do not match'
      )
      return
    }

    setIsSubmitting(true)
    try {
      const res = await resetUserPasswordAction(user.id, password)

      if (!res.success) {
        setErrorMsg(res.error || (locale === 'th' ? 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน' : 'Error resetting password'))
        return
      }

      onOpenChange(false)
      const successText = locale === 'th'
        ? `รีเซ็ตรหัสผ่านสำหรับ "${user.full_name || user.email}" สำเร็จเรียบร้อยแล้ว`
        : locale === 'my'
        ? `"${user.full_name || user.email}" အတွက် စကားဝှက်ကို ပြန်လည်သတ်မှတ်ပြီးပါပြီ`
        : `Password for "${user.full_name || user.email}" reset successfully`
      onSuccess?.(successText)
      router.refresh()
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary-600 mb-1">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
              <KeyRound className="w-5 h-5" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900">
              {t.users.resetPassword}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-slate-500">
            {locale === 'th'
              ? 'ตั้งค่ารหัสผ่านใหม่ให้กับผู้ใช้งานนี้โดยตรงทันที'
              : locale === 'my'
              ? 'ဤအသုံးပြုသူအတွက် စကားဝှက်အသစ်ကို တိုက်ရိုက် သတ်မှတ်ပါ'
              : 'Directly set a new password for this user'}
          </DialogDescription>
        </DialogHeader>

        {/* User Card Summary */}
        {user && (
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center text-base uppercase flex-shrink-0">
              {user.full_name ? user.full_name.charAt(0) : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-slate-900 text-sm truncate">
                {user.full_name || 'No Name'}
              </div>
              <div className="text-xs text-slate-500 font-mono truncate">
                {user.email || '-'}
              </div>
            </div>
            <Badge variant="outline" className="text-xs capitalize">
              {user.role}
            </Badge>
          </div>
        )}

        {errorMsg && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* New Password */}
          <div className="space-y-1.5">
            <Label htmlFor="reset-new-password">
              {t.users.newPassword} <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="reset-new-password"
                type={showPassword ? 'text' : 'password'}
                placeholder={locale === 'th' ? 'กรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)' : 'At least 6 characters'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="space-y-1.5">
            <Label htmlFor="reset-confirm-password">
              {t.users.confirmPassword} <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="reset-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder={locale === 'th' ? 'กรอกรหัสผ่านใหม่อีกครั้งเพื่อยืนยัน' : 'Re-enter new password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <DialogFooter className="pt-3 gap-2 sm:gap-0">
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
              className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t.common.saving}
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4" />
                  {t.users.resetPassword}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
