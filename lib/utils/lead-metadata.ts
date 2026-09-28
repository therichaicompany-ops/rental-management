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
 * Helper to strip metadata tags, financial comments, and TM30 tags from a note
 */
export function cleanRawNote(text?: string | null): string {
  if (!text) return ''
  return text
    .replaceAll(TM30_TAG, '')
    .replace(/\[แจ้งที่พักอาศัยคนต่างด้าว[^\]]*\]/g, '')
    .replace(FINANCIAL_META_REGEX, '')
    .replace(FINANCIAL_TEXT_REGEX, '')
    .trim()
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

  let financial: LeadFinancialTerms = {}
  const match = rawNote.match(FINANCIAL_META_REGEX)
  if (match && match[1]) {
    try {
      financial = JSON.parse(match[1])
    } catch {
      financial = {}
    }
  }

  const isBranchType = financial.property_type === 'branch'
  const hasForeignResident =
    rawNote.includes(TM30_TAG) || rawNote.includes('แจ้งที่พักอาศัยคนต่างด้าว')

  // Priority 1: Explicitly saved property_type takes precedence
  // If property_type is 'branch', it is NEVER a house.
  // If property_type is 'house', it is ALWAYS a house.
  // Fallback (for legacy data without property_type): infer from properties
  const isBranchFallback =
    rawNote.includes('ประเภท: สาขา') ||
    rawNote.includes('สำหรับสาขา') ||
    rawNote.includes('สาขา / สถานประกอบการ')

  const isHouse =
    financial.property_type === 'house'
      ? true
      : isBranchType || isBranchFallback
      ? false
      : Boolean(financial.property_price) ||
        Boolean(financial.down_payment) ||
        rawNote.includes('ประเภท: บ้าน') ||
        rawNote.includes('เช่าซื้อ') ||
        rawNote.includes('สำหรับบ้าน')

  const cleanNote = cleanRawNote(rawNote)

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

  const clean = cleanRawNote(userNote)

  if (clean) {
    parts.push(clean)
  }

  // Foreign resident (ตม.30) can be enabled for both branch and house
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

/**
 * Helper to determine if a contract, lead, or payment record represents a house/residential property
 */
export function isHouseRecord(record?: any): boolean {
  if (!record) return false

  // 1. Check location name for explicit branch indicators
  const locName =
    record.locations?.location_name ||
    record.rental_contracts?.locations?.location_name ||
    ''
  const hasBranchInLocation =
    locName.includes('สาขา') || locName.toLowerCase().includes('branch')

  // 2. Check branch-specific registration flags
  const hasBranchFlags =
    Boolean(record.need_branch_registration) ||
    Boolean(record.need_vat_registration) ||
    Boolean(record.need_signboard) ||
    Boolean(record.need_employer_change) ||
    Boolean(record.need_excise_permit) ||
    Boolean(record.rental_contracts?.need_branch_registration) ||
    Boolean(record.rental_contracts?.need_vat_registration) ||
    Boolean(record.rental_contracts?.need_signboard) ||
    Boolean(record.rental_contracts?.need_employer_change) ||
    Boolean(record.rental_contracts?.need_excise_permit)

  const directNote =
    record.note ||
    (Array.isArray(record.rental_leads)
      ? record.rental_leads[0]?.note
      : record.rental_leads?.note)
  const rc = record.rental_contracts
  const contractNote =
    rc?.note ||
    (Array.isArray(rc?.rental_leads) ? rc?.rental_leads[0]?.note : rc?.rental_leads?.note)

  const effectiveNote = directNote || contractNote || ''
  const parsed = parseLeadMetadata(effectiveNote)

  // Explicit property_type in metadata has highest priority
  if (parsed.financial.property_type === 'house') return true
  if (parsed.financial.property_type === 'branch') return false

  // If location has สาขา or has branch registration flags -> it is a branch!
  if (hasBranchInLocation || hasBranchFlags) return false

  return parsed.isHouse
}
