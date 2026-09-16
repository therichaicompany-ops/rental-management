'use client'

import * as React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, Loader2, Eye, EyeOff } from 'lucide-react'
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
import { type UserRole } from '@/lib/types/auth'
import { createUserAction } from '@/lib/actions/users'
import { useI18n } from '@/lib/i18n/context'
import type { Locale } from '@/lib/i18n/types'

interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
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

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const { t, locale } = useI18n()
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState<UserRole>('staff')
  const [department, setDepartment] = useState('')
  const [phone, setPhone] = useState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const roles = ROLE_OPTIONS[locale] || ROLE_OPTIONS.th

  const resetForm = () => {
    setFullName('')
    setEmail('')
    setPassword('')
    setShowPassword(false)
    setRole('staff')
    setDepartment('')
    setPhone('')
    setErrorMsg(null)
  }

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm()
    }
    onOpenChange(newOpen)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!fullName.trim()) {
      setErrorMsg(locale === 'th' ? 'กรุณากรอกชื่อ-นามสกุล' : locale === 'my' ? 'အမည် အပြည့်အစုံ ထည့်သွင်းပါ' : 'Please enter full name')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg(locale === 'th' ? 'กรุณากรอกอีเมลที่ถูกต้อง' : locale === 'my' ? 'မှန်ကန်သော အီးမေးလ် ထည့်သွင်းပါ' : 'Please enter a valid email address')
      return
    }
    if (!password || password.length < 6) {
      setErrorMsg(locale === 'th' ? 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' : locale === 'my' ? 'စကားဝှက်သည် အနည်းဆုံး ၆ လုံး ရှိရမည်' : 'Password must be at least 6 characters')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await createUserAction({
        full_name: fullName,
        email,
        password,
        role,
        department: department.trim() || undefined,
        phone: phone.trim() || undefined,
      })

      if (!res.success) {
        setErrorMsg(res.error || (locale === 'th' ? 'เกิดข้อผิดพลาดในการสร้างผู้ใช้งาน' : 'Error creating user'))
        return
      }

      handleClose(false)
      router.refresh()
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสร้างผู้ใช้งาน')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary-600 mb-1">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
              <UserPlus className="w-5 h-5" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900">{t.users.addNew}</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-slate-500">
            {locale === 'th'
              ? 'สร้างบัญชีผู้ใช้งานสำหรับเข้าสู่ระบบบริหารงานเช่าและเปิดสาขา'
              : locale === 'my'
              ? 'စနစ်သို့ ဝင်ရောက်ရန် အသုံးပြုသူအကောင့် ဖန်တီးပါ'
              : 'Create a user account for accessing the system'}
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
            <Label htmlFor="create-full-name">
              {t.users.fullName} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="create-full-name"
              placeholder={locale === 'th' ? 'เช่น สมชาย ใจดี' : locale === 'my' ? 'ဥပမာ မောင်မောင်' : 'e.g. John Doe'}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="create-email">
                {t.users.email} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="create-email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-phone">
                {locale === 'th' ? 'เบอร์โทรศัพท์' : locale === 'my' ? 'ဖုန်းနံပါတ်' : 'Phone Number'}
              </Label>
              <Input
                id="create-phone"
                placeholder="081-234-5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="create-password">
              {locale === 'th' ? 'รหัสผ่านเริ่มต้น' : locale === 'my' ? 'စကားဝှက်' : 'Password'} <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="create-password"
                type={showPassword ? 'text' : 'password'}
                placeholder={locale === 'th' ? 'อย่างน้อย 6 ตัวอักษร' : locale === 'my' ? 'အနည်းဆုံး ၆ လုံး' : 'At least 6 characters'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Role & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="create-role">{t.users.role} <span className="text-red-500">*</span></Label>
              <Select
                id="create-role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                {roles.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-department">
                {locale === 'th' ? 'แผนก' : locale === 'my' ? 'ဌာန' : 'Department'}
              </Label>
              <Input
                id="create-department"
                placeholder={locale === 'th' ? 'เช่น การเงิน, จัดซื้อ, สาขา' : locale === 'my' ? 'ဥပမာ ဘဏ္ဍာရေး' : 'e.g. Finance, Operations'}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="pt-3 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
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
                  <UserPlus className="h-4 w-4" />
                  {t.common.create}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
