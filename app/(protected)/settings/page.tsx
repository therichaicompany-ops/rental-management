import type { Metadata } from 'next'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { requireUser } from '@/lib/auth/route-guard'
import { ROLE_LABELS } from '@/lib/types/auth'
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Server,
  Bell,
  HardDrive,
  CheckCircle2,
  Lock,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = {
  title: 'ตั้งค่าระบบ | ระบบบริหารงานเช่าและเปิดสาขา',
  description: 'การตั้งค่าระบบ ข้อมูลผู้ใช้ และสิทธิ์การใช้งาน',
}

const MODULES = [
  { name: 'ระบบสมาชิก & ความปลอดภัย (Auth & Users)', status: 'active', desc: 'Phase 1' },
  { name: 'ระบบข้อมูลหลัก (Master Data: ลูกค้า, ผู้ให้เช่า, สถานที่)', status: 'active', desc: 'Phase 2' },
  { name: 'ระบบงานเช่า & การเจรจา (Rental Leads)', status: 'active', desc: 'Phase 3' },
  { name: 'ระบบสัญญาเช่า & การชำระค่าเช่า (Contracts & Rent)', status: 'active', desc: 'Phase 4' },
  { name: 'ระบบโครงการเปิดสาขา & จัดการงาน (Branch Opening)', status: 'active', desc: 'Phase 5' },
  { name: 'ระบบศูนย์เอกสาร & จัดเก็บไฟล์ (Document Center)', status: 'active', desc: 'Phase 6' },
  { name: 'ระบบ Dashboard, ปฏิทิน และรายงาน 7 รูปแบบ', status: 'active', desc: 'Phase 7' },
  { name: 'ระบบเชื่อมต่อ LINE Messaging API', status: 'upcoming', desc: 'Phase 8 (เร็วๆ นี้)' },
  { name: 'ระบบแจ้งเตือนค่าเช่าอัตโนมัติ (Rent Reminder)', status: 'upcoming', desc: 'Phase 9 (เร็วๆ นี้)' },
  { name: 'ระบบ Recurring Rent & Production Cron', status: 'upcoming', desc: 'Phase 10 (เร็วๆ นี้)' },
]

export default async function SettingsPage() {
  await requireUser()
  const user = await getCurrentUser()
  const profile = user?.profile

  return (
    <div className="space-y-8 max-w-6xl pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-primary" />
          การตั้งค่าระบบ
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          จัดการข้อมูลส่วนตัว สิทธิ์การใช้งาน และตรวจสอบสถานะระบบ
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: User Profile */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold">ข้อมูลบัญชีผู้ใช้</h2>
                <p className="text-xs text-muted-foreground">บัญชีที่กำลังเข้าสู่ระบบ</p>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block">ชื่อ-นามสกุล</span>
                <span className="font-medium">{profile?.full_name || '-'}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">อีเมล</span>
                <span className="font-medium text-foreground">{user?.email || '-'}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-1">ระดับสิทธิ์ (Role)</span>
                <Badge variant="secondary" className="font-medium text-xs">
                  <Shield className="h-3 w-3 mr-1 text-primary" />
                  {profile?.role ? ROLE_LABELS[profile.role] : '-'} ({profile?.role})
                </Badge>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">สถานะบัญชี</span>
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  ใช้งานได้ปกติ (Active)
                </span>
              </div>
            </div>
          </div>

          {/* Storage & Documents Info */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b">
              <HardDrive className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold">พื้นที่จัดเก็บไฟล์ (Storage)</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              ระบบจัดเก็บเอกสารและไฟล์แนบสัญญาเช่า (Supabase Storage: Bucket <code className="bg-muted px-1.5 py-0.5 rounded text-primary">documents</code>)
            </p>
            <div className="rounded-lg bg-muted/40 p-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ประเภทความปลอดภัย:</span>
                <span className="font-medium text-emerald-600 flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Private (Signed URLs)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ขนาดไฟล์สูงสุด:</span>
                <span className="font-medium">10 MB ต่อไฟล์</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ชนิดไฟล์ที่รองรับ:</span>
                <span className="font-medium">PDF, JPG, PNG, WEBP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: System Status & Modules */}
        <div className="space-y-6 lg:col-span-2">
          {/* System Overview */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b">
              <div className="flex items-center gap-3">
                <Server className="h-5 w-5 text-primary" />
                <h2 className="text-base font-semibold">สถานะระบบ & โมดูลที่เปิดใช้งาน</h2>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200">
                v0.1.0 Ready
              </Badge>
            </div>

            <div className="divide-y divide-border">
              {MODULES.map((m, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2.5">
                    {m.status === 'active' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Bell className="h-4 w-4 text-amber-500 shrink-0" />
                    )}
                    <div>
                      <p className="font-medium">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.desc}</p>
                    </div>
                  </div>
                  <Badge
                    variant={m.status === 'active' ? 'default' : 'outline'}
                    className={
                      m.status === 'active'
                        ? 'bg-emerald-500/15 text-emerald-600 border-emerald-300'
                        : 'text-muted-foreground'
                    }
                  >
                    {m.status === 'active' ? 'เปิดใช้งานแล้ว' : 'เร็วๆ นี้'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Role & Permissions reference */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold">คำอธิบายสิทธิ์ในระบบ (Role Permissions)</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border bg-muted/20">
                <span className="font-semibold text-primary block mb-1">Owner / เจ้าของระบบ</span>
                <span className="text-muted-foreground">เข้าถึงได้ทุกส่วนของระบบ ลบและแก้ไขข้อมูลสำคัญได้ทั้งหมด</span>
              </div>
              <div className="p-3 rounded-lg border bg-muted/20">
                <span className="font-semibold text-primary block mb-1">Admin / ผู้ดูแลระบบ</span>
                <span className="text-muted-foreground">จัดการข้อมูลทั้งหมด ผู้ใช้งาน และการตั้งค่าระบบ</span>
              </div>
              <div className="p-3 rounded-lg border bg-muted/20">
                <span className="font-semibold text-primary block mb-1">Accounting / บัญชีและการเงิน</span>
                <span className="text-muted-foreground">จัดการสัญญาเช่า, การชำระค่าเช่า, ดูรายงาน และเอกสารการเงิน</span>
              </div>
              <div className="p-3 rounded-lg border bg-muted/20">
                <span className="font-semibold text-primary block mb-1">Operation / ฝ่ายปฏิบัติการ</span>
                <span className="text-muted-foreground">ดูแลโครงการเปิดสาขา จัดการงาน (Tasks) และปฏิทินงาน</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
