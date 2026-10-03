import Link from 'next/link'
import { ShieldAlert, ArrowLeft, Home, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-2xl shadow-xl border border-slate-200/80">
        <div className="w-20 h-20 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/80 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-10 h-10 stroke-[1.75]" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold tracking-widest text-rose-600 uppercase bg-rose-50 px-3 py-1 rounded-full border border-rose-200/60">
            Error 403 • Access Denied
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-3">
            คุณไม่มีสิทธิ์เข้าถึงหน้านี้
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            บัญชีผู้ใช้ของคุณไม่ได้รับอนุญาตให้ดูหรือแก้ไขข้อมูลในส่วนนี้ หากคุณคิดว่านี่เป็นข้อผิดพลาด กรุณาติดต่อผู้ดูแลระบบ (Owner หรือ Admin)
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button className="w-full bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center gap-2">
              <Home className="w-4 h-4" />
              กลับหน้าหลัก (Dashboard)
            </Button>
          </Link>
        </div>

        <div className="border-t border-slate-100 pt-4 text-xs text-slate-400">
          ระบบบริหารงานเช่าและเปิดสาขา (Rental & Branch Management)
        </div>
      </div>
    </div>
  )
}
