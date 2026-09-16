'use client'

import * as React from 'react'
import { FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { DocumentUploader } from './document-uploader'
import { DocumentList } from './document-list'
import type { DocumentEntityType, DocumentType } from '@/lib/types/documents'
import type { UserRole } from '@/lib/types/auth'
import { canWrite } from '@/lib/auth/permissions'

interface DocumentSectionProps {
  entityType: DocumentEntityType
  entityId: string
  userRole: UserRole
  defaultDocumentType?: DocumentType
  /** Whether to show uploader (viewers cannot upload) */
  title?: string
  defaultOpen?: boolean
}

export function DocumentSection({
  entityType,
  entityId,
  userRole,
  defaultDocumentType,
  title = 'เอกสารแนบ',
  defaultOpen = true,
}: DocumentSectionProps) {
  const [open, setOpen] = React.useState(defaultOpen)
  const [refreshKey, setRefreshKey] = React.useState(0)
  const allowUpload = canWrite(userRole)

  function handleUploadComplete() {
    // Force DocumentList to re-fetch by changing key
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      {/* Header */}
      <button
        type="button"
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition-colors rounded-xl"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">{title}</span>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t">
          {allowUpload && (
            <div className="pt-4">
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                อัปโหลดเอกสารใหม่
              </p>
              <DocumentUploader
                entityType={entityType}
                entityId={entityId}
                defaultDocumentType={defaultDocumentType}
                onUploadComplete={handleUploadComplete}
              />
            </div>
          )}

          <div className={allowUpload ? 'pt-2 border-t' : 'pt-4'}>
            {allowUpload && (
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                รายการเอกสาร
              </p>
            )}
            <DocumentList
              key={refreshKey}
              entityType={entityType}
              entityId={entityId}
              userRole={userRole}
            />
          </div>
        </div>
      )}
    </div>
  )
}
