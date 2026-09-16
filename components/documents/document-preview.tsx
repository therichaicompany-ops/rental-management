'use client'

import * as React from 'react'
import { X, Download, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { getSignedUrlAction } from '@/lib/actions/documents'

interface DocumentPreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fileName: string
  storagePath: string
  mimeType: string | null
}

export function DocumentPreview({
  open,
  onOpenChange,
  fileName,
  storagePath,
  mimeType,
}: DocumentPreviewProps) {
  const [url, setUrl] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) {
      setUrl(null)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    getSignedUrlAction(storagePath).then((res) => {
      if (cancelled) return
      if (res.success && res.data) {
        setUrl(res.data.url)
      } else {
        setError(res.error ?? 'โหลดไม่สำเร็จ')
      }
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [open, storagePath])

  const isImage = mimeType?.startsWith('image/') ?? false
  const isPdf = mimeType === 'application/pdf'

  function handleDownload() {
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between pr-8">
          <DialogTitle className="truncate max-w-[70%] text-sm font-medium">
            {fileName}
          </DialogTitle>
          {url && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
              className="shrink-0 gap-1.5"
            >
              <Download className="h-4 w-4" />
              ดาวน์โหลด
            </Button>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden rounded-md bg-slate-950 min-h-0">
          {loading && (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          )}

          {error && (
            <div className="flex h-64 items-center justify-center text-red-400 text-sm">
              {error}
            </div>
          )}

          {!loading && !error && url && isPdf && (
            <iframe
              src={url}
              className="w-full h-[70vh] rounded"
              title={fileName}
            />
          )}

          {!loading && !error && url && isImage && (
            <div className="flex items-center justify-center p-4 h-[70vh] overflow-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={fileName}
                className="max-w-full max-h-full object-contain rounded"
              />
            </div>
          )}

          {!loading && !error && url && !isPdf && !isImage && (
            <div className="flex h-64 flex-col items-center justify-center gap-4 text-slate-400">
              <X className="h-10 w-10 opacity-40" />
              <p className="text-sm">ไม่สามารถแสดงตัวอย่างได้</p>
              <Button size="sm" variant="secondary" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1.5" />
                ดาวน์โหลดแทน
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
