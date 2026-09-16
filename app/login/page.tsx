'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Building2 } from 'lucide-react'
import { loginAction } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const loginSchema = z.object({
  email: z.string().min(1, 'กรุณากรอก Email').email('รูปแบบ Email ไม่ถูกต้อง'),
  password: z.string().min(1, 'กรุณากรอก Password'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  function onSubmit(data: LoginFormValues) {
    setServerError(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.append('email', data.email)
      formData.append('password', data.password)
      const result = await loginAction(formData)
      if (result?.error) {
        setServerError(result.error)
      }
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          {/* Logo */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-500 shadow-lg mx-auto">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">ระบบบริหารงานเช่าและเปิดสาขา</h1>
              <p className="text-sm text-muted-foreground mt-1">กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id="login-form" noValidate>
            {/* Server error */}
            {serverError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {serverError}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="กรอก Email ของคุณ"
                disabled={isPending}
                {...register('email')}
                className={errors.email ? 'border-red-400 focus-visible:ring-red-400' : ''}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="กรอก Password ของคุณ"
                  disabled={isPending}
                  {...register('password')}
                  className={errors.password ? 'border-red-400 focus-visible:ring-red-400 pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'ซ่อน Password' : 'แสดง Password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full mt-2"
              disabled={isPending}
              id="login-submit"
            >
              {isPending ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          &copy; {new Date().getFullYear()} ระบบบริหารงานเช่าและเปิดสาขา
        </p>
      </div>
    </div>
  )
}
