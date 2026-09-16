'use client'

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
import { LanguagePreferenceCard } from '@/components/settings/language-preference-card'
import { useI18n } from '@/lib/i18n/context'
import type { UserProfile, UserRole } from '@/lib/types/auth'

interface SettingsViewProps {
  user: { email?: string } | null
  profile?: UserProfile | null
}

export function SettingsView({ user, profile }: SettingsViewProps) {
  const { t, locale } = useI18n()

  const MODULES = [
    {
      name:
        locale === 'th'
          ? 'ระบบสมาชิก & ความปลอดภัย (Auth & Users)'
          : locale === 'my'
          ? 'အဖွဲ့ဝင်နှင့် လုံခြုံရေးစနစ် (Auth & Users)'
          : 'Authentication & User Security (Auth & Users)',
      status: 'active',
      desc: 'Phase 1',
    },
    {
      name:
        locale === 'th'
          ? 'ระบบข้อมูลหลัก (Master Data: ลูกค้า, ผู้ให้เช่า, สถานที่)'
          : locale === 'my'
          ? 'အခြေခံဒေတာစနစ် (Master Data: ဖောက်သည်၊ အိမ်ရှင်၊ တည်နေရာ)'
          : 'Master Data (Customers, Landlords, Locations)',
      status: 'active',
      desc: 'Phase 2',
    },
    {
      name:
        locale === 'th'
          ? 'ระบบงานเช่า & การเจรจา (Rental Leads)'
          : locale === 'my'
          ? 'အငှားအခွင့်အလမ်းနှင့် ညှိနှိုင်းမှုစနစ် (Rental Leads)'
          : 'Rental Leads & Negotiations',
      status: 'active',
      desc: 'Phase 3',
    },
    {
      name:
        locale === 'th'
          ? 'ระบบสัญญาเช่า & การชำระค่าเช่า (Contracts & Rent)'
          : locale === 'my'
          ? 'အိမ်ငှားစာချုပ်နှင့် ငွေပေးချေမှုစနစ် (Contracts & Rent)'
          : 'Lease Contracts & Rent Payments',
      status: 'active',
      desc: 'Phase 4',
    },
    {
      name:
        locale === 'th'
          ? 'ระบบโครงการเปิดสาขา & จัดการงาน (Branch Opening)'
          : locale === 'my'
          ? 'ဆိုင်ခွဲဖွင့်လှစ်မှုနှင့် လုပ်ငန်းစီမံခန့်ခွဲမှုစနစ် (Branch Opening)'
          : 'Branch Opening Projects & Task Management',
      status: 'active',
      desc: 'Phase 5',
    },
    {
      name:
        locale === 'th'
          ? 'ระบบศูนย์เอกสาร & จัดเก็บไฟล์ (Document Center)'
          : locale === 'my'
          ? 'စာရွက်စာတမ်းနှင့် ဖိုင်သိမ်းဆည်းမှုစနစ် (Document Center)'
          : 'Document Center & Cloud Storage',
      status: 'active',
      desc: 'Phase 6',
    },
    {
      name:
        locale === 'th'
          ? 'ระบบ Dashboard, ปฏิทิน และรายงาน 7 รูปแบบ'
          : locale === 'my'
          ? 'ဒက်ရှ်ဘုတ်၊ ပြက္ခဒိန်နှင့် အစီရင်ခံစာ ပုံစံ ၇ မျိုး'
          : 'Dashboard, Calendar, and 7 Analytical Reports',
      status: 'active',
      desc: 'Phase 7',
    },
    {
      name:
        locale === 'th'
          ? 'ระบบเชื่อมต่อ LINE Messaging API'
          : locale === 'my'
          ? 'LINE Messaging API ချိတ်ဆက်မှုစနစ်'
          : 'LINE Messaging API Integration',
      status: 'upcoming',
      desc: locale === 'th' ? 'Phase 8 (เร็วๆ นี้)' : locale === 'my' ? 'Phase 8 (မကြာမီ)' : 'Phase 8 (Upcoming)',
    },
    {
      name:
        locale === 'th'
          ? 'ระบบแจ้งเตือนค่าเช่าอัตโนมัติ (Rent Reminder)'
          : locale === 'my'
          ? 'အလိုအလျောက် အငှားခ သတိပေးချက်စနစ် (Rent Reminder)'
          : 'Automated Rent Reminders',
      status: 'upcoming',
      desc: locale === 'th' ? 'Phase 9 (เร็วๆ นี้)' : locale === 'my' ? 'Phase 9 (မကြာမီ)' : 'Phase 9 (Upcoming)',
    },
    {
      name:
        locale === 'th'
          ? 'ระบบ Recurring Rent & Production Cron'
          : locale === 'my'
          ? 'ထပ်တလဲလဲ အငှားခနှင့် အလိုအလျောက်အချိန်ကိုက်စနစ် (Cron)'
          : 'Recurring Rent Generation & Production Cron',
      status: 'upcoming',
      desc: locale === 'th' ? 'Phase 10 (เร็วๆ นี้)' : locale === 'my' ? 'Phase 10 (မကြာမီ)' : 'Phase 10 (Upcoming)',
    },
  ]

  const userRole = profile?.role as UserRole | undefined

  return (
    <div className="space-y-8 max-w-6xl pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-primary" />
          {t.settings.title}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t.settings.subtitle}
        </p>
      </div>

      {/* Language Preference Section */}
      <LanguagePreferenceCard />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: User Profile */}
        <div className="space-y-6 lg:col-span-1">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold">{t.settings.accountInfo}</h2>
                <p className="text-xs text-muted-foreground">{t.settings.accountDesc}</p>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block">{t.settings.fullName}</span>
                <span className="font-medium">{profile?.full_name || '-'}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">{t.auth.email}</span>
                <span className="font-medium text-foreground">{user?.email || '-'}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block mb-1">{t.settings.role}</span>
                <Badge variant="secondary" className="font-medium text-xs">
                  <Shield className="h-3 w-3 mr-1 text-primary" />
                  {userRole && t.auth.roles[userRole] ? t.auth.roles[userRole] : userRole ?? '-'}
                </Badge>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">{t.settings.accountStatus}</span>
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {t.settings.activeStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Storage & Documents Info */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b">
              <HardDrive className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold">{t.settings.storage}</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              {t.settings.storageDesc} ({t.settings.storageBucketDesc}{' '}
              <code className="bg-muted px-1.5 py-0.5 rounded text-primary">documents</code>)
            </p>
            <div className="rounded-lg bg-muted/40 p-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.settings.securityType}:</span>
                <span className="font-medium text-emerald-600 flex items-center gap-1">
                  <Lock className="h-3 w-3" /> {t.settings.securityPrivate}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.settings.maxFileSize}:</span>
                <span className="font-medium">10 MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {locale === 'th' ? 'ชนิดไฟล์ที่รองรับ:' : locale === 'my' ? 'လက်ခံသောဖိုင်အမျိုးအစား:' : 'Supported Types:'}
                </span>
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
                <h2 className="text-base font-semibold">{t.settings.systemStatus}</h2>
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
                    {m.status === 'active'
                      ? locale === 'th'
                        ? 'เปิดใช้งานแล้ว'
                        : locale === 'my'
                        ? 'ဖွင့်လှစ်ပြီး'
                        : 'Active'
                      : locale === 'th'
                      ? 'เร็วๆ นี้'
                      : locale === 'my'
                      ? 'မကြာမီ'
                      : 'Upcoming'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Role & Permissions reference */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold">{t.settings.rolePermissions}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border bg-muted/20">
                <span className="font-semibold text-primary block mb-1">{t.settings.roles.ownerTitle}</span>
                <span className="text-muted-foreground">{t.settings.roles.ownerDesc}</span>
              </div>
              <div className="p-3 rounded-lg border bg-muted/20">
                <span className="font-semibold text-primary block mb-1">{t.settings.roles.adminTitle}</span>
                <span className="text-muted-foreground">{t.settings.roles.adminDesc}</span>
              </div>
              <div className="p-3 rounded-lg border bg-muted/20">
                <span className="font-semibold text-primary block mb-1">{t.settings.roles.accountingTitle}</span>
                <span className="text-muted-foreground">{t.settings.roles.accountingDesc}</span>
              </div>
              <div className="p-3 rounded-lg border bg-muted/20">
                <span className="font-semibold text-primary block mb-1">{t.settings.roles.operationTitle}</span>
                <span className="text-muted-foreground">{t.settings.roles.operationDesc}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
