'use client'

import * as React from 'react'
import {
  Shield,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Lock,
  Building2,
  FileCheck,
  Eye,
  PenTool,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { UserRole } from '@/lib/types/auth'
import type { Resource } from '@/lib/auth/permissions'
import { DEFAULT_PERMISSIONS } from '@/lib/auth/permissions'
import {
  getRolePermissionsAction,
  saveRolePermissionsAction,
  resetRolePermissionsAction,
} from '@/lib/actions/permissions'
import { useI18n } from '@/lib/i18n/context'
import type { Tri } from '@/lib/i18n/tx'

interface RolePermissionsMatrixProps {
  currentUserRole?: UserRole
}

interface ResourceCol {
  key: Resource
  label: Tri
}

const RESOURCES: ResourceCol[] = [
  { key: 'dashboard', label: { th: 'แดชบอร์ด', en: 'Dashboard', my: 'ဒက်ရှ်ဘုတ်' } },
  { key: 'customers', label: { th: 'ลูกค้า/ผู้เช่า', en: 'Customers', my: 'ဖောက်သည်များ' } },
  { key: 'landlords', label: { th: 'ผู้ให้เช่า', en: 'Landlords', my: 'အိမ်ရှင်များ' } },
  { key: 'locations', label: { th: 'สถานที่', en: 'Locations', my: 'တည်နေရာများ' } },
  { key: 'rentals', label: { th: 'ประเภทงาน', en: 'Job Types', my: 'အလုပ်အမျိုးအစားများ' } },
  { key: 'contracts', label: { th: 'สัญญาเช่า', en: 'Contracts', my: 'စာချုပ်များ' } },
  { key: 'rentPayments', label: { th: 'ค่าเช่า', en: 'Rent Payments', my: 'အငှားခ ပေးချေမှုများ' } },
  { key: 'opening', label: { th: 'ความคืบหน้าของงาน', en: 'Work Progress', my: 'လုပ်ငန်း တိုးတက်မှု' } },
  { key: 'documents', label: { th: 'เอกสาร', en: 'Documents', my: 'စာရွက်စာတမ်းများ' } },
  { key: 'calendar', label: { th: 'ปฏิทิน', en: 'Calendar', my: 'ပြက္ခဒိန်' } },
  { key: 'reports', label: { th: 'รายงาน', en: 'Reports', my: 'အစီရင်ခံစာများ' } },
  { key: 'users', label: { th: 'ผู้ใช้งาน', en: 'Users', my: 'အသုံးပြုသူများ' } },
  { key: 'settings', label: { th: 'ตั้งค่า', en: 'Settings', my: 'ဆက်တင်များ' } },
]

interface RoleRow {
  role: UserRole
  name: Tri
  badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive'
  specialRule: Tri
  writeMode: Tri
  writeIcon: React.ReactNode
}

const ROLE_ROWS: RoleRow[] = [
  {
    role: 'owner',
    name: { th: 'เจ้าของระบบ (Owner)', en: 'System Owner', my: 'စနစ်ပိုင်ရှင် (Owner)' },
    badgeVariant: 'default',
    specialRule: {
      th: 'ทุกฟังก์ชัน (Full Access + ลบข้อมูลได้)',
      en: 'Full Access + Administrative control',
      my: 'လုပ်ဆောင်ချက်အားလုံး (အပြည့်အဝရယူခွင့် + ဖျက်ခွင့်)',
    },
    writeMode: { th: 'เพิ่ม, แก้ไข, ลบ', en: 'Add, Edit, Delete', my: 'ထည့်သွင်း၊ ပြင်ဆင်၊ ဖျက်ပစ်' },
    writeIcon: <PenTool className="h-3 w-3 text-emerald-600" />,
  },
  {
    role: 'admin',
    name: { th: 'ผู้ดูแลระบบ (Admin)', en: 'Administrator', my: 'စီမံခန့်ခွဲသူ (Admin)' },
    badgeVariant: 'default',
    specialRule: {
      th: 'ทุกฟังก์ชัน (Full Access + ลบข้อมูลได้)',
      en: 'Full Access + Administrative control',
      my: 'လုပ်ဆောင်ချက်အားလုံး (အပြည့်အဝရယူခွင့် + ဖျက်ခွင့်)',
    },
    writeMode: { th: 'เพิ่ม, แก้ไข, ลบ', en: 'Add, Edit, Delete', my: 'ထည့်သွင်း၊ ပြင်ဆင်၊ ဖျက်ပစ်' },
    writeIcon: <PenTool className="h-3 w-3 text-emerald-600" />,
  },
  {
    role: 'operation',
    name: { th: 'ฝ่ายปฏิบัติการ (Operation)', en: 'Operations Team', my: 'လုပ်ငန်းလည်ပတ်ရေးအဖွဲ့ (Operation)' },
    badgeVariant: 'secondary',
    specialRule: {
      th: 'เฉพาะงานสาขาเท่านั้น (ไม่เห็นบ้านเลย)',
      en: 'Branch only (House records strictly hidden)',
      my: 'ရုံးခွဲလုပ်ငန်းများသာ (အိမ်အချက်အလက် မတွေ့ရ)',
    },
    writeMode: { th: 'เพิ่มและแก้ไขได้ (เฉพาะสาขา)', en: 'Write allowed (Branch only)', my: 'ထည့်သွင်းပြင်ဆင်ခွင့် (ရုံးခွဲသာ)' },
    writeIcon: <Building2 className="h-3 w-3 text-primary-600" />,
  },
  {
    role: 'accounting',
    name: { th: 'บัญชี (Accounting)', en: 'Accounting', my: 'စာရင်းကိုင် (Accounting)' },
    badgeVariant: 'outline',
    specialRule: {
      th: 'ดูอย่างเดียว ห้ามแก้ไข',
      en: 'Read-only across all accessible modules',
      my: 'ကြည့်ရှုခွင့်သာ ပြင်ဆินခွင့်မရှိ',
    },
    writeMode: { th: 'ดูอย่างเดียว (Read-Only)', en: 'Read-Only', my: 'ကြည့်ရှုခွင့်သာ (Read-Only)' },
    writeIcon: <Eye className="h-3 w-3 text-amber-600" />,
  },
  {
    role: 'hr',
    name: { th: 'HR', en: 'Human Resources', my: 'လူ့စွမ်းအားအရင်းအမြစ် (HR)' },
    badgeVariant: 'outline',
    specialRule: {
      th: 'ดาวน์โหลดไฟล์เอกสารลูกค้าได้',
      en: 'Can preview & download customer docs',
      my: 'ဖောက်သည်စာရွက်စာတမ်းများ ဒေါင်းလုဒ်လုပ်ခွင့်',
    },
    writeMode: { th: 'ดูและโหลดเอกสาร (Read-Only)', en: 'Read & Download Docs', my: 'စာရွက်စာတမ်း ကြည့်ရှု/ဒေါင်းလုဒ် (Read-Only)' },
    writeIcon: <FileCheck className="h-3 w-3 text-sky-600" />,
  },
  {
    role: 'staff',
    name: { th: 'พนักงาน (Staff)', en: 'Staff', my: 'ဝန်ထမ်း (Staff)' },
    badgeVariant: 'secondary',
    specialRule: {
      th: 'จัดการลูกค้า, สถานที่, ความคืบหน้า',
      en: 'Manage Customers, Locations, Progress',
      my: 'ဖောက်သည်၊ နေရာ၊ လုပ်ငန်းတိုးတက်မှု စီမံခန့်ခွဲရန်',
    },
    writeMode: { th: 'เพิ่มและแก้ไขได้', en: 'Read/Write', my: 'ထည့်သွင်း/ပြင်ဆင်ခွင့်' },
    writeIcon: <PenTool className="h-3 w-3 text-emerald-600" />,
  },
  {
    role: 'viewer',
    name: { th: 'ผู้ดูข้อมูล (Viewer)', en: 'Viewer', my: 'ကြည့်ရှုသူ (Viewer)' },
    badgeVariant: 'outline',
    specialRule: {
      th: 'ดูอย่างเดียว ห้ามแก้ไข',
      en: 'Read-only, no modifications allowed',
      my: 'ကြည့်ရှုခွင့်သာ ပြင်ဆင်ခွင့်မရှိ',
    },
    writeMode: { th: 'ดูอย่างเดียว (Read-Only)', en: 'Read-Only', my: 'ကြည့်ရှုခွင့်သာ (Read-Only)' },
    writeIcon: <Eye className="h-3 w-3 text-slate-500" />,
  },
]

export function RolePermissionsMatrix({ currentUserRole }: RolePermissionsMatrixProps) {
  const { tx } = useI18n()
  const canManage = currentUserRole === 'owner' || currentUserRole === 'admin'

  const [permissions, setPermissions] = React.useState<Record<UserRole, Resource[]>>(DEFAULT_PERMISSIONS)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [message, setMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [hasChanges, setHasChanges] = React.useState(false)

  // Load permissions on mount
  React.useEffect(() => {
    async function load() {
      setLoading(true)
      const res = await getRolePermissionsAction()
      if (res.success && res.permissions) {
        setPermissions(res.permissions)
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleToggle = (role: UserRole, resKey: Resource) => {
    if (!canManage) return
    if (role === 'owner') return // Owner permissions cannot be revoked

    setPermissions((prev) => {
      const currentList = prev[role] || []
      const nextList = currentList.includes(resKey)
        ? currentList.filter((k) => k !== resKey)
        : [...currentList, resKey]

      return {
        ...prev,
        [role]: nextList,
      }
    })
    setHasChanges(true)
    setMessage(null)
  }

  const handleSave = async () => {
    if (!canManage) return
    setSaving(true)
    setMessage(null)

    const res = await saveRolePermissionsAction(permissions)
    if (res.success) {
      setMessage({
        type: 'success',
        text: tx({
          th: 'บันทึกการตั้งค่า Role & สิทธิ์การเข้าถึงเรียบร้อยแล้ว',
          en: 'Role permissions updated successfully',
          my: 'အခန်းကဏ္ဍနှင့် ခွင့်ပြုချက် ဆက်တင်များကို အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ',
        }),
      })
      setHasChanges(false)
    } else {
      setMessage({
        type: 'error',
        text: res.error || tx({ th: 'บันทึกไม่สำเร็จ', en: 'Save failed', my: 'သိမ်းဆည်းမှု မအောင်မြင်ပါ' }),
      })
    }
    setSaving(false)
  }

  const handleReset = async () => {
    if (!canManage) return
    if (
      !confirm(
        tx({
          th: 'คุณต้องการคืนค่าเริ่มต้นของสิทธิ์การใช้งานใช่หรือไม่?',
          en: 'Are you sure you want to reset permissions to default?',
          my: 'ခွင့်ပြုချက်များကို မူလအတိုင်း ပြန်လည်သတ်မှတ်ရန် သေချာပါသလား။',
        })
      )
    ) {
      return
    }

    setSaving(true)
    const res = await resetRolePermissionsAction()
    if (res.success) {
      setPermissions(DEFAULT_PERMISSIONS)
      setHasChanges(false)
      setMessage({
        type: 'success',
        text: tx({
          th: 'คืนค่าเริ่มต้นสิทธิ์เรียบร้อยแล้ว',
          en: 'Reset to defaults successfully',
          my: 'မူလခွင့်ပြုချက်အတိုင်း ပြန်လည်သတ်မှတ်ပြီးပါပြီ',
        }),
      })
    }
    setSaving(false)
  }

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              {tx({
                th: 'การจัดการ Role & สิทธิ์การเข้าถึงเมนู',
                en: 'Role & Permissions Matrix',
                my: 'အခန်းကဏ္ဍနှင့် မီနူးဝင်ရောက်ခွင့် စီမံခန့်ခွဲမှု',
              })}
              {canManage && (
                <Badge variant="outline" className="text-[10px] text-emerald-600 bg-emerald-50">
                  {tx({ th: 'สามารถแก้ไขได้', en: 'Editable', my: 'ပြင်ဆင်နိုင်သည်' })}
                </Badge>
              )}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {tx({
                th: 'กำหนดเมนูที่แต่ละตำแหน่งสามารถเข้าถึงได้ และสามารถปรับแต่งเพิ่มเติมได้ในอนาคต',
                en: 'Configure menu access and operational boundaries per role',
                my: 'ရာထူးတစ်ခုချင်းစီ ဝင်ရောက်နိုင်သော မီနူးများကို သတ်မှတ်ပါ',
              })}
            </p>
          </div>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={saving || loading}
              className="text-xs text-slate-600"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              {tx({ th: 'คืนค่าเริ่มต้น', en: 'Reset Defaults', my: 'မူလအတိုင်းပြန်ထားမည်' })}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={saving || !hasChanges || loading}
              className="text-xs bg-primary hover:bg-primary/90 text-white"
            >
              <Save className="h-3.5 w-3.5 mr-1" />
              {saving
                ? tx({ th: 'กำลังบันทึก...', en: 'Saving...', my: 'သိမ်းဆည်းနေသည်...' })
                : tx({ th: 'บันทึกการตั้งค่า', en: 'Save Changes', my: 'ဆက်တင်များ သိမ်းဆည်းမည်' })}
            </Button>
          </div>
        )}
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg flex items-center gap-2 text-xs font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Role Summary Rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {ROLE_ROWS.map((r) => (
          <div key={r.role} className="p-3 rounded-lg border bg-muted/20 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-foreground">
                {tx(r.name)}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600">
                {r.writeIcon}
                {tx(r.writeMode)}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/70 shrink-0" />
              <span>{tx(r.specialRule)}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Permissions Matrix Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-muted/60 border-b border-border text-slate-700">
              <th className="p-3 text-left font-semibold sticky left-0 bg-muted/60 z-10 min-w-[180px]">
                {tx({ th: 'ตำแหน่ง (Role)', en: 'Role', my: 'ရာထူး (Role)' })}
              </th>
              {RESOURCES.map((res) => (
                <th
                  key={res.key}
                  className="p-2.5 text-center font-semibold border-l border-border/60 whitespace-nowrap min-w-[90px]"
                >
                  {tx(res.label)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ROLE_ROWS.map((r) => {
              const roleList = permissions[r.role] || []
              const isLocked = !canManage || r.role === 'owner'

              return (
                <tr key={r.role} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-medium sticky left-0 bg-card z-10 border-r border-border">
                    <div className="flex items-center gap-1.5">
                      {r.role === 'owner' && <Lock className="h-3 w-3 text-slate-400" />}
                      <span className="text-xs font-semibold text-foreground">
                        {tx(r.name)}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {tx(r.writeMode)}
                    </span>
                  </td>

                  {RESOURCES.map((res) => {
                    const hasAccess = roleList.includes(res.key)

                    return (
                      <td
                        key={res.key}
                        className="p-2 text-center border-l border-border/60"
                      >
                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={() => handleToggle(r.role, res.key)}
                          className={`inline-flex items-center justify-center h-6 w-6 rounded transition-all ${
                            hasAccess
                              ? 'bg-emerald-500 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-300 border border-slate-200'
                          } ${
                            isLocked
                              ? 'opacity-80 cursor-not-allowed'
                              : 'hover:scale-110 cursor-pointer'
                          }`}
                          title={`${r.role} - ${res.key}: ${hasAccess ? tx({ th: 'มีสิทธิ์', en: 'Allowed', my: 'ခွင့်ပြုထားသည်' }) : tx({ th: 'ไม่มีสิทธิ์', en: 'Forbidden', my: 'ခွင့်မပြုပါ' })}`}
                        >
                          {hasAccess ? '✓' : '—'}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="text-[11px] text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
        <span>
          {tx({
            th: '* สิทธิ์ของ Owner ล็อคไว้เพื่อความปลอดภัยของระบบ | ฝ่ายปฏิบัติการถูกจำกัดสิทธิ์เฉพาะข้อมูลสาขาตามระบบงาน',
            en: '* Owner role access is preserved for system security | Operations is restricted to branch records',
            my: '* စနစ်လုံခြုံရေးအတွက် Owner ခွင့်ပြုချက်ကို ပိတ်ထားသည် | လုပ်ငန်းလည်ပတ်ရေးအဖွဲ့ကို ရုံးခွဲအချက်အလက်များသာ ကန့်သတ်ထားပါသည်',
          })}
        </span>
        {hasChanges && (
          <span className="text-amber-600 font-semibold animate-pulse">
            {tx({
              th: '● มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก',
              en: '● You have unsaved changes',
              my: '● မသိမ်းဆည်းရသေးသော အပြောင်းအလဲများ ရှိပါသည်',
            })}
          </span>
        )}
      </div>
    </div>
  )
}
