ต่อจาก PHASE 2

สร้างระบบเริ่มต้นงานเช่า

หน้า:

/rental-leads
/rental-leads/new
/rental-leads/[id]

Database:

rental_leads
negotiation_logs

Rental Lead fields:

lead_no
location_id
customer_id
landlord_id
lead_name
source
first_contact_date
expected_start_date
expected_open_date
proposed_monthly_rent
proposed_deposit_amount
proposed_advance_rent_amount
proposed_service_amount
need_branch_registration
need_vat_registration
need_employer_change
need_signboard
status
assigned_to
next_follow_up_date
note

Status:

new
contacting
negotiating
follow_up
agreed
lost
cancelled
converted

หน้า Detail ต้องแสดง:

ข้อมูลสถานที่
ลูกค้า
เจ้าของ
ข้อเสนอ
ผู้รับผิดชอบ
สถานะ
Next Follow-up
Negotiation Timeline

Negotiation Logs:

contact_date
contact_method
contact_person
contact_phone
monthly_rent
deposit_amount
advance_rent_amount
service_amount
negotiation_detail
result
next_action
next_follow_up_date
created_by

สามารถเพิ่ม log เช่น:

13/09/2026
โทรคุย
ค่าเช่า 30,000

15/09/2026
โทรต่อรอง
ลดเหลือ 27,000

ต้องแสดงเป็น Timeline

เมื่อ Lead status = agreed
ให้มีปุ่ม:

"สร้างสัญญาเช่า"

กดแล้ว:
สร้าง rental_contracts draft
เชื่อม lead_id

และเปลี่ยน lead status เป็น converted

ต้องป้องกันสร้างสัญญาซ้ำจาก Lead เดิม

ทำ search/filter:

status
assigned_to
province
date

ทำเฉพาะ PHASE 3
ทดสอบ lint/build
แล้วหยุด