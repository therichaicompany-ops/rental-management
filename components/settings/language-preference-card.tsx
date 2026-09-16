'use client'

import { Globe, Check } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { SUPPORTED_LOCALES } from '@/lib/i18n/config'
import type { Locale } from '@/lib/i18n/types'
import { cn } from '@/lib/utils'

export function LanguagePreferenceCard() {
  const { locale, setLocale, t } = useI18n()

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4 pb-3 border-b">
        <Globe className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-base font-semibold">{t.settings.language}</h2>
          <p className="text-xs text-muted-foreground">{t.settings.languageDescription}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {SUPPORTED_LOCALES.map((item) => {
          const isSelected = item.code === locale
          return (
            <button
              key={item.code}
              type="button"
              onClick={() => setLocale(item.code as Locale)}
              className={cn(
                'flex items-center justify-between p-3.5 rounded-lg border text-left transition-all',
                isSelected
                  ? 'border-primary bg-primary-50/50 shadow-sm text-primary-900 ring-1 ring-primary'
                  : 'border-border bg-card hover:bg-muted/40 hover:border-muted-foreground/30'
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl leading-none">{item.flag}</span>
                <div>
                  <p className="text-sm font-semibold leading-tight">{item.nativeName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
                </div>
              </div>
              {isSelected && (
                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-white">
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
