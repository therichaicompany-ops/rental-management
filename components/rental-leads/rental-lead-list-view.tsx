'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  MapPin,
  Calendar,
  ChevronRight,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import type {
  RentalLeadWithRelations,
  LeadStatus,
} from '@/lib/types/rental-leads'
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_BADGE_VARIANTS,
} from '@/lib/types/rental-leads'
import type { UserRole, UserProfile } from '@/lib/types/auth'
import { canWrite } from '@/lib/auth/permissions'

interface RentalLeadListViewProps {
  leads: RentalLeadWithRelations[]
  staffProfiles: Pick<UserProfile, 'id' | 'full_name' | 'email'>[]
  userRole: UserRole
}

export function RentalLeadListView({
  leads,
  staffProfiles,
  userRole,
}: RentalLeadListViewProps) {
  const router = useRouter()
  const allowCreate = canWrite(userRole)

  const [searchTerm, setSearchTerm] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [assignedFilter, setAssignedFilter] = React.useState<string>('all')
  const [provinceFilter, setProvinceFilter] = React.useState<string>('all')

  // Extract unique provinces from lead locations
  const provinces = React.useMemo(() => {
    const set = new Set<string>()
    leads.forEach((l) => {
      if (l.locations?.province) set.add(l.locations.province)
    })
    return Array.from(set).sort()
  }, [leads])

  // Filtered Leads
  const filteredLeads = React.useMemo(() => {
    return leads.filter((lead) => {
      // 1. Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const leadNo = lead.lead_no?.toLowerCase() || ''
        const leadName = lead.lead_name?.toLowerCase() || ''
        const locationName = lead.locations?.location_name?.toLowerCase() || ''
        const customerName = (lead.customers?.name || lead.customers?.company_name || '').toLowerCase()
        if (
          !leadNo.includes(term) &&
          !leadName.includes(term) &&
          !locationName.includes(term) &&
          !customerName.includes(term)
        ) {
          return false
        }
      }

      // 2. Status filter
      if (statusFilter !== 'all' && lead.status !== statusFilter) {
        return false
      }

      // 3. Assigned filter
      if (assignedFilter !== 'all' && lead.assigned_to !== assignedFilter) {
        return false
      }

      // 4. Province filter
      if (provinceFilter !== 'all' && lead.locations?.province !== provinceFilter) {
        return false
      }

      return true
    })
  }, [leads, searchTerm, statusFilter, assignedFilter, provinceFilter])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">งานเช่า (Rental Leads)</h1>
          <p className="text-sm text-slate-500 mt-1">
            ติดตามงานเช่าตั้งแต่เริ่มต้นเจรจา ต่อรองราคา ไปจนถึงปิดตกลงและสร้างสัญญาเช่า
          </p>
        </div>

        {allowCreate && (
          <Link href="/rental-leads/new">
            <Button className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" />
              เพิ่มงานเช่าใหม่
            </Button>
          </Link>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
          <Filter className="h-3.5 w-3.5 text-primary-500" />
          <span>ค้นหาและกรองข้อมูล</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <Input
            type="text"
            placeholder="ค้นหาตามชื่องาน, รหัส, ลูกค้า, สถานที่..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-sm"
          />

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">ทุกสถานะ ({leads.length})</option>
            {Object.entries(LEAD_STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>

          {/* Assigned Staff Filter */}
          <select
            value={assignedFilter}
            onChange={(e) => setAssignedFilter(e.target.value)}
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">ผู้รับผิดชอบทั้งหมด</option>
            {staffProfiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name || p.email}
              </option>
            ))}
          </select>

          {/* Province Filter */}
          <select
            value={provinceFilter}
            onChange={(e) => setProvinceFilter(e.target.value)}
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">ทุกจังหวัด ({provinces.length})</option>
            {provinces.map((prov) => (
              <option key={prov} value={prov}>
                {prov}
              </option>
            ))}
          </select>
        </div>

        {/* Counter */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>
            แสดง {filteredLeads.length} จากทั้งหมด {leads.length} งานเช่า
          </span>
          {(searchTerm || statusFilter !== 'all' || assignedFilter !== 'all' || provinceFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setAssignedFilter('all')
                setProvinceFilter('all')
              }}
              className="text-primary-600 hover:underline cursor-pointer"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>
      </div>

      {/* Table / List */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {filteredLeads.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="ไม่พบข้อมูลงานเช่า"
              message="ยังไม่มีงานเช่าในระบบ หรือไม่มีรายการที่ตรงกับเงื่อนไขการค้นหา"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">รหัส Lead</th>
                  <th className="px-4 py-3.5">ชื่องานเช่า / โครงการ</th>
                  <th className="px-4 py-3.5">สถานที่</th>
                  <th className="px-4 py-3.5">ลูกค้า</th>
                  <th className="px-4 py-3.5 text-right">ค่าเช่าเสนอ</th>
                  <th className="px-4 py-3.5">สถานะ</th>
                  <th className="px-4 py-3.5">นัดถัดไป</th>
                  <th className="px-4 py-3.5">ผู้รับผิดชอบ</th>
                  <th className="px-4 py-3.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map((lead) => {
                  const badgeStyle =
                    LEAD_STATUS_BADGE_VARIANTS[lead.status as LeadStatus] ||
                    LEAD_STATUS_BADGE_VARIANTS.new

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => router.push(`/rental-leads/${lead.id}`)}
                      className="cursor-pointer transition-colors hover:bg-primary-50/40"
                    >
                      {/* Lead No */}
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-900 whitespace-nowrap">
                        {lead.lead_no}
                      </td>

                      {/* Lead Name */}
                      <td className="px-4 py-3.5 font-medium text-slate-900">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-900 leading-snug">{lead.lead_name}</p>
                          {lead.source && (
                            <p className="text-xs text-slate-400">ที่มา: {lead.source}</p>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        {lead.locations ? (
                          <div className="space-y-0.5">
                            <p className="font-medium text-slate-800">
                              {lead.locations.location_name}
                            </p>
                            {lead.locations.province && (
                              <p className="text-slate-400 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {lead.locations.province}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        {lead.customers ? (
                          <div className="space-y-0.5">
                            <p className="font-medium text-slate-800">
                              {lead.customers.name || lead.customers.company_name}
                            </p>
                            {lead.customers.phone && (
                              <p className="text-slate-400">{lead.customers.phone}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Proposed Rent */}
                      <td className="px-4 py-3.5 text-right font-mono font-medium text-slate-900 whitespace-nowrap">
                        ฿{Number(lead.proposed_monthly_rent || 0).toLocaleString('th-TH')}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
                        >
                          {LEAD_STATUS_LABELS[lead.status as LeadStatus] || lead.status}
                        </span>
                      </td>

                      {/* Next follow up date */}
                      <td className="px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                        {lead.next_follow_up_date ? (
                          <div className="flex items-center gap-1 text-amber-700 font-medium">
                            <Calendar className="h-3.5 w-3.5 text-amber-500" />
                            <span>
                              {new Date(lead.next_follow_up_date).toLocaleDateString('th-TH', {
                                day: 'numeric',
                                month: 'short',
                                year: '2-digit',
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Assigned to */}
                      <td className="px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                        {lead.profiles?.full_name || lead.profiles?.email || '-'}
                      </td>

                      {/* Chevron */}
                      <td className="px-4 py-3.5 text-right">
                        <ChevronRight className="h-4 w-4 text-slate-400 inline-block" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
