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
import { useI18n } from '@/lib/i18n/context'
import type { Locale } from '@/lib/i18n/types'
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

function formatDate(iso: string, loc: Locale): string {
  const l = loc === 'th' ? 'th-TH' : loc === 'my' ? 'my-MM' : 'en-US'
  return new Date(iso).toLocaleDateString(l, {
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

const DOC_TYPE_TRANSLATIONS: Record<Locale, Record<DocumentType, string>> = {
  th: {
    RENTAL_CONTRACT: 'สัญญาเช่า',
    TRANSFER_SLIP: 'สลิปโอนเงิน',
    MAP: 'แผนที่',
    VAT_DOCUMENT: 'เอกสาร VAT',
    BRANCH_DOCUMENT: 'เอกสารสาขา',
    EMPLOYMENT_DOCUMENT: 'เอกสารแรงงาน',
    SIGNBOARD: 'ป้ายบริษัท',
    PRE_OPEN_DOCUMENT: 'เอกสารก่อนเปิดร้าน',
    OTHER: 'อื่นๆ',
  },
  en: {
    RENTAL_CONTRACT: 'Rental Contract',
    TRANSFER_SLIP: 'Transfer Slip',
    MAP: 'Map',
    VAT_DOCUMENT: 'VAT Document',
    BRANCH_DOCUMENT: 'Branch Document',
    EMPLOYMENT_DOCUMENT: 'Employment Document',
    SIGNBOARD: 'Company Signboard',
    PRE_OPEN_DOCUMENT: 'Pre-opening Document',
    OTHER: 'Other',
  },
  my: {
    RENTAL_CONTRACT: 'ငှားရမ်းမှုစာချုပ်',
    TRANSFER_SLIP: 'ငွေလွှဲပြေစာ',
    MAP: 'မြေပုံ',
    VAT_DOCUMENT: 'အခွန် (VAT) စာရွက်စာတမ်း',
    BRANCH_DOCUMENT: 'ရုံးခွဲ စာရွက်စာတမ်း',
    EMPLOYMENT_DOCUMENT: 'အလုပ်သမား စာရွက်စာတမ်း',
    SIGNBOARD: 'ကုမ္ပဏီဆိုင်းဘုတ်',
    PRE_OPEN_DOCUMENT: 'ဆိုင်မဖွင့်မီ စာရွက်စာတမ်း',
    OTHER: 'အခြား',
  },
}

const ENTITY_TYPE_TRANSLATIONS: Record<Locale, Record<DocumentEntityType, string>> = {
  th: {
    lead: 'งานเช่า (Lead)',
    contract: 'สัญญาเช่า',
    rent_payment: 'ค่าเช่า',
    opening_project: 'เปิดสาขา',
    task: 'งาน',
    customer: 'ลูกค้า',
    location: 'สถานที่',
    payment_transaction: 'ธุรกรรมการเงิน',
  },
  en: {
    lead: 'Rental Lead',
    contract: 'Contract',
    rent_payment: 'Rent Payment',
    opening_project: 'Branch Opening',
    task: 'Task',
    customer: 'Customer',
    location: 'Location',
    payment_transaction: 'Payment Transaction',
  },
  my: {
    lead: 'ငှားရမ်းမှုအလားအလာ (Lead)',
    contract: 'စာချုပ်',
    rent_payment: 'အိမ်ငှားခပေးချေမှု',
    opening_project: 'ဆိုင်ခွဲဖွင့်လှစ်ခြင်း',
    task: 'လုပ်ငန်းတာဝန်',
    customer: 'ဖောက်သည်',
    location: 'နေရာတည်နေရာ',
    payment_transaction: 'ငွေပေးချေမှုမှတ်တမ်း',
  },
}

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
  const { t, locale } = useI18n()
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

  const docTypeTranslations = DOC_TYPE_TRANSLATIONS[locale] || DOC_TYPE_TRANSLATIONS.th
  const entityTypeTranslations = ENTITY_TYPE_TRANSLATIONS[locale] || ENTITY_TYPE_TRANSLATIONS.th

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

  const dateFromLabel = locale === 'th' ? 'วันที่ตั้งแต่' : locale === 'my' ? 'စတင်သည့်ရက်စွဲ' : 'Date From'
  const dateToLabel = locale === 'th' ? 'ถึงวันที่' : locale === 'my' ? 'ပြီးဆုံးသည့်ရက်စွဲ' : 'Date To'
  const allDocTypesLabel = `${t.common.all} ${t.documents.documentType}`
  const allEntitiesLabel = `${t.common.all} Entity`
  const allUploadersLabel = `${t.common.all}`

  // ----------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.documents.title}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {t.documents.subtitle}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border bg-card shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" />
          {t.common.filter}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="doc-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`${t.common.search} ${t.documents.fileName}...`}
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
            <option value="">{allDocTypesLabel}</option>
            {DOCUMENT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {docTypeTranslations[opt.value] ?? opt.label}
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
            <option value="">{allEntitiesLabel}</option>
            {(Object.keys(entityTypeTranslations) as DocumentEntityType[]).map((key) => (
              <option key={key} value={key}>
                {entityTypeTranslations[key]}
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
            <option value="">{allUploadersLabel}</option>
            {uploaderProfiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </select>

          {/* Date from */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">{dateFromLabel}</label>
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
            <label className="text-xs text-muted-foreground mb-1 block">{dateToLabel}</label>
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
                {t.common.reset}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Result count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {loading ? t.common.loading : `${t.common.total} ${filtered.length.toLocaleString()} ${t.common.items}`}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">{t.common.loading}</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <FileText className="h-10 w-10 opacity-30" />
            <p className="text-sm">{locale === 'th' ? 'ไม่พบเอกสาร' : locale === 'my' ? 'စာရွက်စာတမ်း မရှိပါ' : 'No documents found'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t.documents.fileName}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t.documents.documentType}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Entity</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">{t.documents.fileSize}</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">
                    {locale === 'th' ? 'วันที่อัปโหลด' : locale === 'my' ? 'တင်သည့်ရက်စွဲ' : 'Upload Date'}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden xl:table-cell">{t.documents.uploadedBy}</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t.common.actions}</th>
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
                        {docTypeTranslations[doc.document_type] ?? doc.document_type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {entityTypeTranslations[doc.entity_type] ?? doc.entity_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                      {formatBytes(doc.file_size)}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                      {formatDate(doc.created_at, locale)}
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
                          title={locale === 'th' ? 'ดูตัวอย่าง' : locale === 'my' ? 'အစမ်းကြည့်' : 'Preview'}
                          onClick={() => setPreviewDoc(doc)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          id={`center-download-${doc.id}`}
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          title={locale === 'th' ? 'ดาวน์โหลด' : locale === 'my' ? 'ဒေါင်းလုဒ်' : 'Download'}
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
                            title={t.common.delete}
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
        title={t.common.confirmDelete}
        description={
          confirmDeleteId
            ? `${t.common.confirmDeleteDesc} "${docs.find((d) => d.id === confirmDeleteId)?.file_name ?? ''}"`
            : t.common.confirmDeleteDesc
        }
        confirmText={t.common.delete}
        cancelText={t.common.cancel}
        variant="danger"
        loading={!!deletingId}
        onConfirm={() => { if (confirmDeleteId) handleDelete(confirmDeleteId) }}
      />
    </div>
  )
}
