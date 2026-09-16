'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Phone, Mail, CreditCard, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/ui/data-table'
import type { Landlord } from '@/lib/types/master-data'
import type { UserRole } from '@/lib/types/auth'
import { canWrite } from '@/lib/auth/permissions'

interface LandlordListViewProps {
  landlords: Landlord[]
  userRole: UserRole
}

export function LandlordListView({ landlords, userRole }: LandlordListViewProps) {
  const router = useRouter()
  const allowCreate = canWrite(userRole)

  const columns: Column<Landlord>[] = [
    {
      header: 'รหัสผู้ให้เช่า',
      accessorKey: 'landlord_code',
      sortable: true,
      className: 'w-[130px] font-mono font-medium text-slate-900',
      cell: (row) => row.landlord_code || '-',
    },
    {
      header: 'ชื่อผู้ให้เช่า / บริษัท',
      accessorKey: 'name',
      sortable: true,
      cell: (row) => {
        const displayName = row.name || row.company_name || '-'
        const subName = row.name && row.company_name ? row.company_name : null
        return (
          <div className="space-y-0.5">
            <p className="font-semibold text-slate-900 leading-snug">{displayName}</p>
            {subName && <p className="text-xs text-slate-500">{subName}</p>}
          </div>
        )
      },
    },
    {
      header: 'ผู้ติดต่อ',
      accessorKey: 'contact_name',
      cell: (row) => row.contact_name || '-',
    },
    {
      header: 'การติดต่อ',
      cell: (row) => (
        <div className="space-y-1 text-xs text-slate-600">
          {row.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="h-3 w-3 text-slate-400" />
              <span>{row.phone}</span>
            </div>
          )}
          {row.email && (
            <div className="flex items-center gap-1.5">
              <Mail className="h-3 w-3 text-slate-400" />
              <span className="truncate max-w-[160px]">{row.email}</span>
            </div>
          )}
          {!row.phone && !row.email && <span className="text-slate-400">-</span>}
        </div>
      ),
    },
    {
      header: 'บัญชีธนาคาร',
      cell: (row) => {
        if (!row.bank_name && !row.bank_account_number) {
          return <span className="text-slate-400 text-xs">-</span>
        }
        return (
          <div className="space-y-0.5 text-xs">
            <div className="flex items-center gap-1.5 text-slate-800 font-medium">
              <CreditCard className="h-3.5 w-3.5 text-slate-400" />
              <span>{row.bank_name || 'ธนาคาร'}</span>
            </div>
            {row.bank_account_number && (
              <p className="font-mono text-slate-500">{row.bank_account_number}</p>
            )}
            {row.bank_account_name && (
              <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                {row.bank_account_name}
              </p>
            )}
          </div>
        )
      },
    },
    {
      header: '',
      className: 'w-[50px] text-right',
      cell: () => <ChevronRight className="h-4 w-4 text-slate-400 inline-block" />,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">ผู้ให้เช่า (Landlords)</h1>
          <p className="text-sm text-slate-500 mt-1">
            จัดการฐานข้อมูลเจ้าของพื้นที่ ผู้ให้เช่า และรายละเอียดบัญชีธนาคารสำหรับจ่ายค่าเช่า
          </p>
        </div>

        {allowCreate && (
          <Link href="/landlords/new">
            <Button className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" />
              เพิ่มผู้ให้เช่าใหม่
            </Button>
          </Link>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={landlords}
        searchKey="name"
        searchPlaceholder="ค้นหาตามชื่อผู้ให้เช่า, บริษัท, เลขบัญชี, เบอร์โทร..."
        emptyMessage="ยังไม่มีข้อมูลผู้ให้เช่า"
        emptyDescription="กดปุ่ม 'เพิ่มผู้ให้เช่าใหม่' เพื่อเริ่มบันทึกข้อมูลผู้ให้เช่าเข้าระบบ"
        onRowClick={(row) => router.push(`/landlords/${row.id}`)}
      />
    </div>
  )
}
