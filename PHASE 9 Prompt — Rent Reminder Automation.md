ต่อจาก PHASE 8

สร้างระบบแจ้งเตือนค่าเช่าอัตโนมัติ

ใช้:

Supabase Edge Functions
Supabase Cron

Default:

7 วันก่อนครบกำหนด

รองรับ:

7 วัน
3 วัน
1 วัน
วันครบกำหนด
Overdue

ตั้งค่าได้ใน:

system_settings

Settings:

rent_reminder_enabled
rent_reminder_days
rent_reminder_time
overdue_reminder_enabled

สร้าง:

supabase/functions/rent-reminder

Logic:

ทุกวัน:

1. ค้นหา rent_payments
2. status != paid
3. ตรวจ due_date
4. ตรวจ reminder day
5. หา LINE destination
6. ตรวจ notification_logs
7. ถ้ายังไม่เคยส่ง
8. ส่ง LINE
9. บันทึก log

PAYABLE
→ Group บริษัทจ่าย

RECEIVABLE
→ Group ลูกค้าจ่าย

ถ้า status = paid:
ห้ามส่ง

ถ้า notification เคยส่งวันเดียวกัน:
ห้ามส่งซ้ำ

notification_logs:

notification_type
entity_type
entity_id
destination_id
notification_date
status
message
sent_at
error_message

ต้องรองรับ failed notification

ถ้าส่งไม่สำเร็จ:
status = failed
เก็บ error_message

สร้างหน้า:

/settings/notifications

แสดง:

เปิด/ปิด
วันแจ้งเตือน
เวลา
LINE Groups

สร้างหน้า:

/notifications

แสดงประวัติ:

ส่งสำเร็จ
ส่งไม่สำเร็จ

สร้าง Cron:

ทุกวัน 09:00 Asia/Bangkok

และเรียก:

mark_overdue_rent_payments()

ก่อนส่ง notification

ทดสอบ:

Due in 7 days
Due in 3 days
Due today
Overdue
Paid
Duplicate

ทำเฉพาะ PHASE 9
แล้วหยุด