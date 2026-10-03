# Rental & Branch Management System (ระบบบริหารงานเช่าและเปิดสาขา)

A production-grade, enterprise web application built for managing commercial and residential rental contracts, end-to-end branch opening workflows, payment installments, automated LINE reminders, and document compliance.

---

## 1. Project Overview

ระบบบริหารงานเช่าและเปิดสาขา ออกแบบมาเพื่อควบคุมกระบวนการดำเนินงานด้านอสังหาริมทรัพย์และสาขาอย่างครบวงจร:
- **Lead & Negotiation:** ติดตามลีดพื้นที่เช่า ประวัติการเจรจา และบันทึกข้อตกลง
- **Rental Contracts:** จัดทำและบริหารสัญญาเช่า รองรับทั้งสัญญาที่บริษัทเป็นผู้เช่า (PAYABLE) และสัญญาที่ลูกค้าเป็นผู้เช่า (RECEIVABLE)
- **Rent Payments:** ระบบบันทึกและตัดยอดชำระเงินตามงวด คำนวณหัก ณ ที่จ่าย (WHT) ค่าบริการ และยอดสุทธิ
- **Branch Opening Workflow:** ควบคุมขั้นตอนเปิดสาขา 12 ขั้นตอน (จดทะเบียนสาขา, ยื่นภาษีมูลค่าเพิ่ม, เปลี่ยนนายจ้าง, ป้ายโฆษณา, ตม.30, สรรพสามิต ฯลฯ) พร้อม Checklist
- **Document Center:** อัปโหลดและจัดเก็บเอกสารสำคัญอย่างปลอดภัยด้วย Supabase Storage และ Signed URL
- **Automated LINE Messaging API:** ส่งการ์ดแจ้งเตือนแบบ Flex Message เข้ากลุ่ม LINE ตามกำหนด (ล่วงหน้า 7 วัน, 3 วัน, 1 วัน, วันครบกำหนด, Overdue)
- **Recurring Rent Generation:** สร้างงวดค่าเช่ารายเดือนอัตโนมัติ พร้อมระบบป้องกันงวดซ้ำ (Deduplication)

---

## 2. Tech Stack

- **Framework:** [Next.js 16 (Turbopack / App Router)](https://nextjs.org/)
- **Language:** TypeScript 5 (Strict Mode)
- **Styling:** Tailwind CSS + Radix UI Primitives + Lucide React Icons
- **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL 15+, Row Level Security, SSR Auth)
- **Object Storage:** Supabase Storage (Private bucket `documents`, 60-min Signed URLs)
- **Automation / Serverless:** Supabase Edge Functions (Deno), pg_cron / pg_net, Vercel Cron
- **Integrations:** LINE Messaging API v2 (Push Message, Webhooks, HMAC-SHA256 Signature Verification, Flex Messages)
- **Internationalization (i18n):** Multi-language UI (ไทย / English / မြန်မာ)

---

## 3. Environment Variables

กำหนดค่าตัวแปรใน `.env.local` สำหรับการพัฒนาในเครื่อง และใน **Vercel Settings > Environment Variables** สำหรับ Production:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# LINE Messaging API Configuration (Server-Side Only - Never expose to client)
LINE_CHANNEL_ACCESS_TOKEN=<your-long-lived-channel-access-token>
LINE_CHANNEL_SECRET=<your-channel-secret>

# Automation / Cron Security Token (Optional but recommended)
CRON_SECRET=<your-random-cron-secret-token>
```

> ⚠️ **คำเตือนความปลอดภัย:** `LINE_CHANNEL_ACCESS_TOKEN`, `LINE_CHANNEL_SECRET`, และ `SUPABASE_SERVICE_ROLE_KEY` ห้ามใส่คำนำหน้า `NEXT_PUBLIC_` โดยเด็ดขาด เพื่อป้องกันไม่ให้ข้อมูลความลับรั่วไหลไปยัง Client Bundle

---

## 4. Local Development

### ความต้องการขั้นต่ำ:
- Node.js 20+ หรือ 24+
- npm 10+

### ขั้นตอนติดตั้งและเริ่มทำงาน:
```bash
# 1. Clone repository
git clone https://github.com/therichaicompany-ops/rental-management.git
cd rental-management

# 2. ติดตั้ง Dependencies
npm install

# 3. กำหนดค่า .env.local
cp .env.example .env.local  # หรือกรอกค่าตามข้อ 3

# 4. รันโหมด Development
npm run dev

# 5. เปิดเบราว์เซอร์เข้าที่
# http://localhost:3000
```

### การตรวจสอบคุณภาพโค้ด:
```bash
# ตรวจสอบ Linting
npm run lint

# ตรวจสอบ TypeScript & Production Build
npm run build
```

---

## 5. Supabase Setup

1. สร้างโปรเจกต์ใหม่ใน [Supabase Dashboard](https://supabase.com/dashboard)
2. ไปที่ **Project Settings > API** เพื่อคัดลอก:
   - `Project URL` -> `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` -> `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `service_role key` -> `SUPABASE_SERVICE_ROLE_KEY`
3. ไปที่ **Authentication > URL Configuration**:
   - Site URL: `https://<your-domain>.vercel.app` (หรือ `http://localhost:3000`)
   - Redirect URLs: `https://<your-domain>.vercel.app/**`

---

## 6. Database Setup

1. ไปที่ **SQL Editor** ใน Supabase Dashboard
2. รัน SQL Schema จากไฟล์:
   - `Supabase SQL — Rental & Branch Management Final Schema V2.md`
3. รัน Migration สำหรับ Cron & Overdue Automation:
   - `supabase/migrations/20261004000000_rent_reminder_cron.sql`
4. โครงสร้างตารางหลัก:
   - `profiles`: ข้อมูลผู้ใช้และสิทธิ์ (`owner`, `admin`, `accounting`, `hr`, `operation`, `staff`, `viewer`)
   - `customers`, `landlords`, `locations`: ข้อมูล Master Data
   - `rental_leads`, `negotiation_logs`: งานจัดหาและเจรจาพื้นที่เช่า
   - `rental_contracts`: สัญญาเช่า
   - `rent_payments`: งวดชำระค่าเช่า (รองรับ Deduplication: `unique(contract_id, payment_type, billing_period)`)
   - `payment_transactions`: ประวัติการตัดเงินในแต่ละงวด
   - `opening_projects`, `opening_tasks`, `task_checklists`: งานเปิดสาขาและ Checklist
   - `documents`: ดัชนีเอกสารแนบ
   - `line_destinations`: กลุ่มไลน์ปลายทาง (PAYABLE / RECEIVABLE)
   - `notification_logs`: บันทึกประวัติการส่งแจ้งเตือน
   - `system_settings`: การตั้งค่าระบบ (รอบวันแจ้งเตือน, เวลาส่ง)

---

## 7. Storage Setup

1. ไปที่ **Storage** ใน Supabase Dashboard
2. สร้าง Bucket ชื่อ: **`documents`**
3. ตั้งค่าเป็น **Private Bucket** (ห้ามเปิด Public เพื่อความปลอดภัยของข้อมูลสัญญาและเอกสารแนบ)
4. ไฟล์เอกสารจะถูกเรียกดูผ่าน **Signed URLs** ที่มีอายุ 60 นาที (`getSignedUrlAction`)
5. กำหนดขนาดไฟล์สูงสุดไม่เกิน 10 MB และรองรับชนิดไฟล์: `.pdf`, `.jpg`, `.png`, `.webp`

---

## 8. LINE Messaging API Setup

1. เข้าสู่ระบบ [LINE Developers Console](https://developers.line.biz/console/)
2. สร้างหรือเลือก Provider > สร้าง **Messaging API Channel**
3. ที่แท็บ **Messaging API**:
   - ออก **Channel Access Token (long-lived)** นำมาใส่ใน `LINE_CHANNEL_ACCESS_TOKEN`
   - ตั้งค่า **Webhook URL**:
     ```text
     https://<your-domain>.vercel.app/api/line/webhook
     ```
   - เปิดสวิตช์ **Use webhook** ให้เป็น **ON (สีเขียว)**
   - กดปุ่ม **Verify** เพื่อตรวจสอบว่าเซิร์ฟเวอร์ตอบกลับ 200 OK
4. ใน [LINE Official Account Manager](https://manager.line.biz/):
   - **การเข้าร่วมกลุ่มและการแชทหลายคน:** เลือก **"อนุญาตให้เข้าร่วมกลุ่มและการแชทหลายคน"**
   - **การตั้งค่าการตอบกลับ:**
     - โหมดตอบกลับ: **บอท (Bot)** หรือ แชท (เลือก **แชทแบบแมนนวล**)
     - Webhook: **เปิด (Enabled)**
5. **การดึง Group ID:**
   - เชิญบอทเข้ากลุ่มไลน์ที่ต้องการรับแจ้งเตือน
   - สมาชิกในกลุ่มพิมพ์คำว่า `#id`
   - บอทจะตอบกลับด้วยรหัส Group ID (ขึ้นต้นด้วย `C...`) นำรหัสไปใส่ในระบบที่หน้า `/settings/line`

---

## 9. Cron Setup (การตั้งเวลาระบบอัตโนมัติ)

ระบบรองรับการตั้งเวลาอัตโนมัติ 2 ช่องทาง:

### ช่องทางที่ 1: Vercel Cron (แนะนำ)
ไฟล์ `vercel.json` ถูกตั้งค่าไว้ล่วงหน้าให้เรียก Cron ทุกวันเวลา **09:00 น. Asia/Bangkok** (`02:00 UTC`):
```json
{
  "crons": [
    {
      "path": "/api/cron/rent-reminder",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/recurring-rent",
      "schedule": "0 1 * * *"
    }
  ]
}
```

### ช่องทางที่ 2: Supabase pg_cron + pg_net
รันสคริปต์ใน `supabase/migrations/20261004000000_rent_reminder_cron.sql` เพื่อให้ฐานข้อมูลเป็นผู้สั่งการอัตโนมัติ:
```sql
select cron.schedule(
  'daily-rent-reminder',
  '0 2 * * *',
  $$
    select public.mark_overdue_rent_payments();
    select net.http_post(
      url := 'https://<your-domain>.vercel.app/api/cron/rent-reminder',
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
  $$
);
```

---

## 10. Vercel Deployment

1. เชื่อมต่อ GitHub Repository กับ [Vercel](https://vercel.com/)
2. ใน **Build & Development Settings**:
   - Framework Preset: **Next.js**
   - Build Command: `next build`
   - Output Directory: `.next`
3. ใน **Project Settings > Environment Variables**:
   - เพิ่มตัวแปรทั้ง 5 ค่าตามข้อ 3
4. ทำการ **Deploy**
5. ตรวจสอบสถานะการ Deploy และทดสอบเปิดหน้าเว็บ

---

## 11. User Roles & Security Matrix

ระบบบังคับใช้การตรวจสอบสิทธิ์ที่ **Server-Side อย่างเข้มงวด** ผ่าน `requireRole()`, `requireAdmin()`, และ Server Actions:

| Role | คำอธิบาย | สิทธิ์การเข้าถึง |
| :--- | :--- | :--- |
| **Owner** | ผู้บริหารระดับสูง | เข้าถึงได้ทุกโมดูล จัดการผู้ใช้ สิทธิ์ และตั้งค่าระบบทั้งหมด |
| **Admin** | ผู้ดูแลระบบ | เข้าถึงและแก้ไขได้ทุกโมดูล จัดการข้อมูลและระบบการแจ้งเตือน |
| **Accounting** | ฝ่ายการเงิน / บัญชี | จัดการสัญญา ค่าเช่า (Rent Payments) ยอดเงิน WHT และรายงาน |
| **HR** | ฝ่ายทรัพยากรบุคคล | จัดการสัญญาเช่าบ้านพักพนักงาน ตม.30 และงานเปิดสาขา |
| **Operation** | ฝ่ายปฏิบัติการสาขา | จัดการสัญญาและงานสาขา (ถูกจำกัดไม่ให้ดูข้อมูลบ้านพักพนักงาน) |
| **Staff** | เจ้าหน้าที่ทั่วไป | ดูและจัดการข้อมูลลูกค้า สถานที่ และความคืบหน้างานเปิดสาขา |
| **Viewer** | ผู้มีสิทธิ์อ่านอย่างเดียว | ดูข้อมูลได้อย่างเดียว ไม่สามารถสร้าง แก้ไข หรือลบข้อมูลใดๆ ได้ |

---

## 12. Backup & Recovery Notes

1. **Database Backups:**
   - Supabase ดำเนินการสำรองข้อมูลอัตโนมัติทุกวัน (Point-in-Time Recovery / Daily Backups)
   - แนะนำให้ Export ข้อมูลตารางสำคัญ (`rental_contracts`, `rent_payments`, `notification_logs`) ผ่าน Supabase Dashboard หรือ `pg_dump` เป็นระยะ
2. **File Storage Backup:**
   - ไฟล์ใน Bucket `documents` มีความสัมพันธ์กับตาราง `documents` ด้วย `storage_path`
   - หากมีการกู้คืนฐานข้อมูล ให้ตรวจสอบว่า Object ใน Storage ยังคงอยู่ตรงกับ Path เดิม
3. **Disaster Recovery Checklist:**
   - ตรวจสอบความถูกต้องของ Environment Variables
   - ตรวจสอบการเชื่อมต่อ Supabase Database Connection Pooler (Transaction Mode port 6543)
   - ตรวจสอบ Webhook Signature ใน LINE Developers หลังสลับ Domain หรือ Redeploy
