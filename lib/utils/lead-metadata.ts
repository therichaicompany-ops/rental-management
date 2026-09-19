export type ContractPartyRole = 'payable' | 'receivable'

export interface LeadFinancialTerms {
  property_type?: 'house' | 'branch' | null // ประเภท: บ้าน หรือ สาขา
  contract_party_role?: ContractPartyRole | null // รูปแบบสัญญา: payable (บริษัทเช่ากับเจ้าของ) | receivable (ลูกค้าเช่ากับบริษัท)
  property_price?: number | null // ราคาบ้าน (บาท)
  down_payment?: number | null // เงินดาวน์ (บาท)
  interest_rate?: number | null // อัตราดอกเบี้ย (% ต่อปี)
  installment_years?: number | null // ระยะเวลาการผ่อน (ปี)
  payment_due_day?: number | null // วันที่ครบกำหนดชำระในแต่ละเดือน (1-31)
  contract_end_date?: string | null // วันที่ครบสัญญา (YYYY-MM-DD)
}

export const TM30_TAG = '[แจ้งที่พักอาศัยคนต่างด้าว (ตม.30)]'
const FINANCIAL_META_REGEX = /<!--LEAD_FINANCIAL:(\{.*?\})-->/
const FINANCIAL_TEXT_REGEX = /\[เงื่อนไขการเงิน:.*?\]/g

export const CONTRACT_PARTY_ROLE_LABELS: Record<
  ContractPartyRole,
  {
    title: string
    shortTitle: string
    paymentTypeLabel: string
    badgeClass: string
    description: string
  }
> = {
  payable: {
    title: 'บริษัทเช่ากับเจ้าของ',
    shortTitle: 'บริษัทเช่ากับเจ้าของ',
    paymentTypeLabel: 'จ่ายเจ้าของ (Payable)',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    description: 'บริษัทเป็นผู้เช่า มีหน้าที่ชำระค่าเช่าให้เจ้าของทรัพย์สิน (ตารางค่างวด: มีเฉพาะ "จ่ายเจ้าของ")',
  },
  receivable: {
    title: 'ลูกค้าเช่ากับบริษัท',
    shortTitle: 'ลูกค้าเช่ากับบริษัท',
    paymentTypeLabel: 'รับจากลูกค้า (Receivable)',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
    description: 'ลูกค้า/ผู้เช่า มีหน้าที่ชำระค่าเช่าให้บริษัท (ตารางค่างวด: มีเฉพาะ "รับจากลูกค้า")',
  },
}

/**
 * Determine the single payment direction/party role for a contract
 */
export function getContractPartyRole(
  financial?: LeadFinancialTerms | null,
  isHouse?: boolean,
  hasLandlord?: boolean,
  hasCustomer?: boolean,
  rawNote?: string | null
): ContractPartyRole {
  // 1. Explicitly stored role
  if (financial?.contract_party_role === 'payable' || financial?.contract_party_role === 'receivable') {
    return financial.contract_party_role
  }

  // 2. Fallback check from raw note text
  if (rawNote) {
    if (rawNote.includes('ลูกค้าเช่ากับบริษัท') || rawNote.includes('รับจากลูกค้า')) {
      return 'receivable'
    }
    if (rawNote.includes('บริษัทเช่ากับเจ้าของ') || rawNote.includes('จ่ายเจ้าของ')) {
      return 'payable'
    }
  }

  // 3. For residential house / hire purchase: company rents from owner -> payable
  if (isHouse) {
    return 'payable'
  }

  // 4. If only customer exists and no landlord -> receivable
  if (hasCustomer && !hasLandlord) {
    return 'receivable'
  }

  // 5. Default fallback: company renting premises from landlord -> payable
  return 'payable'
}

/**
 * Calculate estimated monthly installment payment based on standard mortgage loan formula
 */
export function calculateMonthlyInstallment(
  propertyPrice?: number | null,
  downPayment?: number | null,
  interestRate?: number | null,
  installmentYears?: number | null
): number {
  const price = Number(propertyPrice) || 0
  const down = Number(downPayment) || 0
  const rate = Number(interestRate) || 0
  const years = Number(installmentYears) || 0

  const loanAmount = Math.max(0, price - down)
  if (loanAmount <= 0 || years <= 0) return 0

  const n = years * 12
  if (rate <= 0) {
    return Math.round(loanAmount / n)
  }

  const r = rate / 100 / 12
  const monthly = (loanAmount * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1)
  return Math.round(monthly)
}

/**
 * Parse structured metadata from lead note
 */
export function parseLeadMetadata(rawNote?: string | null): {
  cleanNote: string
  hasForeignResident: boolean
  financial: LeadFinancialTerms
  isHouse: boolean
} {
  if (!rawNote) {
    return {
      cleanNote: '',
      hasForeignResident: false,
      financial: {},
      isHouse: false,
    }
  }

  const hasForeignResident =
    rawNote.includes(TM30_TAG) || rawNote.includes('แจ้งที่พักอาศัยคนต่างด้าว')

  let financial: LeadFinancialTerms = {}
  const match = rawNote.match(FINANCIAL_META_REGEX)
  if (match && match[1]) {
    try {
      financial = JSON.parse(match[1])
    } catch {
      financial = {}
    }
  }

  const isHouse =
    financial.property_type === 'house' ||
    Boolean(financial.property_price) ||
    Boolean(financial.down_payment) ||
    hasForeignResident ||
    rawNote.includes('ประเภท: บ้าน') ||
    rawNote.includes('เช่าซื้อ') ||
    rawNote.includes('สำหรับบ้าน')

  let cleanNote = rawNote
    .replace(new RegExp(`\\s*\\${TM30_TAG}\\s*`, 'g'), '')
    .replace(FINANCIAL_META_REGEX, '')
    .replace(FINANCIAL_TEXT_REGEX, '')
    .trim()

  return { cleanNote, hasForeignResident, financial, isHouse }
}

/**
 * Serialize user note and structured metadata into a single string
 */
export function buildLeadMetadataNote(
  userNote: string,
  needForeignResident: boolean,
  financial: LeadFinancialTerms
): string {
  const parts: string[] = []

  const clean = userNote
    .replace(new RegExp(`\\s*\\${TM30_TAG}\\s*`, 'g'), '')
    .replace(FINANCIAL_META_REGEX, '')
    .replace(FINANCIAL_TEXT_REGEX, '')
    .trim()

  if (clean) {
    parts.push(clean)
  }

  if (needForeignResident) {
    parts.push(TM30_TAG)
  }

  const hasFinancial = Object.values(financial).some(
    (v) => v !== undefined && v !== null && v !== 0 && v !== ''
  )

  if (hasFinancial) {
    const summaryParts: string[] = []
    if (financial.property_type) {
      summaryParts.push(
        `ประเภท: ${financial.property_type === 'house' ? 'บ้าน / ที่พักอาศัย' : 'สาขา / สถานประกอบการ'}`
      )
    }
    if (financial.contract_party_role) {
      summaryParts.push(
        `รูปแบบ: ${financial.contract_party_role === 'receivable' ? 'ลูกค้าเช่ากับบริษัท (รับจากลูกค้า)' : 'บริษัทเช่ากับเจ้าของ (จ่ายเจ้าของ)'}`
      )
    }
    if (financial.property_price) {
      summaryParts.push(`ราคาบ้าน: ฿${Number(financial.property_price).toLocaleString('th-TH')}`)
    }
    if (financial.down_payment) {
      summaryParts.push(`เงินดาวน์: ฿${Number(financial.down_payment).toLocaleString('th-TH')}`)
    }
    if (financial.interest_rate) {
      summaryParts.push(`ดอกเบี้ย: ${financial.interest_rate}%`)
    }
    if (financial.installment_years) {
      summaryParts.push(`ระยะเวลาผ่อน: ${financial.installment_years} ปี`)
    }
    if (financial.payment_due_day) {
      summaryParts.push(`กำหนดชำระ: ทุกวันที่ ${financial.payment_due_day} ของเดือน`)
    }
    if (financial.contract_end_date) {
      summaryParts.push(`วันที่ครบสัญญา: ${financial.contract_end_date}`)
    }

    const humanText = `[เงื่อนไขการเงิน: ${summaryParts.join(' | ')}]`
    const machineTag = `<!--LEAD_FINANCIAL:${JSON.stringify(financial)}-->`
    parts.push(`${humanText}\n${machineTag}`)
  }

  return parts.join('\n\n')
}
