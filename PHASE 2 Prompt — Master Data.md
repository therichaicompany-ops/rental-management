ต่อจาก PHASE 1

ห้ามรื้อ Authentication หรือ Layout ที่ทำเสร็จแล้ว

พัฒนา Master Data:

1. Customers
2. Landlords
3. Locations

สร้างหน้า:

/customers
/customers/new
/customers/[id]

/landlords
/landlords/new
/landlords/[id]

/locations
/locations/new
/locations/[id]

Customers:

fields:
customer_code
customer_type
name
company_name
tax_id
contact_name
phone
email
line_name
address
note

Landlords:

fields:
landlord_code
name
company_name
tax_id
contact_name
phone
email
address
bank_name
bank_account_name
bank_account_number
note

Locations:

fields:
location_code
house_no
room_no
location_name
village_name
address
subdistrict
district
province
postal_code
google_maps_url
latitude
longitude
landlord_id
note

Features:
- list
- search
- filter
- create
- edit
- view detail
- delete
- validation
- confirmation dialog
- empty state
- loading state
- error state

Location:
เลือก Landlord จาก dropdown

ใช้ Zod + React Hook Form

Permission:

Owner/Admin:
full CRUD

Accounting/HR/Operation/Staff:
create/edit ตามสิทธิ์ระบบ

Viewer:
read only

ทุก query ต้องผ่าน Supabase

ห้าม hard-code master data

เพิ่ม reusable table component

ตรวจ:
npm run lint
npm run build

ทำเฉพาะ PHASE 2
เสร็จแล้วหยุด