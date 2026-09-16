ต่อจาก PHASE 5

สร้างระบบจัดการเอกสาร

ใช้:

Supabase Storage

Bucket:

documents

Bucket ต้องเป็น PRIVATE

Database:

documents

รองรับ entity:

lead
contract
rent_payment
opening_project
task
customer
location
payment_transaction

Document types:

RENTAL_CONTRACT
TRANSFER_SLIP
MAP
VAT_DOCUMENT
BRANCH_DOCUMENT
EMPLOYMENT_DOCUMENT
SIGNBOARD
PRE_OPEN_DOCUMENT
OTHER

ฟังก์ชัน:

upload
list
preview
download
delete
metadata

แสดง:

ชื่อไฟล์
ประเภท
วันที่ upload
ผู้ upload
ขนาดไฟล์

รองรับ:

PDF
JPG
PNG
WEBP

แนะนำ max 10MB ใน UI

ใช้ signed URL สำหรับ private files

Permissions:
Owner/Admin = full
ผู้ใช้งานทั่วไป = upload/read ตาม resource
Viewer = read

ห้ามทำ public bucket

หน้า Document Center:

/documents

สามารถ filter:

document type
date
uploaded by
entity

และในหน้า:

Lead
Contract
Rent Payment
Opening Project

ต้องเห็นเอกสารที่เกี่ยวข้อง

สร้าง reusable:

DocumentUploader
DocumentList
DocumentPreview

ทดสอบ upload/download/delete
ทดสอบ RLS
lint/build

ทำเฉพาะ PHASE 6 แล้วหยุด