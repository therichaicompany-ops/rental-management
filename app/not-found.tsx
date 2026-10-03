import Link from 'next/link'
import { FileQuestion, ArrowLeft, Home, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-2xl shadow-xl border border-slate-200/80">
        <div className="w-20 h-20 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center mx-auto shadow-inner">
          <FileQuestion className="w-10 h-10 stroke-[1.75]" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold tracking-widest text-primary-600 uppercase bg-primary-50 px-3 py-1 rounded-full border border-primary-200/60">
            Error 404
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-3">
            ไม่พบหน้าที่คุณต้องการ (Page Not Found)
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            หน้าที่คุณกำลังค้นหาอาจถูกย้าย ลบ หรือที่อยู่ URL ไม่ถูกต้อง กรุณาตรวจสอบลิงก์อีกครั้ง
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button className="w-full bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center gap-2">
              <Home className="w-4 h-4" />
              กลับหน้าหลัก
            </Button>
          </Link>
          <Link href="/contracts" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full flex items-center justify-center gap-2">
              <Search className="w-4 h-4" />
              ดูสัญญาเช่า
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
