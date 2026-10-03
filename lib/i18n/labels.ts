import type { Tri } from './tx'
export { labelOf } from './tx'
export type { Tri } from './tx'

/**
 * 3-language labels for shared enum/status values.
 * Keys mirror the Thai-only *_LABELS constants in lib/types/*.
 */

export const CONTRACT_STATUS_TRI: Record<string, Tri> = {
  draft: { th: 'ฉบับร่าง', en: 'Draft', my: 'မူကြမ်း' },
  negotiating: { th: 'อยู่ระหว่างเจรจา', en: 'Negotiating', my: 'ညှိနှိုင်းဆဲ' },
  agreed: { th: 'ตกลงแล้ว', en: 'Agreed', my: 'သဘောတူပြီး' },
  active: { th: 'มีผลบังคับใช้ (Active)', en: 'Active', my: 'အသက်ဝင်နေသည်' },
  expiring: { th: 'ใกล้หมดอายุ', en: 'Expiring Soon', my: 'သက်တမ်းကုန်ခါနီး' },
  expired: { th: 'หมดอายุแล้ว', en: 'Expired', my: 'သက်တမ်းကုန်ပြီး' },
  cancelled: { th: 'ยกเลิก', en: 'Cancelled', my: 'ပယ်ဖျက်ပြီး' },
}

export const PAYMENT_STATUS_TRI: Record<string, Tri> = {
  pending: { th: 'รอชำระ', en: 'Pending', my: 'ပေးချေရန်စောင့်ဆဲ' },
  partial: { th: 'ชำระบางส่วน', en: 'Partially Paid', my: 'တစ်စိတ်တစ်ပိုင်းပေးပြီး' },
  paid: { th: 'ชำระครบแล้ว', en: 'Paid', my: 'အပြည့်ပေးချေပြီး' },
  overdue: { th: 'เกินกำหนดชำระ', en: 'Overdue', my: 'ရက်လွန်' },
  cancelled: { th: 'ยกเลิก', en: 'Cancelled', my: 'ပယ်ဖျက်ပြီး' },
  waived: { th: 'ยกเว้น', en: 'Waived', my: 'ကင်းလွတ်ခွင့်' },
}

export const PAYMENT_TYPE_TRI: Record<string, Tri> = {
  payable: { th: 'จ่ายเจ้าของ', en: 'Pay Owner', my: 'ပိုင်ရှင်ထံပေးချေ' },
  receivable: { th: 'รับจากลูกค้า', en: 'From Customer', my: 'ဖောက်သည်ထံမှလက်ခံ' },
}

export const PAYMENT_TYPE_LONG_TRI: Record<string, Tri> = {
  payable: {
    th: 'บริษัทต้องจ่ายเจ้าของ (Payable)',
    en: 'Company pays owner (Payable)',
    my: 'ကုမ္ပဏီမှ ပိုင်ရှင်ထံ ပေးချေရန် (Payable)',
  },
  receivable: {
    th: 'ลูกค้าต้องจ่ายบริษัท (Receivable)',
    en: 'Customer pays company (Receivable)',
    my: 'ဖောက်သည်မှ ကုမ္ပဏီထံ ပေးချေရန် (Receivable)',
  },
}

export const PAYMENT_METHOD_TRI: Record<string, Tri> = {
  bank_transfer: { th: 'โอนเงินผ่านธนาคาร', en: 'Bank Transfer', my: 'ဘဏ်လွှဲ' },
  cheque: { th: 'เช็คธนาคาร', en: 'Cheque', my: 'ချက်လက်မှတ်' },
  cash: { th: 'เงินสด', en: 'Cash', my: 'ငွေသား' },
  other: { th: 'อื่นๆ', en: 'Other', my: 'အခြား' },
}

export const PROJECT_STATUS_TRI: Record<string, Tri> = {
  not_started: { th: 'ยังไม่เริ่ม', en: 'Not Started', my: 'မစတင်ရသေး' },
  in_progress: { th: 'กำลังดำเนินการ', en: 'In Progress', my: 'ဆောင်ရွက်နေဆဲ' },
  on_hold: { th: 'ระงับชั่วคราว (On-hold)', en: 'On Hold', my: 'ခေတ္တရပ်ထား' },
  ready_to_open: { th: 'พร้อมเปิดสาขา', en: 'Ready to Open', my: 'ဖွင့်ရန်အသင့်' },
  opened: { th: 'เปิดสาขาเรียบร้อย', en: 'Opened', my: 'ဖွင့်လှစ်ပြီး' },
  cancelled: { th: 'ยกเลิก', en: 'Cancelled', my: 'ပယ်ဖျက်ပြီး' },
}

export const TASK_STATUS_TRI: Record<string, Tri> = {
  todo: { th: 'รอดำเนินการ', en: 'To Do', my: 'လုပ်ဆောင်ရန်' },
  in_progress: { th: 'กำลังทำ', en: 'In Progress', my: 'လုပ်ဆောင်နေဆဲ' },
  waiting: { th: 'รอข้อมูล/รออนุมัติ', en: 'Waiting', my: 'စောင့်ဆိုင်းဆဲ' },
  done: { th: 'เสร็จสิ้น', en: 'Done', my: 'ပြီးဆုံး' },
  skipped: { th: 'ข้าม', en: 'Skipped', my: 'ကျော်ထား' },
  cancelled: { th: 'ยกเลิก', en: 'Cancelled', my: 'ပယ်ဖျက်ပြီး' },
}

/** Workflow stage names keyed by stage_code */
export const STAGE_NAME_TRI: Record<string, Tri> = {
  NEGOTIATION: { th: 'โทรเจรจาการเช่า', en: 'Rental Negotiation', my: 'ငှားရမ်းမှု ညှိနှိုင်းခြင်း' },
  AGREED: { th: 'ตกลงเช่า', en: 'Rental Agreed', my: 'ငှားရန် သဘောတူ' },
  DEPOSIT: { th: 'รับมัดจำ / ค่าเช่าล่วงหน้า', en: 'Deposit / Advance Rent', my: 'စရံငွေ / ကြိုတင်ငှားခ' },
  CONTRACT: { th: 'นัดทำสัญญาเช่า', en: 'Contract Signing', my: 'စာချုပ်ချုပ်ဆိုခြင်း' },
  DOCUMENT_CHECK: { th: 'ตรวจสอบเอกสาร', en: 'Document Check', my: 'စာရွက်စာတမ်း စစ်ဆေးခြင်း' },
  SEND_ACCOUNTING: { th: 'ส่งเรื่องให้บัญชี', en: 'Send to Accounting', my: 'စာရင်းဌာနသို့ ပို့ခြင်း' },
  BRANCH_REGISTRATION: { th: 'จดสาขา', en: 'Branch Registration', my: 'ဆိုင်ခွဲ မှတ်ပုံတင်ခြင်း' },
  SIGNBOARD: { th: 'ทำป้ายบริษัท', en: 'Company Signboard', my: 'ကုမ္ပဏီ ဆိုင်းဘုတ်' },
  EMPLOYMENT_CHANGE: {
    th: 'เปลี่ยนนายจ้าง / รออนุมัติจัดหางาน',
    en: 'Employer Change / Job Approval',
    my: 'အလုပ်ရှင်ပြောင်းခြင်း / အလုပ်အကိုင် ခွင့်ပြုချက်',
  },
  JOB_APPROVAL: { th: 'ทำประกันสังคมต่างด้าว', en: 'Foreign Worker Social Security', my: 'နိုင်ငံခြားသား လူမှုဖူလုံရေး' },
  PRE_OPEN_SIGN: { th: 'เซ็นเอกสารก่อนเปิดร้าน', en: 'Pre-open Signing', my: 'ဆိုင်မဖွင့်မီ စာရွက်လက်မှတ်ထိုး' },
  READY_TO_OPEN: { th: 'พร้อมเปิดร้าน', en: 'Ready to Open', my: 'ဆိုင်ဖွင့်ရန် အသင့်' },
  OPENED: { th: 'เปิดร้านแล้ว', en: 'Opened', my: 'ဆိုင်ဖွင့်ပြီး' },
}

export const LEAD_STATUS_TRI: Record<string, Tri> = {
  new: { th: 'ใหม่', en: 'New', my: 'အသစ်' },
  contacting: { th: 'กำลังติดต่อ', en: 'Contacting', my: 'ဆက်သွယ်နေဆဲ' },
  negotiating: { th: 'อยู่ระหว่างเจรจา', en: 'Negotiating', my: 'ညှိနှိုင်းဆဲ' },
  follow_up: { th: 'ติดตามผล', en: 'Follow Up', my: 'နောက်ဆက်တွဲ' },
  agreed: { th: 'ตกลงแล้ว (รอทำสัญญา)', en: 'Agreed (Awaiting Contract)', my: 'သဘောတူပြီး (စာချုပ်စောင့်ဆဲ)' },
  lost: { th: 'ไม่สำเร็จ / หลุด', en: 'Lost', my: 'မအောင်မြင်' },
  cancelled: { th: 'ยกเลิก', en: 'Cancelled', my: 'ပယ်ဖျက်ပြီး' },
  converted: { th: 'สร้างสัญญาแล้ว', en: 'Contract Created', my: 'စာချုပ်ပြုလုပ်ပြီး' },
}

export const CONTACT_METHOD_TRI: Record<string, Tri> = {
  phone: { th: 'โทรศัพท์', en: 'Phone', my: 'ဖုန်း' },
  line: { th: 'LINE', en: 'LINE', my: 'LINE' },
  facebook: { th: 'Facebook', en: 'Facebook', my: 'Facebook' },
  email: { th: 'อีเมล', en: 'Email', my: 'အီးမေးလ်' },
  onsite: { th: 'ลงพื้นที่ / พบตัว', en: 'On-site Visit', my: 'နေရာသို့ သွားရောက်' },
  other: { th: 'ช่องทางอื่นๆ', en: 'Other', my: 'အခြား' },
}

export const DOCUMENT_TYPE_TRI: Record<string, Tri> = {
  RENTAL_CONTRACT: { th: 'สัญญาเช่า', en: 'Rental Contract', my: 'ငှားရမ်းစာချုပ်' },
  TRANSFER_SLIP: { th: 'สลิปโอนเงิน', en: 'Transfer Slip', my: 'ငွေလွှဲပြေစာ' },
  MAP: { th: 'แผนที่', en: 'Map', my: 'မြေပုံ' },
  VAT_DOCUMENT: { th: 'เอกสาร VAT', en: 'VAT Document', my: 'VAT စာရွက်စာတမ်း' },
  BRANCH_DOCUMENT: { th: 'เอกสารสาขา', en: 'Branch Document', my: 'ဆိုင်ခွဲ စာရွက်စာတမ်း' },
  EMPLOYMENT_DOCUMENT: { th: 'เอกสารแรงงาน', en: 'Employment Document', my: 'အလုပ်သမား စာရွက်စာတမ်း' },
  SIGNBOARD: { th: 'ป้ายบริษัท', en: 'Signboard', my: 'ဆိုင်းဘုတ်' },
  PRE_OPEN_DOCUMENT: { th: 'เอกสารก่อนเปิดร้าน', en: 'Pre-open Document', my: 'ဆိုင်မဖွင့်မီ စာရွက်စာတမ်း' },
  PASSPORT: { th: 'หน้าพาสปอร์ต', en: 'Passport', my: 'နိုင်ငံကူးလက်မှတ်' },
  VISA: { th: 'หน้าวีซ่า', en: 'Visa', my: 'ဗီဇာ' },
  WORK_PERMIT: { th: 'ใบอนุญาตทำงาน (Work permit)', en: 'Work Permit', my: 'အလုပ်လုပ်ခွင့်' },
  SMART_CARD: { th: 'Smart card', en: 'Smart Card', my: 'Smart Card' },
  PINK_CARD: { th: 'บัตรชมพู', en: 'Pink Card', my: 'ပန်းရောင်ကတ်' },
  OVERSTAY_90_DAYS_NOTICE: {
    th: 'ใบรับแจ้งอยู่เกิน 90 วัน',
    en: '90-Day Report Receipt',
    my: 'ရက် ၉၀ အစီရင်ခံစာ',
  },
  ID_CARD: { th: 'สำเนาบัตรประชาชน', en: 'ID Card Copy', my: 'မှတ်ပုံတင် မိတ္တူ' },
  COMPANY_CERTIFICATE: { th: 'หนังสือรับรองบริษัท', en: 'Company Certificate', my: 'ကုမ္ပဏီ အသိအမှတ်ပြုလက်မှတ်' },
  DIRECTOR_ID_CARD: { th: 'สำเนาบัตรประชาชนกรรมการ', en: 'Director ID Card Copy', my: 'ဒါရိုက်တာ မှတ်ပုံတင် မိတ္တူ' },
  OTHER: { th: 'อื่นๆ', en: 'Other', my: 'အခြား' },
}

export const ENTITY_TYPE_TRI: Record<string, Tri> = {
  lead: { th: 'งานเช่า (Lead)', en: 'Lead', my: 'Lead' },
  contract: { th: 'สัญญาเช่า', en: 'Contract', my: 'စာချုပ်' },
  rent_payment: { th: 'ค่าเช่า', en: 'Rent Payment', my: 'ငှားခ' },
  opening_project: { th: 'เปิดสาขา', en: 'Branch Opening', my: 'ဆိုင်ခွဲဖွင့်ခြင်း' },
  task: { th: 'งาน', en: 'Task', my: 'လုပ်ငန်း' },
  customer: { th: 'ลูกค้า', en: 'Customer', my: 'ဖောက်သည်' },
  location: { th: 'สถานที่', en: 'Location', my: 'နေရာ' },
  payment_transaction: { th: 'รายการชำระเงิน', en: 'Payment Transaction', my: 'ငွေပေးချေမှု' },
}

export const ROLE_TRI: Record<string, Tri> = {
  owner: { th: 'เจ้าของ', en: 'Owner', my: 'ပိုင်ရှင်' },
  admin: { th: 'ผู้ดูแลระบบ', en: 'Admin', my: 'စီမံခန့်ခွဲသူ' },
  accounting: { th: 'บัญชี', en: 'Accounting', my: 'စာရင်းကိုင်' },
  hr: { th: 'ฝ่ายบุคคล', en: 'HR', my: 'ဝန်ထမ်းရေးရာ' },
  operation: { th: 'ปฏิบัติการ', en: 'Operation', my: 'လုပ်ငန်းလည်ပတ်ရေး' },
  staff: { th: 'พนักงาน', en: 'Staff', my: 'ဝန်ထမ်း' },
  viewer: { th: 'ผู้ดูอย่างเดียว', en: 'Viewer', my: 'ကြည့်ရှုသူ' },
}

/** Common short words reused across many screens */
export const W = {
  installments: { th: 'งวด', en: 'installments', my: 'အရစ်' },
  perMonth: { th: '/ด.', en: '/mo', my: '/လ' },
  phone: { th: 'โทร', en: 'Tel', my: 'ဖုန်း' },
  location: { th: 'สถานที่', en: 'Location', my: 'နေရာ' },
  note: { th: 'หมายเหตุ', en: 'Note', my: 'မှတ်ချက်' },
  years: { th: 'ปี', en: 'years', my: 'နှစ်' },
  house: { th: 'บ้าน / เช่าซื้อ', en: 'House / Hire-purchase', my: 'အိမ် / အရစ်ကျဝယ်' },
  branch: { th: 'สาขา / สถานประกอบการ', en: 'Branch / Business', my: 'ဆိုင်ခွဲ / လုပ်ငန်းဌာန' },
  houseResidential: { th: 'บ้าน / ที่พักอาศัย', en: 'House / Residence', my: 'အိမ် / နေထိုင်ရာ' },
  landlord: { th: 'ผู้ให้เช่า', en: 'Landlord', my: 'အိမ်ရှင်' },
  tenant: { th: 'ผู้เช่า', en: 'Tenant', my: 'အငှားချထားသူ' },
  saveError: {
    th: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
    en: 'An error occurred. Please try again.',
    my: 'အမှားဖြစ်ပွားခဲ့သည်။ ထပ်မံကြိုးစားပါ။',
  },
  deleteError: { th: 'ไม่สามารถลบข้อมูลได้', en: 'Unable to delete record', my: 'ဖျက်၍မရပါ' },
  deleteErrorGeneric: {
    th: 'เกิดข้อผิดพลาดในการลบข้อมูล',
    en: 'Error deleting record',
    my: 'ဖျက်ရာတွင် အမှားဖြစ်ပွားခဲ့သည်',
  },
} satisfies Record<string, Tri>
