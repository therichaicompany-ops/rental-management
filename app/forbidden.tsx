import Link from 'next/link'
import { ShieldAlert, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getServerTranslation } from '@/lib/i18n/server'

export default async function ForbiddenPage() {
  const { tx } = await getServerTranslation()

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
            {tx({
              th: 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้',
              en: 'Access Denied',
              my: 'ဝင်ရောက်ခွင့် မရှိပါ',
            })}
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            {tx({
              th: 'บัญชีผู้ใช้ของคุณไม่ได้รับอนุญาตให้ดูหรือแก้ไขข้อมูลในส่วนนี้ หากคุณคิดว่านี่เป็นข้อผิดพลาด กรุณาติดต่อผู้ดูแลระบบ (Owner หรือ Admin)',
              en: 'Your account does not have permission to view or edit this section. If you believe this is an error, please contact your system administrator (Owner or Admin).',
              my: 'သင့်အကောင့်တွင် ဤအပိုင်းကို ကြည့်ရှုခွင့် သို့မဟုတ် ပြင်ဆင်ခွင့် မရှိပါ။ စနစ်စီမံခန့်ခွဲသူ (Owner သို့မဟုတ် Admin) ထံ ဆက်သွယ်ပါ။',
            })}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button className="w-full bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center gap-2">
              <Home className="w-4 h-4" />
              {tx({
                th: 'กลับหน้าหลัก (Dashboard)',
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
