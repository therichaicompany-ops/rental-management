'use client'

import * as React from 'react'
import { Upload, X, CheckCircle, Loader2, File } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { uploadDocumentAction } from '@/lib/actions/documents'
import type { DocumentEntityType, DocumentType } from '@/lib/types/documents'
import { useI18n } from '@/lib/i18n/context'
import { labelOf, DOCUMENT_TYPE_TRI } from '@/lib/i18n/labels'

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'webp']

const DOCUMENT_TYPE_OPTIONS: DocumentType[] = [
  'RENTAL_CONTRACT',
  'TRANSFER_SLIP',
  'MAP',
  'VAT_DOCUMENT',
  'BRANCH_DOCUMENT',
  'EMPLOYMENT_DOCUMENT',
  'SIGNBOARD',
  'PRE_OPEN_DOCUMENT',
  'PASSPORT',
  'VISA',
  'WORK_PERMIT',
  'SMART_CARD',
  'PINK_CARD',
  'OVERSTAY_90_DAYS_NOTICE',
  'ID_CARD',
  'COMPANY_CERTIFICATE',
  'DIRECTOR_ID_CARD',
  'OTHER',
]

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

interface DocumentUploaderProps {
  entityType: DocumentEntityType
  entityId: string
  defaultDocumentType?: DocumentType
  onUploadComplete?: () => void
}

export function DocumentUploader({
  entityType,
  entityId,
  defaultDocumentType = 'OTHER',
  onUploadComplete,
}: DocumentUploaderProps) {
  const { tx, locale } = useI18n()
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [documentType, setDocumentType] = React.useState<DocumentType>(defaultDocumentType)
  const [uploading, setUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setError(null)
    setSuccess(false)

    if (!file) {
      setSelectedFile(null)
      return
    }

    // Client-side validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(tx({ th: 'ไฟล์ต้องไม่เกิน 10 MB', en: 'File size must not exceed 10 MB', my: 'ဖိုင်အရွယ်အစား 10 MB ထက် မကျော်ရပါ' }))
      setSelectedFile(null)
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(tx({ th: 'รองรับเฉพาะ PDF, JPG, PNG, WEBP เท่านั้น', en: 'Only PDF, JPG, PNG, WEBP are supported', my: 'PDF, JPG, PNG, WEBP သာ လက်ခံပါသည်' }))
      setSelectedFile(null)
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    setSelectedFile(file)
  }

  function handleClear() {
    setSelectedFile(null)
    setError(null)
    setSuccess(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleUpload() {
    if (!selectedFile) return
    setUploading(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData()
    formData.set('file', selectedFile)
    formData.set('entity_type', entityType)
    formData.set('entity_id', entityId)
    formData.set('document_type', documentType)

    const res = await uploadDocumentAction(formData)

    if (res.success) {
      setSuccess(true)
      setSelectedFile(null)
      if (inputRef.current) inputRef.current.value = ''
      onUploadComplete?.()
      // Auto-clear success message after 3s
      setTimeout(() => setSuccess(false), 3000)
    } else {
      setError(res.error ?? tx({ th: 'อัปโหลดไม่สำเร็จ', en: 'Upload failed', my: 'ဖိုင်တင်ခြင်း မအောင်မြင်ပါ' }))
    }

    setUploading(false)
  }

  // ---------------------------------------------------------------
  // Drag & Drop
  // ---------------------------------------------------------------
  const [dragging, setDragging] = React.useState(false)

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave() {
    setDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return

    setError(null)
    setSuccess(false)

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(tx({ th: 'ไฟล์ต้องไม่เกิน 10 MB', en: 'File size must not exceed 10 MB', my: 'ဖိုင်အရွယ်အစား 10 MB ထက် မကျော်ရပါ' }))
      return
    }
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(tx({ th: 'รองรับเฉพาะ PDF, JPG, PNG, WEBP เท่านั้น', en: 'Only PDF, JPG, PNG, WEBP are supported', my: 'PDF, JPG, PNG, WEBP သာ လက်ခံပါသည်' }))
      return
    }

    setSelectedFile(file)
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        id="drop-zone"
        tabIndex={0}
        role="button"
        aria-label="Upload file drop zone"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer ${
          dragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={handleFileChange}
        />

        {selectedFile ? (
          <div className="flex items-center gap-3 w-full px-2">
            <File className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">{formatBytes(selectedFile.size)}</p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0"
              onClick={(e) => { e.stopPropagation(); handleClear() }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground/60" />
            <div className="text-center">
              <p className="text-sm font-medium">
                {tx({ th: 'คลิกหรือลากไฟล์มาวาง', en: 'Click or drag file to upload', my: 'ဖိုင်တင်ရန် ဤနေရာတွင် နှိပ်ပါ သို့မဟုတ် ဖိုင်ဆွဲတင်ပါ' })}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {tx({ th: 'PDF, JPG, PNG, WEBP — สูงสุด 10 MB', en: 'PDF, JPG, PNG, WEBP — Max 10 MB', my: 'PDF, JPG, PNG, WEBP — အများဆုံး 10 MB' })}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Document type selector + Upload button */}
      <div className="flex gap-2">
        <select
          id="document-type-select"
          aria-label="Document type"
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value as DocumentType)}
          className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {DOCUMENT_TYPE_OPTIONS.map((val) => (
            <option key={val} value={val}>
              {labelOf(DOCUMENT_TYPE_TRI, val, locale) || val}
            </option>
          ))}
        </select>

        <Button
          id="upload-document-btn"
          disabled={!selectedFile || uploading}
          onClick={handleUpload}
          className="gap-1.5 shrink-0"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {tx({ th: 'กำลังอัปโหลด...', en: 'Uploading...', my: 'ဖိုင်တင်နေသည်...' })}
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              {tx({ th: 'อัปโหลด', en: 'Upload', my: 'ဖိုင်တင်မည်' })}
            </>
          )}
        </Button>
      </div>

      {/* Error / Success messages */}
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1.5">
          <X className="h-4 w-4" />
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-emerald-500 flex items-center gap-1.5">
          <CheckCircle className="h-4 w-4" />
          {tx({ th: 'อัปโหลดเรียบร้อย', en: 'Upload successful', my: 'ဖိုင်တင်ခြင်း အောင်မြင်ပါသည်' })}
        </p>
      )}
    </div>
  )
}
