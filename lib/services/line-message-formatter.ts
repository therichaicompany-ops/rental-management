import type {
  PayableRentMessageData,
  ReceivableRentMessageData,
} from '@/lib/types/line'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

/**
 * Reusable Message Formatter for PAYABLE (บริษัทจ่ายค่าเช่า)
 * Generates both Text Message and LINE Flex Message Container
 */
export function formatPayableRentMessage(data: PayableRentMessageData) {
  const formattedRent = formatCurrency(data.rentAmount)
  const formattedWht = formatCurrency(data.whtAmount || 0)
  const formattedService = formatCurrency(data.serviceAmount || 0)
  const formattedNet = formatCurrency(data.netAmount)
  const formattedDueDate = formatDate(data.dueDate)

  // Plain Text Version
  const text = [
    '🔔 แจ้งเตือนครบกำหนด: บริษัทจ่ายค่าเช่า (PAYABLE)',
    '──────────────────',
    `📌 ประเภท: บริษัทจ่ายค่าเช่า`,
    `👤 ผู้ติดต่อ/เจ้าของ: ${data.contactName}`,
    `🏢 สถานที่: ${data.locationName}`,
    `🚪 ห้อง/ยูนิต: ${data.roomNo || '-'}`,
    `💰 ค่าเช่า: ${formattedRent}`,
    `📉 หัก ณ ที่จ่าย: ${formattedWht}`,
    `🛠️ ค่าบริการ: ${formattedService}`,
    `💵 ยอดจ่ายจริง: ${formattedNet}`,
    `📅 วันครบกำหนด: ${formattedDueDate}`,
    `📊 สถานะ: ${data.status}`,
    data.contractNo ? `📄 สัญญาเลขที่: ${data.contractNo}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  // Flex Message Container (Bubble)
  const flex = {
    type: 'bubble',
    size: 'mega',
    header: {
      type: 'box',
      layout: 'vertical',
      backgroundColor: '#BE123C', // Deep Rose / Red for Payable
      paddingAll: '16px',
      contents: [
        {
          type: 'text',
          text: 'แจ้งเตือนชำระค่าเช่า (บริษัทจ่าย)',
          color: '#FFFFFF',
          weight: 'bold',
          size: 'md',
        },
        {
          type: 'text',
          text: 'PAYABLE RENT NOTIFICATION',
          color: '#FFE4E6',
          size: 'xxs',
          margin: 'xs',
          weight: 'bold',
        },
      ],
    },
    body: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '16px',
      spacing: 'md',
      contents: [
        // Location & Contact
        {
          type: 'box',
          layout: 'vertical',
          spacing: 'xs',
          contents: [
            {
              type: 'text',
              text: data.locationName,
              weight: 'bold',
              size: 'lg',
              color: '#1E293B',
              wrap: true,
            },
            {
              type: 'text',
              text: `ผู้ให้เช่า: ${data.contactName} ${data.roomNo ? `(ห้อง ${data.roomNo})` : ''}`,
              size: 'xs',
              color: '#64748B',
            },
          ],
        },
        { type: 'separator', color: '#E2E8F0' },
        // Details Grid
        {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                { type: 'text', text: 'ประเภทงาน', size: 'xs', color: '#64748B', flex: 4 },
                { type: 'text', text: 'บริษัทจ่ายค่าเช่า', size: 'xs', color: '#0F172A', weight: 'bold', flex: 6, align: 'end' },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                { type: 'text', text: 'ค่าเช่าสัญญา', size: 'xs', color: '#64748B', flex: 4 },
                { type: 'text', text: formattedRent, size: 'xs', color: '#0F172A', flex: 6, align: 'end' },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                { type: 'text', text: 'หัก ณ ที่จ่าย', size: 'xs', color: '#64748B', flex: 4 },
                { type: 'text', text: formattedWht, size: 'xs', color: '#BE123C', flex: 6, align: 'end' },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                { type: 'text', text: 'ค่าบริการ/ส่วนกลาง', size: 'xs', color: '#64748B', flex: 4 },
                { type: 'text', text: formattedService, size: 'xs', color: '#0F172A', flex: 6, align: 'end' },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                { type: 'text', text: 'วันครบกำหนด', size: 'xs', color: '#64748B', flex: 4 },
                { type: 'text', text: formattedDueDate, size: 'xs', color: '#D97706', weight: 'bold', flex: 6, align: 'end' },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                { type: 'text', text: 'สถานะ', size: 'xs', color: '#64748B', flex: 4 },
                { type: 'text', text: data.status, size: 'xs', color: '#059669', weight: 'bold', flex: 6, align: 'end' },
              ],
            },
          ],
        },
        { type: 'separator', color: '#E2E8F0' },
        // Net amount highlight box
        {
          type: 'box',
          layout: 'vertical',
          backgroundColor: '#FFF1F2',
          cornerRadius: '8px',
          paddingAll: '12px',
          contents: [
            {
              type: 'text',
              text: 'ยอดจ่ายสุทธิ (Net Payable)',
              size: 'xxs',
              color: '#9F1239',
              weight: 'bold',
            },
            {
              type: 'text',
              text: formattedNet,
              size: 'xl',
              weight: 'bold',
              color: '#BE123C',
              margin: 'xs',
            },
          ],
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '12px',
      contents: [
        {
          type: 'text',
          text: 'ระบบบริหารงานเช่าและเปิดสาขา (Rental Management)',
          size: 'xxs',
          color: '#94A3B8',
          align: 'center',
        },
      ],
    },
  }

  return { text, flex, altText: `แจ้งเตือนชำระค่าเช่า (บริษัทจ่าย): ${data.locationName} - ยอดสุทธิ ${formattedNet}` }
}

/**
 * Reusable Message Formatter for RECEIVABLE (ลูกค้าจ่ายค่าเช่า)
 * Generates both Text Message and LINE Flex Message Container
 */
export function formatReceivableRentMessage(data: ReceivableRentMessageData) {
  const formattedRent = formatCurrency(data.rentAmount)
  const formattedService = formatCurrency(data.serviceAmount || 0)
  const formattedReceivable = formatCurrency(data.receivableAmount)
  const formattedDueDate = formatDate(data.dueDate)

  // Plain Text Version
  const text = [
    '🔔 แจ้งเตือนครบกำหนด: เรียกเก็บค่าเช่าลูกค้า (RECEIVABLE)',
    '──────────────────',
    `📌 ประเภท: ลูกค้าจ่ายค่าเช่า`,
    `👤 ลูกค้า: ${data.customerName}`,
    `🏢 สถานที่: ${data.locationName}`,
    `🚪 ห้อง/ยูนิต: ${data.roomNo || '-'}`,
    `💰 ค่าเช่า: ${formattedRent}`,
    `🛠️ ค่าบริการ: ${formattedService}`,
    `💵 ยอดที่ต้องรับ: ${formattedReceivable}`,
    `📅 วันครบกำหนด: ${formattedDueDate}`,
    `📊 สถานะ: ${data.status}`,
    data.contractNo ? `📄 สัญญาเลขที่: ${data.contractNo}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  // Flex Message Container (Bubble)
  const flex = {
    type: 'bubble',
    size: 'mega',
    header: {
      type: 'box',
      layout: 'vertical',
      backgroundColor: '#0D9488', // Emerald / Teal for Receivable
      paddingAll: '16px',
      contents: [
        {
          type: 'text',
          text: 'แจ้งเตือนเรียกเก็บค่าเช่า (รับจากลูกค้า)',
          color: '#FFFFFF',
          weight: 'bold',
          size: 'md',
        },
        {
          type: 'text',
          text: 'RECEIVABLE RENT NOTIFICATION',
          color: '#CCFBF1',
          size: 'xxs',
          margin: 'xs',
          weight: 'bold',
        },
      ],
    },
    body: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '16px',
      spacing: 'md',
      contents: [
        // Location & Customer
        {
          type: 'box',
          layout: 'vertical',
          spacing: 'xs',
          contents: [
            {
              type: 'text',
              text: data.locationName,
              weight: 'bold',
              size: 'lg',
              color: '#1E293B',
              wrap: true,
            },
            {
              type: 'text',
              text: `ลูกค้า: ${data.customerName} ${data.roomNo ? `(ห้อง ${data.roomNo})` : ''}`,
              size: 'xs',
              color: '#64748B',
            },
          ],
        },
        { type: 'separator', color: '#E2E8F0' },
        // Details Grid
        {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          contents: [
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                { type: 'text', text: 'ประเภทงาน', size: 'xs', color: '#64748B', flex: 4 },
                { type: 'text', text: 'ลูกค้าจ่ายค่าเช่า', size: 'xs', color: '#0F172A', weight: 'bold', flex: 6, align: 'end' },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                { type: 'text', text: 'ค่าเช่า', size: 'xs', color: '#64748B', flex: 4 },
                { type: 'text', text: formattedRent, size: 'xs', color: '#0F172A', flex: 6, align: 'end' },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                { type: 'text', text: 'ค่าบริการ/ส่วนกลาง', size: 'xs', color: '#64748B', flex: 4 },
                { type: 'text', text: formattedService, size: 'xs', color: '#0F172A', flex: 6, align: 'end' },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                { type: 'text', text: 'วันครบกำหนด', size: 'xs', color: '#64748B', flex: 4 },
                { type: 'text', text: formattedDueDate, size: 'xs', color: '#D97706', weight: 'bold', flex: 6, align: 'end' },
              ],
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                { type: 'text', text: 'สถานะ', size: 'xs', color: '#64748B', flex: 4 },
                { type: 'text', text: data.status, size: 'xs', color: '#0D9488', weight: 'bold', flex: 6, align: 'end' },
              ],
            },
          ],
        },
        { type: 'separator', color: '#E2E8F0' },
        // Receivable amount highlight box
        {
          type: 'box',
          layout: 'vertical',
          backgroundColor: '#F0FDFA',
          cornerRadius: '8px',
          paddingAll: '12px',
          contents: [
            {
              type: 'text',
              text: 'ยอดที่ต้องเรียกเก็บ (Net Receivable)',
              size: 'xxs',
              color: '#0F766E',
              weight: 'bold',
            },
            {
              type: 'text',
              text: formattedReceivable,
              size: 'xl',
              weight: 'bold',
              color: '#0D9488',
              margin: 'xs',
            },
          ],
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      paddingAll: '12px',
      contents: [
        {
          type: 'text',
          text: 'ระบบบริหารงานเช่าและเปิดสาขา (Rental Management)',
          size: 'xxs',
          color: '#94A3B8',
          align: 'center',
        },
      ],
    },
  }

  return { text, flex, altText: `แจ้งเตือนเรียกเก็บค่าเช่า (รับจากลูกค้า): ${data.locationName} - ยอดสุทธิ ${formattedReceivable}` }
}
