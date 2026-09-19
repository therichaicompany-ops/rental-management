'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UserCog, Loader2 } from 'lucide-react'
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
import { Select } from '@/components/ui/select'
import { type UserProfile, type UserRole } from '@/lib/types/auth'
import { updateUserAction } from '@/lib/actions/users'
import { useI18n } from '@/lib/i18n/context'
import type { Locale } from '@/lib/i18n/types'

interface EditUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserProfile | null
  currentUserId: string
  onSuccess?: (message: string) => void
}

const ROLE_OPTIONS: Record<Locale, { value: UserRole; label: string; desc: string }[]> = {
  th: [
    { value: 'staff', label: 'พนักงาน', desc: 'จัดการข้อมูลทั่วไป' },
    { value: 'operation', label: 'ฝ่ายปฏิบัติการ', desc: 'ดูแลงานเปิดสาขาและสถานที่' },
    { value: 'accounting', label: 'บัญชี', desc: 'ดูแลสัญญาและค่าเช่า' },
    { value: 'hr', label: 'HR', desc: 'จัดการบุคลากร' },
    { value: 'viewer', label: 'ผู้ดูข้อมูล', desc: 'ดูข้อมูลอย่างเดียว' },
    { value: 'admin', label: 'ผู้ดูแลระบบ', desc: 'ผู้ดูแลระบบ จัดการผู้ใช้ได้' },
    { value: 'owner', label: 'เจ้าของระบบ', desc: 'เจ้าของระบบ สิทธิ์สูงสุด' },
  ],
  en: [
    { value: 'staff', label: 'Staff', desc: 'General data management' },
    { value: 'operation', label: 'Operations', desc: 'Branch opening and location management' },
    { value: 'accounting', label: 'Accounting', desc: 'Contracts and rent payments' },
    { value: 'hr', label: 'HR', desc: 'Personnel management' },
    { value: 'viewer', label: 'Viewer', desc: 'Read-only access' },
    { value: 'admin', label: 'Administrator', desc: 'System admin, user management' },
    { value: 'owner', label: 'System Owner', desc: 'Full system permissions' },
  ],
  my: [
    { value: 'staff', label: 'ဝန်ထမ်း', desc: 'အထွေထွေ အချက်အလက် စီမံခန့်ခွဲမှု' },
    { value: 'operation', label: 'လုပ်ငန်းဆောင်ရွက်ရေး', desc: 'ဆိုင်ခွဲဖွင့်လှစ်ခြင်းနှင့် နေရာစီမံမှု' },
    { value: 'accounting', label: 'စာရင်းကိုင်', desc: 'စာချုပ်များနှင့် ငှားရမ်းခများ' },
    { value: 'hr', label: 'လူ့စွမ်းအားအရင်းအမြစ်', desc: 'ဝန်ထမ်း စီမံခန့်ခွဲမှု' },
    { value: 'viewer', label: 'ကြည့်ရှုသူ', desc: 'ကြည့်ရှုခွင့်သာ' },
    { value: 'admin', label: 'အက်ဒမင်', desc: 'စနစ်အုပ်ချုပ်သူ၊ အသုံးပြုသူ စီမံခန့်ခွဲမှု' },
    { value: 'owner', label: 'စနစ်ပိုင်ရှင်', desc: 'အပြည့်အဝ လုပ်ပိုင်ခွင့်' },
  ],
}

export function EditUserDialog({
  open,
  onOpenChange,
  user,
  currentUserId,
  onSuccess,
}: EditUserDialogProps) {
  const { t, locale } = useI18n()
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('staff')
  const [department, setDepartment] = useState('')
  const [phone, setPhone] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const roles = ROLE_OPTIONS[locale] || ROLE_OPTIONS.th

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '')
      setEmail(user.email || '')
      setRole(user.role || 'staff')
      setDepartment(user.department || '')
      setPhone(user.phone || '')
      setErrorMsg(null)
    }
  }, [user, open])

  const isSelf = user?.id === currentUserId
  const isTargetOwner = user?.role === 'owner'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setErrorMsg(null)

    if (!fullName.trim()) {
      setErrorMsg(locale === 'th' ? 'กรุณากรอกชื่อ-นามสกุล' : locale === 'my' ? 'အမည် အပြည့်အစုံ ထည့်သွင်းပါ' : 'Please enter full name')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg(locale === 'th' ? 'กรุณากรอกอีเมลที่ถูกต้อง' : locale === 'my' ? 'မှန်ကန်သော အီးမေးလ် ထည့်သွင်းပါ' : 'Please enter a valid email address')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await updateUserAction(user.id, {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        role,
        department: department.trim() || undefined,
        phone: phone.trim() || undefined,
      })

      if (!res.success) {
        setErrorMsg(res.error || (locale === 'th' ? 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล' : 'Error updating user'))
        return
      }

      onOpenChange(false)
      const successText = locale === 'th'
        ? `แก้ไขข้อมูลผู้ใช้ "${fullName.trim()}" สำเร็จเรียบร้อยแล้ว`
        : locale === 'my'
        ? `အသုံးပြုသူ "${fullName.trim()}" ၏ အချက်အလက်များကို ပြင်ဆင်ပြီးပါပြီ`
        : `User "${fullName.trim()}" updated successfully`
      onSuccess?.(successText)
      router.refresh()
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary-600 mb-1">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
              <UserCog className="w-5 h-5" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900">
              {t.users.editUser}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-slate-500">
            {locale === 'th'
              ? 'แก้ไขข้อมูลส่วนตัว บทบาทหน้าที่ และแผนกของผู้ใช้งาน'
              : locale === 'my'
              ? 'အသုံးပြုသူ၏ အချက်အလက်များ၊ ရာထူးနှင့် ဌာနကို ပြင်ဆင်ပါ'
              : 'Edit user profile, roles, and department details'}
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* ชื่อ-นามสกุล */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-full-name">
              {t.users.fullName} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-email">
                {t.users.email} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-phone">
                {t.users.phone}
              </Label>
              <Input
                id="edit-phone"
                placeholder="081-234-5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Role & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-role">
                {t.users.role} <span className="text-red-500">*</span>
              </Label>
              <Select
                id="edit-role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                disabled={isSelf && isTargetOwner}
              >
                {roles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
              {isSelf && isTargetOwner && (
                <p className="text-[11px] text-slate-500">
                  {locale === 'th' ? '* ไม่สามารถลดสิทธิ์ของตนเองได้' : '* Cannot demote own account'}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-department">
                {t.users.department}
              </Label>
              <Input
                id="edit-department"
                placeholder={locale === 'th' ? 'เช่น การเงิน, จัดซื้อ, สาขา' : 'e.g. Finance, Branch'}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
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
                t.common.save
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
