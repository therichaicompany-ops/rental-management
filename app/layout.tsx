import type { Metadata } from 'next'
import { Inter, Noto_Sans_Myanmar } from 'next/font/google'
import './globals.css'
import { I18nProvider } from '@/lib/i18n/context'
import { getServerLocale } from '@/lib/i18n/server'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

const notoSansMyanmar = Noto_Sans_Myanmar({
  subsets: ['myanmar'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-myanmar',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    template: '%s | ระบบบริหารงานเช่าและเปิดสาขา',
    default: 'ระบบบริหารงานเช่าและเปิดสาขา',
  },
  description: 'ระบบบริหารงานเช่าและเปิดสาขา — จัดการการเช่า สัญญา และการเปิดสาขาในที่เดียว',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getServerLocale()

  return (
    <html lang={locale} className={`${inter.variable} ${notoSansMyanmar.variable}`}>
      <body className="min-h-screen antialiased font-sans">
        <I18nProvider initialLocale={locale}>
          {children}
        </I18nProvider>
      </body>
    </html>
  )
}
