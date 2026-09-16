'use client'

import * as React from 'react'
import {
  Search,
  Filter,
  X,
  FileText,
  FileImage,
  File,
  Eye,
  Download,
  Loader2,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { DocumentPreview } from '@/components/documents/document-preview'
import {
  listAllDocumentsAction,
  deleteDocumentAction,
  getSignedUrlAction,
} from '@/lib/actions/documents'
import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPE_OPTIONS,
  ENTITY_TYPE_LABELS,
  type DocumentWithUploader,
  type DocumentEntityType,
  type DocumentType,
} from '@/lib/types/documents'
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
  })
}

function FileIcon({ mimeType }: { mimeType: string | null }) {
  if (mimeType?.startsWith('image/'))
    return <FileImage className="h-4 w-4 text-blue-400 shrink-0" />
  if (mimeType === 'application/pdf')
    return <FileText className="h-4 w-4 text-red-400 shrink-0" />
  return <File className="h-4 w-4 text-slate-400 shrink-0" />
}

const ENTITY_TYPE_OPTIONS: { value: DocumentEntityType; label: string }[] = [
  { value: 'lead', label: ENTITY_TYPE_LABELS.lead },
  { value: 'contract', label: ENTITY_TYPE_LABELS.contract },
  { value: 'rent_payment', label: ENTITY_TYPE_LABELS.rent_payment },
  { value: 'opening_project', label: ENTITY_TYPE_LABELS.opening_project },
  { value: 'task', label: ENTITY_TYPE_LABELS.task },
  { value: 'customer', label: ENTITY_TYPE_LABELS.customer },
  { value: 'location', label: ENTITY_TYPE_LABELS.location },
  { value: 'payment_transaction', label: ENTITY_TYPE_LABELS.payment_transaction },
]

// ----------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------
interface DocumentCenterViewProps {
  userRole: UserRole
  uploaderProfiles: { id: string; full_name: string }[]
}

export function DocumentCenterView({
  userRole,
  uploaderProfiles,
}: DocumentCenterViewProps) {
  const canDelete = hasFullAccess(userRole)

  // ---- State ----
  const [docs, setDocs] = React.useState<DocumentWithUploader[]>([])
  const [loading, setLoading] = React.useState(true)

  // Filters
  const [search, setSearch] = React.useState('')
  const [filterDocType, setFilterDocType] = React.useState<DocumentType | ''>('')
  const [filterEntityType, setFilterEntityType] = React.useState<DocumentEntityType | ''>('')
  const [filterUploadedBy, setFilterUploadedBy] = React.useState('')
  const [filterDateFrom, setFilterDateFrom] = React.useState('')
  const [filterDateTo, setFilterDateTo] = React.useState('')

  // Actions
  const [previewDoc, setPreviewDoc] = React.useState<DocumentWithUploader | null>(null)
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null)

  // ---- Fetch ----
  React.useEffect(() => {
    setLoading(true)
    listAllDocumentsAction({
      document_type: filterDocType || undefined,
      entity_type: filterEntityType || undefined,
      uploaded_by: filterUploadedBy || undefined,
      date_from: filterDateFrom || undefined,
      date_to: filterDateTo || undefined,
    }).then((res) => {
      if (res.success && res.data) setDocs(res.data)
      setLoading(false)
    })
  }, [filterDocType, filterEntityType, filterUploadedBy, filterDateFrom, filterDateTo])

  // ---- Client-side search ----
  const filtered = React.useMemo(() => {
    if (!search.trim()) return docs
    const q = search.toLowerCase()
    return docs.filter(
      (d) =>
        d.file_name.toLowerCase().includes(q) ||
        d.profiles?.full_name.toLowerCase().includes(q)
    )
  }, [docs, search])

  // ---- Actions ----
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

  async function handleDelete(id: string) {
    setDeletingId(id)
    const res = await deleteDocumentAction(id)
    if (res.success) {
      setDocs((prev) => prev.filter((d) => d.id !== id))
    }
    setDeletingId(null)
    setConfirmDeleteId(null)
  }

  function clearFilters() {
    setSearch('')
    setFilterDocType('')
    setFilterEntityType('')
    setFilterUploadedBy('')
    setFilterDateFrom('')
    setFilterDateTo('')
  }

  const hasActiveFilters = !!(
    search || filterDocType || filterEntityType || filterUploadedBy || filterDateFrom || filterDateTo
  )

  // ----------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Document Center</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            จัดการเอกสารทั้งหมดในระบบ
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-card shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" />
          ตัวกรอง
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="doc-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อไฟล์..."
              className="pl-9"
            />
          </div>

          {/* Document type */}
          <select
            id="filter-doc-type"
            value={filterDocType}
            onChange={(e) => setFilterDocType(e.target.value as DocumentType | '')}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">ทุกประเภทเอกสาร</option>
            {DOCUMENT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Entity type */}
          <select
            id="filter-entity-type"
            value={filterEntityType}
            onChange={(e) => setFilterEntityType(e.target.value as DocumentEntityType | '')}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">ทุก Entity</option>
            {ENTITY_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Uploaded by */}
          <select
            id="filter-uploaded-by"
            value={filterUploadedBy}
            onChange={(e) => setFilterUploadedBy(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">ทุกคน</option>
            {uploaderProfiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </select>

          {/* Date from */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">วันที่ตั้งแต่</label>
            <input
              id="filter-date-from"
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Date to */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">ถึงวันที่</label>
            <input
              id="filter-date-to"
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <div className="flex items-end">
              <Button
                id="clear-filters-btn"
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
                ล้างตัวกรอง
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Result count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {loading ? 'กำลังโหลด...' : `พบ ${filtered.length.toLocaleString()} รายการ`}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">กำลังโหลดเอกสาร...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <FileText className="h-10 w-10 opacity-30" />
            <p className="text-sm">ไม่พบเอกสาร</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">ชื่อไฟล์</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">ประเภทเอกสาร</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Entity</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">ขนาด</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">วันที่อัปโหลด</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden xl:table-cell">ผู้อัปโหลด</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((doc) => (
                  <tr key={doc.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileIcon mimeType={doc.mime_type} />
                        <span className="truncate max-w-[200px] font-medium" title={doc.file_name}>
                          {doc.file_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-[11px]">
                        {DOCUMENT_TYPE_LABELS[doc.document_type] ?? doc.document_type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {ENTITY_TYPE_LABELS[doc.entity_type] ?? doc.entity_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                      {formatBytes(doc.file_size)}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                      {formatDate(doc.created_at)}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell text-muted-foreground truncate max-w-[160px]">
                      {doc.profiles?.full_name ?? '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          id={`center-preview-${doc.id}`}
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="ดูตัวอย่าง"
                          onClick={() => setPreviewDoc(doc)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          id={`center-download-${doc.id}`}
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
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
                            id={`center-delete-${doc.id}`}
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preview dialog */}
      {previewDoc && (
        <DocumentPreview
          open={!!previewDoc}
          onOpenChange={(open) => { if (!open) setPreviewDoc(null) }}
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
          confirmDeleteId
            ? `ต้องการลบไฟล์ "${docs.find((d) => d.id === confirmDeleteId)?.file_name ?? ''}" ใช่หรือไม่? ไม่สามารถกู้คืนได้`
            : 'ต้องการลบเอกสารนี้ใช่หรือไม่?'
        }
        confirmText="ยืนยันลบ"
        cancelText="ยกเลิก"
        variant="danger"
        loading={!!deletingId}
        onConfirm={() => { if (confirmDeleteId) handleDelete(confirmDeleteId) }}
      />
    </div>
  )
}
