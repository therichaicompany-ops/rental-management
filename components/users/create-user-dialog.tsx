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
import { ROLE_LABELS, type UserRole } from '@/lib/types/auth'
import { createUserAction } from '@/lib/actions/users'

interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ROLES: { value: UserRole; label: string; desc: string }[] = [
  { value: 'staff', label: ROLE_LABELS.staff, desc: 'จัดการข้อมูลทั่วไป' },
  { value: 'operation', label: ROLE_LABELS.operation, desc: 'ดูแลงานเปิดสาขาและสถานที่' },
  { value: 'accounting', label: ROLE_LABELS.accounting, desc: 'ดูแลสัญญาและค่าเช่า' },
  { value: 'hr', label: ROLE_LABELS.hr, desc: 'จัดการบุคลากร' },
  { value: 'viewer', label: ROLE_LABELS.viewer, desc: 'ดูข้อมูลอย่างเดียว' },
  { value: 'admin', label: ROLE_LABELS.admin, desc: 'ผู้ดูแลระบบ จัดการผู้ใช้ได้' },
  { value: 'owner', label: ROLE_LABELS.owner, desc: 'เจ้าของระบบ สิทธิ์สูงสุด' },
]

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
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
      setErrorMsg('กรุณากรอกชื่อ-นามสกุล')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('กรุณากรอกอีเมลที่ถูกต้อง')
      return
    }
    if (!password || password.length < 6) {
      setErrorMsg('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร')
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
        setErrorMsg(res.error || 'เกิดข้อผิดพลาดในการสร้างผู้ใช้งาน')
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
            <DialogTitle className="text-xl font-bold text-slate-900">เพิ่มผู้ใช้งานใหม่</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-slate-500">
            สร้างบัญชีผู้ใช้งานสำหรับเข้าสู่ระบบบริหารงานเช่าและเปิดสาขา
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
              ชื่อ-นามสกุล <span className="text-red-500">*</span>
            </Label>
            <Input
              id="create-full-name"
              placeholder="เช่น สมชาย ใจดี"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="create-email">
                Email (ล็อกอิน) <span className="text-red-500">*</span>
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
              <Label htmlFor="create-phone">เบอร์โทรศัพท์</Label>
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
              รหัสผ่านเริ่มต้น <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="create-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="อย่างน้อย 6 ตัวอักษร"
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
              <Label htmlFor="create-role">ตำแหน่ง / สิทธิ์ <span className="text-red-500">*</span></Label>
              <Select
                id="create-role"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-department">แผนก</Label>
              <Input
                id="create-department"
                placeholder="เช่น การเงิน, จัดซื้อ, สาขา"
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
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  กำลังสร้าง...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  สร้างผู้ใช้งาน
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
