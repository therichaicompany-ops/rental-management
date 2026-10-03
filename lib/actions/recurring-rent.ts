'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { hasFullAccess, canAccess } from '@/lib/auth/permissions'
import {
  generateRecurringRentPayments,
  type RecurringRentRunResult,
} from '@/lib/services/recurring-rent-engine'

export interface ActionResponse<T = unknown> {
  success: boolean
  error?: string
  data?: T
}

/**
 * Server Action to trigger recurring rent generation (Owner, Admin, Accounting)
 */
export async function generateRecurringRentAction(options?: {
  targetContractId?: string
  horizonMonthsAhead?: number
}): Promise<ActionResponse<RecurringRentRunResult>> {
  const user = await getCurrentUser()
  if (!user || (!hasFullAccess(user.profile.role) && !canAccess(user.profile.role, 'contracts'))) {
    return { success: false, error: 'คุณไม่มีสิทธิ์สร้างงวดค่าเช่าอัตโนมัติ' }
  }

  try {
    const result = await generateRecurringRentPayments(options)
    revalidatePath('/rent-payments')
    revalidatePath('/contracts')
    if (options?.targetContractId) {
      revalidatePath(`/contracts/${options.targetContractId}`)
    }
    return { success: true, data: result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown generation error'
    return { success: false, error: msg }
  }
}
