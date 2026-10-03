import type { Locale } from './types'

/**
 * Inline 3-language text. Every UI string must provide all three locales,
 * so TypeScript will fail the build if a translation is missing.
 */
export type Tri = { th: string; en: string; my: string }

export function pickTri(m: Tri, locale: Locale): string {
  return m[locale] ?? m.th
}

/** Intl locale tag for number/date formatting. */
export function intlLocale(locale: Locale): string {
  return locale === 'th' ? 'th-TH' : locale === 'my' ? 'my-MM' : 'en-GB'
}

/** Format a date (string | Date) according to locale. */
export function formatDateLocale(
  value: string | Date | null | undefined,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!value) return '-'
  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString(intlLocale(locale), options)
}

/** Look up a Tri map by key, falling back to the raw key. */
export function labelOf<K extends string>(
  map: Record<K, Tri>,
  key: string | null | undefined,
  locale: Locale
): string {
  if (!key) return '-'
  const entry = (map as Record<string, Tri>)[key]
  return entry ? pickTri(entry, locale) : key
}
