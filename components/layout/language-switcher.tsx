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
import { cn } from '@/lib/utils'

interface LanguageSwitcherProps {
  className?: string
  variant?: 'ghost' | 'outline' | 'default'
  showLabel?: boolean
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
            'flex items-center gap-1.5 px-2.5 h-9 rounded-lg text-xs font-medium transition-colors',
            className
          )}
          id="language-switcher-trigger"
          aria-label="Change language"
        >
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span className="text-base leading-none">{current.flag}</span>
          {showLabel && (
            <span className="font-semibold uppercase tracking-wider">{current.code}</span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-44 p-1.5 shadow-lg">
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
                <span className="text-base leading-none">{item.flag}</span>
                <div className="flex flex-col">
                  <span>{item.nativeName}</span>
                  <span className="text-[10px] text-muted-foreground">{item.label}</span>
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
