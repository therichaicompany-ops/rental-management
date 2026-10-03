'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertOctagon, RotateCcw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/context'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { tx } = useI18n()

  useEffect(() => {
    console.error('Application Runtime Error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-2xl shadow-xl border border-slate-200/80">
        <div className="w-20 h-20 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/80 flex items-center justify-center mx-auto shadow-inner">
          <AlertOctagon className="w-10 h-10 stroke-[1.75]" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold tracking-widest text-rose-600 uppercase bg-rose-50 px-3 py-1 rounded-full border border-rose-200/60">
            Error 500
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-3">
            {tx({
              th: 'เกิดข้อผิดพลาดในการประมวลผล (Internal Error)',
              en: 'Application Error (Internal Error)',
              my: 'လုပ်ဆောင်ရာတွင် အမှားဖြစ်ပွားသည် (Internal Error)',
            })}
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            {tx({
              th: 'ระบบพบข้อขัดข้องชั่วคราวในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบหากปัญหายังคงอยู่',
              en: 'The system encountered a temporary error loading this data. Please try again or contact support if the issue persists.',
              my: 'အချက်အလက် ရယူရာတွင် ယာယီအမှားတစ်ခု ဖြစ်ပေါ်နေပါသည်။ ကျေးဇူးပြု၍ ထပ်မံကြိုးစားပါ သို့မဟုတ် စနစ်စီမံခန့်ခွဲသူထံ ဆက်သွယ်ပါ။',
            })}
          </p>
          {error.digest && (
            <p className="text-xs font-mono text-slate-400 bg-slate-50 p-2 rounded border border-slate-100 mt-2 truncate">
              Digest ID: {error.digest}
            </p>
          )}
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={() => reset()}
            className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            {tx({
              th: 'ลองใหม่อีกครั้ง',
              en: 'Try Again',
              my: 'ထပ်မံကြိုးစားမည်',
            })}
          </Button>
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full flex items-center justify-center gap-2">
              <Home className="w-4 h-4" />
              {tx({
                th: 'กลับหน้าหลัก',
                en: 'Return to Dashboard',
                my: 'ပင်မစာမျက်နှာသို့ ပြန်သွားမည်',
              })}
            </Button>
          </Link>
        </div>

        <div className="border-t border-slate-100 pt-4 text-xs text-slate-400">
          {tx({
            th: 'ระบบบริหารงานเช่าและเปิดสาขา (Rental & Branch Management)',
            en: 'Rental & Branch Management System',
            my: 'အငှားနှင့် ဆိုင်ခွဲစီမံခန့်ခွဲမှုစနစ်',
          })}
        </div>
      </div>
    </div>
  )
}
