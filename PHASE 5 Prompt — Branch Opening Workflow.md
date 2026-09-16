ต่อจาก PHASE 4

สร้างระบบติดตามการเปิดสาขา

Database:

opening_projects
opening_tasks
task_checklists
workflow_stages

หน้า:

/opening
/opening/[id]

เมื่อ Rental Contract เปลี่ยนเป็น agreed/active
สามารถสร้าง Opening Project

Opening Project:

project_no
contract_id
current_stage_id
target_open_date
assigned_to
status
note

Workflow:

NEGOTIATION
AGREED
DEPOSIT
CONTRACT
DOCUMENT_CHECK
SEND_ACCOUNTING
BRANCH_REGISTRATION
SIGNBOARD
EMPLOYMENT_CHANGE
JOB_APPROVAL
PRE_OPEN_SIGN
READY_TO_OPEN
OPENED

Detail แสดง Progress:

✅
🟡
⚪

Task:

task_name
description
assigned_to
due_date
status
completed_at
completed_by
note

Status:

todo
in_progress
waiting
done
skipped
cancelled

Checklist:

item_name
is_required
is_checked
checked_by
checked_at

Rule:

ถ้า required checklist ยังไม่ครบ
ห้ามเปลี่ยน Task เป็น DONE

Requirements:

need_branch_registration
need_vat_registration
need_employer_change
need_signboard

ถ้า false:
ไม่ต้องสร้าง task ขั้นตอนนั้น

หน้า Detail ต้องมี:

Progress
Current Stage
Tasks
Checklist
Documents
Timeline

เพิ่ม:
"เปลี่ยนผู้รับผิดชอบ"
"กำหนดวันครบกำหนด"

สร้างสี status ให้เห็นง่าย

ห้ามทำ LINE ใน Phase นี้

ทดสอบ lint/build
ทำเฉพาะ PHASE 5 แล้วหยุด