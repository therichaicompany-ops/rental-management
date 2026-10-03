import { NextRequest, NextResponse } from 'next/server'
import { runRentReminderAutomation } from '@/lib/services/rent-reminder-engine'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { hasFullAccess } from '@/lib/auth/permissions'

function isAuthorizedCron(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // 1. If CRON_SECRET is configured, check bearer token
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true
  }

  // 2. Allow if Vercel Cron header is present
  if (req.headers.get('x-vercel-cron') === '1') {
    return true
  }

  return false
}

export async function GET(req: NextRequest) {
  // Allow authorized cron OR authenticated Owner/Admin
  const isCron = isAuthorizedCron(req)
  if (!isCron) {
    const user = await getCurrentUser()
    if (!user || !hasFullAccess(user.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const result = await runRentReminderAutomation()
    return NextResponse.json(result, { status: result.success ? 200 : 500 })
  } catch (err) {
    console.error('Cron rent-reminder GET error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const isCron = isAuthorizedCron(req)
  if (!isCron) {
    const user = await getCurrentUser()
    if (!user || !hasFullAccess(user.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const body = await req.json().catch(() => ({}))
    const result = await runRentReminderAutomation({
      forcedDate: body.forcedDate,
      targetPaymentId: body.targetPaymentId,
    })
    return NextResponse.json(result, { status: result.success ? 200 : 500 })
  } catch (err) {
    console.error('Cron rent-reminder POST error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
