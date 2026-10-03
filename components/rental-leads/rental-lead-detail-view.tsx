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
import { useI18n } from '@/lib/i18n/context'
import { labelOf, LEAD_STATUS_TRI, W } from '@/lib/i18n/labels'

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
  const { t, locale, tx } = useI18n()
  const intlLocale = locale === 'en' ? 'en-US' : locale === 'my' ? 'my-MM' : 'th-TH'
  const [isEditing, setIsEditing] = React.useState(false)
  const allowEdit = canWrite(userRole)

  const { cleanNote, hasForeignResident, financial, isHouse } = React.useMemo(
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
            {tx({ th: 'กลับไปหน้าภาพรวม', en: 'Back to Overview', my: 'အကျဉ်းချုပ်သို့ ပြန်သွားရန်' })}
          </Button>
        </div>
        <RentalLeadForm
          initialData={lead}
          locations={locations}
          customers={customers}
          landlords={landlords}
          staffProfiles={staffProfiles}
          userRole={userRole}
          onSuccess={() => setIsEditing(false)}
          onCancel={() => setIsEditing(false)}
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
                {labelOf(LEAD_STATUS_TRI, lead.status, locale)}
              </span>
              {isHouse ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                  <Home className="h-3 w-3 text-amber-600" />
                  {tx(W.houseResidential)}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-300">
                  <Building className="h-3 w-3 text-sky-600" />
                  {tx(W.branch)}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              {tx({ th: 'รหัส Lead', en: 'Lead Code', my: 'အခွင့်အလမ်းကုဒ်' })}: {lead.lead_no} • {tx({ th: 'วันที่บันทึก', en: 'Created', my: 'ရက်စွဲ' })}:{' '}
              {new Date(lead.created_at).toLocaleDateString(intlLocale, {
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
              {tx({ th: 'แก้ไขข้อมูลงานเช่า', en: 'Edit Lead', my: 'ပြင်ဆင်ရန်' })}
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
            {tx({ th: 'ค่าเช่าเสนอ', en: 'Proposed Rent', my: 'အဆိုပြုငှားခ' })}
          </p>
          <p className="text-xl font-bold text-slate-900 font-mono">
            ฿{Number(lead.proposed_monthly_rent || 0).toLocaleString(intlLocale)}
            <span className="text-xs font-normal text-slate-500"> /{tx({ th: 'เดือน', en: 'mo', my: 'လ' })}</span>
          </p>
          <p className="text-[11px] text-slate-400">
            {tx({ th: 'มัดจำ', en: 'Deposit', my: 'စပေါ်' })}: ฿{Number(lead.proposed_deposit_amount || 0).toLocaleString(intlLocale)}
          </p>
        </div>

        {/* Location */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
          <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary-500" />
            {tx({ th: 'สถานที่เป้าหมาย', en: 'Target Location', my: 'ရည်ရွယ်ထားသော နေရာ' })}
          </p>
          <p className="text-base font-semibold text-slate-900 truncate">
            {lead.locations?.location_name || tx({ th: 'ยังไม่ระบุ', en: 'Unspecified', my: 'မသတ်မှတ်ရသေး' })}
          </p>
          <p className="text-[11px] text-slate-400 truncate">
            {lead.locations?.province || '-'}
          </p>
        </div>

        {/* Next Follow-up */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
          <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            {tx({ th: 'นัดติดตามผลครั้งถัดไป', en: 'Next Follow-up', my: 'နောက်တစ်ကြိမ် တွေ့ဆုံရက်' })}
          </p>
          <p className="text-base font-semibold text-amber-800">
            {lead.next_follow_up_date
              ? new Date(lead.next_follow_up_date).toLocaleDateString(intlLocale, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : tx({ th: 'ไม่มีนัดหมาย', en: 'No appointment', my: 'ရက်ချိန်းမရှိ' })}
          </p>
          <p className="text-[11px] text-slate-400">
            {tx({ th: 'เริ่ม', en: 'Start', my: 'စတင်' })}:{' '}
            {lead.expected_start_date
              ? new Date(lead.expected_start_date).toLocaleDateString(intlLocale, {
                  day: 'numeric',
                  month: 'short',
                  year: '2-digit',
                })
              : '-'}
            {financial.contract_end_date ? (
              <> • {tx({ th: 'ครบ', en: 'End', my: 'ကုန်ဆုံး' })}: {new Date(financial.contract_end_date).toLocaleDateString(intlLocale, {
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
            {tx({ th: 'ผู้รับผิดชอบ', en: 'Assigned Staff', my: 'တာဝန်ခံ' })}
          </p>
          <p className="text-base font-semibold text-slate-900 truncate">
            {lead.profiles?.full_name || lead.profiles?.email || tx({ th: 'ยังไม่มอบหมาย', en: 'Unassigned', my: 'တာဝန်ခံ မသတ်မှတ်ရသေး' })}
          </p>
          <p className="text-[11px] text-slate-400 truncate">
            {tx({ th: 'วัตถุประสงค์', en: 'Purpose', my: 'ရည်ရွယ်ချက်' })}: {lead.source || '-'}
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
              {tx({ th: 'คู่สัญญาและสถานที่', en: 'Parties & Location', my: 'စာချုပ်ပါပုဂ္ဂိုလ်နှင့် နေရာ' })}
            </h3>

            {/* Customer */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-400">{t.customers.title} ({tx(W.tenant)})</span>
              {lead.customers ? (
                <div className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-800 space-y-0.5">
                  <p className="font-semibold text-sm text-slate-900">
                    {lead.customers.name || lead.customers.company_name}
                  </p>
                  {lead.customers.phone && <p>{tx({ th: 'โทร', en: 'Tel', my: 'ဖုန်း' })}: {lead.customers.phone}</p>}
                  <Link
                    href={`/customers/${lead.customers.id}`}
                    className="text-primary-600 hover:underline inline-flex items-center gap-1 pt-1"
                  >
                    {tx({ th: 'ดูโปรไฟล์ลูกค้า', en: 'View Customer Profile', my: 'ဖောက်သည် အချက်အလက် ကြည့်ရန်' })} <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <p className="text-xs text-slate-400">{tx({ th: 'ยังไม่ระบุลูกค้า', en: 'No customer specified', my: 'ဖောက်သည် မသတ်မှတ်ရသေးပါ' })}</p>
              )}
            </div>

            {/* Landlord */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-400">{t.landlords.title} ({tx(W.landlord)})</span>
              {lead.landlords ? (
                <div className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-800 space-y-0.5">
                  <p className="font-semibold text-sm text-slate-900">
                    {lead.landlords.name || lead.landlords.company_name}
                  </p>
                  {lead.landlords.phone && <p>{tx({ th: 'โทร', en: 'Tel', my: 'ဖုန်း' })}: {lead.landlords.phone}</p>}
                  <Link
                    href={`/landlords/${lead.landlords.id}`}
                    className="text-primary-600 hover:underline inline-flex items-center gap-1 pt-1"
                  >
                    {tx({ th: 'ดูโปรไฟล์ผู้ให้เช่า', en: 'View Landlord Profile', my: 'အိမ်ရှင် အချက်အလက် ကြည့်ရန်' })} <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <p className="text-xs text-slate-400">{tx({ th: 'ยังไม่ระบุผู้ให้เช่า', en: 'No landlord specified', my: 'အိမ်ရှင် မသတ်မှတ်ရသေးပါ' })}</p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-400">{t.locations.title}</span>
              {lead.locations ? (
                <div className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-800 space-y-0.5">
                  <p className="font-semibold text-sm text-slate-900">
                    {lead.locations.location_name}
                  </p>
                  <p>{tx({ th: 'จังหวัด', en: 'Province', my: 'တိုင်းဒေသကြီး/ပြည်နယ်' })}: {lead.locations.province || '-'}</p>
                  <Link
                    href={`/locations/${lead.locations.id}`}
                    className="text-primary-600 hover:underline inline-flex items-center gap-1 pt-1"
                  >
                    {tx({ th: 'ดูรายละเอียดสถานที่', en: 'View Location Details', my: 'နေရာ အသေးစိတ် ကြည့်ရန်' })} <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <p className="text-xs text-slate-400">{tx({ th: 'ยังไม่ระบุสถานที่', en: 'No location specified', my: 'နေရာ မသတ်မှတ်ရသေးပါ' })}</p>
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
                    {tx({ th: 'สรุปข้อเสนอทางการเงิน (ค่าเช่า)', en: 'Financial Terms Summary', my: 'ဘဏ္ဍာရေး အဆိုပြုချက် အကျဉ်းချုပ်' })}
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">{tx({ th: 'ค่าเช่าเสนอ:', en: 'Proposed Rent:', my: 'အဆိုပြုငှားခ:' })}</span>
                      <span className="font-semibold text-slate-900 font-mono">
                        ฿{Number(lead.proposed_monthly_rent || 0).toLocaleString(intlLocale)}/{tx({ th: 'เดือน', en: 'mo', my: 'လ' })}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">{tx({ th: 'เงินมัดจำ / ประกัน:', en: 'Deposit / Security:', my: 'စပေါ် / အာမခံငွေ:' })}</span>
                      <span className="font-semibold text-slate-900 font-mono">
                        ฿{Number(lead.proposed_deposit_amount || 0).toLocaleString(intlLocale)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">{tx({ th: 'ค่าเช่าล่วงหน้า:', en: 'Advance Rent:', my: 'ကြိုတင်ငှားခ:' })}</span>
                      <span className="font-semibold text-slate-900 font-mono">
                        ฿{Number(lead.proposed_advance_rent_amount || 0).toLocaleString(intlLocale)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-500">{tx({ th: 'ค่าบริการส่วนกลาง:', en: 'Service Fee:', my: 'အများသုံး ဝန်ဆောင်ခ:' })}</span>
                      <span className="font-semibold text-slate-900 font-mono">
                        ฿{Number(lead.proposed_service_amount || 0).toLocaleString(intlLocale)}{tx({ th: '/เดือน', en: '/month', my: '/လ' })}
                      </span>
                    </div>
                    {financial.payment_due_day && (
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-600 font-medium">{tx({ th: 'วันที่ครบกำหนดชำระ:', en: 'Due Day:', my: 'ပေးချေရမည့်ရက်:' })}</span>
                        <span className="font-semibold text-primary-700">
                          {tx({ th: 'ทุกวันที่', en: 'Every', my: 'လစဉ်' })} {financial.payment_due_day} {tx({ th: 'ของเดือน', en: 'of month', my: 'ရက်' })}
                        </span>
                      </div>
                    )}
                    {financial.contract_end_date && (
                      <div className="flex justify-between py-1">
                        <span className="text-slate-600 font-medium">{tx({ th: 'วันที่ครบสัญญา:', en: 'Contract End Date:', my: 'စာချုပ်ကုန်ဆုံးရက်:' })}</span>
                        <span className="font-semibold text-slate-900">
                          {new Date(financial.contract_end_date).toLocaleDateString(intlLocale, {
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
                {isHouse && hasHouseTerms && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                      <h3 className="text-xs font-semibold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Home className="h-3.5 w-3.5 text-amber-600" />
                        {tx({ th: 'ข้อเสนอสำหรับบ้าน / เช่าซื้อ', en: 'House / Hire-Purchase Terms', my: 'အိမ် / အငှားဝယ် အဆိုပြုချက်' })}
                      </h3>
                      {estimatedInstallment > 0 && (
                        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-300">
                          {tx({ th: 'ผ่อน ~฿', en: 'Est. ~฿', my: 'အရစ်ကျ ~฿' })}{estimatedInstallment.toLocaleString(intlLocale)}/{tx({ th: 'เดือน', en: 'mo', my: 'လ' })}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2 text-xs">
                      {financial.property_price ? (
                        <div className="flex justify-between py-1 border-b border-amber-100/60">
                          <span className="text-slate-600">{tx({ th: 'ราคาบ้าน:', en: 'Property Price:', my: 'အိမ်တန်ဖိုး:' })}</span>
                          <span className="font-bold text-slate-900 font-mono text-sm">
                            ฿{Number(financial.property_price).toLocaleString(intlLocale)}
                          </span>
                        </div>
                      ) : null}
                      {financial.down_payment ? (
                        <div className="flex justify-between py-1 border-b border-amber-100/60">
                          <span className="text-slate-600">{tx({ th: 'เงินดาวน์:', en: 'Down Payment:', my: 'စရန်ငွေ:' })}</span>
                          <span className="font-bold text-slate-900 font-mono">
                            ฿{Number(financial.down_payment).toLocaleString(intlLocale)}
                          </span>
                        </div>
                      ) : null}
                      {financial.interest_rate ? (
                        <div className="flex justify-between py-1 border-b border-amber-100/60">
                          <span className="text-slate-600">{tx({ th: 'อัตราดอกเบี้ย:', en: 'Interest Rate:', my: 'အတိုးနှုန်း:' })}</span>
                          <span className="font-semibold text-slate-900 font-mono">
                            {financial.interest_rate}% {tx({ th: 'ต่อปี', en: '/ year', my: '/ နှစ်' })}
                          </span>
                        </div>
                      ) : null}
                      {financial.installment_years ? (
                        <div className="flex justify-between py-1 border-b border-amber-100/60">
                          <span className="text-slate-600">{tx({ th: 'ระยะเวลาการผ่อน:', en: 'Installment Period:', my: 'အရစ်ကျကာလ:' })}</span>
                          <span className="font-semibold text-slate-900 font-mono">
                            {financial.installment_years} {tx({ th: 'ปี', en: 'years', my: 'နှစ်' })}
                          </span>
                        </div>
                      ) : null}
                      {financial.payment_due_day ? (
                        <div className="flex justify-between py-1">
                          <span className="text-slate-600">{tx({ th: 'วันที่ครบกำหนดชำระ:', en: 'Due Day:', my: 'ပေးချေရမည့်ရက်:' })}</span>
                          <span className="font-semibold text-amber-900">
                            {tx({ th: 'ทุกวันที่', en: 'Every', my: 'လစဉ်' })} {financial.payment_due_day} {tx({ th: 'ของเดือน', en: 'of month', my: 'ရက်' })}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}

                {/* Registration Checklist Card */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                  <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
                    {tx({ th: 'รายการที่ต้องดำเนินการทางทะเบียนและเอกสาร', en: 'Registration & Documentation Checklist', my: 'မှတ်ပုံတင်ခြင်းနှင့် စာရွက်စာတမ်းများ စာရင်း' })}
                  </h3>

                  {/* หมวดสำหรับสาขา */}
                  {!isHouse && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                        <Building className="h-3.5 w-3.5 text-slate-500" />
                        <span>{tx(W.branch)} / {tx({ th: 'สถานประกอบการ', en: 'Business Place', my: 'လုပ်ငန်းဌာန' })}</span>
                      </div>
                      <div className="space-y-1.5 text-xs pl-2 border-l-2 border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">{tx({ th: 'จดทะเบียนสาขา:', en: 'Branch Registration:', my: 'ဆိုင်ခွဲမှတ်ပုံတင်:' })}</span>
                          <span
                            className={`font-semibold ${
                              lead.need_branch_registration ? 'text-emerald-700' : 'text-slate-400'
                            }`}
                          >
                            {lead.need_branch_registration ? tx({ th: '✓ ต้องดำเนินการ', en: '✓ Required', my: '✓ ဆောင်ရွက်ရန်' }) : tx({ th: 'ไม่ระบุ', en: 'Unspecified', my: 'မရှိပါ' })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">{tx({ th: 'จดภาษีมูลค่าเพิ่ม (VAT):', en: 'VAT Registration:', my: 'VAT မှတ်ပုံတင်:' })}</span>
                          <span
                            className={`font-semibold ${
                              lead.need_vat_registration ? 'text-emerald-700' : 'text-slate-400'
                            }`}
                          >
                            {lead.need_vat_registration ? tx({ th: '✓ ต้องดำเนินการ', en: '✓ Required', my: '✓ ဆောင်ရွက်ရန်' }) : tx({ th: 'ไม่ระบุ', en: 'Unspecified', my: 'မရှိပါ' })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">{tx({ th: 'เปลี่ยนนายจ้างประกันสังคม:', en: 'SSO Employer Change:', my: 'လူမှုဖူလုံရေး အလုပ်ရှင်ပြောင်း:' })}</span>
                          <span
                            className={`font-semibold ${
                              lead.need_employer_change ? 'text-emerald-700' : 'text-slate-400'
                            }`}
                          >
                            {lead.need_employer_change ? tx({ th: '✓ ต้องดำเนินการ', en: '✓ Required', my: '✓ ဆောင်ရွက်ရန်' }) : tx({ th: 'ไม่ระบุ', en: 'Unspecified', my: 'မရှိပါ' })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">{tx({ th: 'ขออนุญาตติดตั้งป้ายร้าน:', en: 'Signboard Permit:', my: 'ဆိုင်းဘုတ်လိုင်စင်:' })}</span>
                          <span
                            className={`font-semibold ${
                              lead.need_signboard ? 'text-emerald-700' : 'text-slate-400'
                            }`}
                          >
                            {lead.need_signboard ? tx({ th: '✓ ต้องดำเนินการ', en: '✓ Required', my: '✓ ဆောင်ရွက်ရန်' }) : tx({ th: 'ไม่ระบุ', en: 'Unspecified', my: 'မရှိပါ' })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">{tx({ th: 'ยื่นกรมสรรพสามิต (เหล้า/ยาสูบ):', en: 'Excise Permit (Liquor/Tobacco):', my: 'ယစ်မျိုးခွန်လိုင်စင်:' })}</span>
                          <span
                            className={`font-semibold ${
                              lead.need_excise_permit ? 'text-emerald-700' : 'text-slate-400'
                            }`}
                          >
                            {lead.need_excise_permit ? tx({ th: '✓ ต้องดำเนินการ', en: '✓ Required', my: '✓ ဆောင်ရွက်ရန်' }) : tx({ th: 'ไม่ระบุ', en: 'Unspecified', my: 'မရှိပါ' })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">{tx({ th: 'แจ้งที่พักอาศัยคนต่างด้าว (ตม.30):', en: 'Foreign Resident (TM.30):', my: 'နိုင်ငံခြားသား နေထိုင်ရာ (TM.30):' })}</span>
                          <span
                            className={`font-semibold ${
                              hasForeignResident ? 'text-emerald-700' : 'text-slate-400'
                            }`}
                          >
                            {hasForeignResident ? tx({ th: '✓ ต้องดำเนินการ (ตม.30)', en: '✓ Required (TM.30)', my: '✓ ဆောင်ရွက်ရန် (TM.30)' }) : tx({ th: 'ไม่ระบุ', en: 'Unspecified', my: 'မရှိပါ' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* หมวดสำหรับบ้าน */}
                  {isHouse && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
                        <Home className="h-3.5 w-3.5 text-amber-600" />
                        <span>{tx(W.houseResidential)}</span>
                      </div>
                      <div className="space-y-1.5 text-xs pl-2 border-l-2 border-amber-200">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">{tx({ th: 'แจ้งที่พักอาศัยคนต่างด้าว (ตม.30):', en: 'Foreign Resident (TM.30):', my: 'နိုင်ငံခြားသား နေထိုင်ရာ (TM.30):' })}</span>
                          <span
                            className={`font-semibold ${
                              hasForeignResident ? 'text-amber-700 font-bold' : 'text-slate-400'
                            }`}
                          >
                            {hasForeignResident ? tx({ th: '✓ ต้องดำเนินการ (ตม.30)', en: '✓ Required (TM.30)', my: '✓ ဆောင်ရွက်ရန် (TM.30)' }) : tx({ th: 'ไม่ระบุ', en: 'Unspecified', my: 'မရှိပါ' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {cleanNote && (
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
                    <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">
                      {tx({ th: 'หมายเหตุงานเช่า', en: 'Lead Notes', my: 'အခွင့်အလမ်း မှတ်ချက်' })}
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
            title={tx({ th: 'เอกสารแนบ (Lead)', en: 'Attachments (Lead)', my: 'ပူးတွဲစာရွက်စာတမ်းများ' })}
          />
        </div>
      </div>
    </div>
  )
}
