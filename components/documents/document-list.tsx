'use client'

import * as React from 'react'
import {
  FileText,
  Trash2,
  Eye,
  Download,
  Loader2,
  FileImage,
  File,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { DocumentPreview } from './document-preview'
import { listDocumentsAction, deleteDocumentAction, getSignedUrlAction } from '@/lib/actions/documents'
import { DOCUMENT_TYPE_LABELS } from '@/lib/types/documents'
import type { DocumentWithUploader, DocumentEntityType } from '@/lib/types/documents'
import type { UserRole } from '@/lib/types/auth'
import { hasFullAccess } from '@/lib/auth/permissions'

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------
function formatBytes(bytes: number | null): string {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function FileIcon({ mimeType }: { mimeType: string | null }) {
  if (mimeType?.startsWith('image/'))
    return <FileImage className="h-5 w-5 text-blue-400 shrink-0" />
  if (mimeType === 'application/pdf')
    return <FileText className="h-5 w-5 text-red-400 shrink-0" />
  return <File className="h-5 w-5 text-slate-400 shrink-0" />
}

// ----------------------------------------------------------------
// Props
// ----------------------------------------------------------------
interface DocumentListProps {
  entityType: DocumentEntityType
  entityId: string
  userRole: UserRole
  initialDocuments?: DocumentWithUploader[]
}

export function DocumentList({
  entityType,
  entityId,
  userRole,
  initialDocuments,
}: DocumentListProps) {
  const [docs, setDocs] = React.useState<DocumentWithUploader[]>(initialDocuments ?? [])
  const [loading, setLoading] = React.useState(!initialDocuments)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null)
  const [previewDoc, setPreviewDoc] = React.useState<DocumentWithUploader | null>(null)
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null)

  const canDelete = hasFullAccess(userRole)

  React.useEffect(() => {
    if (initialDocuments) return
    listDocumentsAction(entityType, entityId).then((res) => {
      if (res.success && res.data) setDocs(res.data)
      setLoading(false)
    })
  }, [entityType, entityId, initialDocuments])

  async function handleDelete() {
    if (!confirmDeleteId) return
    setDeletingId(confirmDeleteId)
    const res = await deleteDocumentAction(confirmDeleteId)
    if (res.success) {
      setDocs((prev) => prev.filter((d) => d.id !== confirmDeleteId))
    }
    setConfirmDeleteId(null)
    setDeletingId(null)
  }

  async function handleDownload(doc: DocumentWithUploader) {
    setDownloadingId(doc.id)
    const res = await getSignedUrlAction(doc.storage_path)
    if (res.success && res.data) {
      const a = document.createElement('a')
      a.href = res.data.url
      a.download = doc.file_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
    setDownloadingId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        กำลังโหลดเอกสาร...
      </div>
    )
  }

  if (docs.length === 0) {
    return <p className="py-4 text-sm text-muted-foreground">ยังไม่มีเอกสาร</p>
  }

  const confirmDoc = docs.find((d) => d.id === confirmDeleteId)

  return (
    <>
      <div className="divide-y divide-border rounded-lg border">
        {docs.map((doc) => (
          <div
            key={doc.id}
            className="flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
          >
            <div className="mt-0.5">
              <FileIcon mimeType={doc.mime_type} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" title={doc.file_name}>
                {doc.file_name}
              </p>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {DOCUMENT_TYPE_LABELS[doc.document_type] ?? doc.document_type}
                </Badge>
                <span>{formatBytes(doc.file_size)}</span>
                <span>{formatDate(doc.created_at)}</span>
                {doc.profiles && (
                  <span className="truncate">โดย {doc.profiles.full_name}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Button
                id={`preview-doc-${doc.id}`}
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                title="ดูตัวอย่าง"
                onClick={() => setPreviewDoc(doc)}
              >
                <Eye className="h-4 w-4" />
              </Button>

              <Button
                id={`download-doc-${doc.id}`}
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                title="ดาวน์โหลด"
                disabled={downloadingId === doc.id}
                onClick={() => handleDownload(doc)}
              >
                {downloadingId === doc.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Button>

              {canDelete && (
                <Button
                  id={`delete-doc-${doc.id}`}
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  title="ลบ"
                  disabled={deletingId === doc.id}
                  onClick={() => setConfirmDeleteId(doc.id)}
                >
                  {deletingId === doc.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Preview dialog */}
      {previewDoc && (
        <DocumentPreview
          open={!!previewDoc}
          onOpenChange={(open) => {
            if (!open) setPreviewDoc(null)
          }}
          fileName={previewDoc.file_name}
          storagePath={previewDoc.storage_path}
          mimeType={previewDoc.mime_type}
        />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => { if (!open) setConfirmDeleteId(null) }}
        title="ลบเอกสาร"
        description={
          confirmDoc
            ? `ต้องการลบไฟล์ "${confirmDoc.file_name}" ใช่หรือไม่? ไม่สามารถกู้คืนได้`
            : 'ต้องการลบเอกสารนี้ใช่หรือไม่?'
        }
        confirmText="ยืนยันลบ"
        cancelText="ยกเลิก"
        variant="danger"
        loading={!!deletingId}
        onConfirm={handleDelete}
      />
    </>
  )
}
