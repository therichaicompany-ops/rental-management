import * as React from 'react'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ActiveProject } from '@/lib/actions/dashboard'

const STATUS_LABELS: Record<string, string> = {
  not_started: 'ยังไม่เริ่ม',
  in_progress: 'กำลังดำเนินการ',
  on_hold: 'พักไว้',
  ready_to_open: 'พร้อมเปิด',
  opened: 'เปิดแล้ว',
  cancelled: 'ยกเลิก',
}

const STATUS_COLORS: Record<string, string> = {
  not_started: 'bg-slate-50 text-slate-600 border-slate-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  on_hold: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  ready_to_open: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  opened: 'bg-violet-50 text-violet-700 border-violet-200',
  cancelled: 'bg-slate-50 text-slate-400 border-slate-100',
}

function formatDate(s: string | null): string {
  if (!s) return '-'
  return new Date(s).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  })
}

interface OpeningSummaryTableProps {
  projects: ActiveProject[]
}

export function OpeningSummaryTable({ projects }: OpeningSummaryTableProps) {
  if (projects.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        ไม่มีโครงการเปิดสาขาที่กำลังดำเนินการ
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">โครงการ</th>
            <th className="px-3 py-2.5 text-left font-medium text-muted-foreground hidden md:table-cell">Stage ปัจจุบัน</th>
            <th className="px-3 py-2.5 text-left font-medium text-muted-foreground hidden lg:table-cell">วันเปิดร้าน</th>
            <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">ความคืบหน้า</th>
            <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">สถานะ</th>
            <th className="px-3 py-2.5"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {projects.map((p) => {
            const pct =
              p.total_tasks > 0
                ? Math.round((p.completed_tasks / p.total_tasks) * 100)
                : 0
            const color = STATUS_COLORS[p.status] ?? STATUS_COLORS.not_started
            return (
              <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-3 py-2.5">
                  <p className="font-medium truncate max-w-[160px]">{p.location_name || '-'}</p>
                  <p className="text-xs text-muted-foreground">{p.project_no}</p>
                </td>
                <td className="px-3 py-2.5 hidden md:table-cell text-muted-foreground text-xs">
                  {p.current_stage_name ?? '-'}
                </td>
                <td className="px-3 py-2.5 hidden lg:table-cell text-muted-foreground">
                  {formatDate(p.target_open_date)}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-full max-w-[80px] h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {p.completed_tasks}/{p.total_tasks}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <Badge variant="outline" className={`text-[10px] ${color}`}>
                    {STATUS_LABELS[p.status] ?? p.status}
                  </Badge>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <Link
                    href={`/opening/${p.id}`}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
