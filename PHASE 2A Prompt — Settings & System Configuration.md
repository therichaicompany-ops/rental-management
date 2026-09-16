คุณคือ Senior Full-Stack Engineer เชี่ยวชาญ Next.js, TypeScript, Supabase และ Business Management System

ให้พัฒนา **PHASE 2A — Settings & System Configuration**
สำหรับระบบ Rental & Branch Management System

IMPORTANT:
- ทำต่อจาก PHASE 1
- ห้ามทำ Rental Lead
- ห้ามทำ Contract
- ห้ามทำ Rent Payment
- ห้ามทำ Opening Workflow หลัก
- ห้ามทำ LINE Automation
- ให้ทำเฉพาะ Settings และระบบ Configuration ที่ใช้ร่วมกับทุกโมดูล
- ห้ามรื้อ Authentication, Middleware, Layout และ Permission ที่ทำไปแล้ว
- ใช้ Database Schema Final V2 ที่มีอยู่แล้ว
- ถ้าต้องเพิ่ม database field ให้สร้าง migration ใหม่ ห้ามแก้ schema เดิมแบบเงียบ ๆ

==================================================
1. SETTINGS OVERVIEW
==================================================

สร้างหน้า:

/settings

โดยแบ่งเป็นหมวดดังนี้:

1. ข้อมูลบริษัท
2. ผู้ใช้งานและสิทธิ์
3. ค่าเช่าและการเงิน
4. Workflow
5. เอกสาร
6. การแจ้งเตือน
7. LINE
8. ระบบทั่วไป
9. Audit / Activity

หน้า Settings ต้องมี Sidebar หรือ Settings Navigation ของตัวเอง

Desktop:
Settings navigation ด้านซ้าย
Content ด้านขวา

Mobile:
ใช้ tabs / accordion / select navigation

==================================================
2. SETTINGS PERMISSION
==================================================

เฉพาะ:

owner
admin

สามารถเข้าหน้า Settings ทั้งหมด

Role อื่น:

ไม่สามารถแก้ไข Settings

Accounting:
ดูเฉพาะ settings ที่เกี่ยวกับค่าเช่า/การเงินได้
ถ้าต้องการให้แก้ไขต้องกำหนด permission เพิ่มภายหลัง

HR:
ดู workflow ที่เกี่ยวข้องกับ HR ได้

Operation:
ดู workflow ที่เกี่ยวข้องกับ operation ได้

Viewer:
ไม่สามารถแก้ไข settings

ห้ามใช้ frontend เป็น security boundary
ต้องใช้ RLS

==================================================
3. COMPANY SETTINGS
==================================================

สร้าง:

/settings/company

ใช้เก็บข้อมูลบริษัท

Fields:

company_name
company_name_en
company_code
tax_id
branch_no
address
phone
email
website
logo
default_province
default_timezone

Default timezone:

Asia/Bangkok

UI:

ชื่อบริษัท
ชื่อภาษาอังกฤษ
รหัสบริษัท
เลขประจำตัวผู้เสียภาษี
สำนักงานใหญ่/สาขา
ที่อยู่
เบอร์โทร
Email
Website
Logo
Timezone

สามารถ upload Logo ได้

Logo:
PNG
JPG
WEBP

สร้าง Supabase Storage bucket:

company-assets

เป็น private หรือควบคุมสิทธิ์ตามความเหมาะสม

ห้ามเปลี่ยน bucket documents

==================================================
4. USER MANAGEMENT
==================================================

สร้าง:

/settings/users

หรือ redirect ไป:

/users

แต่ Settings ต้องมี shortcut เข้าหน้านี้

แสดง:

ชื่อ
Email
โทรศัพท์
Role
แผนก
สถานะ
วันที่สร้าง

Actions:

เพิ่มผู้ใช้
เปลี่ยน Role
เปิดใช้งาน
ปิดใช้งาน

Roles:

owner
admin
accounting
hr
operation
staff
viewer

Role labels:

owner = เจ้าของระบบ
admin = ผู้ดูแลระบบ
accounting = บัญชี
hr = HR
operation = ฝ่ายปฏิบัติการ
staff = พนักงาน
viewer = ผู้ดูข้อมูล

Rules:

- ห้ามลบ Owner คนสุดท้าย
- ห้ามให้ user เปลี่ยน role ตัวเอง
- Owner/Admin เท่านั้นที่เปลี่ยน role
- Owner/Admin เท่านั้นที่ deactivate user
- ห้าม deactivate ตัวเอง
- ก่อน deactivate ต้องมี confirmation dialog

ถ้า database รองรับ:
แสดง Last Login

ถ้าไม่รองรับ:
ไม่ต้องสร้าง field ปลอม

==================================================
5. RENTAL & FINANCE SETTINGS
==================================================

สร้าง:

/settings/rental

ตั้งค่าระบบค่าเช่า

Fields:

rent_reminder_enabled
rent_reminder_days
rent_reminder_time
overdue_reminder_enabled
default_payment_due_day
default_wht_rate
default_service_amount

ความหมาย:

rent_reminder_enabled
เปิด/ปิดการแจ้งเตือนค่าเช่า

rent_reminder_days
จำนวนวันก่อนครบกำหนด

Default:
7

รองรับ:
1
3
7
14
หรือ Custom

rent_reminder_time
Default:
09:00

overdue_reminder_enabled
เปิด/ปิดการแจ้งเตือน overdue

default_payment_due_day
วันครบกำหนดค่าเช่าที่ใช้เป็นค่าเริ่มต้นเวลาเพิ่มสัญญา

default_wht_rate
อัตราหัก ณ ที่จ่าย default

ไม่บังคับให้ทุกสัญญาใช้ค่าเดียวกัน

default_service_amount
ค่าบริการเริ่มต้น

สำคัญ:
ค่าใน Settings เป็น "Default"
ผู้ใช้สามารถแก้ไขเฉพาะสัญญาได้ในภายหลัง

==================================================
6. PAYMENT SETTINGS
==================================================

สร้าง:

/settings/payment

ตั้งค่า:

วิธีการชำระเงินที่เปิดใช้งาน

Cash
Bank Transfer
PromptPay
Cheque
Other

สามารถ:

Enable / Disable

ตัวอย่าง:

☑ เงินสด
☑ โอนธนาคาร
☑ PromptPay
☐ เช็ค
☑ อื่น ๆ

ถ้าปิด:
ไม่ให้เลือกวิธีนั้นใน Payment Form

หมายเหตุ:
ห้ามลบ payment method ที่ถูกใช้ใน transaction แล้ว
ให้เปลี่ยนเป็น inactive

==================================================
7. WORKFLOW SETTINGS
==================================================

สร้าง:

/settings/workflow

ใช้ข้อมูลจาก:

workflow_stages

แสดง:

ลำดับ
Stage Code
ชื่อขั้นตอน
Required
Active

ตัวอย่าง:

1
โทรเจรจาการเช่า

2
ตกลงเช่า

3
รับมัดจำ

...

สามารถ:

- เพิ่ม Stage
- แก้ชื่อ
- เปลี่ยนลำดับ
- เปิด/ปิด Stage
- กำหนด Required
- Reorder ด้วย drag/drop ถ้าเหมาะสม

IMPORTANT:

ห้ามลบ workflow stage ที่มีข้อมูลถูกใช้อยู่

ถ้ามี record ที่ใช้งานแล้ว:
ให้เป็น inactive แทน

ต้องแสดง warning ก่อนเปลี่ยน sequence

==================================================
8. WORKFLOW REQUIREMENT SETTINGS
==================================================

สร้างส่วน:

เปิด/ปิด Requirement

รายการ:

ต้องจดสาขา
ต้องจด VAT
ต้องเปลี่ยนนายจ้าง
ต้องทำป้าย

หลักการ:

นี่เป็น Default ของระบบ

เมื่อสร้าง Rental Lead:
ให้ copy ค่า Default ไปเป็นค่าของ Lead

เมื่อสร้าง Contract:
ใช้ค่าของ Lead

อย่าให้เปลี่ยน Default ย้อนหลัง
ไปเปลี่ยนข้อมูล Lead/Contract ที่สร้างไปแล้ว

ตัวอย่าง:

Settings:

☑ จดสาขา
☐ จด VAT
☑ เปลี่ยนนายจ้าง
☑ ทำป้าย

เมื่อสร้าง Lead ใหม่
ระบบจะ copy:

need_branch_registration = true
need_vat_registration = false
need_employer_change = true
need_signboard = true

==================================================
9. DOCUMENT SETTINGS
==================================================

สร้าง:

/settings/documents

กำหนด:

Allowed file types

PDF
JPG
PNG
WEBP

Maximum file size

Default:
10 MB

Document Types

สามารถเปิด/ปิดประเภทเอกสาร:

RENTAL_CONTRACT
TRANSFER_SLIP
MAP
VAT_DOCUMENT
BRANCH_DOCUMENT
EMPLOYMENT_DOCUMENT
SIGNBOARD
PRE_OPEN_DOCUMENT
OTHER

ห้ามลบ document type ที่ถูกใช้งานแล้ว

ให้เปลี่ยนเป็น inactive

สามารถ:

เพิ่มประเภทเอกสาร
แก้ชื่อ
เปิด/ปิด

==================================================
10. LINE SETTINGS
==================================================

สร้าง:

/settings/line

แสดง:

LINE Messaging API

Status:

Connected / Not Connected

อย่าแสดง Access Token จริง

แสดง:

● Connected

หรือ:

○ Not Connected

เก็บ secret ใน environment / server-side secret

Database:

line_destinations

รองรับ:

Group 1
บริษัทจ่ายค่าเช่า

Group 2
ลูกค้าจ่ายค่าเช่า

Fields:

ชื่อกลุ่ม
Group ID
ประเภท
Active

Types:

PAYABLE
RECEIVABLE

สามารถ:

เพิ่ม
แก้ไข
เปิด/ปิด
ทดสอบส่งข้อความ

ปุ่ม:

[ ทดสอบส่ง LINE ]

ส่งข้อความทดสอบ:

"ทดสอบระบบแจ้งเตือนค่าเช่า"

ห้ามส่งข้อมูลจริง

ผล:

✅ ส่งสำเร็จ

หรือ

❌ ส่งไม่สำเร็จ

เก็บ log

==================================================
11. NOTIFICATION SETTINGS
==================================================

สร้าง:

/settings/notifications

รองรับ:

ค่าเช่า
Task
Workflow
System

ค่าเช่า:

☑ 7 วันก่อน
☐ 3 วันก่อน
☐ 1 วันก่อน
☐ วันครบกำหนด
☑ Overdue

สามารถเลือกหลายแบบ

ตัวอย่าง:

reminder_schedule

7
3
1
0

และ:

overdue_enabled

true / false

สามารถเปิด/ปิด notification category

Rental
Task
Workflow
System

==================================================
12. GENERAL SETTINGS
==================================================

สร้าง:

/settings/general

Fields:

company timezone
date format
currency
language
first day of week

Default:

timezone:
Asia/Bangkok

date format:
DD/MM/YYYY

currency:
THB

language:
ไทย

first day:
Monday

ไม่ต้องทำ i18n เต็มระบบใน Phase นี้

แต่โครงสร้างต้องเผื่อ English

==================================================
13. NUMBERING SETTINGS
==================================================

สร้าง:

/settings/numbering

กำหนดรูปแบบเลขที่:

Rental Lead
Contract
Opening Project
Customer
Landlord
Location

ตัวอย่าง:

LEAD-2026-001
CONTRACT-2026-001
OPEN-2026-001
CUS-0001
LAND-0001
LOC-0001

Settings:

prefix
year_enabled
padding

ตัวอย่าง:

Prefix:
LEAD

Year:
true

Padding:
3

ผล:

LEAD-2026-001

IMPORTANT:

เลขต้องไม่ซ้ำ

ห้ามสร้างเลขจาก frontend โดยตรงแบบ:

count + 1

เพราะอาจเกิด duplicate เมื่อมีหลาย user ใช้งานพร้อมกัน

ให้เตรียมระบบ sequence / database function สำหรับ production

==================================================
14. AUDIT / ACTIVITY
==================================================

สร้าง:

/settings/audit

สำหรับ Owner/Admin

แสดง:

วันที่
ผู้ใช้งาน
Action
Entity
รายละเอียด

ใช้:

activity_logs

Filter:

user
action
date
entity

Actions:

created
updated
status_changed
assigned
completed
uploaded
deleted
commented

ห้ามให้ผู้ใช้แก้ไข activity log

Read only

==================================================
15. SETTINGS DASHBOARD
==================================================

/settings

ด้านบนแสดง cards:

Company
Users
Rental
Workflow
LINE
Notifications

แต่ละ card แสดงสถานะ

ตัวอย่าง:

Company
✅ Configured

Users
12 active

Rental
✅ Reminder enabled

LINE
✅ Connected

Notifications
7 days before

Workflow
13 stages active

==================================================
16. SETTINGS DATABASE
==================================================

ใช้:

system_settings

สำหรับ settings ที่เป็น key/value

แต่อย่าพยายามเก็บทุกอย่างลง string เดียว

หากข้อมูลมีโครงสร้างจริง:
ให้ใช้ table แยก

เช่น:

workflow_stages
line_destinations

payment methods อาจใช้ system_settings หรือ dedicated table ตามความเหมาะสม

ต้องออกแบบให้ maintainable

==================================================
17. MIGRATION RULE
==================================================

หาก Final Schema V2 ไม่มี table สำหรับ requirement ใด:

สร้าง migration ใหม่

ห้ามแก้ migration เก่า

ห้าม DROP TABLE

ห้าม DROP COLUMN ที่มีข้อมูล

ห้ามเปลี่ยนข้อมูล production แบบ destructive

==================================================
18. SETTINGS UI
==================================================

Design:

Modern Business SaaS

Sidebar:

Settings

├── ข้อมูลบริษัท
├── ผู้ใช้งาน
├── ค่าเช่าและการเงิน
├── วิธีการชำระเงิน
├── Workflow
├── เอกสาร
├── LINE
├── การแจ้งเตือน
├── ระบบทั่วไป
├── เลขที่เอกสาร
└── Audit Log

ใช้:

Card
Tabs
Form
Switch
Select
Input
Checkbox
Badge
Dialog
Toast

Primary:

#F97316

==================================================
19. FORM VALIDATION
==================================================

ใช้ Zod

ตรวจ:

email
phone
tax_id
numbers
percent
time
file size
file type

WHT rate:

0-100

Reminder days:

>= 0

Payment due day:

1-31

==================================================
20. SECURITY
==================================================

Settings ห้ามเปิด public

ต้อง login

Owner/Admin เป็นผู้แก้ไข settings

Line secret/token:
server-side only

Storage:
private

Activity log:
read-only

ห้าม trust client role

ใช้ RLS

==================================================
21. FILE STRUCTURE
==================================================

แนะนำ:

app/
└── (protected)/
    └── settings/
        ├── page.tsx
        ├── company/
        ├── users/
        ├── rental/
        ├── payment/
        ├── workflow/
        ├── documents/
        ├── line/
        ├── notifications/
        ├── general/
        ├── numbering/
        └── audit/

components/
└── settings/
    ├── settings-sidebar.tsx
    ├── company-form.tsx
    ├── rental-settings-form.tsx
    ├── payment-settings.tsx
    ├── workflow-settings.tsx
    ├── document-settings.tsx
    ├── line-settings.tsx
    ├── notification-settings.tsx
    ├── general-settings.tsx
    ├── numbering-settings.tsx
    └── audit-log.tsx

lib/
└── settings/
    ├── settings-service.ts
    ├── permissions.ts
    └── numbering.ts

==================================================
22. TESTING
==================================================

ทดสอบ:

1. Viewer เข้า /settings
→ denied

2. Staff เข้า /settings
→ denied

3. Accounting เข้า /settings
→ read-only เฉพาะข้อมูลที่อนุญาต

4. Owner เข้า /settings
→ full access

5. Admin เข้า /settings
→ full access

6. เปลี่ยน reminder day
→ ค่าใน database เปลี่ยน

7. เปลี่ยน workflow active
→ workflow list เปลี่ยน

8. ปิด payment method
→ future form ต้องไม่แสดง method นั้น

9. เปลี่ยน company logo
→ upload สำเร็จ

10. Test LINE
→ log ถูกบันทึก

11. Activity log
→ การเปลี่ยน Settings ต้องถูกบันทึก

12. Refresh
→ settings ยังคงอยู่

==================================================
23. LOGGING
==================================================

ทุกการเปลี่ยนแปลงสำคัญต้องบันทึก:

activity_logs

ตัวอย่าง:

เปลี่ยนค่า:

rent_reminder_days

จาก:
7

เป็น:
3

Log:

"เปลี่ยนการแจ้งเตือนค่าเช่าจาก 7 วันเป็น 3 วัน"

==================================================
24. DEVELOPMENT RULE
==================================================

ก่อนเขียน:

ตรวจ:
- package.json
- project structure
- current database schema
- existing auth
- existing layout
- existing components

แสดง:

Files to create
Files to modify
Database migration needed

จากนั้นทำ code

หลังทำ:

npm run lint
npm run build

แก้ errors จนผ่าน

==================================================
25. STOP CONDITION
==================================================

ทำเฉพาะ Settings

เมื่อ Settings ทำงานครบ:

Company
Users
Rental
Payment
Workflow
Documents
LINE
Notifications
General
Numbering
Audit

แล้วให้หยุด

ห้ามเริ่ม:

Rental Lead
Negotiation
Contract
Rent Payment
Opening Project
LINE Automation
Recurring Rent

จนกว่าจะได้รับคำสั่ง Phase ถัดไป