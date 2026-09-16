ต่อจาก PHASE 3

สร้างระบบสัญญาเช่าและค่าเช่า

หน้า:

/contracts
/contracts/new
/contracts/[id]

/rent-payments
/rent-payments/[id]

Rental Contract:

contract_no
lead_id
location_id
customer_id
landlord_id
contract_date
start_date
end_date
monthly_rent
deposit_amount
advance_rent_amount
payment_due_day
wht_enabled
wht_rate
recurring_rent_enabled
other_service_amount
status
need_branch_registration
need_vat_registration
need_employer_change
need_signboard
assigned_to
note

Contract status:

draft
negotiating
agreed
active
expiring
expired
cancelled

Rent Payment:

payment_type:
payable
receivable

billing_period
due_date
rent_amount
wht_amount
service_amount
other_amount
gross_amount
net_amount
amount_paid
balance_amount
status

PAYABLE:
บริษัทต้องจ่ายเจ้าของ

RECEIVABLE:
ลูกค้าต้องจ่ายบริษัท

UI:

Tab:
บริษัทต้องจ่าย
ลูกค้าต้องจ่าย
ค้างชำระ
ชำระแล้ว

หัก ณ ที่จ่าย:

gross =
rent + service + other

net =
gross - WHT

ห้ามให้ user กรอก gross/net

Payment Transactions:

สามารถ:
เพิ่มรายการจ่าย/รับ
partial payment
แนบสลิป

แสดง:

ยอดทั้งหมด
จ่ายแล้ว
คงเหลือ

เมื่อยอดชำระ >= net:
status = paid

เมื่อยอดชำระ > 0:
status = partial

เมื่อเลย due_date:
status = overdue

ถ้า paid:
ไม่ต้องแจ้งเตือนในอนาคต

หน้า Detail ต้องมี:

Contract information
Payment schedule
Transactions
Documents
Timeline

ทำ filter:

เดือน
สถานะ
ประเภท
สถานที่
เจ้าของ
ลูกค้า

ห้ามทำ LINE ใน Phase นี้

ทดสอบ lint/build
ทำเฉพาะ PHASE 4 แล้วหยุด