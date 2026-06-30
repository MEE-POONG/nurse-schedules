# ระบบจัดตารางเวรพยาบาล — ตารางเวร (tarangwen)

ระบบจัดและบริหารตารางเวรพยาบาลสำหรับโรงพยาบาลครบุรี จังหวัดนครราชสีมา (หน่วย ICU เป็นหลัก) พัฒนาด้วย **Next.js + MongoDB (Prisma)** รองรับการจัดเวรปกติ เวรควบ เวร OT เวร On-Call การจองเวรล่วงหน้า การจัดเวรอัตโนมัติตามกฎ และการออกรายงาน/พิมพ์ตารางเวรราชการรายเดือน รวมถึงส่งออกเป็นไฟล์ Excel

> UI ทั้งหมดเป็นภาษาไทย ออกแบบ mobile-first ธีมหลักสี Teal มี sidebar (จอใหญ่) / bottom nav (มือถือ)

---

## สารบัญ

- [คุณสมบัติหลัก](#คุณสมบัติหลัก)
- [เทคโนโลยีที่ใช้](#เทคโนโลยีที่ใช้)
- [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
- [การติดตั้งและเริ่มใช้งาน](#การติดตั้งและเริ่มใช้งาน)
- [คำสั่งที่ใช้บ่อย](#คำสั่งที่ใช้บ่อย)
- [ฐานข้อมูล (Data Model)](#ฐานข้อมูล-data-model)
- [ระบบยืนยันตัวตน (Authentication)](#ระบบยืนยันตัวตน-authentication)
- [ชนิดของกะ/เวร](#ชนิดของกะเวร)
- [ระบบจัดเวรอัตโนมัติ (Auto-Schedule)](#ระบบจัดเวรอัตโนมัติ-auto-schedule)
- [หน้าจอ (Pages)](#หน้าจอ-pages)
- [API Routes](#api-routes)
- [การพิมพ์และส่งออกรายงาน](#การพิมพ์และส่งออกรายงาน)
- [การ Deploy](#การ-deploy)
- [ข้อควรระวัง / สิ่งที่ควรรู้](#ข้อควรระวัง--สิ่งที่ควรรู้)

---

## คุณสมบัติหลัก

| ด้าน | รายละเอียด |
|------|-----------|
| 📅 **ตารางเวรรายเดือน** | แสดงตารางเวรทั้งทีมแบบเดือนต่อเดือน แก้ไขเวรรายวันผ่าน modal ไฮไลต์วันปัจจุบัน เรียงกะในวันเดียวกันตามเวลาเริ่มกะ (ด → ช → บ เช่น "ชบ", "ดบ") |
| 🤖 **จัดเวรอัตโนมัติ** | สร้างตารางเวรทั้งเดือนอัตโนมัติตามกฎ (rest, เวรควบ, OT, วันหยุด) อิงรูปแบบเวรจริงของ ICU เคารพการจองเวร/วันหยุดที่พยาบาลจองไว้ |
| 🔖 **จองเวรล่วงหน้า** | พยาบาลเลือกวัน/กะที่ต้องการ (จองแน่นอน หรือระบุความต้องการ) ระบบ auto-schedule จะพยายามจัดตามที่จองไว้ |
| ⚖️ **สรุปความเป็นธรรม (Fairness)** | คำนวณคะแนนภาระงานต่อคน (ถ่วงน้ำหนักตามความหนักของกะ + โบนัสเวรควบ) เพื่อดูความสมดุลของการจัดเวร |
| 📞 **เวร On-Call** | จัดและติดตามเวรเตรียมพร้อม (On-Call) สำหรับเจ้าหน้าที่ ICU แยกจากเวรปกติ |
| 💰 **ค่าตอบแทน/OT** | ติดตามค่าเวรปกติและค่าล่วงเวลา แยกการคำนวณ OT ออกจากเวรปกติ |
| 🖨️ **พิมพ์รายงานราชการ** | ออกตารางเวรรูปแบบราชการพร้อมช่องลงนามผู้บริหาร ผ่าน `react-to-print` |
| 📊 **ส่งออก Excel** | ดาวน์โหลดตารางเวรเป็นไฟล์ `.xlsx` ดึงข้อมูลจาก DB โดยตรง |

---

## เทคโนโลยีที่ใช้

- **Framework:** [Next.js 13](https://nextjs.org/) (Pages Router) + React 18
- **ฐานข้อมูล:** MongoDB ผ่าน [Prisma 5.8](https://www.prisma.io/) (`provider = "mongodb"`)
- **State management:** Redux Toolkit + React-Redux (เก็บการเลือกเดือน/ปี)
- **UI / Styling:** Tailwind CSS 3 (+ `@tailwindcss/forms`, `@tailwindcss/typography`), Headless UI, React Icons
- **Auth:** Cookie-based ผ่าน `nookies` (cookie ชื่อ `_auth_nurse`)
- **HTTP:** Axios + `axios-hooks`
- **วันที่:** Day.js (locale ไทย)
- **รายงาน:** `react-to-print` (พิมพ์), `xlsx` (export Excel), `thai-baht-text` (แปลงตัวเลขเป็นข้อความบาท)
- **Logging:** `next-logger` + `pino` (production)

---

## โครงสร้างโปรเจกต์

```
nurse-schedules/
├── pages/                      # Next.js Pages Router
│   ├── _app.jsx                # App wrapper (Redux Provider, Layout, auth gate)
│   ├── index.jsx               # หน้าหลัก: เวรของฉัน/ทีม + ปฏิทิน + เข้าเวรวันนี้
│   ├── login.jsx               # หน้าเข้าสู่ระบบ
│   ├── register.jsx            # ลงทะเบียนผู้ใช้
│   ├── profile.jsx             # โปรไฟล์ผู้ใช้
│   ├── auto-schedule.jsx       # จัดเวรอัตโนมัติ + มอบหมายพนักงานเข้าแผนก
│   ├── reservation.jsx         # จองเวรล่วงหน้า (ปฏิทินเลือกกะ)
│   ├── fairness.jsx            # สรุปความเป็นธรรม
│   ├── official-schedule.jsx   # ตารางเวรราชการ (สำหรับพิมพ์)
│   ├── on-call.jsx             # เวร On-Call (ICU)
│   ├── payment.jsx             # ค่าตอบแทน/OT
│   └── api/                    # API routes (ดูหัวข้อ API Routes)
│
├── components/
│   ├── Layout/                 # Sidebar, MobileNav, navConfig (เมนู)
│   ├── TableSelectMonth/       # ตารางเวรรายเดือน + modal แก้ไขเวร (หลายตัวแปร: OT/RF/Red/AFC)
│   ├── AutoSchedule/           # AutoSchedulePanel (สร้าง/พรีวิว/บันทึกตารางอัตโนมัติ)
│   ├── StaffAssignment/        # มอบหมายพนักงานเข้าแผนก
│   ├── ShiftReservation/       # ปุ่ม/ตรรกะการจองเวร
│   ├── Schedule/               # ScheduleBoard, modal เพิ่ม/แก้กะ, shiftStyle
│   ├── Fairness/               # FairnessDashboard, FairnessSummaryCard
│   ├── Home/                   # TodayBoard (เวรวันนี้)
│   ├── OfficialScheduleTable/  # ตารางสำหรับพิมพ์ราชการ
│   ├── OnCall/                 # ตารางเวร On-Call
│   ├── ScheduleCalendar.jsx    # ปฏิทินเวร (แทน FullCalendar เดิม)
│   ├── ExportExcelButton.jsx   # ปุ่มส่งออก Excel
│   └── Loading/Error/...       # คอมโพเนนต์ทั่วไป
│
├── prisma/
│   ├── schema.prisma           # นิยามฐานข้อมูล (MongoDB)
│   └── seed.js                 # ข้อมูลตั้งต้น
│
├── store/                      # Redux (dateSlice, store)
├── src/authProvider.js         # ตรรกะ login/logout/check (cookie)
├── utils/                      # prisma client, day.js helper, printStyle
├── styles/                     # globals.css (Tailwind)
├── public/                     # static assets
├── .env                        # ตัวแปรสภาพแวดล้อม (ต้องสร้างเอง)
└── Dockerfile                  # สำหรับ build image
```

---

## การติดตั้งและเริ่มใช้งาน

### สิ่งที่ต้องมีก่อน (Prerequisites)

- **Node.js** 18 ขึ้นไป (แนะนำ 20.x)
- **MongoDB** (ต้องเป็น **replica set** เพราะ Prisma ใช้ transaction — ใช้ MongoDB Atlas หรือ DigitalOcean Managed ได้)
- **yarn** (มี `yarn.lock` ใน repo) หรือ npm

### 1. ติดตั้ง dependencies

```bash
yarn          # หรือ npm install
```

### 2. ตั้งค่าตัวแปรสภาพแวดล้อม

สร้างไฟล์ `.env` ที่ root:

```env
# MongoDB connection string (ต้องเป็น replica set / รองรับ transaction)
DATABASE_URL="mongodb+srv://<user>:<password>@<cluster>/<db-name>?authSource=admin&tls=true"
```

> ⚠️ ค่า `DATABASE_URL` ชี้ไปยังฐานข้อมูลจริง อย่า commit รหัสผ่านลง git

### 3. เตรียมฐานข้อมูล

```bash
npx prisma generate     # สร้าง Prisma Client
npx prisma db push      # sync schema เข้า MongoDB
npm run seed            # (ทางเลือก) ใส่ข้อมูลตั้งต้น เช่น กะ/ตำแหน่ง/แผนก
```

### 4. รันโหมดพัฒนา

```bash
npm run dev
```

เปิด <http://localhost:3000>

---

## คำสั่งที่ใช้บ่อย

| คำสั่ง | หน้าที่ |
|--------|---------|
| `npm run dev` | รัน dev server (Next.js hot reload, port 3000) |
| `npm run build` | build สำหรับ production |
| `npm start` | รัน production (port **6040**, เปิด `next-logger`) |
| `npm run lint` | ตรวจ ESLint |
| `npx prisma generate` | สร้าง Prisma Client |
| `npx prisma db push` | sync schema เข้า MongoDB |
| `npx prisma studio` | เปิด GUI ดู/แก้ข้อมูลในฐานข้อมูล |
| `npm run seed` | seed ข้อมูลตั้งต้น |
| `npm run build-push` | build + push Docker image (`chunwarayut/tarangwen:latest`) |
| `npm run build-push-rn` | Docker variant (`chunwarayut/nurse-schedules:latest`) |
| `npm run build-push-pn` | Docker variant (`chunwarayut/pasuk-pn-tarangwen:latest`) |

---

## ฐานข้อมูล (Data Model)

ใช้ MongoDB ผ่าน Prisma — โมเดลหลัก:

| Model | หน้าที่ |
|-------|---------|
| **User** | พนักงาน (ชื่อ, username/password, ค่าตอบแทนปกติ/OT, สถานะ: admin/chief/part-time/ตั้งครรภ์/สูงอายุ, แผนก/ตำแหน่ง/คำนำหน้า) |
| **Duty** | เวรปกติ (ผูก `userId` × `shifId` × `locationId` × `datetime`, ธง `isOT`) — **1 คนมีได้หลายเวรต่อวัน** (รองรับเวรควบ) |
| **OnCallDuty** | เวร On-Call (โครงสร้างเดียวกับ Duty แต่แยกตาราง) |
| **UserDuty** | การมอบหมายพนักงานเข้าแผนก/วัน + สถานะอบรม (`isTrain`, `TrainingName`) |
| **Location** | แผนก/พื้นที่ทำงาน (ICU, ER, ...) — `name` unique |
| **Shif** | ชนิดกะ (`name`, `class` = สี/รูปแบบ, `isOT`, `isShif`, `isDayOff`) |
| **Position** | ตำแหน่งงาน (พยาบาล, พนักงานเปล, ...) |
| **Title** | คำนำหน้าวิชาชีพ |
| **Configuration** | ข้อมูลผู้ลงนามในรายงาน (หัวหน้าแผนก/ผู้นำ/ผู้อำนวยการ) |
| **ShiftPreference** | การจองเวร: `priority` (1=สูงสุด, 2=ปกติ, 3=ไม่อยาก), `isReserved` (จองแน่นอน) — unique `(userId, shifId, datetime)` |
| **ShiftHistory** | ประวัติการจัดเวร (สำหรับวิเคราะห์/อ้างอิงย้อนหลัง) |

> 📌 หมายเหตุ: โมเดล `Shif` มี field `code` แต่ในข้อมูลจริงไม่ได้ใช้/ไม่มีค่า การเรียงลำดับกะจึงอิง **ชื่อกะ** ตามเวลาเริ่มงานแทน

---

## ระบบยืนยันตัวตน (Authentication)

- ใช้ cookie ชื่อ **`_auth_nurse`** เก็บข้อมูลผู้ใช้ที่ login (`src/authProvider.js`)
- `login` → POST `/api/login` ตรวจ `username`/`password` → ถ้าพบ user ตั้ง cookie (อายุ 30 วัน)
- `check` → มี cookie = ผ่าน, ไม่มี = redirect ไป `/login`
- `logout` → ลบ cookie → ไป `/login`
- ผู้ใช้ที่เป็น admin (`isAdmin`) สามารถจัดเวร/มอบหมายงานได้

> ⚠️ ปัจจุบันรหัสผ่านเก็บแบบ plain text และ **API routes ใน `pages/api` ยังไม่มีการตรวจสิทธิ์ระดับ endpoint** — ดูหัวข้อ [ข้อควรระวัง](#ข้อควรระวัง--สิ่งที่ควรรู้)

---

## ชนิดของกะ/เวร

| สัญลักษณ์ | กะ | เวลา |
|-----------|----|----|
| **ช** | เช้า (morning) | 08:30 – 16:30 |
| **บ** | บ่าย (afternoon) | 16:30 – 00:30 |
| **ด** | ดึก (night) | 00:30 – 08:30 |
| **O / OT** | ล่วงเวลา (overtime) | ตามกะที่ทำควบ |
| **x** | วันหยุด (day off) | — |
| **R** | หยุดชดเชย / พัก | — |
| **อบรม** | วันอบรม | — |

**เวรควบที่พบจริงใน ICU:**
- `ชบ` — เช้า + บ่าย (มักเป็น OT เช้าต่อบ่าย, ทำต่อเนื่อง ~16 ชม.)
- `ดบ` — ดึก + บ่าย (OT บ่ายต่อจากดึก)

การแสดงผลในตารางจะเรียงกะในวันเดียวกันตามเวลาเริ่มกะ: **ด (00:30) → ช (08:30) → บ (16:30)**

---

## ระบบจัดเวรอัตโนมัติ (Auto-Schedule)

`POST /api/auto-schedule` สร้างตารางเวร **ทั้งเดือนจริง** (30/31 วัน) ตามขั้นตอน (ต่อวัน):

1. **เคารพการจองแน่นอน** (`isReserved`) — จัดกะ/วันหยุดที่พยาบาลจองไว้ก่อน
2. **กำหนดวันหยุด** ตามโควตาที่กระจายไว้
3. **จัดเวรหลัก** (ด → บ → ช) ตามจำนวนที่ต้องการต่อกะ/วัน (ลดลงในวันหยุดสุดสัปดาห์/นักขัตฤกษ์)
4. **จัด OT + เวรควบ** ตามรูปแบบจริง (ช OT ควบบ่าย, บ่าย OT ควบดึก)
5. **แก้ไขข้อขัดแย้ง** (ลบกะที่ห้ามทำติดกัน, ยกเว้นเวรควบที่ถูกต้อง ช+บ / ด+บ)
6. **เติมวันหยุด (x)** ให้คนที่ยังไม่มีเวรในวันนั้น เพื่อไม่ให้ตารางมีช่องว่าง

**กฎหลัก (Hard rules) ที่ใช้** (ปรับได้ใน `pages/api/auto-schedule/index.js` → `SHIFT_RULES`):

| รหัส | กฎ |
|------|----|
| H1–H3 | ระยะพักหลังเวรเดี่ยว ≥12 ชม., เวรควบ ≥24 ชม., On-Call ≥12 ชม. |
| H4 | ไม่เกิน 6 เวรดึกใน 14 วัน |
| H5 | เวรควบ ≤10/เดือน/คน |
| H6 | ไม่เกิน 4 On-Call/เดือน และห้าม On-Call ติดกัน |
| H7 | เวรชนิดเดียวกันติดกันได้สูงสุด 2 ครั้ง |

> ตัวเลขข้างต้นถูกปรับให้อิงสถิติเวรจริงของ ICU (ค่าเฉลี่ย มี.ค.–พ.ค. 2026) — กฎ "หมุนเวร ด→ช→บ เป๊ะ" ถูกถอดออก เพราะเวรจริงไม่ได้หมุนตามนั้น

**การบันทึก:** พรีวิวใน `AutoSchedulePanel` แล้วกด "บันทึกตารางเวร" → `POST /api/auto-schedule/apply` (ทำใน transaction) มีตัวเลือก **"แทนที่ของเดิม"** (ลบเวรเดิมของแผนกในเดือนนั้นก่อนบันทึกใหม่)

---

## หน้าจอ (Pages)

| Route | คำอธิบาย |
|-------|----------|
| `/` | หน้าหลัก — เวรของฉัน, เวรเพื่อนร่วมทีม, เข้าเวรวันนี้, ปฏิทินเวร |
| `/login` | เข้าสู่ระบบ |
| `/register` | ลงทะเบียนผู้ใช้ |
| `/profile` | โปรไฟล์ |
| `/auto-schedule` | จัดเวรอัตโนมัติ + มอบหมายพนักงานเข้าแผนก (แท็บ) |
| `/reservation` | จองเวรล่วงหน้า (ค่าเริ่มต้น = เดือนหน้า) |
| `/fairness` | สรุปความเป็นธรรม / ภาระงานต่อคน |
| `/official-schedule` | ตารางเวรราชการ (สำหรับพิมพ์) |
| `/on-call` | เวร On-Call (ICU) |
| `/payment` | ค่าตอบแทน / OT |

---

## API Routes

| Endpoint | หน้าที่ |
|----------|---------|
| `POST /api/login` | เข้าสู่ระบบ / `PUT` แก้ username-password |
| `GET /api/user/selectMonth` | ดึงผู้ใช้ + เวรของเดือน (ใช้ render ตารางหลัก) |
| `GET /api/user/selectMonth{AF,OT,R,NoR}` | ตัวแปรของ selectMonth สำหรับมุมมองต่าง ๆ |
| `GET /api/user/select-month-on-call` | ข้อมูลเวร On-Call รายเดือน |
| `* /api/duty`, `/api/duty/[id]` | CRUD เวรปกติ |
| `* /api/on-call`, `/api/on-call/[id]` | CRUD เวร On-Call |
| `POST /api/auto-schedule` | สร้างตารางอัตโนมัติ (พรีวิว) |
| `POST /api/auto-schedule/apply` | บันทึกตารางที่สร้างลง DB (transaction) |
| `GET/POST /api/auto-schedule/config` | กฎ/พารามิเตอร์การจัดเวร |
| `POST /api/staff-assignment`, `/api/auto-assign-staff` | มอบหมายพนักงานเข้าแผนก |
| `* /api/shift-preference` | จองเวร (ShiftPreference) |
| `GET /api/fairness` | สรุปคะแนนภาระงาน/ความเป็นธรรมรายเดือน |
| `* /api/user`, `/api/user-duty` | จัดการผู้ใช้ / การมอบหมาย |
| `* /api/location`, `/api/position`, `/api/title`, `/api/shif` | ข้อมูลอ้างอิง (แผนก/ตำแหน่ง/คำนำหน้า/กะ) |
| `* /api/configuration` | ตั้งค่าผู้ลงนามในรายงาน |

---

## การพิมพ์และส่งออกรายงาน

- **พิมพ์ราชการ:** ใช้ `react-to-print` + สไตล์ใน `utils/printStyle.js` มีบล็อกลงนามผู้บริหาร (ดึงจาก `Configuration`) — กลุ่มอบรม/พนักงานเปล render แยกแถวพิเศษ
- **Excel:** `ExportExcelButton` ใช้ `xlsx` ดึงข้อมูลจาก DB สร้างไฟล์ `.xlsx`
- รูปแบบตารางคงฟอร์มราชการเดิมไว้แม้ UI หน้าจอจะถูกออกแบบใหม่

---

## การ Deploy

### Docker

```bash
npm run build-push      # build (linux/amd64) + push → chunwarayut/tarangwen:latest
```

production รันที่ **port 6040** พร้อม `next-logger`

### Vercel

โปรเจกต์เชื่อมกับ Vercel (auto-deploy ต่อ PR/branch) — ตั้งค่า `DATABASE_URL` ใน Environment Variables ของ Vercel ก่อน

---

## ข้อควรระวัง / สิ่งที่ควรรู้

- **MongoDB ต้องเป็น replica set** — `apply.js` และหลาย endpoint ใช้ Prisma transaction ซึ่งไม่ทำงานบน MongoDB แบบ standalone
- **ความปลอดภัย:** รหัสผ่านเก็บเป็น plain text และ API routes ยังไม่มี auth ระดับ endpoint (รวมถึง endpoint ที่ลบข้อมูลจำนวนมาก เช่น `apply.js` โหมดแทนที่) — ควรเพิ่ม auth/role guard ก่อนใช้งานจริงในวงกว้าง
- **เวรควบกับการบันทึก:** 1 คนมีได้หลายเวร/วัน (ช+บ, ด+บ) ตอนบันทึกผ่าน `apply.js` ต้องแยกแต่ละกะเป็นคนละ Duty record — ตรวจสอบให้การ match เวรเดิมแยกตาม `shifId`/`isOT` ด้วย ไม่ใช่แค่ `userId`+`datetime`+`locationId`
- **ภาษา:** UI และข้อความทั้งหมดเป็นภาษาไทย วันที่ใช้ Day.js locale `th`

---

_เอกสารนี้อธิบายโครงสร้างและการใช้งานระบบ ณ ปัจจุบัน หากปรับโครงสร้าง/กฎการจัดเวร ควรอัปเดต README ให้สอดคล้อง_
