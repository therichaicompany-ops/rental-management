คุณคือ Senior Full-Stack Engineer เชี่ยวชาญ Next.js, TypeScript และ Supabase

ให้พัฒนา PHASE 1 ของระบบ **Rental & Branch Management System**

IMPORTANT:
- ทำเฉพาะ PHASE 1 เท่านั้น
- ห้ามสร้าง Rental, Payment, Workflow, LINE หรือ Report ใน Phase นี้
- ห้ามสร้าง Database schema ใหม่ เพราะ Database ถูกสร้างไว้แล้ว
- ต้องใช้ Database Schema Final V2 ที่มีอยู่ใน Supabase
- ก่อนแก้ไขไฟล์ ให้ตรวจสอบ project structure ปัจจุบันก่อน
- ถ้ามีไฟล์หรือ component ที่ใช้งานได้อยู่แล้ว ให้ reuse แทนการสร้างซ้ำ

==================================================
1. TECHNOLOGY
==================================================

ใช้:

- Next.js App Router
- TypeScript strict
- Tailwind CSS
- shadcn/ui
- Supabase
- @supabase/ssr
- Zod
- React Hook Form
- Lucide React

ใช้ timezone:
Asia/Bangkok

==================================================
2. PROJECT OBJECTIVE
==================================================

สร้างพื้นฐาน Web Application สำหรับระบบบริหารงานเช่าและเปิดสาขา

Phase นี้ต้องทำ:

1. Project setup
2. Supabase connection
3. Supabase Browser Client
4. Supabase Server Client
5. Authentication
6. Login
7. Logout
8. Middleware / session refresh
9. Protected routes
10. User profile
11. Role system
12. Application layout
13. Sidebar
14. Header
15. User menu
16. Permission helper
17. Basic dashboard shell

==================================================
3. DATABASE
==================================================

Supabase Database มี table:

profiles

column:

id
full_name
email
phone
role
department
is_active
created_at
updated_at

role enum:

owner
admin
accounting
hr
operation
staff
viewer

Supabase Auth:
auth.users

มี database trigger:

auth.users
→ public.profiles

เมื่อ User สมัคร / ถูกสร้าง
ระบบจะสร้าง profiles ให้อัตโนมัติ

ห้ามสร้าง profile จาก frontend เองหลัง signup
เว้นแต่เป็นกรณีที่จำเป็นจริง ๆ

==================================================
4. ENVIRONMENT VARIABLES
==================================================

ต้องรองรับ:

NEXT_PUBLIC_SUPABASE_URL

NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

ห้ามใช้:

SUPABASE_SERVICE_ROLE_KEY

ใน browser

ถ้าต้องใช้ service role ในอนาคต
ให้ใช้เฉพาะ server-side / Edge Function

สร้าง:

.env.example

ตัวอย่าง:

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

ห้ามใส่ credential จริงลงใน repository

==================================================
5. SUPABASE CLIENT
==================================================

สร้าง:

lib/supabase/client.ts

สำหรับ Browser Client

ใช้:

createBrowserClient

จาก:

@supabase/ssr

สร้าง:

lib/supabase/server.ts

สำหรับ Server Client

ต้องรองรับ cookie-based session

ใช้:

createServerClient

จาก:

@supabase/ssr

อ่าน cookies ผ่าน Next.js cookies API

==================================================
6. MIDDLEWARE
==================================================

สร้าง middleware.ts

หน้าที่:

1. refresh Supabase session
2. ตรวจ authentication
3. ถ้ายังไม่ได้ login
   และกำลังเข้าหน้าที่ protected
   → redirect /login
4. ถ้า login แล้ว
   และเข้าหน้า /login
   → redirect /dashboard
5. ไม่ต้องตรวจ Role ใน middleware ทุกหน้า
6. Role permission ให้ตรวจใน server/page/component ตามความเหมาะสม

Public paths:

/login

Protected:

/dashboard
/rentals
/contracts
/rent-payments
/opening
/documents
/calendar
/reports
/users
/settings

Phase นี้สร้างแค่:

/login
/dashboard
/users

แต่ middleware ต้องเตรียมโครงสร้างให้รองรับ path อื่นในอนาคต

==================================================
7. LOGIN
==================================================

สร้าง:

app/login/page.tsx

UI:

--------------------------------

โลโก้ / ชื่อระบบ

ระบบบริหารงานเช่าและเปิดสาขา

Email
[________________]

Password
[________________]

[ เข้าสู่ระบบ ]

--------------------------------

ใช้ Supabase Auth:

signInWithPassword

หลัง Login สำเร็จ:

→ /dashboard

แสดง validation:

กรุณากรอก Email
กรุณากรอก Password

ถ้า Login ไม่สำเร็จ:

แสดง:

"อีเมลหรือรหัสผ่านไม่ถูกต้อง"

ห้ามแสดง technical error ให้ผู้ใช้เห็น

==================================================
8. LOGOUT
==================================================

สร้าง logout action

ใช้:

supabase.auth.signOut()

แล้ว redirect:

/login

Logout ต้องล้าง session อย่างถูกต้อง

==================================================
9. CURRENT USER
==================================================

สร้าง helper:

lib/auth/get-current-user.ts

ให้สามารถเรียกได้ว่า:

getCurrentUser()

คืน:

Auth User
Profile

โดย query:

auth user
+
profiles

ต้อง handle กรณี:

ไม่มี session
ไม่มี profile
profile inactive

ถ้า profile:

is_active = false

ให้ logout และ redirect /login

==================================================
10. ROLE HELPERS
==================================================

สร้าง:

lib/auth/permissions.ts

มี helper:

isOwner()
isAdmin()
isAccounting()
isHR()
isOperation()
hasFullAccess()

และ:

canAccess(
  role,
  resource
)

resources:

dashboard
rentals
contracts
rentPayments
opening
documents
calendar
reports
users
settings

Permission เบื้องต้น:

owner:
ทุกอย่าง

admin:
ทุกอย่าง

accounting:
dashboard
rentPayments
contracts
documents
reports

hr:
dashboard
opening
documents

operation:
dashboard
rentals
contracts
opening
documents
calendar

staff:
dashboard
rentals
opening
documents
calendar

viewer:
dashboard
reports

users:
เฉพาะ owner/admin

settings:
เฉพาะ owner/admin

==================================================
11. ROUTE GUARD
==================================================

สร้าง helper สำหรับ server:

requireUser()

ถ้าไม่ login:

redirect /login

สร้าง:

requireRole()

และ:

requireAdmin()

ถ้าไม่มี permission:

redirect ไป:

/dashboard

ไม่ให้เกิด white screen หรือ uncaught error

==================================================
12. ROOT LAYOUT
==================================================

สร้าง App Layout สำหรับ authenticated pages

โครงสร้าง:

app/
├── login/
│   └── page.tsx
│
└── (protected)/
    ├── layout.tsx
    ├── dashboard/
    │   └── page.tsx
    └── users/
        └── page.tsx

หรือโครงสร้างที่เหมาะสมกว่านี้ได้
แต่ต้องใช้ route groups อย่างเหมาะสม

==================================================
13. SIDEBAR
==================================================

สร้าง:

components/layout/sidebar.tsx

Menu:

Dashboard
งานเช่า
ค่าเช่า
เปิดสาขา
เอกสาร
Calendar
รายงาน
ผู้ใช้งาน
ตั้งค่า

Icons ใช้ Lucide

แสดงเฉพาะเมนูที่ User Role เข้าถึงได้

ตัวอย่าง:

Viewer

Dashboard
รายงาน

Accounting

Dashboard
ค่าเช่า
เอกสาร
รายงาน

Owner

ทุกเมนู

เมนูที่ยังไม่มีหน้าใน Phase นี้
สามารถแสดง disabled / coming soon ได้
แต่ห้ามทำลิงก์เสีย

==================================================
14. HEADER
==================================================

สร้าง:

components/layout/header.tsx

แสดง:

ชื่อหน้า

User profile

ชื่อผู้ใช้งาน

Role

Logout

ตัวอย่าง:

คุณสมชาย
Accounting

[ออกจากระบบ]

==================================================
15. DASHBOARD
==================================================

สร้าง:

app/(protected)/dashboard/page.tsx

Phase นี้ยังไม่มีข้อมูลธุรกิจ

ดังนั้นใช้ Dashboard Shell

Cards:

งานเช่า
กำลังดำเนินการ

ค่าเช่า
รอตรวจสอบ

เปิดสาขา
กำลังดำเนินการ

งานครบกำหนด
วันนี้

ใช้ค่า:

0

และแสดงข้อความ:

"ข้อมูลจะแสดงเมื่อเริ่มใช้งานระบบ"

ห้าม fake business data

==================================================
16. USER PROFILE
==================================================

สร้าง:

components/auth/user-profile.tsx

แสดง:

full_name
email
role
department

Role ต้องแสดงเป็นภาษาไทย:

owner → เจ้าของระบบ
admin → ผู้ดูแลระบบ
accounting → บัญชี
hr → HR
operation → ฝ่ายปฏิบัติการ
staff → พนักงาน
viewer → ผู้ดูข้อมูล

==================================================
17. USERS PAGE
==================================================

สร้าง:

app/(protected)/users/page.tsx

Phase นี้ยังไม่ต้องทำ CRUD User เต็มระบบ

แค่สร้างหน้า:

ผู้ใช้งานระบบ

และแสดง:

ชื่อ
Email
Role
แผนก
สถานะ

ดึงข้อมูลจาก:

profiles

ให้ Owner/Admin ดูได้

Role อื่น:

แสดง Access Denied หรือ redirect dashboard

==================================================
18. UI DESIGN
==================================================

Design:

Modern Business SaaS

Primary:

#F97316

Background:

#F8FAFC

Text:

Slate / Navy

Border:

light gray

Desktop:
Sidebar ซ้าย

Mobile:
Sidebar เป็น sheet / drawer

ต้อง responsive

ไม่ใช้ gradient เยอะ

ไม่ทำ UI แบบ gaming

ไม่ใช้ animation ที่ไม่จำเป็น

==================================================
19. COMPONENTS
==================================================

สร้าง reusable components:

components/layout/sidebar.tsx
components/layout/header.tsx
components/layout/app-shell.tsx
components/auth/user-profile.tsx
components/auth/logout-button.tsx
components/ui/loading-state.tsx
components/ui/error-state.tsx
components/ui/empty-state.tsx

ถ้า shadcn/ui ใช้งานได้
ให้ใช้ Button
Card
Input
Label
Badge
DropdownMenu
Sheet
Separator

==================================================
20. ERROR HANDLING
==================================================

ต้องรองรับ:

loading
error
empty

สร้าง:

app/(protected)/dashboard/loading.tsx

app/(protected)/dashboard/error.tsx

และหน้า error หลักของ app ตามความเหมาะสม

Error message ภาษาไทย

ห้ามเปิดเผย database error ให้ user เห็นโดยตรง

==================================================
21. TYPES
==================================================

อย่าใช้:

any

สร้าง type:

UserProfile

ให้ role เป็น:

Database generated type

หรือ enum ที่ตรงกับ Supabase

ถ้าสร้าง:

lib/types/auth.ts

ให้ใช้ type ที่สอดคล้องกับ Database จริง

==================================================
22. DATABASE TYPES
==================================================

ถ้า project ยังไม่มี:

supabase/types.ts

ให้สร้าง placeholder type structure
แต่ห้ามเดา schema เพิ่มเติม

ถ้าใช้ Supabase CLI ได้
ให้แนะนำ command:

supabase gen types typescript

เพื่อ generate types จาก project จริง

==================================================
23. SECURITY
==================================================

สำคัญมาก:

ห้าม trust role ที่ส่งมาจาก client

ห้ามให้ client เป็นตัวตัดสิน permission เพียงอย่างเดียว

Role จริงต้องอ่านจาก:

public.profiles

และ Database RLS เป็น security boundary

ห้าม expose:

Service Role Key
LINE Secret
LINE Access Token

==================================================
24. FILE STRUCTURE
==================================================

โครงสร้างที่ต้องการ:

app/
├── login/
│   └── page.tsx
│
├── (protected)/
│   ├── layout.tsx
│   ├── dashboard/
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   └── error.tsx
│   │
│   └── users/
│       └── page.tsx
│
components/
├── auth/
│   ├── logout-button.tsx
│   └── user-profile.tsx
│
├── layout/
│   ├── app-shell.tsx
│   ├── header.tsx
│   └── sidebar.tsx
│
├── ui/
│
lib/
├── auth/
│   ├── get-current-user.ts
│   └── permissions.ts
│
├── supabase/
│   ├── client.ts
│   └── server.ts
│
middleware.ts

.env.example

==================================================
25. DEVELOPMENT RULES
==================================================

ก่อนแก้ไข:

1. Inspect repository
2. Inspect package.json
3. Inspect existing Next.js version
4. Inspect Supabase configuration
5. Inspect existing app router
6. Inspect tsconfig
7. Inspect tailwind configuration

จากนั้นสรุป:

FILES TO CREATE
FILES TO MODIFY
FILES NOT TO TOUCH

แล้วค่อยเขียน code

==================================================
26. COMMANDS
==================================================

หลังเขียน code ให้รัน:

npm install

ถ้าจำเป็น:

npx shadcn@latest init

และติดตั้ง packages:

npm install @supabase/ssr @supabase/supabase-js zod react-hook-form @hookform/resolvers date-fns lucide-react

จากนั้น:

npm run lint

npm run build

ถ้ามี TypeScript error
ให้แก้จน build ผ่าน

==================================================
27. TESTING
==================================================

ต้องทดสอบ:

TEST 1

เปิด /dashboard โดยไม่ login

Expected:

→ /login

TEST 2

Login ด้วย User ที่ถูกต้อง

Expected:

→ /dashboard

TEST 3

Logout

Expected:

→ /login

TEST 4

Login ด้วย user ที่ is_active = false

Expected:

→ logout
→ /login

TEST 5

Viewer เข้า /users

Expected:

ไม่มีสิทธิ์
→ /dashboard

TEST 6

Owner เข้า /users

Expected:

เห็นรายชื่อ user

TEST 7

Refresh browser หลัง login

Expected:

session ยังคงอยู่

TEST 8

ปิด browser แล้วเปิดใหม่

Expected:

session ทำงานตาม Supabase Auth configuration

==================================================
28. OUTPUT
==================================================

เมื่อทำเสร็จให้รายงาน:

1. Files created
2. Files modified
3. Packages installed
4. Environment variables required
5. Authentication flow
6. Permission flow
7. Tests performed
8. npm run lint result
9. npm run build result
10. Any remaining issue

ห้ามตอบเพียงว่า "เสร็จแล้ว"

ต้องรายงานผลจริง

==================================================
29. STOP CONDITION
==================================================

ทำเฉพาะ PHASE 1

เมื่อ:

Login
Logout
Middleware
Protected route
Profile
Role
Sidebar
Header
Dashboard
Users page

ทำงานเรียบร้อยแล้ว

ให้หยุด

ห้ามเริ่ม:

Rental
Contract
Payment
Opening
Document
LINE
Cron
Report

จนกว่าจะได้รับคำสั่ง PHASE 2