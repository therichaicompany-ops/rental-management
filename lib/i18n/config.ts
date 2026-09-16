import type { Locale, LocaleConfig } from './types'

export const DEFAULT_LOCALE: Locale = 'th'

export const SUPPORTED_LOCALES: LocaleConfig[] = [
  {
    code: 'th',
    label: 'ไทย',
    nativeName: 'ภาษาไทย',
    flag: '🇹🇭',
  },
  {
    code: 'en',
    label: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
  },
  {
    code: 'my',
    label: 'မြန်မာ',
    nativeName: 'မြန်မာစာ',
    flag: '🇲🇲',
  },
]

export const LOCALE_COOKIE_NAME = 'NEXT_LOCALE'
