import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    template: '%s | ระบบบริหารงานเช่าและเปิดสาขา',
    default: 'ระบบบริหารงานเช่าและเปิดสาขา',
  },
  description: 'ระบบบริหารงานเช่าและเปิดสาขา — จัดการการเช่า สัญญา และการเปิดสาขาในที่เดียว',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={inter.variable}>
      <body className="min-h-screen antialiased font-sans">{children}</body>
    </html>
  )
}
