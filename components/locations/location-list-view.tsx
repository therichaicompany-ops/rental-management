'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, MapPin, ExternalLink, ChevronRight, Building } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/ui/data-table'
import type { LocationWithLandlord } from '@/lib/types/master-data'
import type { UserRole } from '@/lib/types/auth'
import { canWrite } from '@/lib/auth/permissions'
import { useI18n } from '@/lib/i18n/context'

interface LocationListViewProps {
  locations: LocationWithLandlord[]
  userRole: UserRole
}

export function LocationListView({ locations, userRole }: LocationListViewProps) {
  const router = useRouter()
  const allowCreate = canWrite(userRole)
  const { t } = useI18n()

  // Extract unique provinces for filtering
  const provinceOptions = React.useMemo(() => {
    const set = new Set<string>()
    locations.forEach((loc) => {
      if (loc.province) set.add(loc.province)
    })
    return Array.from(set).sort().map((p) => ({ label: p, value: p }))
  }, [locations])

  const columns: Column<LocationWithLandlord>[] = [
    {
      header: 'Code',
      accessorKey: 'location_code',
      sortable: true,
      className: 'w-[130px] font-mono font-medium text-slate-900',
      cell: (row) => row.location_code || '-',
    },
    {
      header: t.locations.locationName,
      accessorKey: 'location_name',
      sortable: true,
      cell: (row) => (
        <div className="space-y-0.5">
          <p className="font-semibold text-slate-900 leading-snug">{row.location_name}</p>
          {(row.village_name || row.room_no) && (
            <p className="text-xs text-slate-500">
              {[row.village_name, row.room_no ? `${t.locations.addressDetail}: ${row.room_no}` : null]
                .filter(Boolean)
                .join(' ')}
            </p>
          )}
        </div>
      ),
    },
    {
      header: t.locations.province,
      accessorKey: 'province',
      sortable: true,
      cell: (row) => {
        const area = [row.subdistrict, row.district].filter(Boolean).join(', ')
        return (
          <div className="space-y-0.5 text-xs">
            <div className="flex items-center gap-1 font-medium text-slate-800">
              <MapPin className="h-3.5 w-3.5 text-primary-500" />
              <span>{row.province || '-'}</span>
            </div>
            {area && <p className="text-slate-500">{area}</p>}
          </div>
        )
      },
    },
    {
      header: t.landlords.title,
      cell: (row) => {
        const landlord = row.landlords
        if (!landlord) {
          return <span className="text-slate-400 text-xs">-</span>
        }
        return (
          <div className="space-y-0.5 text-xs">
            <div className="flex items-center gap-1.5 text-slate-800 font-medium">
              <Building className="h-3.5 w-3.5 text-slate-400" />
              <span>{landlord.name || landlord.company_name || '-'}</span>
            </div>
            {landlord.phone && <p className="text-slate-500">{landlord.phone}</p>}
          </div>
        )
      },
    },
    {
      header: 'Maps',
      className: 'w-[100px]',
      cell: (row) => {
        if (!row.google_maps_url) {
          return <span className="text-slate-400 text-xs">-</span>
        }
        return (
          <a
            href={row.google_maps_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 hover:underline"
          >
            <span>Google Maps</span>
            <ExternalLink className="h-3 w-3" />
          </a>
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t.locations.title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {t.locations.subtitle}
          </p>
        </div>

        {allowCreate && (
          <Link href="/locations/new">
            <Button className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" />
              {t.locations.addNew}
            </Button>
          </Link>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={locations}
        searchKey="location_name"
        searchPlaceholder={`${t.common.search} (${t.locations.locationName}, ${t.locations.province})`}
        filterOptions={
          provinceOptions.length > 0
            ? {
                key: 'province',
                label: t.locations.province,
                options: provinceOptions,
              }
            : undefined
        }
        emptyMessage={t.common.noData}
        emptyDescription={t.common.noDataDesc}
        onRowClick={(row) => router.push(`/locations/${row.id}`)}
      />
    </div>
  )
}
