'use client'

import * as React from 'react'
import { Search, SlidersHorizontal, ArrowUpDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'

import { useI18n } from '@/lib/i18n/context'

export interface Column<T> {
  header: string
  accessorKey?: keyof T
  cell?: (row: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

interface FilterOption {
  label: string
  value: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  searchKey?: keyof T
  searchPlaceholder?: string
  filterOptions?: {
    key: keyof T
    label: string
    options: FilterOption[]
  }
  emptyMessage?: string
  emptyDescription?: string
  onRowClick?: (row: T) => void
  actions?: React.ReactNode
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  searchKey,
  searchPlaceholder,
  filterOptions,
  emptyMessage,
  emptyDescription,
  onRowClick,
  actions,
}: DataTableProps<T>) {
  const { t, locale } = useI18n()
  const [searchTerm, setSearchTerm] = React.useState('')
  const [selectedFilter, setSelectedFilter] = React.useState('all')
  const [sortKey, setSortKey] = React.useState<keyof T | null>(null)
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc')

  const resolvedSearchPlaceholder = searchPlaceholder ?? t.common.search
  const resolvedEmptyMessage = emptyMessage ?? t.common.noData
  const resolvedEmptyDescription = emptyDescription ?? t.common.noDataDesc

  // Filtered and searched data
  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      // Search
      if (searchTerm && searchKey) {
        const val = String(item[searchKey] ?? '').toLowerCase()
        if (!val.includes(searchTerm.toLowerCase())) {
          return false
        }
      } else if (searchTerm) {
        // Fallback: search across all string fields
        const matchesAny = Object.values(item).some((v) =>
          typeof v === 'string' && v.toLowerCase().includes(searchTerm.toLowerCase())
        )
        if (!matchesAny) return false
      }

      // Filter
      if (filterOptions && selectedFilter !== 'all') {
        const filterVal = String(item[filterOptions.key] ?? '')
        if (filterVal !== selectedFilter) {
          return false
        }
      }

      return true
    })
  }, [data, searchTerm, searchKey, filterOptions, selectedFilter])

  // Sorted data
  const sortedData = React.useMemo(() => {
    if (!sortKey) return filteredData
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return sortDirection === 'asc' ? 1 : -1
      if (bVal == null) return sortDirection === 'asc' ? -1 : 1

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal, 'th')
          : bVal.localeCompare(aVal, 'th')
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredData, sortKey, sortDirection])

  const handleSort = (key?: keyof T, sortable?: boolean) => {
    if (!sortable || !key) return
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar: Search, Filters, and Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder={resolvedSearchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>

          {filterOptions && (
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-sm text-slate-700 shadow-sm">
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">{t.common.all} ({filterOptions.label})</option>
                {filterOptions.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Counter */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          {t.common.total} {sortedData.length} / {data.length} {t.common.items}
        </span>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {sortedData.length === 0 ? (
          <div className="p-8">
            <EmptyState title={resolvedEmptyMessage} message={resolvedEmptyDescription} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                <tr>
                  {columns.map((col, idx) => (
                    <th
                      key={idx}
                      scope="col"
                      onClick={() => handleSort(col.accessorKey, col.sortable)}
                      className={`px-4 py-3.5 ${
                        col.sortable ? 'cursor-pointer select-none hover:bg-slate-100 transition-colors' : ''
                      } ${col.className ?? ''}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{col.header}</span>
                        {col.sortable && (
                          <ArrowUpDown
                            className={`h-3 w-3 ${
                              sortKey === col.accessorKey ? 'text-primary-600 font-bold' : 'text-slate-400'
                            }`}
                          />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedData.map((row, rowIdx) => (
                  <tr
                    key={String(row.id ?? rowIdx)}
                    onClick={() => onRowClick?.(row)}
                    className={`transition-colors ${
                      onRowClick ? 'cursor-pointer hover:bg-primary-50/40' : 'hover:bg-slate-50/50'
                    }`}
                  >
                    {columns.map((col, colIdx) => (
                      <td key={colIdx} className={`px-4 py-3.5 align-middle ${col.className ?? ''}`}>
                        {col.cell
                          ? col.cell(row)
                          : col.accessorKey
                          ? String(row[col.accessorKey] ?? '-')
                          : null}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
