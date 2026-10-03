'use client'

import * as React from 'react'
import {
  Phone,
  MessageSquare,
  Mail,
  Users,
  Calendar,
  DollarSign,
  Clock,
  ArrowRight,
  UserCheck,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { NegotiationLog, ContactMethod } from '@/lib/types/rental-leads'
import { AddNegotiationDialog } from './add-negotiation-dialog'
import { useI18n } from '@/lib/i18n/context'
import type { Tri } from '@/lib/i18n/tx'

interface NegotiationTimelineProps {
  leadId: string
  logs: NegotiationLog[]
  allowAddLog: boolean
}

const METHOD_ICONS: Record<ContactMethod, React.ComponentType<{ className?: string }>> = {
  phone: Phone,
  line: MessageSquare,
  facebook: MessageSquare,
  email: Mail,
  onsite: Users,
  other: Clock,
}

const METHOD_LABELS_TRI: Record<ContactMethod, Tri> = {
  phone: { th: 'โทรศัพท์', en: 'Phone', my: 'ဖုန်း' },
  line: { th: 'LINE', en: 'LINE', my: 'LINE' },
  facebook: { th: 'Facebook', en: 'Facebook', my: 'Facebook' },
  email: { th: 'อีเมล', en: 'Email', my: 'အီးမေးလ်' },
  onsite: { th: 'ลงพื้นที่ / พบตัวจริง', en: 'On-site Meeting', my: 'နေရာသို့ သွားရောက်တွေ့ဆုံခြင်း' },
  other: { th: 'อื่นๆ', en: 'Other', my: 'အခြား' },
}

export function NegotiationTimeline({
  leadId,
  logs,
  allowAddLog,
}: NegotiationTimelineProps) {
  const { tx, locale } = useI18n()
  const intlLocale = locale === 'en' ? 'en-US' : locale === 'my' ? 'my-MM' : 'th-TH'
  const [showAddModal, setShowAddModal] = React.useState(false)

  // Sort logs by contact_date descending (newest first)
  const sortedLogs = React.useMemo(() => {
    return [...logs].sort(
      (a, b) => new Date(b.contact_date).getTime() - new Date(a.contact_date).getTime()
    )
  }, [logs])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {tx({
              th: 'ประวัติการเจรจาต่อรอง (Negotiation Timeline)',
              en: 'Negotiation Timeline',
              my: 'ညှိနှိုင်းမှု မှတ်တမ်း',
            })}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {tx({
              th: 'บันทึกการติดต่อ โทรคุย ต่อรองราคาค่าเช่า และข้อตกลงในแต่ละครั้ง',
              en: 'Record of calls, discussions, rent price negotiations, and agreements',
              my: 'ဆက်သွယ်ပြောဆိုမှု၊ ဈေးနှုန်းညှိနှိုင်းမှုနှင့် သဘောတူညီချက်များ မှတ်တမ်း',
            })}
          </p>
        </div>

        {allowAddLog && (
          <Button
            type="button"
            onClick={() => setShowAddModal(true)}
            size="sm"
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            {tx({
              th: 'เพิ่มบันทึกการเจรจา',
              en: 'Add Negotiation Log',
              my: 'ညှိနှိုင်းမှုမှတ်တမ်း အသစ်ထည့်မည်',
            })}
          </Button>
        )}
      </div>

      {/* Timeline List */}
      {sortedLogs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
          <Clock className="mx-auto h-8 w-8 text-slate-300 mb-2" />
          <p className="text-sm font-medium text-slate-600">
            {tx({
              th: 'ยังไม่มีบันทึกการเจรจา',
              en: 'No negotiation logs yet',
              my: 'ညှိနှိုင်းမှုမှတ်တမ်း မရှိသေးပါ',
            })}
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {tx({
              th: 'กดปุ่ม "เพิ่มบันทึกการเจรจา" เพื่อจดบันทึกการโทรคุย ค่าเช่าที่ต่อรอง หรือข้อสรุปกับลูกค้า/ผู้ให้เช่า',
              en: 'Click "Add Negotiation Log" to record calls, negotiated rent, or conclusions with clients/landlords.',
              my: 'ဖောက်သည်/အိမ်ရှင်နှင့် ဆက်သွယ်ပြောဆိုမှု၊ ဈေးနှုန်းညှိနှိုင်းမှုများကို မှတ်တမ်းတင်ရန် "ညှိနှိုင်းမှုမှတ်တမ်း အသစ်ထည့်မည်" ကို နှိပ်ပါ',
            })}
          </p>
          {allowAddLog && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="mt-4 gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              {tx({
                th: 'บันทึกการคุยครั้งแรก',
                en: 'Record First Discussion',
                my: 'ပထမဆုံး ဆွေးနွေးမှု မှတ်တမ်းတင်မည်',
              })}
            </Button>
          )}
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
          {sortedLogs.map((log) => {
            const MethodIcon = METHOD_ICONS[log.contact_method] || Phone
            const dateStr = new Date(log.contact_date).toLocaleDateString(intlLocale, {
              day: 'numeric',
              month: 'short',
              year: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })

            return (
              <div key={log.id} className="relative group">
                {/* Timeline Dot */}
                <div className="absolute -left-6 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-white shadow-sm ring-4 ring-white">
                  <MethodIcon className="h-2.5 w-2.5" />
                </div>

                {/* Content Card */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 transition-colors space-y-3">
                  {/* Top Bar: Date, Method, Contact Person */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">{dateStr}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        <MethodIcon className="h-3 w-3" />
                        {METHOD_LABELS_TRI[log.contact_method] ? tx(METHOD_LABELS_TRI[log.contact_method]) : log.contact_method}
                      </span>
                    </div>

                    {(log.contact_person || log.contact_phone) && (
                      <div className="text-xs text-slate-500 flex items-center gap-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                        <span>{log.contact_person || '-'}</span>
                        {log.contact_phone && (
                          <span className="text-slate-400">({log.contact_phone})</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Pricing Negotiated Pill (if any) */}
                  {(log.monthly_rent != null || log.deposit_amount != null || log.advance_rent_amount != null) && (
                    <div className="flex flex-wrap gap-2 py-1">
                      {log.monthly_rent != null && (
                        <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800">
                          <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                          <span>
                            {tx({ th: 'ค่าเช่าที่คุย: ฿', en: 'Negotiated Rent: ฿', my: 'ညှိနှိုင်းရရှိသော အငှားခ: ฿' })}
                            {Number(log.monthly_rent).toLocaleString(intlLocale)}
                            {tx({ th: '/เดือน', en: '/month', my: '/လ' })}
                          </span>
                        </div>
                      )}
                      {log.deposit_amount != null && (
                        <div className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-medium text-blue-800">
                          <span>
                            {tx({ th: 'เงินมัดจำ: ฿', en: 'Deposit: ฿', my: 'စပေါ်ငွေ: ฿' })}
                            {Number(log.deposit_amount).toLocaleString(intlLocale)}
                          </span>
                        </div>
                      )}
                      {log.advance_rent_amount != null && (
                        <div className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 border border-purple-200 px-3 py-1 text-xs font-medium text-purple-800">
                          <span>
                            {tx({ th: 'ค่าเช่าล่วงหน้า: ฿', en: 'Advance Rent: ฿', my: 'ကြိုတင်ငှားရမ်းခ: ฿' })}
                            {Number(log.advance_rent_amount).toLocaleString(intlLocale)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Negotiation Details */}
                  <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                    {log.negotiation_detail}
                  </div>

                  {/* Result & Next Action */}
                  {(log.result || log.next_action) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-50 text-xs">
                      {log.result && (
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-500">
                            {tx({ th: 'ผลการเจรจา:', en: 'Result:', my: 'ရလဒ်:' })}
                          </span>
                          <p className="text-slate-700">{log.result}</p>
                        </div>
                      )}
                      {log.next_action && (
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-500 flex items-center gap-1">
                            <ArrowRight className="h-3 w-3 text-primary-500" />
                            {tx({ th: 'สิ่งที่ต้องทำต่อ:', en: 'Next Action:', my: 'နောက်ထပ်လုပ်ဆောင်ရန်:' })}
                          </span>
                          <p className="text-slate-700">{log.next_action}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer: Next Follow up & Staff */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-slate-400 border-t border-slate-50">
                    <div>
                      {log.next_follow_up_date && (
                        <span className="text-amber-700 font-medium flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-amber-500" />
                          {tx({ th: 'นัดหมายครั้งถัดไป: ', en: 'Next Follow-up: ', my: 'နောက်တစ်ကြိမ် တွေ့ဆုံ/ဆက်သွယ်မည့်ရက်: ' })}
                          {new Date(log.next_follow_up_date).toLocaleDateString(intlLocale, {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                    {log.profiles && (
                      <span>
                        {tx({ th: 'บันทึกโดย: ', en: 'Logged by: ', my: 'မှတ်တမ်းတင်သူ: ' })}
                        {log.profiles.full_name || log.profiles.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Negotiation Modal */}
      <AddNegotiationDialog
        open={showAddModal}
        onOpenChange={setShowAddModal}
        leadId={leadId}
      />
    </div>
  )
}
