'use client'

import * as React from 'react'
import {
  FileText,
  FileImage,
  Upload,
  X,
  Eye,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Building,
  User,
  Globe,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { DocumentPreview } from '@/components/documents/document-preview'
import {
  listDocumentsAction,
  deleteDocumentAction,
  getSignedUrlAction,
} from '@/lib/actions/documents'
import {
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
  type DocumentType,
  type DocumentWithUploader,
} from '@/lib/types/documents'
import type { UserRole } from '@/lib/types/auth'
import { hasFullAccess, canWrite } from '@/lib/auth/permissions'

export type CustomerCategory = 'company' | 'thai_individual' | 'foreigner_individual'

export interface DocumentSlotConfig {
  type: DocumentType
  title: string
  subTitle: string
  required: boolean
}

export const FOREIGNER_DOCUMENT_SLOTS: DocumentSlotConfig[] = [
  {
    type: 'PASSPORT',
    title: '1. หน้าพาสปอร์ต',
    subTitle: 'สำเนา/รูปถ่ายหน้าข้อมูลหนังสือเดินทาง (Passport)',
    required: true,
  },
  {
    type: 'VISA',
    title: '2. หน้าวีซ่า',
    subTitle: 'สำเนา/รูปถ่ายหน้าวีซ่าที่ได้รับการประทับตราอนุญาตให้อยู่ในราชอาณาจักร',
    required: true,
  },
  {
    type: 'WORK_PERMIT',
    title: '3. ใบอนุญาตทำงาน Work permit',
    subTitle: 'สำเนา/รูปถ่ายใบอนุญาตทำงานในประเทศไทย (หน้าข้อมูลและวันหมดอายุ)',
    required: true,
  },
  {
    type: 'SMART_CARD',
    title: '4. Smart card (ถ้ามี)',
    subTitle: 'บัตรประจำตัวคนต่างด้าวอิเล็กทรอนิกส์ หรือบัตร Smart Card',
    required: false,
  },
  {
    type: 'PINK_CARD',
    title: '5. บัตรประจำตัวคนซึ่งไม่มีสัญชาติไทย (บัตรชมพู) (ถ้ามี)',
    subTitle: 'บัตรประจำตัวบุคคลไม่มีสถานะทางทะเบียน (บัตรสีชมพู)',
    required: false,
  },
  {
    type: 'OVERSTAY_90_DAYS_NOTICE',
    title: '6. ใบรับแจ้งการอยู่เกิน 90 วัน ของคนต่างด่าว (ถ้ามี)',
    subTitle: 'ใบรับแจ้งการอยู่เกินกว่า 90 วัน จากสำนักงานตรวจคนเข้าเมือง (ตม.47)',
    required: false,
  },
]

export const THAI_DOCUMENT_SLOTS: DocumentSlotConfig[] = [
  {
    type: 'ID_CARD',
    title: '1. สำเนาบัตรประชาชน',
    subTitle: 'สำเนาบัตรประจำตัวประชาชน พร้อมลงลายมือชื่อรับรองสำเนาถูกต้อง',
    required: true,
  },
]

export const COMPANY_DOCUMENT_SLOTS: DocumentSlotConfig[] = [
  {
    type: 'COMPANY_CERTIFICATE',
    title: '1. หนังสือรับรองบริษัท',
    subTitle: 'หนังสือรับรองการจดทะเบียนนิติบุคคลจากกรมพัฒนาธุรกิจการค้า (อายุไม่เกิน 3-6 เดือน)',
    required: true,
  },
  {
    type: 'DIRECTOR_ID_CARD',
    title: '2. สำเนาบัตรประชาชนกรรมการ',
    subTitle: 'สำเนาบัตรประจำตัวประชาชนของกรรมการผู้มีอำนาจลงนาม พร้อมลงนามรับรองสำเนาถูกต้อง',
    required: true,
  },
]

export const OTHER_DOCUMENT_SLOT: DocumentSlotConfig = {
  type: 'OTHER',
  title: 'เอกสารแนบอื่นๆ (ถ้ามี)',
  subTitle: 'เอกสารเพิ่มเติม เช่น สัญญาเช่าเดิม, หนังสือมอบอำนาจ, ทะเบียนบ้าน ฯลฯ',
  required: false,
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

interface CustomerDocumentSlotsProps {
  category: CustomerCategory
  customerId?: string
  stagedFiles: Record<string, File[]>
  onStagedFilesChange: (files: Record<string, File[]>) => void
  missingSlots: DocumentType[]
  userRole: UserRole
  disabled?: boolean
}

export function CustomerDocumentSlots({
  category,
  customerId,
  stagedFiles,
  onStagedFilesChange,
  missingSlots,
  userRole,
  disabled = false,
}: CustomerDocumentSlotsProps) {
  const allowEdit = canWrite(userRole) && !disabled
  const allowDelete = hasFullAccess(userRole)

  // Existing uploaded documents fetched from DB
  const [existingDocs, setExistingDocs] = React.useState<DocumentWithUploader[]>([])
  const [loadingDocs, setLoadingDocs] = React.useState(Boolean(customerId))

  // Preview & delete dialog state
  const [previewDoc, setPreviewDoc] = React.useState<{
    fileName: string
    storagePath: string
    mimeType: string | null
  } | null>(null)
  const [deleteDocId, setDeleteDocId] = React.useState<string | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Fetch existing documents if customerId is present
  React.useEffect(() => {
    if (!customerId) {
      setExistingDocs([])
      setLoadingDocs(false)
      return
    }

    let active = true
    setLoadingDocs(true)

    listDocumentsAction('customer', customerId).then((res) => {
      if (active && res.success && res.data) {
        setExistingDocs(res.data)
      }
      if (active) setLoadingDocs(false)
    })

    return () => {
      active = false
    }
  }, [customerId])

  // Get active slots based on category
  const activeSlots = React.useMemo(() => {
    switch (category) {
      case 'company':
        return [...COMPANY_DOCUMENT_SLOTS, OTHER_DOCUMENT_SLOT]
      case 'thai_individual':
        return [...THAI_DOCUMENT_SLOTS, OTHER_DOCUMENT_SLOT]
      case 'foreigner_individual':
        return [...FOREIGNER_DOCUMENT_SLOTS, OTHER_DOCUMENT_SLOT]
    }
  }, [category])

  // Count required slots and how many are satisfied
  const requiredSlots = activeSlots.filter((s) => s.required)
  const satisfiedCount = requiredSlots.filter((s) => {
    const hasStaged = (stagedFiles[s.type]?.length ?? 0) > 0
    const hasExisting = existingDocs.some((d) => d.document_type === s.type)
    return hasStaged || hasExisting
  }).length

  const allRequiredFilled = satisfiedCount === requiredSlots.length

  // Add files to a slot
  const handleAddFiles = (type: DocumentType, newFiles: FileList | File[]) => {
    const validFiles: File[] = []
    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i]
      if (file.size > MAX_FILE_SIZE_BYTES) {
        alert(`ไฟล์ ${file.name} มีขนาดเกิน 10 MB`)
        continue
      }
      const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        alert(`ไฟล์ ${file.name} นามสกุลไม่รองรับ (รองรับ PDF, JPG, PNG, WEBP)`)
        continue
      }
      validFiles.push(file)
    }

    if (validFiles.length > 0) {
      const current = stagedFiles[type] || []
      onStagedFilesChange({
        ...stagedFiles,
        [type]: [...current, ...validFiles],
      })
    }
  }

  // Remove a staged file
  const handleRemoveStagedFile = (type: DocumentType, index: number) => {
    const current = stagedFiles[type] || []
    const updated = current.filter((_, i) => i !== index)
    onStagedFilesChange({
      ...stagedFiles,
      [type]: updated,
    })
  }

  // Confirm delete of existing document from database
  const handleConfirmDelete = async () => {
    if (!deleteDocId) return
    setIsDeleting(true)
    const res = await deleteDocumentAction(deleteDocId)
    if (res.success) {
      setExistingDocs((prev) => prev.filter((d) => d.id !== deleteDocId))
    } else {
      alert(res.error || 'ลบเอกสารไม่สำเร็จ')
    }
    setIsDeleting(false)
    setDeleteDocId(null)
  }

  // Download existing document
  const handleDownloadExisting = async (doc: DocumentWithUploader) => {
    const res = await getSignedUrlAction(doc.storage_path)
    if (res.success && res.data) {
      const a = document.createElement('a')
      a.href = res.data.url
      a.download = doc.file_name
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } else {
      alert(res.error || 'ไม่สามารถดาวน์โหลดไฟล์ได้')
    }
  }

  return (
    <div className="space-y-4">
      {/* Header & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary-600" />
            <h3 className="text-sm font-bold text-slate-900">
              {category === 'foreigner_individual' && 'เอกสารข้อมูลลูกค้า (ชาวต่างชาติ)'}
              {category === 'thai_individual' && 'เอกสารข้อมูลลูกค้า (บุคคลธรรมดาสัญชาติไทย)'}
              {category === 'company' && 'เอกสารข้อมูลลูกค้า (นิติบุคคล / บริษัท)'}
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {category === 'foreigner_individual' &&
              'แนบไฟล์เอกสารข้อ 1-3 จำเป็นต้องแนบไฟล์ (พาสปอร์ต, วีซ่า, Work permit)'}
            {category === 'thai_individual' &&
              'แนบไฟล์เอกสารประจำตัวบุคคล (จำเป็นต้องแนบสำเนาบัตรประชาชน)'}
            {category === 'company' &&
              'แนบไฟล์เอกสารการจดทะเบียนนิติบุคคล (จำเป็นต้องแนบหนังสือรับรองบริษัท และบัตรประชาชนกรรมการ)'}
          </p>
        </div>

        {/* Completeness Badge */}
        {requiredSlots.length > 0 && (
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border shrink-0 ${
              allRequiredFilled
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}
          >
            {allRequiredFilled ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>เอกสารจำเป็น: ครบถ้วน ({satisfiedCount}/{requiredSlots.length})</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span>
                  เอกสารจำเป็น: ยังขาดอีก {requiredSlots.length - satisfiedCount} รายการ (แนบแล้ว{' '}
                  {satisfiedCount}/{requiredSlots.length})
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {loadingDocs && (
        <div className="flex items-center justify-center p-6 text-xs text-slate-500 gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary-500" />
          <span>กำลังโหลดข้อมูลเอกสาร...</span>
        </div>
      )}

      {/* Document Slots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeSlots.map((slot) => {
          const slotStaged = stagedFiles[slot.type] || []
          const slotExisting = existingDocs.filter((d) => d.document_type === slot.type)
          const totalFiles = slotStaged.length + slotExisting.length
          const isMissing = missingSlots.includes(slot.type)
          const isSatisfied = totalFiles > 0

          return (
            <div
              key={slot.type}
              className={`rounded-xl border p-4 transition-all bg-white flex flex-col justify-between ${
                isMissing
                  ? 'border-rose-400 bg-rose-50/20 ring-2 ring-rose-200'
                  : isSatisfied
                  ? 'border-emerald-200 shadow-sm'
                  : 'border-slate-200 shadow-sm hover:border-slate-300'
              }`}
            >
              {/* Slot Header */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h4 className="text-xs font-bold text-slate-900 leading-snug flex items-center gap-1.5">
                    {slot.type === 'PASSPORT' && <Globe className="h-4 w-4 text-sky-600 shrink-0" />}
                    {slot.type === 'VISA' && <FileCheck className="h-4 w-4 text-indigo-600 shrink-0" />}
                    {slot.type === 'WORK_PERMIT' && <User className="h-4 w-4 text-amber-600 shrink-0" />}
                    {slot.type === 'ID_CARD' && <User className="h-4 w-4 text-primary-600 shrink-0" />}
                    {slot.type === 'COMPANY_CERTIFICATE' && <Building className="h-4 w-4 text-indigo-600 shrink-0" />}
                    {slot.type === 'DIRECTOR_ID_CARD' && <User className="h-4 w-4 text-primary-600 shrink-0" />}
                    <span>{slot.title}</span>
                  </h4>
                  {slot.required ? (
                    isSatisfied ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                        ✓ แนบแล้ว
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 whitespace-nowrap">
                        จำเป็นต้องแนบ *
                      </span>
                    )
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                      {isSatisfied ? '✓ แนบแล้ว' : 'ถ้ามี'}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 mb-3">{slot.subTitle}</p>

                {/* Validation error hint */}
                {isMissing && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold mb-2.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>จำเป็นต้องแนบไฟล์เอกสารนี้</span>
                  </div>
                )}

                {/* List of existing uploaded documents */}
                {slotExisting.length > 0 && (
                  <div className="space-y-1.5 mb-2.5">
                    {slotExisting.map((doc) => {
                      const isImage = doc.mime_type?.startsWith('image/')
                      const isPdf = doc.mime_type === 'application/pdf'

                      return (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/60 border border-emerald-200 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0 mr-2">
                            {isImage ? (
                              <FileImage className="h-4 w-4 text-emerald-600 shrink-0" />
                            ) : isPdf ? (
                              <FileText className="h-4 w-4 text-red-500 shrink-0" />
                            ) : (
                              <FileText className="h-4 w-4 text-slate-500 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 truncate" title={doc.file_name}>
                                {doc.file_name}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {formatBytes(doc.file_size)} • อัปโหลดแล้ว
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-slate-600 hover:text-slate-900"
                              title="ดูตัวอย่าง"
                              onClick={() =>
                                setPreviewDoc({
                                  fileName: doc.file_name,
                                  storagePath: doc.storage_path,
                                  mimeType: doc.mime_type,
                                })
                              }
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-slate-600 hover:text-slate-900"
                              title="ดาวน์โหลด"
                              onClick={() => handleDownloadExisting(doc)}
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                            {allowDelete && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                title="ลบไฟล์นี้"
                                onClick={() => setDeleteDocId(doc.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* List of newly staged files (to be uploaded on submit) */}
                {slotStaged.length > 0 && (
                  <div className="space-y-1.5 mb-2.5">
                    {slotStaged.map((file, idx) => {
                      const isImage = file.type.startsWith('image/')
                      const isPdf = file.type === 'application/pdf'

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-sky-50 border border-sky-200 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0 mr-2">
                            {isImage ? (
                              <FileImage className="h-4 w-4 text-sky-600 shrink-0" />
                            ) : isPdf ? (
                              <FileText className="h-4 w-4 text-red-500 shrink-0" />
                            ) : (
                              <FileText className="h-4 w-4 text-slate-500 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 truncate" title={file.name}>
                                {file.name}
                              </p>
                              <p className="text-[10px] text-sky-700">
                                {formatBytes(file.size)} • พร้อมอัปโหลดเมื่อกดบันทึก
                              </p>
                            </div>
                          </div>

                          {allowEdit && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                              title="ยกเลิกไฟล์นี้"
                              onClick={() => handleRemoveStagedFile(slot.type, idx)}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Upload Input Area */}
              {allowEdit && (
                <div className="pt-2">
                  <label className="flex items-center justify-center gap-2 p-2.5 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-primary-400 hover:bg-primary-50/20 transition-all text-center group">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleAddFiles(slot.type, e.target.files)
                          e.target.value = ''
                        }
                      }}
                    />
                    <Upload className="h-3.5 w-3.5 text-slate-400 group-hover:text-primary-600 transition-colors" />
                    <span className="text-xs font-semibold text-slate-600 group-hover:text-primary-700 transition-colors">
                      {totalFiles > 0 ? '+ แนบไฟล์เพิ่ม' : 'คลิกเพื่อเลือกไฟล์แนบ'}
                    </span>
                  </label>
                  <p className="text-[10px] text-slate-400 text-center mt-1">
                    PDF, JPG, PNG, WEBP (สูงสุด 10 MB)
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={Boolean(deleteDocId)}
        onOpenChange={(open) => !open && setDeleteDocId(null)}
        title="ยืนยันการลบไฟล์เอกสาร"
        description="คุณแน่ใจหรือไม่ว่าต้องการลบไฟล์นี้ออกจากระบบ? การดำเนินการนี้ไม่สามารถกู้คืนได้"
        confirmText="ลบไฟล์"
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
      />

      {/* Preview Modal */}
      {previewDoc && (
        <DocumentPreview
          open={Boolean(previewDoc)}
          onOpenChange={(open) => !open && setPreviewDoc(null)}
          fileName={previewDoc.fileName}
          storagePath={previewDoc.storagePath}
          mimeType={previewDoc.mimeType}
        />
      )}
    </div>
  )
}
