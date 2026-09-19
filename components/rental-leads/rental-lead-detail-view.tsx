'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Edit3,
  MapPin,
  User,
  DollarSign,
  Clock,
  ExternalLink,
  Building,
  Home,
} from 'lucide-react'
import {
  parseLeadMetadata,
  calculateMonthlyInstallment,
} from '@/lib/utils/lead-metadata'
import { Button } from '@/components/ui/button'
import { ConvertContractButton } from './convert-contract-button'
import { NegotiationTimeline } from './negotiation-timeline'
import { RentalLeadForm } from './rental-lead-form'
import type {
  RentalLeadWithRelations,
  LeadStatus,
} from '@/lib/types/rental-leads'
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_BADGE_VARIANTS,
} from '@/lib/types/rental-leads'
import type { Customer, Landlord, Location } from '@/lib/types/master-data'
import type { UserProfile, UserRole } from '@/lib/types/auth'
import { canWrite } from '@/lib/auth/permissions'
import { DocumentSection } from '@/components/documents/document-section'

interface RentalLeadDetailViewProps {
  lead: RentalLeadWithRelations
  locations: Pick<Location, 'id' | 'location_code' | 'location_name' | 'province'>[]
  customers: Pick<Customer, 'id' | 'customer_code' | 'name' | 'company_name'>[]
  landlords: Pick<Landlord, 'id' | 'landlord_code' | 'name' | 'company_name'>[]
  staffProfiles: Pick<UserProfile, 'id' | 'full_name' | 'email'>[]
  userRole: UserRole
  existingContract?: { id: string; contract_no: string } | null
}

export function RentalLeadDetailView({
  lead,
  locations,
  customers,
  landlords,
  staffProfiles,
  userRole,
  existingContract,
}: RentalLeadDetailViewProps) {
  const [isEditing, setIsEditing] = React.useState(false)
  const allowEdit = canWrite(userRole)

  const { cleanNote, hasForeignResident, financial } = React.useMemo(
    () => parseLeadMetadata(lead.note),
    [lead.note]
  )

  const badgeStyle =
    LEAD_STATUS_BADGE_VARIANTS[lead.status as LeadStatus] ||
    LEAD_STATUS_BADGE_VARIANTS.new

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsEditing(false)}
            className="gap-2 text-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับไปหน้าภาพรวม
          </Button>
        </div>
        <RentalLeadForm
          initialData={lead}
          locations={locations}
          customers={customers}
          landlords={landlords}
          staffProfiles={staffProfiles}
          userRole={userRole}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link href="/rental-leads">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-slate-500 hover:text-slate-900">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{lead.lead_name}</h1>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
              >
                {LEAD_STATUS_LABELS[lead.status as LeadStatus] || lead.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              รหัส Lead: {lead.lead_no} • วันที่บันทึก:{' '}
              {new Date(lead.created_at).toLocaleDateString('th-TH', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Action Buttons: Convert to Contract & Edit */}
        <div className="flex items-center gap-3">
          {/* Button: Convert to Contract (if status = agreed or converted without contract) */}
          <ConvertContractButton
            leadId={lead.id}
            status={lead.status as LeadStatus}
            allowConvert={allowEdit}
            hasExistingContract={Boolean(existingContract)}
            contractNo={existingContract?.contract_no}
            contractId={existingContract?.id}
          />

          {allowEdit && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="gap-1.5 shadow-sm"
            >
              <Edit3 className="h-4 w-4 text-slate-500" />
              แก้ไขข้อมูลงานเช่า
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Proposed Rent */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
          <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
            ค่าเช่าเสนอ
          </p>
          <p className="text-xl font-bold text-slate-900 font-mono">
            ฿{Number(lead.proposed_monthly_rent || 0).toLocaleString('th-TH')}
            <span className="text-xs font-normal text-slate-500"> /เดือน</span>
          </p>
          <p className="text-[11px] text-slate-400">
            มัดจำ: ฿{Number(lead.proposed_deposit_amount || 0).toLocaleString('th-TH')}
          </p>
        </div>

        {/* Location */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
          <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary-500" />
            สถานที่เป้าหมาย
          </p>
          <p className="text-base font-semibold text-slate-900 truncate">
            {lead.locations?.location_name || 'ยังไม่ระบุ'}
          </p>
          <p className="text-[11px] text-slate-400 truncate">
            {lead.locations?.province || '-'}
          </p>
        </div>

        {/* Next Follow-up */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
          <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            นัดติดตามผลครั้งถัดไป
          </p>
          <p className="text-base font-semibold text-amber-800">
            {lead.next_follow_up_date
              ? new Date(lead.next_follow_up_date).toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'ไม่มีนัดหมาย'}
          </p>
          <p className="text-[11px] text-slate-400">
            เริ่ม:{' '}
            {lead.expected_start_date
              ? new Date(lead.expected_start_date).toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'short',
                  year: '2-digit',
                })
              : '-'}
            {financial.contract_end_date ? (
              <> • ครบ: {new Date(financial.contract_end_date).toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'short',
                  year: '2-digit',
                })}</>
            ) : null}
          </p>
        </div>

        {/* Assigned Staff */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
          <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-indigo-500" />
            ผู้รับผิดชอบ
          </p>
          <p className="text-base font-semibold text-slate-900 truncate">
            {lead.profiles?.full_name || lead.profiles?.email || 'ยังไม่มอบหมาย'}
          </p>
          <p className="text-[11px] text-slate-400 truncate">
            วัตถุประสงค์: {lead.source || '-'}
          </p>
        </div>
      </div>

      {/* Main Grid: Left Details + Right Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Master Data & Proposal Details */}
        <div className="lg:col-span-5 space-y-6">
          {/* Related Entities Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
              คู่สัญญาและสถานที่
            </h3>

            {/* Customer */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-400">ลูกค้า (ผู้เช่า)</span>
              {lead.customers ? (
                <div className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-800 space-y-0.5">
                  <p className="font-semibold text-sm text-slate-900">
                    {lead.customers.name || lead.customers.company_name}
                  </p>
                  {lead.customers.phone && <p>โทร: {lead.customers.phone}</p>}
                  <Link
                    href={`/customers/${lead.customers.id}`}
                    className="text-primary-600 hover:underline inline-flex items-center gap-1 pt-1"
                  >
                    ดูโปรไฟล์ลูกค้า <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <p className="text-xs text-slate-400">ยังไม่ระบุลูกค้า</p>
              )}
            </div>

            {/* Landlord */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-400">ผู้ให้เช่า (เจ้าของพื้นที่)</span>
              {lead.landlords ? (
                <div className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-800 space-y-0.5">
                  <p className="font-semibold text-sm text-slate-900">
                    {lead.landlords.name || lead.landlords.company_name}
                  </p>
                  {lead.landlords.phone && <p>โทร: {lead.landlords.phone}</p>}
                  <Link
                    href={`/landlords/${lead.landlords.id}`}
                    className="text-primary-600 hover:underline inline-flex items-center gap-1 pt-1"
                  >
                    ดูโปรไฟล์ผู้ให้เช่า <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <p className="text-xs text-slate-400">ยังไม่ระบุผู้ให้เช่า</p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-400">สถานที่เช่า</span>
              {lead.locations ? (
                <div className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-800 space-y-0.5">
                  <p className="font-semibold text-sm text-slate-900">
                    {lead.locations.location_name}
                  </p>
                  <p>จังหวัด: {lead.locations.province || '-'}</p>
                  <Link
                    href={`/locations/${lead.locations.id}`}
                    className="text-primary-600 hover:underline inline-flex items-center gap-1 pt-1"
                  >
                    ดูรายละเอียดสถานที่ <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <p className="text-xs text-slate-400">ยังไม่ระบุสถานที่</p>
              )}
            </div>
          </div>

          {/* Pricing & Terms Section */}
          {(() => {
            const { cleanNote, hasForeignResident, financial } = parseLeadMetadata(lead.note)
            const estimatedInstallment = calculateMonthlyInstallment(
              financial.property_price,
              financial.down_payment,
              financial.interest_rate,
              financial.installment_years
            )
            const hasHouseTerms = Boolean(
              financial.property_price ||
              financial.down_payment ||
              financial.interest_rate ||
              financial.installment_years
            )

            return (
              <>
                {/* Pricing Summary Card */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                  <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
                    สรุปข้อเสนอทางการเงิน (ค่าเช่า)
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">ค่าเช่าเสนอ:</span>
                      <span className="font-semibold text-slate-900 font-mono">
                        ฿{Number(lead.proposed_monthly_rent || 0).toLocaleString('th-TH')}/เดือน
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">เงินมัดจำ / ประกัน:</span>
                      <span className="font-semibold text-slate-900 font-mono">
                        ฿{Number(lead.proposed_deposit_amount || 0).toLocaleString('th-TH')}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">ค่าเช่าล่วงหน้า:</span>
                      <span className="font-semibold text-slate-900 font-mono">
                        ฿{Number(lead.proposed_advance_rent_amount || 0).toLocaleString('th-TH')}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">ค่าบริการส่วนกลาง:</span>
                      <span className="font-semibold text-slate-900 font-mono">
                        ฿{Number(lead.proposed_service_amount || 0).toLocaleString('th-TH')}/เดือน
                      </span>
                    </div>
                    {financial.payment_due_day && (
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-600 font-medium">วันที่ครบกำหนดชำระ:</span>
                        <span className="font-semibold text-primary-700">
                          ทุกวันที่ {financial.payment_due_day} ของเดือน
                        </span>
                      </div>
                    )}
                    {financial.contract_end_date && (
                      <div className="flex justify-between py-1">
                        <span className="text-slate-600 font-medium">วันที่ครบสัญญา:</span>
                        <span className="font-semibold text-slate-900">
                          {new Date(financial.contract_end_date).toLocaleDateString('th-TH', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* House Pricing & Financing Card (for Residential / Hire-Purchase) */}
                {hasHouseTerms && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                      <h3 className="text-xs font-semibold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Home className="h-3.5 w-3.5 text-amber-600" />
                        ข้อเสนอสำหรับบ้าน / เช่าซื้อ
                      </h3>
                      {estimatedInstallment > 0 && (
                        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-300">
                          ผ่อน ~฿{estimatedInstallment.toLocaleString('th-TH')}/เดือน
                        </span>
                      )}
                    </div>
                    <div className="space-y-2 text-xs">
                      {financial.property_price ? (
                        <div className="flex justify-between py-1 border-b border-amber-100/60">
                          <span className="text-slate-600">ราคาบ้าน:</span>
                          <span className="font-bold text-slate-900 font-mono text-sm">
                            ฿{Number(financial.property_price).toLocaleString('th-TH')}
                          </span>
                        </div>
                      ) : null}
                      {financial.down_payment ? (
                        <div className="flex justify-between py-1 border-b border-amber-100/60">
                          <span className="text-slate-600">เงินดาวน์:</span>
                          <span className="font-bold text-slate-900 font-mono">
                            ฿{Number(financial.down_payment).toLocaleString('th-TH')}
                          </span>
                        </div>
                      ) : null}
                      {financial.interest_rate ? (
                        <div className="flex justify-between py-1 border-b border-amber-100/60">
                          <span className="text-slate-600">อัตราดอกเบี้ย:</span>
                          <span className="font-semibold text-slate-900 font-mono">
                            {financial.interest_rate}% ต่อปี
                          </span>
                        </div>
                      ) : null}
                      {financial.installment_years ? (
                        <div className="flex justify-between py-1 border-b border-amber-100/60">
                          <span className="text-slate-600">ระยะเวลาการผ่อน:</span>
                          <span className="font-semibold text-slate-900 font-mono">
                            {financial.installment_years} ปี
                          </span>
                        </div>
                      ) : null}
                      {financial.payment_due_day ? (
                        <div className="flex justify-between py-1">
                          <span className="text-slate-600">วันที่ครบกำหนดชำระ:</span>
                          <span className="font-semibold text-amber-900">
                            ทุกวันที่ {financial.payment_due_day} ของเดือน
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}

                {/* Registration Checklist Card */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                  <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
                    รายการที่ต้องดำเนินการทางทะเบียนและเอกสาร
                  </h3>

                  {/* หมวดสำหรับสาขา */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                      <Building className="h-3.5 w-3.5 text-slate-500" />
                      <span>สำหรับสาขา / สถานประกอบการ</span>
                    </div>
                    <div className="space-y-1.5 text-xs pl-2 border-l-2 border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">จดทะเบียนสาขา:</span>
                        <span
                          className={`font-semibold ${
                            lead.need_branch_registration ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          {lead.need_branch_registration ? '✓ ต้องดำเนินการ' : 'ไม่ระบุ'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">จดภาษีมูลค่าเพิ่ม (VAT):</span>
                        <span
                          className={`font-semibold ${
                            lead.need_vat_registration ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          {lead.need_vat_registration ? '✓ ต้องดำเนินการ' : 'ไม่ระบุ'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">เปลี่ยนนายจ้างประกันสังคม:</span>
                        <span
                          className={`font-semibold ${
                            lead.need_employer_change ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          {lead.need_employer_change ? '✓ ต้องดำเนินการ' : 'ไม่ระบุ'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">ขออนุญาตติดตั้งป้ายร้าน:</span>
                        <span
                          className={`font-semibold ${
                            lead.need_signboard ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          {lead.need_signboard ? '✓ ต้องดำเนินการ' : 'ไม่ระบุ'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* หมวดสำหรับบ้าน */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
                      <Home className="h-3.5 w-3.5 text-amber-600" />
                      <span>สำหรับบ้าน / ที่พักอาศัย</span>
                    </div>
                    <div className="space-y-1.5 text-xs pl-2 border-l-2 border-amber-200">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">แจ้งที่พักอาศัยคนต่างด้าว (ตม.30):</span>
                        <span
                          className={`font-semibold ${
                            hasForeignResident ? 'text-amber-700 font-bold' : 'text-slate-400'
                          }`}
                        >
                          {hasForeignResident ? '✓ ต้องดำเนินการ (ตม.30)' : 'ไม่ระบุ'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {cleanNote && (
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
                    <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
                      หมายเหตุงานเช่า
                    </h3>
                    <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                      {cleanNote}
                    </p>
                  </div>
                )}
              </>
            )
          })()}
        </div>

        {/* Right Column (7 Cols): Negotiation Timeline + Documents */}
        <div className="lg:col-span-7 space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <NegotiationTimeline
              leadId={lead.id}
              logs={lead.negotiation_logs || []}
              allowAddLog={allowEdit}
            />
          </div>

          {/* Documents */}
          <DocumentSection
            entityType="lead"
            entityId={lead.id}
            userRole={userRole}
            defaultDocumentType="RENTAL_CONTRACT"
            title="เอกสารแนบ (Lead)"
          />
        </div>
      </div>
    </div>
  )
}
