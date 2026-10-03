import { createAdminClient } from '@/lib/supabase/admin'

export interface RecurringRentRunResult {
  success: boolean
  timestamp: string
  totalContractsChecked: number
  contractsProcessed: number
  paymentsGenerated: number
  skippedDuplicates: number
  errors: string[]
  details: Array<{
    contractId: string
    contractNo: string
    paymentType: string
    billingPeriod: string
    dueDate: string
    rentAmount: number
    status: 'generated' | 'skipped' | 'failed'
    reason?: string
  }>
}

/**
 * Helper to get current Date string in Asia/Bangkok (YYYY-MM-DD)
 */
function getBangkokDate(date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(date)
}

/**
 * Core Recurring Rent Generation Engine (Phase 10)
 * Scans active contracts with recurring_rent_enabled = true,
 * calculates amounts, avoids duplicates, and creates monthly rent_payments up to end_date.
 */
export async function generateRecurringRentPayments(options?: {
  targetContractId?: string
  horizonMonthsAhead?: number // Default: 1 (generate up to next month)
}): Promise<RecurringRentRunResult> {
  const timestamp = new Date().toISOString()
  const todayStr = getBangkokDate()
  const horizon = options?.horizonMonthsAhead ?? 1

  const result: RecurringRentRunResult = {
    success: true,
    timestamp,
    totalContractsChecked: 0,
    contractsProcessed: 0,
    paymentsGenerated: 0,
    skippedDuplicates: 0,
    errors: [],
    details: [],
  }

  const supabase = createAdminClient() as any

  try {
    // 1. Query active contracts with recurring_rent_enabled = true
    let query = supabase
      .from('rental_contracts')
      .select(
        `
        id,
        contract_no,
        location_id,
        customer_id,
        landlord_id,
        start_date,
        end_date,
        monthly_rent,
        other_service_amount,
        payment_due_day,
        wht_enabled,
        wht_rate,
        recurring_rent_enabled,
        status
      `
      )
      .eq('status', 'active')
      .eq('recurring_rent_enabled', true)
      .not('start_date', 'is', null)
      .not('end_date', 'is', null)

    if (options?.targetContractId) {
      query = query.eq('id', options.targetContractId)
    }

    const { data: contracts, error: contractErr } = await query

    if (contractErr || !contracts) {
      result.success = false
      result.errors.push(contractErr ? contractErr.message : 'ไม่สามารถดึงข้อมูลสัญญาเช่าได้')
      return result
    }

    result.totalContractsChecked = contracts.length

    // Today's year and month
    const today = new Date(todayStr + 'T00:00:00Z')
    // Generation horizon limit (current month + horizon)
    const maxHorizonDate = new Date(
      today.getUTCFullYear(),
      today.getUTCMonth() + horizon,
      1
    )

    for (const contract of contracts) {
      const contractId = contract.id
      const contractNo = contract.contract_no || 'ไม่ระบุเลขที่สัญญา'
      const startDate = new Date(contract.start_date + 'T00:00:00Z')
      const endDate = new Date(contract.end_date + 'T00:00:00Z')

      // RULE: ถ้าสัญญา expired หรือพ้น end_date ไปแล้ว -> หยุดสร้าง
      if (contract.status === 'expired' || contract.status === 'cancelled') {
        continue
      }

      // Determine payment types for this contract:
      // If customer_id exists -> 'receivable' (ลูกค้าจ่าย)
      // If landlord_id exists -> 'payable' (บริษัทจ่าย)
      const paymentTypes: ('payable' | 'receivable')[] = []
      if (contract.customer_id) {
        paymentTypes.push('receivable')
      }
      if (contract.landlord_id || paymentTypes.length === 0) {
        paymentTypes.push('payable')
      }

      // Fetch existing payments for this contract to enforce unique(contract_id, payment_type, billing_period)
      const { data: existingPayments } = await supabase
        .from('rent_payments')
        .select('billing_period, payment_type')
        .eq('contract_id', contractId)

      const existingSet = new Set<string>()
      if (existingPayments) {
        for (const p of existingPayments) {
          existingSet.add(`${p.billing_period}_${p.payment_type}`)
        }
      }

      const rentAmount = Number(contract.monthly_rent) || 0
      const serviceAmount = Number(contract.other_service_amount) || 0
      const whtRate = Number(contract.wht_rate) || 0
      const whtAmount = contract.wht_enabled
        ? Math.round(rentAmount * (whtRate / 100) * 100) / 100
        : 0
      const dueDay = contract.payment_due_day || 5

      // Start month
      const currentMonth = new Date(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth(),
        1
      )
      // Stop month: whichever is earlier between endDate and maxHorizonDate
      const endMonth = new Date(
        endDate.getUTCFullYear(),
        endDate.getUTCMonth(),
        1
      )
      const upperMonthLimit = endMonth < maxHorizonDate ? endMonth : maxHorizonDate

      let contractProcessed = false

      while (currentMonth <= upperMonthLimit) {
        const year = currentMonth.getUTCFullYear()
        const month = currentMonth.getUTCMonth() // 0-11
        const monthStr = String(month + 1).padStart(2, '0')
        const billingPeriod = `${year}-${monthStr}-01`

        // RULE: ห้ามสร้างงวดหลัง end_date
        const billingDateObj = new Date(billingPeriod + 'T00:00:00Z')
        if (billingDateObj > endDate) {
          break
        }

        // Clamp due day to last day of month
        const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
        const clampedDay = Math.min(dueDay, lastDayOfMonth)
        const dueDate = `${year}-${monthStr}-${String(clampedDay).padStart(2, '0')}`

        const status = dueDate < todayStr ? 'overdue' : 'pending'

        for (const pType of paymentTypes) {
          const dedupeKey = `${billingPeriod}_${pType}`

          // Check duplicate
          if (existingSet.has(dedupeKey)) {
            result.skippedDuplicates++
            result.details.push({
              contractId,
              contractNo,
              paymentType: pType,
              billingPeriod,
              dueDate,
              rentAmount,
              status: 'skipped',
              reason: 'มีงวดเดือนนี้ในระบบแล้ว (Duplicate Prevention)',
            })
            continue
          }

          // Insert into rent_payments
          const { error: insertErr } = await supabase.from('rent_payments').insert({
            contract_id: contractId,
            payment_type: pType,
            billing_period: billingPeriod,
            due_date: dueDate,
            rent_amount: rentAmount,
            wht_amount: whtAmount,
            service_amount: serviceAmount,
            other_amount: 0,
            amount_paid: 0,
            status,
          })

          if (insertErr) {
            result.errors.push(`สัญญา ${contractNo} งวด ${billingPeriod}: ${insertErr.message}`)
            result.details.push({
              contractId,
              contractNo,
              paymentType: pType,
              billingPeriod,
              dueDate,
              rentAmount,
              status: 'failed',
              reason: insertErr.message,
            })
          } else {
            existingSet.add(dedupeKey) // Prevent duplicate within same run
            result.paymentsGenerated++
            contractProcessed = true
            result.details.push({
              contractId,
              contractNo,
              paymentType: pType,
              billingPeriod,
              dueDate,
              rentAmount,
              status: 'generated',
            })
          }
        }

        // Move to next month
        currentMonth.setUTCMonth(currentMonth.getUTCMonth() + 1)
      }

      if (contractProcessed) {
        result.contractsProcessed++
      }
    }

    return result
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown recurring rent generation error'
    result.success = false
    result.errors.push(msg)
    return result
  }
}
