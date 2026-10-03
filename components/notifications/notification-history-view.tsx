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
        showToast('ส่งซ้ำการแจ้งเตือนสำเร็จแล้ว', 'success')
        fetchLogs()
      } else {
        showToast(res.error || 'ส่งซ้ำไม่สำเร็จ', 'error')
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
              การตั้งค่าแจ้งเตือน
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-primary-600" />
            ประวัติการแจ้งเตือน (Notification Logs)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            บันทึกประวัติการส่งแจ้งเตือนค่าเช่าเข้ากลุ่ม LINE ทั้งหมด รายการที่สำเร็จ และรายการที่ส่งไม่สำเร็จ
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/settings/notifications">
            <Button variant="outline" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              ตั้งค่ารอบแจ้งเตือน
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => fetchLogs()}
            disabled={isPending}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
            รีเฟรช
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
              ทั้งหมด ({totalCount})
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
              ส่งสำเร็จ
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
              ส่งไม่สำเร็จ
            </button>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">ประเภทสัญญา:</span>
            <select
              value={typeFilter}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-primary-500"
            >
              <option value="all">ทั้งหมด (PAYABLE + RECEIVABLE)</option>
              <option value="PAYABLE">PAYABLE (บริษัทจ่าย)</option>
              <option value="RECEIVABLE">RECEIVABLE (ลูกค้าจ่าย)</option>
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
                <th className="py-3 px-4">วันและเวลาที่ส่ง</th>
                <th className="py-3 px-4">ประเภท</th>
                <th className="py-3 px-4">กลุ่มปลายทาง</th>
                <th className="py-3 px-4">สถานะ</th>
                <th className="py-3 px-4">ข้อความตัวอย่าง</th>
                <th className="py-3 px-4">ข้อผิดพลาด (ถ้ามี)</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isPending ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary-500 mb-2" />
                    กำลังโหลดข้อมูลประวัติ...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    ไม่พบประวัติการแจ้งเตือนตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const destName = log.destination_id
                    ? destMap.get(log.destination_id) || 'กลุ่ม LINE'
                    : 'ไม่ระบุกลุ่ม'
                  const isSent = log.status === 'sent'
                  const isRetrying = retryingId === log.id

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                        {log.sent_at
                          ? new Date(log.sent_at).toLocaleString('th-TH', {
                              dateStyle: 'short',
                              timeStyle: 'medium',
                            })
                          : new Date(log.created_at).toLocaleString('th-TH', {
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
                            สำเร็จ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                            <AlertTriangle className="w-3 h-3" />
                            ไม่สำเร็จ
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
                            ส่งซ้ำ
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedMessage(log.message)}
                            className="h-7 text-xs text-slate-500 hover:text-slate-800"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            ดูข้อความ
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
            แสดงหน้า {page} จาก {totalPages} (ทั้งหมด {totalCount} รายการ)
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
              ก่อนหน้า
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages || isPending}
              className="h-8 text-xs"
            >
              ถัดไป
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
                เนื้อหาข้อความแจ้งเตือน (Message Preview)
              </h3>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕ ปิด
              </button>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 max-h-80 overflow-y-auto font-mono text-xs text-slate-800 whitespace-pre-wrap break-all leading-relaxed">
              {selectedMessage}
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => setSelectedMessage(null)}>
                ปิดหน้าต่าง
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
