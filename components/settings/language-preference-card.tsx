'use client'

import { Globe, Check } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { SUPPORTED_LOCALES } from '@/lib/i18n/config'
import type { Locale } from '@/lib/i18n/types'
import { FlagIcon } from '@/components/ui/flag-icon'
import { cn } from '@/lib/utils'

const PREFERENCE_LABELS: Record<string, { title: string; subtitle: string }> = {
  th: { title: 'ภาษาไทย', subtitle: 'Thai' },
  en: { title: 'English', subtitle: 'English (UK)' },
  my: { title: 'မြန်မာစာ', subtitle: 'Myanmar (Burmese)' },
}

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
          const info = PREFERENCE_LABELS[item.code] ?? { title: item.nativeName, subtitle: item.label }

          return (
            <button
              key={item.code}
              type="button"
              id={`lang-pref-${item.code}`}
              onClick={() => setLocale(item.code as Locale)}
              className={cn(
                'flex items-center justify-between p-3.5 rounded-lg border text-left transition-all',
                isSelected
                  ? 'border-primary bg-primary/5 shadow-xs text-foreground ring-1.5 ring-primary'
                  : 'border-border bg-card hover:bg-muted/40 hover:border-muted-foreground/30'
              )}
            >
              <div className="flex items-center gap-3.5">
                <FlagIcon locale={item.code} className="w-8 h-5.5 rounded-[3px] shadow-xs" />
                <div>
                  <p className="text-sm font-semibold leading-tight">{info.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{info.subtitle}</p>
                </div>
              </div>
              {isSelected && (
                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-white shrink-0">
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
