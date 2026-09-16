'use client'

import * as React from 'react'
import { Upload, X, File, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { uploadDocumentAction } from '@/lib/actions/documents'
import {
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
  DOCUMENT_TYPE_OPTIONS,
  type DocumentEntityType,
  type DocumentType,
} from '@/lib/types/documents'

// ----------------------------------------------------------------
// Props
// ----------------------------------------------------------------
interface DocumentUploaderProps {
  entityType: DocumentEntityType
  entityId: string
  /** Called after a successful upload so the parent can refresh the list */
  onUploadComplete?: () => void
  defaultDocumentType?: DocumentType
}

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------
export function DocumentUploader({
  entityType,
  entityId,
  onUploadComplete,
  defaultDocumentType = 'OTHER',
}: DocumentUploaderProps) {
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
      setError('ไฟล์ต้องไม่เกิน 10 MB')
      setSelectedFile(null)
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError('รองรับเฉพาะ PDF, JPG, PNG, WEBP เท่านั้น')
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
      setError(res.error ?? 'อัปโหลดไม่สำเร็จ')
    }

    setUploading(false)
  }

  // ---------------------------------------------------------------
  // Drag & Drop
  // ---------------------------------------------------------------
  const [dragging, setDragging] = React.useState(false)

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    // Trigger same validation via synthetic event
    const dt = new DataTransfer()
    dt.items.add(file)
    if (inputRef.current) {
      inputRef.current.files = dt.files
      inputRef.current.dispatchEvent(new Event('change', { bubbles: true }))
    }
  }

  function formatBytes(b: number) {
    if (b < 1024) return `${b} B`
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
    return `${(b / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        className={[
          'relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 transition-colors cursor-pointer',
          dragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30',
          selectedFile ? 'border-primary/50 bg-primary/5' : '',
        ].join(' ')}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
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
              <p className="text-sm font-medium">คลิกหรือลากไฟล์มาวาง</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                PDF, JPG, PNG, WEBP — สูงสุด 10 MB
              </p>
            </div>
          </>
        )}
      </div>

      {/* Document type selector + Upload button */}
      <div className="flex gap-2">
        <select
          id="document-type-select"
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value as DocumentType)}
          className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {DOCUMENT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
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
              กำลังอัปโหลด...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              อัปโหลด
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
          อัปโหลดเรียบร้อย
        </p>
      )}
    </div>
  )
}
