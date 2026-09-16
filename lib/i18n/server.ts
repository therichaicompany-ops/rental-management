import { cookies } from 'next/headers'
import type { Locale, TranslationDictionary } from './types'
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME } from './config'
import { th } from './dictionaries/th'
import { en } from './dictionaries/en'
import { my } from './dictionaries/my'

const DICTIONARIES: Record<Locale, TranslationDictionary> = {
  th,
  en,
  my,
}

export async function getServerLocale(): Promise<Locale> {
  try {
    const cookieStore = await cookies()
    const localeCookie = cookieStore.get(LOCALE_COOKIE_NAME)?.value as Locale
    if (localeCookie === 'th' || localeCookie === 'en' || localeCookie === 'my') {
      return localeCookie
    }
  } catch {
    // If called where cookies are not available
  }
  return DEFAULT_LOCALE
}

export async function getServerTranslation(): Promise<{
  locale: Locale
  t: TranslationDictionary
}> {
  const locale = await getServerLocale()
  return {
    locale,
    t: DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE],
  }
}
