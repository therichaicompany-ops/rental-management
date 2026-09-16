import * as React from 'react'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { RecentPayment } from '@/lib/actions/dashboard'

const STATUS_LABELS: Record<string, string> = {
  pending: 'รอชำระ',
  partial: 'ชำระบางส่วน',
  overdue: 'ค้างชำระ',
  paid: 'ชำระแล้ว',
  cancelled: 'ยกเลิก',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  partial: 'bg-blue-50 text-blue-700 border-blue-200',
  overdue: 'bg-red-50 text-red-700 border-red-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-slate-50 text-slate-500 border-slate-200',
}

function formatBaht(n: number): string {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

function formatDate(s: string): string {
  if (!s) return '-'
  return new Date(s).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  })
}

interface RentSummaryTableProps {
  payments: RecentPayment[]
}

export function RentSummaryTable({ payments }: RentSummaryTableProps) {
  if (payments.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        ไม่มีรายการค่าเช่าที่รอชำระ
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">สถานที่</th>
            <th className="px-3 py-2.5 text-left font-medium text-muted-foreground hidden sm:table-cell">ประเภท</th>
            <th className="px-3 py-2.5 text-left font-medium text-muted-foreground hidden md:table-cell">ครบกำหนด</th>
            <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">ค้างชำระ (฿)</th>
            <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">สถานะ</th>
            <th className="px-3 py-2.5 text-center font-medium text-muted-foreground hidden lg:table-cell"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {payments.map((p) => {
            const color = STATUS_COLORS[p.status] ?? STATUS_COLORS.pending
            return (
              <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-3 py-2.5">
                  <p className="font-medium truncate max-w-[160px]">{p.location_name || '-'}</p>
                  <p className="text-xs text-muted-foreground">{p.contract_no}</p>
                </td>
                <td className="px-3 py-2.5 hidden sm:table-cell text-muted-foreground">
                  {p.payment_type === 'payable' ? 'จ่าย' : 'รับ'}
                </td>
                <td className="px-3 py-2.5 hidden md:table-cell text-muted-foreground">
                  {formatDate(p.due_date)}
                </td>
                <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                  {formatBaht(p.balance_amount)}
                </td>
                <td className="px-3 py-2.5 text-center">
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${color}`}
                  >
                    {STATUS_LABELS[p.status] ?? p.status}
                  </Badge>
                </td>
                <td className="px-3 py-2.5 text-center hidden lg:table-cell">
                  <Link
                    href={`/rent-payments/${p.id}`}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    ดู <ExternalLink className="h-3 w-3" />
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
