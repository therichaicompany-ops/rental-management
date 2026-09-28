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

interface RolePermissionsMatrixProps {
  currentUserRole?: UserRole
}

interface ResourceCol {
  key: Resource
  labelTh: string
  labelEn: string
}

const RESOURCES: ResourceCol[] = [
  { key: 'dashboard', labelTh: 'Dashboard', labelEn: 'Dashboard' },
  { key: 'customers', labelTh: 'ลูกค้า/ผู้เช่า', labelEn: 'Customers' },
  { key: 'landlords', labelTh: 'ผู้ให้เช่า', labelEn: 'Landlords' },
  { key: 'locations', labelTh: 'สถานที่', labelEn: 'Locations' },
  { key: 'rentals', labelTh: 'ประเภทงาน', labelEn: 'Job Types' },
  { key: 'contracts', labelTh: 'สัญญาเช่า', labelEn: 'Contracts' },
  { key: 'rentPayments', labelTh: 'ค่าเช่า', labelEn: 'Rent Payments' },
  { key: 'opening', labelTh: 'ความคืบหน้าของงาน', labelEn: 'Work Progress' },
  { key: 'documents', labelTh: 'เอกสาร', labelEn: 'Documents' },
  { key: 'calendar', labelTh: 'ปฏิทิน', labelEn: 'Calendar' },
  { key: 'reports', labelTh: 'รายงาน', labelEn: 'Reports' },
  { key: 'users', labelTh: 'ผู้ใช้งาน', labelEn: 'Users' },
  { key: 'settings', labelTh: 'ตั้งค่า', labelEn: 'Settings' },
]

interface RoleRow {
  role: UserRole
  nameTh: string
  nameEn: string
  badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive'
  specialRuleTh: string
  specialRuleEn: string
  writeModeTh: string
  writeModeEn: string
  writeIcon: React.ReactNode
}

const ROLE_ROWS: RoleRow[] = [
  {
    role: 'owner',
    nameTh: 'เจ้าของระบบ (Owner)',
    nameEn: 'System Owner',
    badgeVariant: 'default',
    specialRuleTh: 'ทุกฟังก์ชัน (Full Access + ลบข้อมูลได้)',
    specialRuleEn: 'Full Access + Administrative control',
    writeModeTh: 'เพิ่ม, แก้ไข, ลบ',
    writeModeEn: 'Full Read/Write/Delete',
    writeIcon: <PenTool className="h-3 w-3 text-emerald-600" />,
  },
  {
    role: 'admin',
    nameTh: 'ผู้ดูแลระบบ (Admin)',
    nameEn: 'Administrator',
    badgeVariant: 'default',
    specialRuleTh: 'ทุกฟังก์ชัน (Full Access + ลบข้อมูลได้)',
    specialRuleEn: 'Full Access + Administrative control',
    writeModeTh: 'เพิ่ม, แก้ไข, ลบ',
    writeModeEn: 'Full Read/Write/Delete',
    writeIcon: <PenTool className="h-3 w-3 text-emerald-600" />,
  },
  {
    role: 'operation',
    nameTh: 'ฝ่ายปฏิบัติการ (Operation)',
    nameEn: 'Operations Team',
    badgeVariant: 'secondary',
    specialRuleTh: 'เฉพาะงานสาขาเท่านั้น (ไม่เห็นบ้านเลย)',
    specialRuleEn: 'Branch only (House records strictly hidden)',
    writeModeTh: 'เพิ่มและแก้ไขได้ (เฉพาะสาขา)',
    writeModeEn: 'Write allowed (Branch only)',
    writeIcon: <Building2 className="h-3 w-3 text-primary-600" />,
  },
  {
    role: 'accounting',
    nameTh: 'บัญชี (Accounting)',
    nameEn: 'Accounting',
    badgeVariant: 'outline',
    specialRuleTh: 'ดูอย่างเดียว ห้ามแก้ไข',
    specialRuleEn: 'Read-only across all accessible modules',
    writeModeTh: 'ดูอย่างเดียว (Read-Only)',
    writeModeEn: 'Read-Only',
    writeIcon: <Eye className="h-3 w-3 text-amber-600" />,
  },
  {
    role: 'hr',
    nameTh: 'HR',
    nameEn: 'Human Resources',
    badgeVariant: 'outline',
    specialRuleTh: 'ดาวน์โหลดไฟล์เอกสารลูกค้าได้',
    specialRuleEn: 'Can preview & download customer docs',
    writeModeTh: 'ดูและโหลดเอกสาร (Read-Only)',
    writeModeEn: 'Read & Download Docs',
    writeIcon: <FileCheck className="h-3 w-3 text-sky-600" />,
  },
  {
    role: 'staff',
    nameTh: 'พนักงาน (Staff)',
    nameEn: 'Staff',
    badgeVariant: 'secondary',
    specialRuleTh: 'จัดการลูกค้า, สถานที่, ความคืบหน้า',
    specialRuleEn: 'Manage Customers, Locations, Progress',
    writeModeTh: 'เพิ่มและแก้ไขได้',
    writeModeEn: 'Read/Write',
    writeIcon: <PenTool className="h-3 w-3 text-emerald-600" />,
  },
  {
    role: 'viewer',
    nameTh: 'ผู้ดูข้อมูล (Viewer)',
    nameEn: 'Viewer',
    badgeVariant: 'outline',
    specialRuleTh: 'ดูอย่างเดียว ห้ามแก้ไข',
    specialRuleEn: 'Read-only, no modifications allowed',
    writeModeTh: 'ดูอย่างเดียว (Read-Only)',
    writeModeEn: 'Read-Only',
    writeIcon: <Eye className="h-3 w-3 text-slate-500" />,
  },
]

export function RolePermissionsMatrix({ currentUserRole }: RolePermissionsMatrixProps) {
  const { locale } = useI18n()
  const isThai = locale === 'th'
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
        text: isThai
          ? 'บันทึกการตั้งค่า Role & สิทธิ์การเข้าถึงเรียบร้อยแล้ว'
          : 'Role permissions updated successfully',
      })
      setHasChanges(false)
    } else {
      setMessage({
        type: 'error',
        text: res.error || (isThai ? 'บันทึกไม่สำเร็จ' : 'Save failed'),
      })
    }
    setSaving(false)
  }

  const handleReset = async () => {
    if (!canManage) return
    if (
      !confirm(
        isThai
          ? 'คุณต้องการคืนค่าเริ่มต้นของสิทธิ์การใช้งานใช่หรือไม่?'
          : 'Are you sure you want to reset permissions to default?'
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
        text: isThai ? 'คืนค่าเริ่มต้นสิทธิ์เรียบร้อยแล้ว' : 'Reset to defaults successfully',
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
              {isThai ? 'การจัดการ Role & สิทธิ์การเข้าถึงเมนู' : 'Role & Permissions Matrix'}
              {canManage && (
                <Badge variant="outline" className="text-[10px] text-emerald-600 bg-emerald-50">
                  {isThai ? 'สามารถแก้ไขได้' : 'Editable'}
                </Badge>
              )}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isThai
                ? 'กำหนดเมนูที่แต่ละตำแหน่งสามารถเข้าถึงได้ และสามารถปรับแต่งเพิ่มเติมได้ในอนาคต'
                : 'Configure menu access and operational boundaries per role'}
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
              disabled={saving}
              className="text-xs text-slate-600"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              {isThai ? 'คืนค่าเริ่มต้น' : 'Reset Defaults'}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="text-xs bg-primary hover:bg-primary/90 text-white"
            >
              <Save className="h-3.5 w-3.5 mr-1" />
              {saving
                ? isThai
                  ? 'กำลังบันทึก...'
                  : 'Saving...'
                : isThai
                ? 'บันทึกการตั้งค่า'
                : 'Save Changes'}
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
                {isThai ? r.nameTh : r.nameEn}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600">
                {r.writeIcon}
                {isThai ? r.writeModeTh : r.writeModeEn}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/70 shrink-0" />
              <span>{isThai ? r.specialRuleTh : r.specialRuleEn}</span>
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
                {isThai ? 'ตำแหน่ง (Role)' : 'Role'}
              </th>
              {RESOURCES.map((res) => (
                <th
                  key={res.key}
                  className="p-2.5 text-center font-semibold border-l border-border/60 whitespace-nowrap min-w-[90px]"
                >
                  {isThai ? res.labelTh : res.labelEn}
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
                        {isThai ? r.nameTh : r.nameEn}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {isThai ? r.writeModeTh : r.writeModeEn}
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
                          title={`${r.role} - ${res.key}: ${hasAccess ? 'มีสิทธิ์' : 'ไม่มีสิทธิ์'}`}
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
          {isThai
            ? '* สิทธิ์ของ Owner ล็อคไว้เพื่อความปลอดภัยของระบบ | ฝ่ายปฏิบัติการถูกจำกัดสิทธิ์เฉพาะข้อมูลสาขาตามระบบงาน'
            : '* Owner role access is preserved for system security | Operations is restricted to branch records'}
        </span>
        {hasChanges && (
          <span className="text-amber-600 font-semibold animate-pulse">
            {isThai ? '● มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก' : '● You have unsaved changes'}
          </span>
        )}
      </div>
    </div>
  )
}
