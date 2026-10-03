'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
  ArrowLeft,
  Calendar,
  Clock,
  Eye,
  Settings,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import type { NotificationLogModel, LineDestinationModel } from '@/lib/types/line'
import {
  getNotificationHistoryAction,
  retryFailedNotificationAction,
} from '@/lib/actions/reminder'
import { useToast } from '@/components/ui/toast'
import { useI18n } from '@/lib/i18n/context'
import { W } from '@/lib/i18n/labels'

interface NotificationHistoryViewProps {
  initialLogs: NotificationLogModel[]
  initialTotal: number
  destinations: LineDestinationModel[]
}

export function NotificationHistoryView({
  initialLogs,
  initialTotal,
  destinations,
}: NotificationHistoryViewProps) {
  const { t, locale, tx } = useI18n()
  const intlLocale = locale === 'en' ? 'en-US' : locale === 'my' ? 'my-MM' : 'th-TH'
  const [logs, setLogs] = useState<NotificationLogModel[]>(initialLogs)
  const [totalCount, setTotalCount] = useState(initialTotal)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [retryingId, setRetryingId] = useState<string | null>(null)
  const { showToast } = useToast()

  const destMap = new Map<string, string>()
  for (const d of destinations) {
    destMap.set(d.id, d.name)
  }

  // Refetch logs when filter or page changes
  const fetchLogs = (newStatus = statusFilter, newType = typeFilter, newPage = page) => {
    startTransition(async () => {
      const res = await getNotificationHistoryAction({
        status: newStatus,
        notificationType: newType,
        page: newPage,
        limit: pageSize,
      })
      setLogs(res.logs)
      setTotalCount(res.totalCount)
    })
  }

  const handleStatusChange = (status: string) => {
    setStatusFilter(status)
    setPage(1)
    fetchLogs(status, typeFilter, 1)
  }

  const handleTypeChange = (type: string) => {
    setTypeFilter(type)
    setPage(1)
    fetchLogs(statusFilter, type, 1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    fetchLogs(statusFilter, typeFilter, newPage)
  }

  const handleRetry = (logId: string) => {
    setRetryingId(logId)
    startTransition(async () => {
      const res = await retryFailedNotificationAction(logId)
      setRetryingId(null)
      if (res.success) {
        showToast(tx({ th: 'ส่งซ้ำการแจ้งเตือนสำเร็จแล้ว', en: 'Notification retried successfully', my: 'သတိပေးချက် ပြန်လည်ပေးပို့ပြီးပါပြီ' }), 'success')
        fetchLogs()
      } else {
        showToast(res.error || tx({ th: 'ส่งซ้ำไม่สำเร็จ', en: 'Retry failed', my: 'ပြန်လည်ပေးပို့မှု မအောင်မြင်ပါ' }), 'error')
      }
    })
  }

  const totalPages = Math.ceil(totalCount / pageSize) || 1

  // Summary counts
  const sentCount = logs.filter((l) => l.status === 'sent').length
  const failedCount = logs.filter((l) => l.status === 'failed').length

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/settings/notifications"
              className="text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              {tx({ th: 'การตั้งค่าแจ้งเตือน', en: 'Reminder Settings', my: 'သတိပေးချက် ဆက်တင်များ' })}
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-primary-600" />
            {tx({ th: 'ประวัติการแจ้งเตือน (Notification Logs)', en: 'Notification Logs History', my: 'သတိပေးချက် ပေးပို့မှု မှတ်တမ်း' })}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {tx({ th: 'บันทึกประวัติการส่งแจ้งเตือนค่าเช่าเข้ากลุ่ม LINE ทั้งหมด รายการที่สำเร็จ และรายการที่ส่งไม่สำเร็จ', en: 'Log history of all rent reminders dispatched to LINE groups (successful and failed)', my: 'LINE အဖွဲ့များသို့ ငှားရမ်းခ သတိပေးချက် ပေးပို့မှု မှတ်တမ်းအားလုံး' })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/settings/notifications">
            <Button variant="outline" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              {tx({ th: 'ตั้งค่ารอบแจ้งเตือน', en: 'Reminder Settings', my: 'သတိပေးချက် ဆက်တင်' })}
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => fetchLogs()}
            disabled={isPending}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
            {tx({ th: 'รีเฟรช', en: 'Refresh', my: 'ပြန်ဖွင့်ရန်' })}
          </Button>
        </div>
      </div>

      {/* Filter and Stats Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-sm">
            <button
              onClick={() => handleStatusChange('all')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tx({ th: 'ทั้งหมด', en: 'All', my: 'အားလုံး' })} ({totalCount})
            </button>
            <button
              onClick={() => handleStatusChange('sent')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                statusFilter === 'sent'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {tx({ th: 'ส่งสำเร็จ', en: 'Sent', my: 'အောင်မြင်' })}
            </button>
            <button
              onClick={() => handleStatusChange('failed')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
                statusFilter === 'failed'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {tx({ th: 'ส่งไม่สำเร็จ', en: 'Failed', my: 'မအောင်မြင်' })}
            </button>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">{tx({ th: 'ประเภทสัญญา:', en: 'Contract Type:', my: 'စာချုပ်အမျိုးအစား:' })}</span>
            <select
              value={typeFilter}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-primary-500"
            >
              <option value="all">{tx({ th: 'ทั้งหมด (PAYABLE + RECEIVABLE)', en: 'All (PAYABLE + RECEIVABLE)', my: 'အားလုံး (PAYABLE + RECEIVABLE)' })}</option>
              <option value="PAYABLE">{tx({ th: 'PAYABLE (บริษัทจ่าย)', en: 'PAYABLE (Company pays)', my: 'PAYABLE (ကုမ္ပဏီမှ ပေးရန်)' })}</option>
              <option value="RECEIVABLE">{tx({ th: 'RECEIVABLE (ลูกค้าจ่าย)', en: 'RECEIVABLE (Customer pays)', my: 'RECEIVABLE (ဖောက်သည်မှ ပေးရန်)' })}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">{tx({ th: 'วันและเวลาที่ส่ง', en: 'Sent Date & Time', my: 'ပေးပို့သည့် ရက်စွဲ/အချိန်' })}</th>
                <th className="py-3 px-4">{tx({ th: 'ประเภท', en: 'Type', my: 'အမျိုးအစား' })}</th>
                <th className="py-3 px-4">{tx({ th: 'กลุ่มปลายทาง', en: 'Destination Group', my: 'လက်ခံမည့် အဖွဲ့' })}</th>
                <th className="py-3 px-4">{t.common.status}</th>
                <th className="py-3 px-4">{tx({ th: 'ข้อความตัวอย่าง', en: 'Sample Message', my: 'မက်ဆေ့ခ်ျ နမူနာ' })}</th>
                <th className="py-3 px-4">{tx({ th: 'ข้อผิดพลาด (ถ้ามี)', en: 'Error (if any)', my: 'အမှား (ရှိလျှင်)' })}</th>
                <th className="py-3 px-4 text-right">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isPending ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary-500 mb-2" />
                    {tx({ th: 'กำลังโหลดข้อมูลประวัติ...', en: 'Loading history logs...', my: 'မှတ်တမ်း ဖွင့်နေသည်...' })}
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {tx({ th: 'ไม่พบประวัติการแจ้งเตือนตามเงื่อนไขที่เลือก', en: 'No notification logs match selected criteria', my: 'သတ်မှတ်ချက်နှင့်ကိုက်ညီသော မှတ်တမ်း မရှိပါ' })}
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const destName = log.destination_id
                    ? destMap.get(log.destination_id) || 'กลุ่ม LINE'
                    : tx({ th: 'ไม่ระบุกลุ่ม', en: 'Unassigned Group', my: 'အဖွဲ့ မသတ်မှတ်' })
                  const isSent = log.status === 'sent'
                  const isRetrying = retryingId === log.id

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                        {log.sent_at
                          ? new Date(log.sent_at).toLocaleString(intlLocale, {
                              dateStyle: 'short',
                              timeStyle: 'medium',
                            })
                          : new Date(log.created_at).toLocaleString(intlLocale, {
                              dateStyle: 'short',
                              timeStyle: 'medium',
                            })}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={
                            log.notification_type === 'PAYABLE'
                              ? 'border-rose-200 text-rose-700 bg-rose-50/50'
                              : 'border-teal-200 text-teal-700 bg-teal-50/50'
                          }
                        >
                          {log.notification_type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 max-w-[180px] truncate">
                        {destName}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isSent ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            {tx({ th: 'สำเร็จ', en: 'Sent', my: 'အောင်မြင်' })}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                            <AlertTriangle className="w-3 h-3" />
                            {tx({ th: 'ไม่สำเร็จ', en: 'Failed', my: 'မအောင်မြင်' })}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 max-w-[220px]">
                        <button
                          type="button"
                          onClick={() => setSelectedMessage(log.message)}
                          className="text-left font-mono text-slate-500 hover:text-primary-600 truncate block w-full hover:underline"
                        >
                          {log.message || '-'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-rose-600 font-mono max-w-[200px] truncate">
                        {log.error_message || '-'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {!isSent ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRetry(log.id)}
                            disabled={isRetrying || isPending}
                            className="h-7 text-xs border-rose-200 text-rose-700 hover:bg-rose-50"
                          >
                            {isRetrying ? (
                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            ) : (
                              <RotateCcw className="w-3 h-3 mr-1" />
                            )}
                            {tx({ th: 'ส่งซ้ำ', en: 'Resend', my: 'ပြန်ပို့မည်' })}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedMessage(log.message)}
                            className="h-7 text-xs text-slate-500 hover:text-slate-800"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            {tx({ th: 'ดูข้อความ', en: 'View', my: 'ကြည့်ရန်' })}
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            {tx({ th: 'แสดงหน้า', en: 'Showing page', my: 'စာမျက်နှာ' })} {page} {tx({ th: 'จาก', en: 'of', my: 'မှ' })} {totalPages} ({tx({ th: 'ทั้งหมด', en: 'total', my: 'စုစုပေါင်း' })} {totalCount} {tx({ th: 'รายการ', en: 'items', my: 'ခု' })})
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1 || isPending}
              className="h-8 text-xs"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {tx({ th: 'ก่อนหน้า', en: 'Previous', my: 'ယခင်' })}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || isPending}
              className="h-8 text-xs"
            >
              {tx({ th: 'ถัดไป', en: 'Next', my: 'နောက်တစ်ခု' })}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Message Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary-600" />
                {tx({ th: 'เนื้อหาข้อความแจ้งเตือน (Message Preview)', en: 'Notification Message Preview', my: 'သတိပေးချက် မက်ဆေ့ခ်ျ နမူနာ' })}
              </h3>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕ {t.common.cancel}
              </button>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 max-h-80 overflow-y-auto font-mono text-xs text-slate-800 whitespace-pre-wrap break-all leading-relaxed">
              {selectedMessage}
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => setSelectedMessage(null)}>
                {tx({ th: 'ปิดหน้าต่าง', en: 'Close', my: 'ပိတ်ရန်' })}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
