'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  MessageSquare,
  Plus,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Edit,
  ExternalLink,
  ShieldAlert,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import type {
  LineDestinationModel,
  NotificationLogModel,
  LineGroupType,
} from '@/lib/types/line'
import {
  createLineDestinationAction,
  updateLineDestinationAction,
  deleteLineDestinationAction,
  testSendLineMessageAction,
} from '@/lib/actions/line'

interface LineSettingsViewProps {
  destinations: LineDestinationModel[]
  logs: NotificationLogModel[]
  userRole: string
  baseUrl: string
}

export function LineSettingsView({
  destinations,
  logs,
  userRole,
  baseUrl,
}: LineSettingsViewProps) {
  const router = useRouter()
  const [isPending, setIsPending] = React.useState(false)
  const [actionError, setActionError] = React.useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = React.useState<string | null>(null)
  const [copiedWebhook, setCopiedWebhook] = React.useState(false)

  // Dialog States
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [editingDest, setEditingDest] = React.useState<LineDestinationModel | null>(null)
  const [deletingDestId, setDeletingDestId] = React.useState<string | null>(null)
  const [testingDestId, setTestingDestId] = React.useState<string | null>(null)

  // Form State
  const [formName, setFormName] = React.useState('')
  const [formGroupId, setFormGroupId] = React.useState('')
  const [formGroupType, setFormGroupType] = React.useState<LineGroupType>('PAYABLE')
  const [formIsActive, setFormIsActive] = React.useState(true)

  const webhookUrl = `${baseUrl}/api/line/webhook`

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopiedWebhook(true)
    setTimeout(() => setCopiedWebhook(false), 2000)
  }

  const handleOpenAdd = () => {
    setFormName('')
    setFormGroupId('')
    setFormGroupType('PAYABLE')
    setFormIsActive(true)
    setActionError(null)
    setIsAddOpen(true)
  }

  const handleOpenEdit = (dest: LineDestinationModel) => {
    setEditingDest(dest)
    setFormName(dest.name.replace(/^\[(PAYABLE|RECEIVABLE)\]\s*/, ''))
    setFormGroupId(dest.line_group_id)
    setFormGroupType((dest.group_category || dest.destination_type || 'PAYABLE') as LineGroupType)
    setFormIsActive(dest.is_active)
    setActionError(null)
  }

  const handleSaveDestination = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formGroupId.trim()) return

    setIsPending(true)
    setActionError(null)

    if (editingDest) {
      const res = await updateLineDestinationAction(editingDest.id, {
        name: formName.trim(),
        line_group_id: formGroupId.trim(),
        group_type: formGroupType,
        is_active: formIsActive,
      })
      setIsPending(false)
      if (res.success) {
        setEditingDest(null)
        setActionSuccess('บันทึกการเปลี่ยนแปลงกลุ่ม LINE สำเร็จ')
        router.refresh()
      } else {
        setActionError(res.error || 'เกิดข้อผิดพลาดในการแก้ไขกลุ่ม')
      }
    } else {
      const res = await createLineDestinationAction({
        name: formName.trim(),
        line_group_id: formGroupId.trim(),
        group_type: formGroupType,
        is_active: formIsActive,
      })
      setIsPending(false)
      if (res.success) {
        setIsAddOpen(false)
        setActionSuccess('เพิ่มกลุ่ม LINE ใหม่สำเร็จ')
        router.refresh()
      } else {
        setActionError(res.error || 'เกิดข้อผิดพลาดในการเพิ่มกลุ่ม')
      }
    }
  }

  const handleDeleteDestination = async () => {
    if (!deletingDestId) return
    setIsPending(true)
    const res = await deleteLineDestinationAction(deletingDestId)
    setIsPending(false)
    setDeletingDestId(null)
    if (res.success) {
      setActionSuccess('ลบกลุ่มเรียบร้อยแล้ว')
      router.refresh()
    } else {
      setActionError(res.error || 'ไม่สามารถลบกลุ่มได้')
    }
  }

  const handleTestSend = async (dest: LineDestinationModel) => {
    if (!dest.line_group_id || !dest.line_group_id.trim()) {
      setActionError('ห้ามส่งจริงถ้าไม่มี Group ID')
      return
    }

    setTestingDestId(dest.id)
    setActionError(null)
    setActionSuccess(null)

    const testType = dest.group_category === 'RECEIVABLE' ? 'RECEIVABLE' : 'PAYABLE'
    const res = await testSendLineMessageAction(dest.id, testType)

    setTestingDestId(null)
    if (res.success) {
      setActionSuccess(`ส่งข้อความ Flex Message ทดสอบไปยังกลุ่ม "${dest.name}" สำเร็จเรียบร้อย! 🎉`)
      router.refresh()
    } else {
      setActionError(res.error || 'เกิดข้อผิดพลาดในการส่งข้อความ LINE')
    }
  }

  const payableDests = destinations.filter(
    (d) => d.group_category === 'PAYABLE' || d.name.includes('[PAYABLE]')
  )
  const receivableDests = destinations.filter(
    (d) => d.group_category === 'RECEIVABLE' || d.name.includes('[RECEIVABLE]')
  )
  const otherDests = destinations.filter(
    (d) => !payableDests.includes(d) && !receivableDests.includes(d)
  )

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/settings"
          className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          กลับไปหน้าตั้งค่าระบบ
        </Link>

        <Button
          onClick={handleOpenAdd}
          className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          เพิ่มกลุ่ม LINE
        </Button>
      </div>

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                ตั้งค่าระบบ LINE Messaging API
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                กำหนดกลุ่ม LINE รับการแจ้งเตือนค่าเช่าแยกตามประเภท PAYABLE (บริษัทจ่าย) และ RECEIVABLE (ลูกค้าจ่าย)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-slate-50 text-slate-700 text-xs px-2.5 py-1">
              กลุ่มทั้งหมด: {destinations.length}
            </Badge>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs px-2.5 py-1">
              ใช้งานอยู่: {destinations.filter((d) => d.is_active).length}
            </Badge>
          </div>
        </div>

        {/* Webhook Configuration Box */}
        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50/80 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-blue-500" />
                LINE Webhook URL (นำลิงก์นี้ไปใส่ใน LINE Developers Console):
              </span>
              <div className="font-mono text-xs text-slate-800 bg-white px-3 py-1.5 rounded border border-slate-200 break-all select-all">
                {webhookUrl}
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyWebhook}
              className="shrink-0 text-xs"
            >
              {copiedWebhook ? (
                <>
                  <Check className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                  คัดลอกแล้ว
                </>
              ) : (
                <>
                  <Copy className="mr-1 h-3.5 w-3.5" />
                  คัดลอก Webhook URL
                </>
              )}
            </Button>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            💡 <strong>วิธีนำบอทเข้ากลุ่ม:</strong> เมื่อเชิญ LINE OA บอทเข้ากลุ่ม LINE ระบบจะบันทึก Group ID เข้าหน้านี้ให้อัตโนมัติ หรือพิมพ์คำว่า <code className="text-primary-700 bg-white px-1 py-0.5 rounded border border-slate-200">#id</code> ในกลุ่มเพื่อดู Group ID
          </p>
        </div>
      </div>

      {/* Action Alerts */}
      {actionError && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-xs underline text-rose-600">
            ปิด
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-xs underline text-emerald-600">
            ปิด
          </button>
        </div>
      )}

      {/* Section 1: PAYABLE Groups */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 bg-rose-50/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className="bg-rose-100 text-rose-800 border-rose-200 font-semibold text-xs">
              PAYABLE
            </Badge>
            <h2 className="text-sm font-bold text-slate-800">
              กลุ่มแจ้งเตือน: บริษัทจ่ายค่าเช่า (Payable)
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            {payableDests.length} กลุ่ม
          </span>
        </div>

        {payableDests.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            ยังไม่มีกลุ่มสำหรับแจ้งเตือนบริษัทจ่ายค่าเช่า กรุณากดปุ่ม <strong>"เพิ่มกลุ่ม LINE"</strong> ด้านบน
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {payableDests.map((dest) => (
              <DestinationRow
                key={dest.id}
                dest={dest}
                isTesting={testingDestId === dest.id}
                onTestSend={() => handleTestSend(dest)}
                onEdit={() => handleOpenEdit(dest)}
                onDelete={() => setDeletingDestId(dest.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Section 2: RECEIVABLE Groups */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 bg-emerald-50/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className="bg-teal-100 text-teal-800 border-teal-200 font-semibold text-xs">
              RECEIVABLE
            </Badge>
            <h2 className="text-sm font-bold text-slate-800">
              กลุ่มแจ้งเตือน: ลูกค้าจ่ายค่าเช่า (Receivable)
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            {receivableDests.length} กลุ่ม
          </span>
        </div>

        {receivableDests.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            ยังไม่มีกลุ่มสำหรับแจ้งเตือนลูกค้าจ่ายค่าเช่า กรุณากดปุ่ม <strong>"เพิ่มกลุ่ม LINE"</strong> ด้านบน
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {receivableDests.map((dest) => (
              <DestinationRow
                key={dest.id}
                dest={dest}
                isTesting={testingDestId === dest.id}
                onTestSend={() => handleTestSend(dest)}
                onEdit={() => handleOpenEdit(dest)}
                onDelete={() => setDeletingDestId(dest.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Section 3: Other / Unassigned Groups */}
      {otherDests.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">
              กลุ่มที่ตรวจพบจากบอท (ยังไม่ได้จัดหมวดหมู่)
            </h2>
            <span className="text-xs text-slate-500">{otherDests.length} กลุ่ม</span>
          </div>
          <div className="divide-y divide-slate-100">
            {otherDests.map((dest) => (
              <DestinationRow
                key={dest.id}
                dest={dest}
                isTesting={testingDestId === dest.id}
                onTestSend={() => handleTestSend(dest)}
                onEdit={() => handleOpenEdit(dest)}
                onDelete={() => setDeletingDestId(dest.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Section 4: Notification Logs History */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              ประวัติการส่งข้อความแจ้งเตือน (Notification Logs)
            </h2>
            <p className="text-xs text-slate-500">
              บันทึกผลการส่งข้อความผ่าน LINE API ล่าสุด
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.refresh()}
            className="text-xs text-slate-500 hover:text-slate-800"
          >
            <RefreshCw className="mr-1 h-3.5 w-3.5" />
            รีเฟรช
          </Button>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            ยังไม่มีประวัติการส่งข้อความในระบบ (ลองกดปุ่ม "ทดสอบส่ง LINE" เพื่อทดสอบได้ครับ)
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">วันที่ / เวลา</th>
                  <th className="py-2.5 px-4">ประเภท</th>
                  <th className="py-2.5 px-4">สถานะ</th>
                  <th className="py-2.5 px-4">รายละเอียดข้อความ</th>
                  <th className="py-2.5 px-4">ข้อผิดพลาด (ถ้ามี)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">
                      {log.sent_at || log.created_at
                        ? new Date(log.sent_at || log.created_at).toLocaleString('th-TH', {
                            dateStyle: 'short',
                            timeStyle: 'medium',
                          })
                        : log.notification_date}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-semibold text-slate-700">
                        {log.notification_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      {log.status === 'sent' ? (
                        <span className="inline-flex items-center text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-200/60">
                          <CheckCircle2 className="mr-1 h-3 w-3" /> สำเร็จ
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-medium border border-rose-200/60">
                          <XCircle className="mr-1 h-3 w-3" /> ล้มเหลว
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 max-w-xs truncate">
                      {log.message || '-'}
                    </td>
                    <td className="py-2.5 px-4 text-rose-600 font-mono text-[11px] max-w-xs truncate">
                      {log.error_message || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Destination Modal */}
      <Dialog
        open={isAddOpen || Boolean(editingDest)}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddOpen(false)
            setEditingDest(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {editingDest ? 'แก้ไขกลุ่ม LINE' : 'เพิ่มกลุ่ม LINE ปลายทาง'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              กำหนด Group ID และหมวดหมู่การแจ้งเตือนค่าเช่า
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveDestination} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ชื่อกลุ่ม <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                placeholder="เช่น กลุ่มแจ้งเตือนค่าเช่าบริษัท (บัญชี)"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                LINE Group ID <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                placeholder="ขึ้นต้นด้วย C... เช่น C8923a10..."
                value={formGroupId}
                onChange={(e) => setFormGroupId(e.target.value)}
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Group ID สามารถดูได้จากข้อความตอบกลับของบอทเมื่อดึงเข้ากลุ่ม หรือพิมพ์ <code className="bg-slate-100 px-1 rounded">#id</code> ในกลุ่ม
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ประเภทกลุ่มการแจ้งเตือน <span className="text-rose-500">*</span>
              </label>
              <Select
                value={formGroupType}
                onChange={(e) => setFormGroupType(e.target.value as LineGroupType)}
              >
                <option value="PAYABLE">PAYABLE — บริษัทจ่ายค่าเช่า (ผู้ให้เช่า/เจ้าของ)</option>
                <option value="RECEIVABLE">RECEIVABLE — ลูกค้าจ่ายค่าเช่า (ผู้เช่า)</option>
              </Select>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="formIsActive"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="formIsActive" className="text-xs font-medium text-slate-700 cursor-pointer">
                เปิดใช้งานการส่งแจ้งเตือนไปยังกลุ่มนี้ (Active)
              </label>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddOpen(false)
                  setEditingDest(null)
                }}
                disabled={isPending}
              >
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-primary-600 hover:bg-primary-700 text-white"
              >
                {isPending ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deletingDestId)}
        onOpenChange={(open) => {
          if (!open) setDeletingDestId(null)
        }}
        title="ยืนยันการลบกลุ่ม LINE"
        description="คุณแน่ใจหรือไม่ว่าต้องการลบกลุ่มนี้? ระบบจะไม่สามารถส่งข้อความแจ้งเตือนไปยังกลุ่มนี้ได้อีก"
        confirmText="ลบกลุ่ม"
        onConfirm={handleDeleteDestination}
        loading={isPending}
      />
    </div>
  )
}

function DestinationRow({
  dest,
  isTesting,
  onTestSend,
  onEdit,
  onDelete,
}: {
  dest: LineDestinationModel
  isTesting: boolean
  onTestSend: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const isPayable = dest.group_category === 'PAYABLE' || dest.name.includes('[PAYABLE]')
  const cleanName = dest.name.replace(/^\[(PAYABLE|RECEIVABLE)\]\s*/, '')
  const hasGroupId = Boolean(dest.line_group_id && dest.line_group_id.trim())

  return (
    <div className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50/60 transition-colors">
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900 text-xs truncate">
            {cleanName}
          </span>
          {dest.is_active ? (
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-medium">
              เปิดใช้งาน
            </span>
          ) : (
            <span className="text-[10px] bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded font-medium">
              ปิดใช้งาน
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
          <span>Group ID:</span>
          {hasGroupId ? (
            <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 select-all">
              {dest.line_group_id}
            </span>
          ) : (
            <span className="text-rose-500 font-sans italic">
              ไม่มี Group ID (ห้ามส่งจริง)
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Test Send Button: Rule: "ห้ามส่งจริงถ้าไม่มี Group ID" */}
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!hasGroupId || !dest.is_active || isTesting}
          onClick={onTestSend}
          title={!hasGroupId ? 'ห้ามส่งจริงถ้าไม่มี Group ID' : 'ทดสอบส่งข้อความ Flex Message'}
          className={`text-xs h-8 ${
            isPayable
              ? 'hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300'
              : 'hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300'
          }`}
        >
          <Send className="mr-1.5 h-3.5 w-3.5" />
          {isTesting ? 'กำลังส่ง...' : 'ทดสอบส่ง LINE'}
        </Button>

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onEdit}
          className="text-xs h-8 px-2 text-slate-600 hover:text-slate-900"
        >
          <Edit className="h-3.5 w-3.5" />
        </Button>

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onDelete}
          className="text-xs h-8 px-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
