'use client'

import React, { createContext, useContext, useEffect, useState, useTransition } from 'react'
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

interface I18nContextType {
  locale: Locale
  setLocale: (newLocale: Locale) => void
  t: TranslationDictionary
  isPending: boolean
}

const I18nContext = createContext<I18nContextType | null>(null)

function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE

  // 1. Try reading from cookie
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE_NAME}=([^;]*)`))
  if (match) {
    const val = decodeURIComponent(match[1]) as Locale
    if (val === 'th' || val === 'en' || val === 'my') return val
  }

  // 2. Try localStorage
  try {
    const local = localStorage.getItem(LOCALE_COOKIE_NAME) as Locale
    if (local === 'th' || local === 'en' || local === 'my') return local
  } catch {
    // Ignore storage errors
  }

  return DEFAULT_LOCALE
}

export function I18nProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: React.ReactNode
  initialLocale?: Locale
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const stored = getStoredLocale()
    if (stored !== locale) {
      setLocaleState(stored)
      document.documentElement.lang = stored
    }
  }, [])

  const setLocale = (newLocale: Locale) => {
    startTransition(() => {
      setLocaleState(newLocale)
      document.documentElement.lang = newLocale

      // Set cookie (1 year expiration)
      const maxAge = 60 * 60 * 24 * 365
      document.cookie = `${LOCALE_COOKIE_NAME}=${newLocale}; path=/; max-age=${maxAge}; SameSite=Lax`

      // Store in localStorage
      try {
        localStorage.setItem(LOCALE_COOKIE_NAME, newLocale)
      } catch {
        // Ignore storage errors
      }
    })
  }

  const dictionary = DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE]

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        t: dictionary,
        isPending,
      }}
    >
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext)
  if (!context) {
    // Fallback if rendered outside provider
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      t: th,
      isPending: false,
    }
  }
  return context
}
