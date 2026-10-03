import { NextRequest, NextResponse } from 'next/server'
import { generateRecurringRentPayments } from '@/lib/services/recurring-rent-engine'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { hasFullAccess } from '@/lib/auth/permissions'

function isAuthorizedCron(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true
  }

  if (req.headers.get('x-vercel-cron') === '1') {
    return true
  }

  return false
}

export async function GET(req: NextRequest) {
  const isCron = isAuthorizedCron(req)
  if (!isCron) {
    const user = await getCurrentUser()
    if (!user || !hasFullAccess(user.profile.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const result = await generateRecurringRentPayments()
    return NextResponse.json(result, { status: result.success ? 200 : 500 })
  } catch (err) {
    console.error('Cron recurring-rent GET error:', err)
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
    const result = await generateRecurringRentPayments({
      targetContractId: body.targetContractId,
      horizonMonthsAhead: body.horizonMonthsAhead,
    })
    return NextResponse.json(result, { status: result.success ? 200 : 500 })
  } catch (err) {
    console.error('Cron recurring-rent POST error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
