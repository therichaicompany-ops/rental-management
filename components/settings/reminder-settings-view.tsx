'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Bell,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Play,
  Save,
  ArrowLeft,
  MessageSquare,
  ShieldAlert,
  Loader2,
  ExternalLink,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  type ReminderSettings,
  type ReminderRunResult,
} from '@/lib/types/reminder'
import type { LineDestinationModel } from '@/lib/types/line'
import {
  saveReminderSettingsAction,
  runRentReminderNowAction,
} from '@/lib/actions/reminder'
import { useToast } from '@/components/ui/toast'

interface ReminderSettingsViewProps {
  initialSettings: ReminderSettings
  destinations: LineDestinationModel[]
}

const AVAILABLE_DAYS = [
  { days: 7, label: '7 วันก่อนครบกำหนด' },
  { days: 3, label: '3 วันก่อนครบกำหนด' },
  { days: 1, label: '1 วันก่อนครบกำหนด' },
  { days: 0, label: 'วันครบกำหนดชำระ (Due Date)' },
]

export function ReminderSettingsView({
  initialSettings,
  destinations,
}: ReminderSettingsViewProps) {
  const [settings, setSettings] = useState<ReminderSettings>(initialSettings)
  const [isPending, startTransition] = useTransition()
  const [isRunning, startRunTransition] = useTransition()
  const [runResult, setRunResult] = useState<ReminderRunResult | null>(null)
  const [showResultModal, setShowResultModal] = useState(false)
  const { showToast } = useToast()

  // Find destinations
  const payableDest =
    destinations.find(
      (d) => d.destination_type === 'PAYABLE' || d.name.includes('[PAYABLE]')
    ) || destinations[0]

  const receivableDest =
    destinations.find(
      (d) => d.destination_type === 'RECEIVABLE' || d.name.includes('[RECEIVABLE]')
    ) || destinations[1] || destinations[0]

  const handleToggleDay = (days: number) => {
    setSettings((prev) => {
      const exists = prev.rent_reminder_days.includes(days)
      const updated = exists
        ? prev.rent_reminder_days.filter((d) => d !== days)
        : [...prev.rent_reminder_days, days].sort((a, b) => b - a)
      return { ...prev, rent_reminder_days: updated }
    })
  }

  const handleSave = () => {
    startTransition(async () => {
      const res = await saveReminderSettingsAction(settings)
      if (res.success) {
        showToast('บันทึกการตั้งค่าการแจ้งเตือนสำเร็จแล้ว', 'success')
      } else {
        showToast(res.error || 'เกิดข้อผิดพลาดในการบันทึก', 'error')
      }
    })
  }

  const handleRunNow = () => {
    startRunTransition(async () => {
      const res = await runRentReminderNowAction()
      if (res.success && res.data) {
        setRunResult(res.data)
        setShowResultModal(true)
        showToast(
          `ประมวลผลเสร็จสิ้น: ส่งสำเร็จ ${res.data.sentCount} รายการ`,
          'success'
        )
      } else {
        showToast(res.error || 'เกิดข้อผิดพลาดในการสั่งรันระบบ', 'error')
      }
    })
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/settings"
              className="text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              การตั้งค่า
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary-600" />
            ระบบแจ้งเตือนค่าเช่าอัตโนมัติ (Rent Reminder Automation)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            กำหนดเงื่อนไขรอบการแจ้งเตือนสัญญาเช่าล่วงหน้า และเชื่อมโยงส่งข้อความเข้ากลุ่ม LINE
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/notifications">
            <Button variant="outline" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              ประวัติการแจ้งเตือน
            </Button>
          </Link>
          <Button
            onClick={handleRunNow}
            disabled={isRunning || isPending}
            variant="outline"
            className="border-primary-200 text-primary-700 hover:bg-primary-50 flex items-center gap-2"
          >
            {isRunning ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
            ) : (
              <Play className="w-4 h-4 text-primary-600 fill-primary-600" />
            )}
            สั่งรันรอบแจ้งเตือนทันที
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending || isRunning}
            className="bg-primary-600 hover:bg-primary-700 text-white flex items-center gap-2"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            บันทึกการตั้งค่า
          </Button>
        </div>
      </div>

      {/* Grid Settings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Settings - 2 Columns */}
        <div className="md:col-span-2 space-y-6">
          {/* Card 1: Master Toggle & Overdue */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>สถานะการทำงานของระบบ</span>
              <Badge
                className={
                  settings.rent_reminder_enabled
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-600'
                }
              >
                {settings.rent_reminder_enabled ? 'เปิดใช้งาน (Enabled)' : 'ปิดการทำงาน (Disabled)'}
              </Badge>
            </h2>

            {/* Master Toggle */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-900">
                  เปิดระบบแจ้งเตือนค่าเช่าอัตโนมัติ (Rent Reminder Enabled)
                </label>
                <p className="text-xs text-slate-500 leading-relaxed">
                  เมื่อเปิดใช้งาน ระบบจะตรวจสอบรอบครบกำหนดชำระทุกวันและส่งข้อความ Flex Message
                  เข้ากลุ่ม LINE ตามกำหนด
                </p>
              </div>
              <Switch
                checked={settings.rent_reminder_enabled}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, rent_reminder_enabled: checked }))
                }
              />
            </div>

            <div className="border-t border-slate-100 pt-5 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-900 flex items-center gap-1.5 text-rose-700">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  แจ้งเตือนรายการเกินกำหนดชำระ (Overdue Reminder Enabled)
                </label>
                <p className="text-xs text-slate-500 leading-relaxed">
                  ส่งข้อความแจ้งเตือนซ้ำสำหรับรายการค่าเช่าที่เลยกำหนดชำระแล้วแต่ยังไม่ได้รับเงิน/ยังไม่ได้จ่าย
                </p>
              </div>
              <Switch
                checked={settings.overdue_reminder_enabled}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, overdue_reminder_enabled: checked }))
                }
              />
            </div>
          </div>

          {/* Card 2: Schedule & Days */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            <h2 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              กำหนดรอบวันและเวลาแจ้งเตือน
            </h2>

            {/* Reminder Days Checkboxes */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700 block">
                รอบวันแจ้งเตือนล่วงหน้า (เลือกได้หลายข้อ):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AVAILABLE_DAYS.map((item) => {
                  const isChecked = settings.rent_reminder_days.includes(item.days)
                  return (
                    <button
                      key={item.days}
                      type="button"
                      onClick={() => handleToggleDay(item.days)}
                      className={`flex items-center gap-3 p-3.5 rounded-lg border text-left transition-all ${
                        isChecked
                          ? 'border-primary-500 bg-primary-50/50 text-primary-900 font-medium shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                          isChecked
                            ? 'bg-primary-600 border-primary-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-sm">{item.label}</span>
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                * ค่าเริ่มต้นที่แนะนำ: 7 วัน, 3 วัน, 1 วัน และวันครบกำหนด
              </p>
            </div>

            {/* Time input */}
            <div className="border-t border-slate-100 pt-5 space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                เวลาที่ระบบเริ่มส่งการแจ้งเตือนประจำวัน (Asia/Bangkok):
              </label>
              <div className="flex items-center gap-3 max-w-xs">
                <Input
                  type="time"
                  value={settings.rent_reminder_time}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, rent_reminder_time: e.target.value }))
                  }
                  className="w-36 font-mono text-center text-base"
                />
                <span className="text-xs text-slate-500">
                  (รอบ Cron อัตโนมัติ: ทุกวัน {settings.rent_reminder_time} น.)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: LINE Destinations Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                กลุ่ม LINE ปลายทาง
              </h2>
              <Link
                href="/settings/line"
                className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                จัดการกลุ่ม
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {/* Destination 1: PAYABLE */}
            <div className="p-3.5 rounded-lg border border-rose-100 bg-rose-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <Badge className="bg-rose-100 text-rose-800 border-rose-200">
                  PAYABLE (บริษัทจ่าย)
                </Badge>
                <span className="text-xs text-slate-500">
                  {payableDest?.is_active ? '✅ พร้อมส่ง' : '⚠️ ปิดอยู่'}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-800 truncate">
                {payableDest?.name || 'ยังไม่ได้ตั้งค่ากลุ่ม'}
              </p>
              <p className="text-xs font-mono text-slate-400 truncate">
                {payableDest?.line_group_id || 'ไม่มี Group ID'}
              </p>
            </div>

            {/* Destination 2: RECEIVABLE */}
            <div className="p-3.5 rounded-lg border border-teal-100 bg-teal-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <Badge className="bg-teal-100 text-teal-800 border-teal-200">
                  RECEIVABLE (ลูกค้าจ่าย)
                </Badge>
                <span className="text-xs text-slate-500">
                  {receivableDest?.is_active ? '✅ พร้อมส่ง' : '⚠️ ปิดอยู่'}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-800 truncate">
                {receivableDest?.name || 'ยังไม่ได้ตั้งค่ากลุ่ม'}
              </p>
              <p className="text-xs font-mono text-slate-400 truncate">
                {receivableDest?.line_group_id || 'ไม่มี Group ID'}
              </p>
            </div>

            <div className="pt-2 text-xs text-slate-500 leading-relaxed border-t border-slate-100">
              💡 ข้อความแจ้งเตือนจะถูกส่งแยกเข้ากลุ่มตามประเภทสัญญา หากงวดใดมีสถานะ <b>ชำระแล้ว (Paid)</b> ระบบจะป้องกันไม่ให้ส่งซ้ำอย่างเคร่งครัด
            </div>
          </div>

          {/* Quick link to logs */}
          <Link
            href="/notifications"
            className="block p-4 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white hover:border-slate-300 transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary-100 text-primary-700">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    ดูประวัติการแจ้งเตือนทั้งหมด
                  </p>
                  <p className="text-xs text-slate-500">
                    ตรวจสอบรายการที่ส่งสำเร็จและล้มเหลว
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* Execution Results Modal */}
      {showResultModal && runResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  ผลการสั่งรันการแจ้งเตือนค่าเช่า
                </h3>
              </div>
              <button
                onClick={() => setShowResultModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕ ปิด
              </button>
            </div>

            {/* Summary stat cards */}
            <div className="grid grid-cols-4 gap-3 py-2">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-center">
                <p className="text-xs text-slate-500">ตรวจทั้งหมด</p>
                <p className="text-xl font-bold text-slate-900">{runResult.totalChecked}</p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-center">
                <p className="text-xs text-emerald-700 font-medium">ส่งสำเร็จ</p>
                <p className="text-xl font-bold text-emerald-700">{runResult.sentCount}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-center">
                <p className="text-xs text-slate-500">ข้าม (Skipped)</p>
                <p className="text-xl font-bold text-slate-600">{runResult.skippedCount}</p>
              </div>
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-center">
                <p className="text-xs text-rose-700 font-medium">ล้มเหลว</p>
                <p className="text-xl font-bold text-rose-700">{runResult.failedCount}</p>
              </div>
            </div>

            {/* Details list */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 border border-slate-100 rounded-lg p-3 bg-slate-50/50">
              {runResult.details.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-6">
                  ไม่พบรายการค่าเช่าที่ตรงตามเงื่อนไขส่งการแจ้งเตือน
                </p>
              ) : (
                runResult.details.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-md bg-white border border-slate-200 text-xs flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">
                          {item.contractNo}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            item.paymentType === 'PAYABLE'
                              ? 'text-rose-700 border-rose-200'
                              : 'text-teal-700 border-teal-200'
                          }
                        >
                          {item.paymentType}
                        </Badge>
                        <span className="text-slate-400 font-mono">
                          Due: {item.dueDate}
                        </span>
                      </div>
                      <p className="text-slate-500 mt-0.5 truncate">
                        {item.reason}
                      </p>
                    </div>
                    <div>
                      {item.status === 'sent' && (
                        <Badge className="bg-emerald-100 text-emerald-800">
                          ส่งสำเร็จ
                        </Badge>
                      )}
                      {item.status === 'skipped' && (
                        <Badge variant="outline" className="text-slate-500">
                          ข้าม
                        </Badge>
                      )}
                      {item.status === 'failed' && (
                        <Badge className="bg-rose-100 text-rose-800">
                          ล้มเหลว
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button onClick={() => setShowResultModal(false)}>
                ตกลง
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
