'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, User, Building, Phone, Mail, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable, type Column } from '@/components/ui/data-table'
import type { Customer } from '@/lib/types/master-data'
import type { UserRole } from '@/lib/types/auth'
import { canWrite } from '@/lib/auth/permissions'

interface CustomerListViewProps {
  customers: Customer[]
  userRole: UserRole
}

export function CustomerListView({ customers, userRole }: CustomerListViewProps) {
  const router = useRouter()
  const allowCreate = canWrite(userRole)

  const columns: Column<Customer>[] = [
    {
      header: 'รหัสลูกค้า',
      accessorKey: 'customer_code',
      sortable: true,
      className: 'w-[130px] font-mono font-medium text-slate-900',
      cell: (row) => row.customer_code || '-',
    },
    {
      header: 'ประเภท',
      accessorKey: 'customer_type',
      sortable: true,
      className: 'w-[140px]',
      cell: (row) => (
        <Badge
          variant={row.customer_type === 'company' ? 'default' : 'secondary'}
          className="gap-1 font-normal"
        >
          {row.customer_type === 'company' ? (
            <>
              <Building className="h-3 w-3" />
              นิติบุคคล
            </>
          ) : (
            <>
              <User className="h-3 w-3" />
              บุคคลธรรมดา
            </>
          )}
        </Badge>
      ),
    },
    {
      header: 'ชื่อลูกค้า / บริษัท',
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">ลูกค้า (Customers)</h1>
          <p className="text-sm text-slate-500 mt-1">
            จัดการฐานข้อมูลลูกค้าทั้งประเภทบุคคลธรรมดาและนิติบุคคล
          </p>
        </div>

        {allowCreate && (
          <Link href="/customers/new">
            <Button className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" />
              เพิ่มลูกค้าใหม่
            </Button>
          </Link>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={customers}
        searchKey="name"
        searchPlaceholder="ค้นหาตามชื่อลูกค้า, บริษัท, เบอร์โทร..."
        filterOptions={{
          key: 'customer_type',
          label: 'ประเภท',
          options: [
            { label: 'นิติบุคคล', value: 'company' },
            { label: 'บุคคลธรรมดา', value: 'individual' },
          ],
        }}
        emptyMessage="ยังไม่มีข้อมูลลูกค้า"
        emptyDescription="กดปุ่ม 'เพิ่มลูกค้าใหม่' เพื่อเริ่มบันทึกข้อมูลลูกค้าเข้าระบบ"
        onRowClick={(row) => router.push(`/customers/${row.id}`)}
      />
    </div>
  )
}
