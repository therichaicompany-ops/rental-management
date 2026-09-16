ต่อจาก PHASE 9

สร้างระบบค่าเช่ารายเดือนอัตโนมัติ

ถ้า:

rental_contracts.recurring_rent_enabled = true

ระบบสร้าง rent_payments รายเดือน

ต้องใช้:

contract_id
payment_type
billing_period

และป้องกัน duplicate ด้วย:

unique(contract_id, payment_type, billing_period)

Logic:

อ่าน active contracts

ตรวจ:

start_date
end_date
monthly_rent
payment_due_day

สร้างงวดเดือนที่ยังไม่มี

รองรับ:

PAYABLE
RECEIVABLE

คำนวณ:

rent_amount
wht_amount
service_amount
other_amount
gross_amount
net_amount

ถ้า contract มี:

wht_enabled = true

ใช้:

wht_rate

ในการคำนวณ

ห้ามสร้างงวดหลัง end_date

ถ้าสัญญา expired:
หยุดสร้าง

สร้าง:

supabase/functions/generate-recurring-rent

ใช้ Cron

ตรวจ duplicate ทุกครั้ง

==================================================
PRODUCTION HARDENING
==================================================

ตรวจสอบทุก table:

RLS
INSERT
SELECT
UPDATE
DELETE

ตรวจสอบ:

Owner
Admin
Accounting
HR
Operation
Staff
Viewer

ห้ามใช้ client-side permission เป็น security boundary

ตรวจ:

Storage RLS
Signed URL
File upload

ตรวจ:

LINE secrets

ห้ามอยู่ client bundle

ตรวจ:

Environment variables

ตรวจ:

SQL queries

ตรวจ:

TypeScript

ตรวจ:

npm run lint

ตรวจ:

npm run build

ตรวจ:

loading states
error states
empty states

ตรวจ responsive:

Desktop
Tablet
Mobile

สร้าง:

404
403 / Access Denied
500 Error

สร้าง README.md

README ต้องมี:

1. Project Overview
2. Tech Stack
3. Environment Variables
4. Local Development
5. Supabase Setup
6. Database Setup
7. Storage Setup
8. LINE Setup
9. Cron Setup
10. Vercel Deployment
11. User Roles
12. Backup / Recovery notes

==================================================
PRODUCTION CHECKLIST
==================================================

ต้องสามารถใช้งาน flow นี้ครบ:

Lead
→ Negotiation
→ Agreed
→ Contract
→ Deposit
→ Documents
→ Accounting
→ Opening
→ Branch Registration
→ Signboard
→ Employer Change
→ Job Approval
→ Pre-open Sign
→ Ready
→ Opened
→ Active Rental
→ Recurring Rent
→ LINE Reminder

จากนั้น:

npm run lint
npm run build

ถ้ามี error
ให้แก้จนผ่าน

ห้ามเพิ่ม Feature ใหม่ที่ไม่ได้ระบุ

เมื่อเสร็จแล้วให้สรุป:

- Files created
- Files modified
- Database dependency
- Environment variables
- Cron jobs
- LINE setup
- Security
- Test results
- Build results
- Remaining issues

ทำเฉพาะ PHASE 10 แล้วจบ