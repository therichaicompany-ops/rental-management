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
import { ROLE_LABELS, type UserProfile, type UserRole } from '@/lib/types/auth'
import { CreateUserDialog } from '@/components/users/create-user-dialog'
import { toggleUserStatusAction, updateUserRoleAction } from '@/lib/actions/users'

interface UsersManagementViewProps {
  initialProfiles: UserProfile[]
  currentUserId: string
}

export function UsersManagementView({
  initialProfiles,
  currentUserId,
}: UsersManagementViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [actionError, setActionError] = useState<string | null>(null)

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
      alert('ไม่สามารถปิดการใช้งานบัญชีของคุณเองได้')
      return
    }

    const actionText = currentStatus ? 'ปิดใช้งาน' : 'เปิดใช้งาน'
    if (!confirm(`คุณต้องการ ${actionText} บัญชีผู้ใช้นี้ใช่หรือไม่?`)) {
      return
    }

    setActionError(null)
    startTransition(async () => {
      const res = await toggleUserStatusAction(userId, currentStatus)
      if (!res.success) {
        setActionError(res.error || 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ')
      } else {
        router.refresh()
      }
    })
  }

  const handleUpdateRole = (userId: string, newRole: UserRole) => {
    if (userId === currentUserId) {
      alert('ไม่สามารถเปลี่ยนตำแหน่งของตนเองได้')
      return
    }

    setActionError(null)
    startTransition(async () => {
      const res = await updateUserRoleAction(userId, newRole)
      if (!res.success) {
        setActionError(res.error || 'เกิดข้อผิดพลาดในการเปลี่ยนตำแหน่ง')
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
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">ผู้ใช้งานระบบ</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            จัดการบัญชีผู้ใช้งาน กำหนดสิทธิ์ และควบคุมการเข้าถึงระบบ
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-sm text-slate-600 font-medium">
            <Users className="h-4 w-4 text-slate-500" />
            <span>ทั้งหมด {initialProfiles.length} คน</span>
          </div>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white gap-2 shadow-sm font-medium"
          >
            <UserPlus className="h-4 w-4" />
            เพิ่มผู้ใช้งาน
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
            ปิด
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="ค้นหาตามชื่อ, อีเมล, แผนก หรือเบอร์โทร..."
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
            <option value="all">ทุกตำแหน่ง</option>
            {Object.entries(ROLE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
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
            <h3 className="mt-2 text-sm font-semibold text-slate-900">ไม่พบผู้ใช้งาน</h3>
            <p className="mt-1 text-sm text-slate-500">
              {searchQuery || roleFilter !== 'all'
                ? 'ลองปรับเปลี่ยนเงื่อนไขการค้นหา'
                : 'ยังไม่มีผู้ใช้งานในระบบ'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" id="users-table">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-4 py-3 font-semibold text-slate-700">ผู้ใช้งาน</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">Email</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">ตำแหน่ง / สิทธิ์</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">แผนก</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">เบอร์โทร</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">สถานะ</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">การจัดการ</th>
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
                              {profile.full_name || 'ไม่ระบุชื่อ'}
                              {isSelf && (
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-normal">
                                  คุณ
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
                          {ROLE_LABELS[profile.role] || profile.role}
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
                            ใช้งาน
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full text-xs font-medium border border-slate-200">
                            <XCircle className="w-3 h-3 text-slate-400" />
                            ปิดใช้งาน
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
                          <DropdownMenuContent align="end" className="w-48 bg-white border border-slate-200 shadow-lg">
                            <DropdownMenuLabel className="text-xs text-slate-400">
                              เปลี่ยนตำแหน่ง
                            </DropdownMenuLabel>
                            {Object.entries(ROLE_LABELS).map(([key, label]) => (
                              <DropdownMenuItem
                                key={key}
                                disabled={profile.role === key || (isSelf && key !== 'owner')}
                                onClick={() => handleUpdateRole(profile.id, key as UserRole)}
                                className="text-xs cursor-pointer"
                              >
                                {label} {profile.role === key && '✓'}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              disabled={isSelf}
                              onClick={() => handleToggleStatus(profile.id, profile.is_active)}
                              className={`text-xs cursor-pointer ${
                                profile.is_active ? 'text-red-600 focus:text-red-600' : 'text-emerald-600 focus:text-emerald-600'
                              }`}
                            >
                              {profile.is_active ? 'ปิดการใช้งาน' : 'เปิดใช้งานบัญชี'}
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
    </div>
  )
}
