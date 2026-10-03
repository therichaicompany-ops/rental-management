'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global Application Error:', error)
  }, [error])

  return (
    <html lang="th">
      <body className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full text-center space-y-4 bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            เกิดข้อผิดพลาดร้ายแรงของระบบ
          </h2>
          <p className="text-sm text-slate-500">
            ระบบไม่สามารถเริ่มทำงานได้ กรุณากดปุ่มด้านล่างเพื่อโหลดใหม่อีกครั้ง
          </p>
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg text-sm hover:bg-blue-700 transition-colors shadow-sm"
          >
            โหลดระบบใหม่
          </button>
        </div>
      </body>
    </html>
  )
}
