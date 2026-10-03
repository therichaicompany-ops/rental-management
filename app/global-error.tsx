'use client'

import { useEffect, useState } from 'react'
import type { Locale } from '@/lib/i18n/types'
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME } from '@/lib/i18n/config'

const TEXTS: Record<Locale, { title: string; desc: string; retry: string }> = {
  th: {
    title: 'เกิดข้อผิดพลาดร้ายแรงของระบบ',
    desc: 'ระบบไม่สามารถเริ่มทำงานได้ กรุณากดปุ่มด้านล่างเพื่อโหลดใหม่อีกครั้ง',
    retry: 'โหลดระบบใหม่',
  },
  en: {
    title: 'A Critical System Error Occurred',
    desc: 'The system failed to initialize. Please click the button below to reload.',
    retry: 'Reload System',
  },
  my: {
    title: 'ဆိုးရွားသော စနစ်အမှားတစ်ခု ဖြစ်ပေါ်ခဲ့သည်',
    desc: 'စနစ်စတင်၍ မရပါ။ စနစ်ပြန်လည်ဖွင့်ရန် အောက်ပါခလုတ်ကို နှိပ်ပါ။',
    retry: 'စနစ်ပြန်လည်ဖွင့်မည်',
  },
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE)

  useEffect(() => {
    console.error('Global Application Error:', error)
    try {
      const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE_NAME}=([^;]*)`))
      if (match) {
        const val = decodeURIComponent(match[1]) as Locale
        if (val === 'th' || val === 'en' || val === 'my') setLocale(val)
      }
    } catch {
      // Ignore
    }
  }, [error])

  const t = TEXTS[locale] || TEXTS.th

  return (
    <html lang={locale}>
      <body className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full text-center space-y-4 bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            {t.title}
          </h2>
          <p className="text-sm text-slate-500">
            {t.desc}
          </p>
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg text-sm hover:bg-blue-700 transition-colors shadow-sm"
          >
            {t.retry}
          </button>
        </div>
      </body>
    </html>
  )
}
