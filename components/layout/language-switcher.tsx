'use client'

import { Globe, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useI18n } from '@/lib/i18n/context'
import { SUPPORTED_LOCALES } from '@/lib/i18n/config'
import type { Locale } from '@/lib/i18n/types'
import { FlagIcon } from '@/components/ui/flag-icon'
import { cn } from '@/lib/utils'

interface LanguageSwitcherProps {
  className?: string
  variant?: 'ghost' | 'outline' | 'default'
  showLabel?: boolean
}

const LOCALE_SUBTITLES: Record<string, string> = {
  th: 'Thai',
  en: 'English (UK)',
  my: 'Myanmar (Burmese)',
}

export function LanguageSwitcher({
  className,
  variant = 'ghost',
  showLabel = true,
}: LanguageSwitcherProps) {
  const { locale, setLocale } = useI18n()
  const current = SUPPORTED_LOCALES.find((l) => l.code === locale) ?? SUPPORTED_LOCALES[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size="sm"
          className={cn(
            'flex items-center gap-2 px-2.5 h-9 rounded-lg text-xs font-medium transition-colors border border-border/60 hover:border-border',
            className
          )}
          id="language-switcher-trigger"
          aria-label="Change language"
        >
          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
          <FlagIcon locale={current.code} className="w-4 h-3" />
          {showLabel && (
            <span className="font-semibold uppercase tracking-wider text-[11px]">{current.code}</span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48 p-1.5 shadow-lg">
        {SUPPORTED_LOCALES.map((item) => {
          const isSelected = item.code === locale
          return (
            <DropdownMenuItem
              key={item.code}
              onClick={() => setLocale(item.code as Locale)}
              className={cn(
                'flex items-center justify-between px-3 py-2 text-xs rounded-md cursor-pointer transition-colors',
                isSelected ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-foreground'
              )}
            >
              <div className="flex items-center gap-2.5">
                <FlagIcon locale={item.code} className="w-5 h-3.5" />
                <div className="flex flex-col">
                  <span className="font-medium">{item.nativeName}</span>
                  <span className="text-[10px] text-muted-foreground">{LOCALE_SUBTITLES[item.code] ?? item.label}</span>
                </div>
              </div>
              {isSelected && <Check className="h-3.5 w-3.5 text-primary-600" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
