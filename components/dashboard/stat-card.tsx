'use client'

import * as React from 'react'
import Link from 'next/link'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

interface StatCardProps {
  title: string
  subtitle: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  iconColor: string
  href?: string
  trend?: 'up' | 'down' | 'neutral'
  formatAsCurrency?: boolean
}

function formatValue(v: number | string, currency: boolean, locale: string): string {
  if (typeof v === 'string') return v
  const intlLocale = locale === 'en' ? 'en-US' : locale === 'my' ? 'my-MM' : 'th-TH'
  if (currency) {
    return new Intl.NumberFormat(intlLocale, {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(v)
  }
  return v.toLocaleString(intlLocale)
}

export function StatCard({
  title,
  subtitle,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  href,
  trend,
  formatAsCurrency = false,
}: StatCardProps) {
  const { locale } = useI18n()

  const content = (
    <div
      className={[
        'rounded-xl border bg-card p-5 shadow-sm transition-all',
        href ? 'hover:shadow-md hover:border-primary/30 cursor-pointer' : '',
      ].join(' ')}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground font-medium truncate">{title}</p>
          <p className="text-3xl font-bold mt-1.5 tabular-nums">
            {formatValue(value, formatAsCurrency, locale)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <div className={`rounded-xl p-3 ${iconBg} shrink-0 ml-3`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t flex items-center gap-1">
          {trend === 'up' && <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
          {trend === 'down' && <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
          {trend === 'neutral' && <Minus className="h-3.5 w-3.5 text-slate-400" />}
        </div>
      )}
    </div>
  )

  if (href) {
    return <Link href={href} className="block">{content}</Link>
  }
  return content
}
