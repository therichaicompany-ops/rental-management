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
import { useI18n } from '@/lib/i18n/context'
import { Tri } from '@/lib/i18n/tx'

interface ReminderSettingsViewProps {
  initialSettings: ReminderSettings
  destinations: LineDestinationModel[]
}

const AVAILABLE_DAYS: { days: number; label: Tri }[] = [
  { days: 7, label: { th: '7 วันก่อนครบกำหนด', en: '7 days before due date', my: 'သတ်မှတ်ရက် မတိုင်မီ ၇ ရက်' } },
  { days: 3, label: { th: '3 วันก่อนครบกำหนด', en: '3 days before due date', my: 'သတ်မှတ်ရက် မတိုင်မီ ၃ ရက်' } },
  { days: 1, label: { th: '1 วันก่อนครบกำหนด', en: '1 day before due date', my: 'သတ်မှတ်ရက် မတိုင်မီ ၁ ရက်' } },
  { days: 0, label: { th: 'วันครบกำหนดชำระ (Due Date)', en: 'On Due Date', my: 'သတ်မှတ်ရက်နေ့' } },
]

export function ReminderSettingsView({
  initialSettings,
  destinations,
}: ReminderSettingsViewProps) {
  const { t, locale, tx } = useI18n()
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
        showToast(tx({ th: 'บันทึกการตั้งค่าการแจ้งเตือนสำเร็จแล้ว', en: 'Reminder settings saved successfully', my: 'သတိပေးချက် ဆက်တင်များ သိမ်းဆည်းပြီးပါပြီ' }), 'success')
      } else {
        showToast(res.error || tx({ th: 'เกิดข้อผิดพลาดในการบันทึก', en: 'Failed to save settings', my: 'သိမ်းဆည်းရာတွင် အမှားဖြစ်ပွားပါသည်' }), 'error')
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
          `${tx({ th: 'ประมวลผลเสร็จสิ้น: ส่งสำเร็จ', en: 'Run completed: Sent', my: 'ပြီးစီး: ပေးပို့အောင်မြင်' })} ${res.data.sentCount} ${tx({ th: 'รายการ', en: 'items', my: 'ခု' })}`,
          'success'
        )
      } else {
        showToast(res.error || tx({ th: 'เกิดข้อผิดพลาดในการสั่งรันระบบ', en: 'Failed to run reminders', my: 'စနစ် လည်ပတ်ရာတွင် အမှားဖြစ်ပွားပါသည်' }), 'error')
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
              {t.settings.title}
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary-600" />
            {tx({ th: 'ระบบแจ้งเตือนค่าเช่าอัตโนมัติ (Rent Reminder Automation)', en: 'Rent Reminder Automation', my: 'ငှားရမ်းခ အလိုအလျောက် သတိပေးစနစ်' })}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {tx({ th: 'กำหนดเงื่อนไขรอบการแจ้งเตือนสัญญาเช่าล่วงหน้า และเชื่อมโยงส่งข้อความเข้ากลุ่ม LINE', en: 'Configure rent reminder schedules and connect to LINE notification groups', my: 'ငှားရမ်းခ ကြိုတင်သတိပေးချက် နေ့ရက်များနှင့် LINE အဖွဲ့များကို သတ်မှတ်ပါ' })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/notifications">
            <Button variant="outline" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {tx({ th: 'ประวัติการแจ้งเตือน', en: 'Notification History', my: 'သတိပေးချက် မှတ်တမ်း' })}
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
            {tx({ th: 'สั่งรันรอบแจ้งเตือนทันที', en: 'Run Reminder Now', my: 'ယခု ချက်ချင်း ပေးပို့ရန်' })}
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
            {tx({ th: 'บันทึกการตั้งค่า', en: 'Save Settings', my: 'ဆက်တင် သိမ်းဆည်းရန်' })}
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
              <span>{tx({ th: 'สถานะการทำงานของระบบ', en: 'System Operational Status', my: 'စနစ် လုပ်ဆောင်မှု အခြေအနေ' })}</span>
              <Badge
                className={
                  settings.rent_reminder_enabled
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-600'
                }
              >
                {settings.rent_reminder_enabled ? tx({ th: 'เปิดใช้งาน (Enabled)', en: 'Enabled', my: 'ဖွင့်ထားသည်' }) : tx({ th: 'ปิดการทำงาน (Disabled)', en: 'Disabled', my: 'ပိတ်ထားသည်' })}
              </Badge>
            </h2>

            {/* Master Toggle */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-900">
                  {tx({ th: 'เปิดระบบแจ้งเตือนค่าเช่าอัตโนมัติ (Rent Reminder Enabled)', en: 'Enable Rent Reminder Automation', my: 'အလိုအလျောက် ငှားရမ်းခသတိပေးစနစ် ဖွင့်ရန်' })}
                </label>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {tx({ th: 'เมื่อเปิดใช้งาน ระบบจะตรวจสอบรอบครบกำหนดชำระทุกวันและส่งข้อความ Flex Message เข้ากลุ่ม LINE ตามกำหนด', en: 'When enabled, the system checks due dates daily and dispatches Flex Messages to LINE groups.', my: 'ဖွင့်ထားပါက စနစ်သည် နေ့စဉ် သတ်မှတ်ရက်ကို စစ်ဆေးပြီး LINE အဖွဲ့များသို့ Flex Message ပေးပို့ပါမည်။' })}
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
                  {tx({ th: 'แจ้งเตือนรายการเกินกำหนดชำระ (Overdue Reminder Enabled)', en: 'Enable Overdue Rent Reminders', my: 'ရက်လွန် သတိပေးစနစ် ဖွင့်ရန်' })}
                </label>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {tx({ th: 'ส่งข้อความแจ้งเตือนซ้ำสำหรับรายการค่าเช่าที่เลยกำหนดชำระแล้วแต่ยังไม่ได้รับเงิน/ยังไม่ได้จ่าย', en: 'Send recurring alerts for unpaid rents that are past their due dates.', my: 'သတ်မှတ်ရက်ကျော်လွန်သော်လည်း မပေးချေရသေးသော ငှားရမ်းခများကို ထပ်မံသတိပေးပါမည်။' })}
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
              {tx({ th: 'กำหนดรอบวันและเวลาแจ้งเตือน', en: 'Reminder Schedule & Timing', my: 'သတိပေးမည့် ရက်နှင့် အချိန် သတ်မှတ်ချက်' })}
            </h2>

            {/* Reminder Days Checkboxes */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700 block">
                {tx({ th: 'รอบวันแจ้งเตือนล่วงหน้า (เลือกได้หลายข้อ):', en: 'Advance Reminder Intervals (Multi-select):', my: 'ကြိုတင်သတိပေးမည့် နေ့ရက်များ (အများအပြား ရွေးချယ်နိုင်):' })}
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
                      <span className="text-sm">{tx(item.label)}</span>
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                * {tx({ th: 'ค่าเริ่มต้นที่แนะนำ: 7 วัน, 3 วัน, 1 วัน และวันครบกำหนด', en: 'Recommended default: 7 days, 3 days, 1 day, and due date', my: 'အကြံပြုထားသော မူလသတ်မှတ်ချက်: ၇ ရက်၊ ၃ ရက်၊ ၁ ရက် နှင့် သတ်မှတ်ရက်နေ့' })}
              </p>
            </div>

            {/* Time input */}
            <div className="border-t border-slate-100 pt-5 space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                {tx({ th: 'เวลาที่ระบบเริ่มส่งการแจ้งเตือนประจำวัน (Asia/Bangkok):', en: 'Daily Notification Trigger Time (Asia/Bangkok):', my: 'နေ့စဉ် သတိပေးချက် စတင်ပေးပို့မည့်အချိန် (Asia/Bangkok):' })}
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
                  ({tx({ th: 'รอบ Cron อัตโนมัติ: ทุกวัน', en: 'Automated Cron: Daily at', my: 'အလိုအလျောက် Cron: နေ့စဉ်' })} {settings.rent_reminder_time})
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
                {tx({ th: 'กลุ่ม LINE ปลายทาง', en: 'LINE Target Groups', my: 'လက်ခံမည့် LINE အဖွဲ့များ' })}
              </h2>
              <Link
                href="/settings/line"
                className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                {tx({ th: 'จัดการกลุ่ม', en: 'Manage Groups', my: 'အဖွဲ့များ စီမံရန်' })}
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {/* Destination 1: PAYABLE */}
            <div className="p-3.5 rounded-lg border border-rose-100 bg-rose-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <Badge className="bg-rose-100 text-rose-800 border-rose-200">
                  {tx({ th: 'PAYABLE (บริษัทจ่าย)', en: 'PAYABLE (Company pays)', my: 'PAYABLE (ကုမ္ပဏီမှ ပေးရန်)' })}
                </Badge>
                <span className="text-xs text-slate-500">
                  {payableDest?.is_active ? tx({ th: '✅ พร้อมส่ง', en: '✅ Ready', my: '✅ အသင့်ဖြစ်' }) : tx({ th: '⚠️ ปิดอยู่', en: '⚠️ Inactive', my: '⚠️ ပိတ်ထားသည်' })}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-800 truncate">
                {payableDest?.name || tx({ th: 'ยังไม่ได้ตั้งค่ากลุ่ม', en: 'No group configured', my: 'အဖွဲ့ မသတ်မှတ်ရသေး' })}
              </p>
              <p className="text-xs font-mono text-slate-400 truncate">
                {payableDest?.line_group_id || tx({ th: 'ไม่มี Group ID', en: 'No Group ID', my: 'Group ID မရှိပါ' })}
              </p>
            </div>

            {/* Destination 2: RECEIVABLE */}
            <div className="p-3.5 rounded-lg border border-teal-100 bg-teal-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <Badge className="bg-teal-100 text-teal-800 border-teal-200">
                  {tx({ th: 'RECEIVABLE (ลูกค้าจ่าย)', en: 'RECEIVABLE (Customer pays)', my: 'RECEIVABLE (ဖောက်သည်မှ ပေးရန်)' })}
                </Badge>
                <span className="text-xs text-slate-500">
                  {receivableDest?.is_active ? tx({ th: '✅ พร้อมส่ง', en: '✅ Ready', my: '✅ အသင့်ဖြစ်' }) : tx({ th: '⚠️ ปิดอยู่', en: '⚠️ Inactive', my: '⚠️ ပိတ်ထားသည်' })}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-800 truncate">
                {receivableDest?.name || tx({ th: 'ยังไม่ได้ตั้งค่ากลุ่ม', en: 'No group configured', my: 'အဖွဲ့ မသတ်မှတ်ရသေး' })}
              </p>
              <p className="text-xs font-mono text-slate-400 truncate">
                {receivableDest?.line_group_id || tx({ th: 'ไม่มี Group ID', en: 'No Group ID', my: 'Group ID မရှိပါ' })}
              </p>
            </div>

            <div className="pt-2 text-xs text-slate-500 leading-relaxed border-t border-slate-100">
              💡 {tx({ th: 'ข้อความแจ้งเตือนจะถูกส่งแยกเข้ากลุ่มตามประเภทสัญญา หากงวดใดมีสถานะ ชำระแล้ว (Paid) ระบบจะป้องกันไม่ให้ส่งซ้ำอย่างเคร่งครัด', en: 'Alerts are dispatched to separate groups by contract type. Any installment with status Paid is strictly excluded from repeated alerts.', my: 'သတိပေးချက်များကို စာချုပ်အမျိုးအစားအလိုက် ခွဲခြားပေးပို့ပါမည်။ ပေးချေပြီးဖြစ်သော အရစ်များကို ထပ်မံပေးပို့မည် မဟုတ်ပါ။' })}
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
                    {tx({ th: 'ดูประวัติการแจ้งเตือนทั้งหมด', en: 'View All Notification Logs', my: 'သတိပေးချက် မှတ်တမ်းအားလုံး ကြည့်ရန်' })}
                  </p>
                  <p className="text-xs text-slate-500">
                    {tx({ th: 'ตรวจสอบรายการที่ส่งสำเร็จและล้มเหลว', en: 'Inspect successful and failed notification deliveries', my: 'အောင်မြင်ပြီး ကျရှုံးသော ပေးပို့မှုများကို စစ်ဆေးပါ' })}
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
                  {tx({ th: 'ผลการสั่งรันการแจ้งเตือนค่าเช่า', en: 'Rent Reminder Execution Results', my: 'သတိပေးချက် ပေးပို့မှု ရလဒ်များ' })}
                </h3>
              </div>
              <button
                onClick={() => setShowResultModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕ {t.common.cancel}
              </button>
            </div>

            {/* Summary stat cards */}
            <div className="grid grid-cols-4 gap-3 py-2">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-center">
                <p className="text-xs text-slate-500">{tx({ th: 'ตรวจทั้งหมด', en: 'Total Checked', my: 'စစ်ဆေးပြီး စုစုပေါင်း' })}</p>
                <p className="text-xl font-bold text-slate-900">{runResult.totalChecked}</p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-center">
                <p className="text-xs text-emerald-700 font-medium">{tx({ th: 'ส่งสำเร็จ', en: 'Sent', my: 'အောင်မြင်' })}</p>
                <p className="text-xl font-bold text-emerald-700">{runResult.sentCount}</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-center">
                <p className="text-xs text-slate-500">{tx({ th: 'ข้าม (Skipped)', en: 'Skipped', my: 'ကျော်သွားသည်' })}</p>
                <p className="text-xl font-bold text-slate-600">{runResult.skippedCount}</p>
              </div>
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-center">
                <p className="text-xs text-rose-700 font-medium">{tx({ th: 'ล้มเหลว', en: 'Failed', my: 'ကျရှုံး' })}</p>
                <p className="text-xl font-bold text-rose-700">{runResult.failedCount}</p>
              </div>
            </div>

            {/* Details list */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 border border-slate-100 rounded-lg p-3 bg-slate-50/50">
              {runResult.details.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-6">
                  {tx({ th: 'ไม่พบรายการค่าเช่าที่ตรงตามเงื่อนไขส่งการแจ้งเตือน', en: 'No rent items matched reminder dispatch criteria.', my: 'သတိပေးချက် ပေးပို့ရန် သတ်မှတ်ချက်နှင့်ကိုက်ညီသော အချက် မရှိပါ' })}
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
                          {tx({ th: 'ส่งสำเร็จ', en: 'Sent', my: 'အောင်မြင်' })}
                        </Badge>
                      )}
                      {item.status === 'skipped' && (
                        <Badge variant="outline" className="text-slate-500">
                          {tx({ th: 'ข้าม', en: 'Skipped', my: 'ကျော်သွားသည်' })}
                        </Badge>
                      )}
                      {item.status === 'failed' && (
                        <Badge className="bg-rose-100 text-rose-800">
                          {tx({ th: 'ล้มเหลว', en: 'Failed', my: 'ကျရှုံး' })}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button onClick={() => setShowResultModal(false)}>
                {tx({ th: 'ตกลง', en: 'OK', my: 'ကောင်းပြီ' })}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
