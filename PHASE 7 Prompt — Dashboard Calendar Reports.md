ต่อจาก PHASE 6

สร้าง Dashboard สำหรับใช้งานจริง

หน้า:

/dashboard
/calendar
/reports

Dashboard Cards:

งานเช่าทั้งหมด
Lead
กำลังเจรจา
ทำสัญญา
เปิดสาขา
พร้อมเปิดร้าน

ค่าเช่า:

บริษัทต้องจ่าย
ลูกค้าต้องจ่าย
ค้างจ่าย
ค้างรับ

งาน:

ครบกำหนดวันนี้
ใกล้ครบกำหนด
Overdue

ห้าม hard-code

ใช้ข้อมูลจริงจาก Database

ใช้ Views:

v_rent_payment_summary
v_opening_project_progress

Calendar:

แสดง:

ค่าเช่า due date
Task due date
วันทำสัญญา
วันจดสาขา
วันติดป้าย
วันเปิดร้าน

สามารถ filter:

ค่าเช่า
Task
สัญญา
เปิดสาขา

Reports:

1. ค่าเช่าบริษัทต้องจ่าย
2. ค่าเช่าลูกค้าต้องจ่าย
3. ค้างชำระ
4. งานเปิดสาขาตาม Stage
5. งานตามผู้รับผิดชอบ
6. ค่าเช่ารายเดือน
7. ค่าเช่าตามสถานที่

รองรับ:
เดือน
ปี
สถานที่
จังหวัด
สถานะ

เตรียม export CSV

Dashboard ต้อง responsive

Desktop:
cards + tables + charts

Mobile:
cards + lists

ทดสอบข้อมูลจริง
lint/build

ทำเฉพาะ PHASE 7 แล้วหยุด