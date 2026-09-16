'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { CreateProjectDialog } from './create-project-dialog'
import type {
  OpeningProjectWithRelations,
  OpeningProjectStatus,
} from '@/lib/types/opening'
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_BADGE_VARIANTS,
} from '@/lib/types/opening'
import type { UserRole, UserProfile } from '@/lib/types/auth'
import { canWrite } from '@/lib/auth/permissions'

interface EligibleContract {
  id: string
  contract_no: string
  status: string
  locations?: {
    location_name: string
    province: string
  } | null
}

interface OpeningListViewProps {
  projects: OpeningProjectWithRelations[]
  eligibleContracts: EligibleContract[]
  staffProfiles: Pick<UserProfile, 'id' | 'full_name' | 'email'>[]
  userRole: UserRole
}

type TabType = 'all' | 'in_progress' | 'ready_to_open' | 'opened'

export function OpeningListView({
  projects,
  eligibleContracts,
  staffProfiles,
  userRole,
}: OpeningListViewProps) {
  const allowWrite = canWrite(userRole)

  const [activeTab, setActiveTab] = React.useState<TabType>('all')
  const [searchTerm, setSearchTerm] = React.useState('')
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)

  // KPIs
  const stats = React.useMemo(() => {
    const total = projects.length
    const inProgress = projects.filter((p) => p.status === 'in_progress').length
    const readyToOpen = projects.filter((p) => p.status === 'ready_to_open').length
    const opened = projects.filter((p) => p.status === 'opened').length

    return { total, inProgress, readyToOpen, opened }
  }, [projects])

  // Filtered List
  const filteredProjects = React.useMemo(() => {
    return projects.filter((p) => {
      // 1. Tab filter
      if (activeTab === 'in_progress' && p.status !== 'in_progress') return false
      if (activeTab === 'ready_to_open' && p.status !== 'ready_to_open') return false
      if (activeTab === 'opened' && p.status !== 'opened') return false

      // 2. Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const projNo = p.project_no?.toLowerCase() || ''
        const locName = p.rental_contracts?.locations?.location_name?.toLowerCase() || ''
        const prov = p.rental_contracts?.locations?.province?.toLowerCase() || ''
        const contractNo = p.rental_contracts?.contract_no?.toLowerCase() || ''

        const match =
          projNo.includes(term) ||
          locName.includes(term) ||
          prov.includes(term) ||
          contractNo.includes(term)

        if (!match) return false
      }

      return true
    })
  }, [projects, activeTab, searchTerm])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            ติดตามการเปิดสาขา (Branch Opening Workflow)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            บริหารจัดการและติดตาม 13 ขั้นตอนการเปิดสาขา พร้อมตรวจสอบงานย่อยและเช็คลิสต์
          </p>
        </div>

        {allowWrite && (
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white shrink-0"
          >
            <Plus className="mr-2 h-4 w-4" />
            สร้างโครงการเปิดสาขา
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">โครงการทั้งหมด</span>
            <Building2 className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats.total}</p>
          <span className="text-xs text-slate-400">โครงการในระบบ</span>
        </div>

        <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">กำลังดำเนินการ</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2">{stats.inProgress}</p>
          <span className="text-xs text-amber-600">อยู่ระหว่างเตรียมเปิดสาขา</span>
        </div>

        <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-800">พร้อมเปิดสาขา</span>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-700 mt-2">{stats.readyToOpen}</p>
          <span className="text-xs text-blue-600">พร้อมเปิดให้บริการ</span>
        </div>

        <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">เปิดสาขาเรียบร้อย</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">{stats.opened}</p>
          <span className="text-xs text-emerald-600">เปิดดำเนินการแล้ว</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'all'
              ? 'border-primary-600 text-primary-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          ทั้งหมด ({projects.length})
        </button>

        <button
          onClick={() => setActiveTab('in_progress')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'in_progress'
              ? 'border-amber-500 text-amber-700 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          กำลังดำเนินการ ({stats.inProgress})
        </button>

        <button
          onClick={() => setActiveTab('ready_to_open')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'ready_to_open'
              ? 'border-blue-500 text-blue-700 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          พร้อมเปิด ({stats.readyToOpen})
        </button>

        <button
          onClick={() => setActiveTab('opened')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'opened'
              ? 'border-emerald-500 text-emerald-700 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          เปิดเรียบร้อย ({stats.opened})
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="ค้นหารหัสโครงการ, สาขา, จังหวัด หรือเลขที่สัญญา..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>
      </div>

      {/* Project Table */}
      {filteredProjects.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            title="ไม่พบโครงการเปิดสาขา"
            message={
              searchTerm || activeTab !== 'all'
                ? 'ไม่พบโครงการที่ตรงกับเงื่อนไขการค้นหา ลองปรับตัวกรองใหม่'
                : 'ยังไม่มีโครงการเปิดสาขาในระบบ คุณสามารถสร้างโครงการจากสัญญาเช่าที่ตกลงแล้วได้'
            }
          />
          {allowWrite && eligibleContracts.length > 0 && (
            <div className="flex justify-center">
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                สร้างโครงการเปิดสาขา
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">รหัสโครงการ</th>
                  <th className="px-4 py-3">สถานที่ / สาขา</th>
                  <th className="px-4 py-3">สัญญาเช่า</th>
                  <th className="px-4 py-3">ขั้นตอนปัจจุบัน (Stage)</th>
                  <th className="px-4 py-3">วันเป้าหมายเปิด</th>
                  <th className="px-4 py-3">ความคืบหน้างาน (Tasks)</th>
                  <th className="px-4 py-3 text-center">สถานะ</th>
                  <th className="px-4 py-3 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredProjects.map((p) => {
                  const badgeVariant =
                    PROJECT_STATUS_BADGE_VARIANTS[p.status as OpeningProjectStatus] || {
                      bg: 'bg-slate-100',
                      text: 'text-slate-600',
                      border: 'border-slate-200',
                    }

                  const contract = p.rental_contracts
                  const tasks = p.opening_tasks || []
                  const doneTasks = tasks.filter((t) => t.status === 'done').length
                  const totalTasks = tasks.length
                  const percent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Project No */}
                      <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                        <Link
                          href={`/opening/${p.id}`}
                          className="text-primary-600 hover:underline font-bold"
                        >
                          {p.project_no}
                        </Link>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">
                          {contract?.locations?.location_name || '-'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {contract?.locations?.province}
                        </div>
                      </td>

                      {/* Contract */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {contract ? (
                          <Link
                            href={`/contracts/${contract.id}`}
                            className="text-slate-600 hover:text-primary-600 hover:underline flex items-center gap-1"
                          >
                            {contract.contract_no}
                            <ExternalLink className="h-3 w-3 text-slate-400" />
                          </Link>
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* Current Stage */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {p.workflow_stages ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            {p.workflow_stages.sequence}. {p.workflow_stages.stage_name}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Target Open Date */}
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        {p.target_open_date ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {new Date(p.target_open_date).toLocaleDateString('th-TH')}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* Task Progress */}
                      <td className="px-4 py-3 min-w-[140px]">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-slate-500">
                            {doneTasks}/{totalTasks} งาน
                          </span>
                          <span className="font-semibold text-slate-700">{percent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              percent === 100
                                ? 'bg-emerald-500'
                                : percent > 0
                                ? 'bg-amber-500'
                                : 'bg-slate-300'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`${badgeVariant.bg} ${badgeVariant.text} ${badgeVariant.border} text-[10px] font-medium`}
                        >
                          {PROJECT_STATUS_LABELS[p.status as OpeningProjectStatus] || p.status}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                        >
                          <Link href={`/opening/${p.id}`}>
                            <Eye className="mr-1 h-3.5 w-3.5" />
                            ดูรายละเอียด
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        contracts={eligibleContracts}
        staffProfiles={staffProfiles}
      />
    </div>
  )
}
