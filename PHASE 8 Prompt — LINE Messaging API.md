ต่อจาก PHASE 7

เพิ่ม LINE Messaging API

สำคัญ:
ห้ามเปิดเผย credential ฝั่ง client

Environment variables:

LINE_CHANNEL_ACCESS_TOKEN
LINE_CHANNEL_SECRET

เก็บเฉพาะ server-side / Edge Function

สร้าง:

supabase/functions/line-webhook
supabase/functions/send-line-message

Webhook:

รับ LINE event

ตรวจสอบ:

x-line-signature

เก็บ Group ID

สร้างหน้า:

/settings/line

ให้ Owner/Admin ตั้งค่า:

ชื่อกลุ่ม
Group ID
ประเภทกลุ่ม
สถานะ active

Database:

line_destinations

มี 2 กลุ่มหลัก:

PAYABLE
บริษัทจ่ายค่าเช่า

RECEIVABLE
ลูกค้าจ่ายค่าเช่า

ถ้าจำเป็นให้เพิ่ม field:

destination_type

LINE Message Service ต้องรองรับ:

text message
Flex Message

สร้าง reusable message formatter:

formatPayableRentMessage()
formatReceivableRentMessage()

PAYABLE message ต้องแสดง:

ประเภท
ผู้ติดต่อ/เจ้าของ
ห้อง
สถานที่
ค่าเช่า
หัก ณ ที่จ่าย
ค่าบริการ
ยอดจ่ายจริง
วันครบกำหนด
สถานะ

RECEIVABLE:

ประเภท
ลูกค้า
ห้อง
สถานที่
ค่าเช่า
ค่าบริการ
ยอดที่ต้องรับ
วันครบกำหนด
สถานะ

สร้างปุ่มใน Settings:

"ทดสอบส่ง LINE"

ห้ามส่งจริงถ้าไม่มี Group ID

เก็บผลการส่งใน notification_logs

ทำ error handling

ทำเฉพาะ PHASE 8
ห้ามสร้าง Cron
แล้วหยุด