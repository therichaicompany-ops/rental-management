'use client'

import * as React from 'react'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  MoreVertical,
  ShieldCheck,
  Phone,
  Building,
  Loader2,
  Pencil,
  KeyRound,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { type UserProfile, type UserRole } from '@/lib/types/auth'
import { CreateUserDialog } from '@/components/users/create-user-dialog'
import { EditUserDialog } from '@/components/users/edit-user-dialog'
import { ResetPasswordDialog } from '@/components/users/reset-password-dialog'
import { toggleUserStatusAction, updateUserRoleAction } from '@/lib/actions/users'
import { useI18n } from '@/lib/i18n/context'
import type { Locale } from '@/lib/i18n/types'

const ROLE_TRANSLATIONS: Record<Locale, Record<UserRole, string>> = {
  th: {
    owner: 'เจ้าของระบบ',
    admin: 'ผู้ดูแลระบบ',
    accounting: 'บัญชี',
    hr: 'HR',
    operation: 'ฝ่ายปฏิบัติการ',
    staff: 'พนักงาน',
    viewer: 'ผู้ดูข้อมูล',
  },
  en: {
    owner: 'System Owner',
    admin: 'Administrator',
    accounting: 'Accounting',
    hr: 'HR',
    operation: 'Operations',
    staff: 'Staff',
    viewer: 'Viewer',
  },
  my: {
    owner: 'စနစ်ပိုင်ရှင်',
    admin: 'အက်ဒမင်',
    accounting: 'စာရင်းကိုင်',
    hr: 'လူ့စွမ်းအားအရင်းအမြစ်',
    operation: 'လုပ်ငန်းဆောင်ရွက်ရေး',
    staff: 'ဝန်ထမ်း',
    viewer: 'ကြည့်ရှုသူ',
  },
}

interface UsersManagementViewProps {
  initialProfiles: UserProfile[]
  currentUserId: string
}

export function UsersManagementView({
  initialProfiles,
  currentUserId,
}: UsersManagementViewProps) {
  const { t, locale } = useI18n()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [resettingUser, setResettingUser] = useState<UserProfile | null>(null)

  const roles = ROLE_TRANSLATIONS[locale] || ROLE_TRANSLATIONS.th

  // Filter profiles
  const filteredProfiles = initialProfiles.filter((p) => {
    const matchSearch =
      !searchQuery.trim() ||
      (p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (p.department?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (p.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)

    const matchRole = roleFilter === 'all' || p.role === roleFilter

    return matchSearch && matchRole
  })

  const handleToggleStatus = (userId: string, currentStatus: boolean) => {
    if (userId === currentUserId) {
      alert(locale === 'th' ? 'ไม่สามารถปิดการใช้งานบัญชีของคุณเองได้' : locale === 'my' ? 'သင့်ကိုယ်ပိုင်အကောင့်ကို ပိတ်၍မရပါ' : 'Cannot deactivate your own account')
      return
    }

    const actionText = currentStatus
      ? (locale === 'th' ? 'ปิดใช้งาน' : locale === 'my' ? 'ပိတ်ရန်' : 'deactivate')
      : (locale === 'th' ? 'เปิดใช้งาน' : locale === 'my' ? 'ဖွင့်ရန်' : 'activate')
    const confirmMsg = locale === 'th'
      ? `คุณต้องการ ${actionText} บัญชีผู้ใช้นี้ใช่หรือไม่?`
      : locale === 'my'
      ? `ဤအကောင့်ကို ${actionText} လိုပါသလား?`
      : `Are you sure you want to ${actionText} this user account?`
    if (!confirm(confirmMsg)) {
      return
    }

    setActionError(null)
    startTransition(async () => {
      const res = await toggleUserStatusAction(userId, currentStatus)
      if (!res.success) {
        setActionError(res.error || (locale === 'th' ? 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ' : 'Error updating status'))
      } else {
        router.refresh()
      }
    })
  }

  const handleUpdateRole = (userId: string, newRole: UserRole) => {
    if (userId === currentUserId) {
      alert(locale === 'th' ? 'ไม่สามารถเปลี่ยนตำแหน่งของตนเองได้' : locale === 'my' ? 'သင့်ကိုယ်ပိုင်ရာထူးကို ပြောင်းလဲ၍မရပါ' : 'Cannot change your own role')
      return
    }

    setActionError(null)
    startTransition(async () => {
      const res = await updateUserRoleAction(userId, newRole)
      if (!res.success) {
        setActionError(res.error || (locale === 'th' ? 'เกิดข้อผิดพลาดในการเปลี่ยนตำแหน่ง' : 'Error updating role'))
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{t.users.title}</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {t.users.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-sm text-slate-600 font-medium">
            <Users className="h-4 w-4 text-slate-500" />
            <span>{t.common.total} {initialProfiles.length} {t.common.items}</span>
          </div>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white gap-2 shadow-sm font-medium"
          >
            <UserPlus className="h-4 w-4" />
            {t.users.addNew}
          </Button>
        </div>
      </div>

      {actionError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          <span>{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            className="text-red-500 hover:text-red-700 text-xs font-semibold"
          >
            {locale === 'th' ? 'ปิด' : locale === 'my' ? 'ပိတ်' : 'Close'}
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-emerald-600 hover:text-emerald-800 text-xs font-semibold ml-2"
          >
            {locale === 'th' ? 'ปิด' : locale === 'my' ? 'ပိတ်' : 'Close'}
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={`${t.common.search} ${t.users.fullName}, ${t.users.email}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-50 border-slate-200 text-sm h-9"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 w-full sm:w-auto"
          >
            <option value="all">{t.common.all} {t.users.role}</option>
            {(Object.keys(roles) as UserRole[]).map((key) => (
              <option key={key} value={key}>
                {roles[key]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {filteredProfiles.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Users className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-2 text-sm font-semibold text-slate-900">
              {locale === 'th' ? 'ไม่พบผู้ใช้งาน' : locale === 'my' ? 'အသုံးပြုသူ မရှိပါ' : 'No users found'}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {searchQuery || roleFilter !== 'all'
                ? (locale === 'th' ? 'ลองปรับเปลี่ยนเงื่อนไขการค้นหา' : locale === 'my' ? 'ရှာဖွေမှု အခြေအနေများကို ပြောင်းလဲကြည့်ပါ' : 'Try adjusting your search criteria')
                : (locale === 'th' ? 'ยังไม่มีผู้ใช้งานในระบบ' : locale === 'my' ? 'စနစ်တွင် အသုံးပြုသူ မရှိသေးပါ' : 'No users in the system yet')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" id="users-table">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-4 py-3 font-semibold text-slate-700">{t.users.fullName}</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">{t.users.email}</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">{t.users.role}</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">{locale === 'th' ? 'แผนก' : locale === 'my' ? 'ဌာန' : 'Department'}</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">{locale === 'th' ? 'เบอร์โทร' : locale === 'my' ? 'ဖုန်း' : 'Phone'}</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">{t.users.status}</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">{t.common.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProfiles.map((profile) => {
                  const isSelf = profile.id === currentUserId
                  return (
                    <tr
                      key={profile.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center text-sm uppercase flex-shrink-0">
                            {profile.full_name ? profile.full_name.charAt(0) : 'U'}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900 flex items-center gap-1.5">
                              {profile.full_name || (locale === 'th' ? 'ไม่ระบุชื่อ' : locale === 'my' ? 'အမည်မဖော်ပြထား' : 'No Name')}
                              {isSelf && (
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-normal">
                                  {locale === 'th' ? 'คุณ' : locale === 'my' ? 'သင်' : 'You'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                        {profile.email || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="secondary"
                          className={
                            profile.role === 'owner' || profile.role === 'admin'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }
                        >
                          <ShieldCheck className="w-3 h-3 mr-1 inline" />
                          {roles[profile.role] || profile.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {profile.department ? (
                          <span className="flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            {profile.department}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {profile.phone ? (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {profile.phone}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {profile.is_active ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-medium border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            {locale === 'th' ? 'ใช้งาน' : locale === 'my' ? 'အသုံးပြုဆဲ' : 'Active'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full text-xs font-medium border border-slate-200">
                            <XCircle className="w-3 h-3 text-slate-400" />
                            {locale === 'th' ? 'ปิดใช้งาน' : locale === 'my' ? 'ပိတ်ထားသည်' : 'Inactive'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 text-slate-500 hover:text-slate-800"
                              disabled={isPending}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52 bg-white border border-slate-200 shadow-lg p-1">
                            <DropdownMenuItem
                              onClick={() => {
                                setActionError(null)
                                setActionSuccess(null)
                                setEditingUser(profile)
                              }}
                              className="text-xs cursor-pointer flex items-center gap-2 py-2 text-slate-700 hover:text-slate-900 focus:bg-slate-100"
                            >
                              <Pencil className="h-3.5 w-3.5 text-slate-500" />
                              <span className="font-medium">{t.users.editUser}</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => {
                                setActionError(null)
                                setActionSuccess(null)
                                setResettingUser(profile)
                              }}
                              className="text-xs cursor-pointer flex items-center gap-2 py-2 text-amber-700 hover:text-amber-800 focus:bg-amber-50"
                            >
                              <KeyRound className="h-3.5 w-3.5 text-amber-600" />
                              <span className="font-medium">{t.users.resetPassword}</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="my-1 bg-slate-100" />

                            <DropdownMenuLabel className="text-[11px] text-slate-400 font-semibold px-2 py-1">
                              {locale === 'th' ? 'เปลี่ยนตำแหน่ง' : locale === 'my' ? 'ရာထူး ပြောင်းရန်' : 'Change Role'}
                            </DropdownMenuLabel>
                            {(Object.keys(roles) as UserRole[]).map((key) => (
                              <DropdownMenuItem
                                key={key}
                                disabled={profile.role === key || (isSelf && key !== 'owner')}
                                onClick={() => handleUpdateRole(profile.id, key)}
                                className="text-xs cursor-pointer flex items-center justify-between"
                              >
                                <span>{roles[key]}</span>
                                {profile.role === key && <span className="text-orange-600 font-bold">✓</span>}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator className="my-1 bg-slate-100" />
                            <DropdownMenuItem
                              disabled={isSelf}
                              onClick={() => handleToggleStatus(profile.id, profile.is_active)}
                              className={`text-xs cursor-pointer py-1.5 ${
                                profile.is_active ? 'text-red-600 focus:text-red-600' : 'text-emerald-600 focus:text-emerald-600'
                              }`}
                            >
                              {profile.is_active
                                ? (locale === 'th' ? 'ปิดการใช้งาน' : locale === 'my' ? 'ပိတ်ရန်' : 'Deactivate')
                                : (locale === 'th' ? 'เปิดใช้งานบัญชี' : locale === 'my' ? 'ဖွင့်ရန်' : 'Activate')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Dialog */}
      <CreateUserDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />

      {/* Edit User Dialog */}
      <EditUserDialog
        open={Boolean(editingUser)}
        onOpenChange={(open) => {
          if (!open) setEditingUser(null)
        }}
        user={editingUser}
        currentUserId={currentUserId}
        onSuccess={(msg) => setActionSuccess(msg)}
      />

      {/* Reset Password Dialog */}
      <ResetPasswordDialog
        open={Boolean(resettingUser)}
        onOpenChange={(open) => {
          if (!open) setResettingUser(null)
        }}
        user={resettingUser}
        onSuccess={(msg) => setActionSuccess(msg)}
      />
    </div>
  )
}
