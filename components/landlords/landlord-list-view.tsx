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
import { useI18n } from '@/lib/i18n/context'

interface LandlordListViewProps {
  landlords: Landlord[]
  userRole: UserRole
}

export function LandlordListView({ landlords, userRole }: LandlordListViewProps) {
  const router = useRouter()
  const allowCreate = canWrite(userRole)
  const { t } = useI18n()

  const columns: Column<Landlord>[] = [
    {
      header: 'Code',
      accessorKey: 'landlord_code',
      sortable: true,
      className: 'w-[130px] font-mono font-medium text-slate-900',
      cell: (row) => row.landlord_code || '-',
    },
    {
      header: t.landlords.landlordName,
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
      header: t.customers.contactPerson,
      accessorKey: 'contact_name',
      cell: (row) => row.contact_name || '-',
    },
    {
      header: t.landlords.phone,
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
      header: t.landlords.bankName,
      cell: (row) => {
        if (!row.bank_name && !row.bank_account_number) {
          return <span className="text-slate-400 text-xs">-</span>
        }
        return (
          <div className="space-y-0.5 text-xs">
            <div className="flex items-center gap-1.5 text-slate-800 font-medium">
              <CreditCard className="h-3.5 w-3.5 text-slate-400" />
              <span>{row.bank_name || t.landlords.bankName}</span>
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t.landlords.title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {t.landlords.subtitle}
          </p>
        </div>

        {allowCreate && (
          <Link href="/landlords/new">
            <Button className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" />
              {t.landlords.addNew}
            </Button>
          </Link>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={landlords}
        searchKey="name"
        searchPlaceholder={`${t.common.search} (${t.landlords.landlordName}, ${t.landlords.phone})`}
        emptyMessage={t.common.noData}
        emptyDescription={t.common.noDataDesc}
        onRowClick={(row) => router.push(`/landlords/${row.id}`)}
      />
    </div>
  )
}
