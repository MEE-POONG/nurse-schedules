import dayjs from "dayjs";

// ข้อมูล/สีของแต่ละกะ ใช้ร่วมกันทุกมุมมองของตารางเวรใหม่
export const SHIFT_META = {
  ด: { label: "ด", full: "ดึก", time: "00:30–08:30", order: 1, chip: "bg-indigo-100 text-indigo-800", accent: "#6366f1" },
  ช: { label: "ช", full: "เช้า", time: "08:30–16:30", order: 2, chip: "bg-amber-100 text-amber-800", accent: "#f59e0b" },
  บ: { label: "บ", full: "บ่าย", time: "16:30–00:30", order: 3, chip: "bg-sky-100 text-sky-800", accent: "#0ea5e9" },
  R: { label: "พัก", full: "พัก", time: "", order: 8, chip: "bg-rose-50 text-rose-600", accent: "#f43f5e" },
  x: { label: "หยุด", full: "หยุด", time: "", order: 9, chip: "bg-gray-100 text-gray-500", accent: "#9ca3af" },
  อบรม: { label: "อบรม", full: "อบรม", time: "", order: 7, chip: "bg-violet-100 text-violet-700", accent: "#8b5cf6" },
  ลาพัก: { label: "ลาพัก", full: "ลาพัก", time: "", order: 8, chip: "bg-gray-100 text-gray-500", accent: "#9ca3af" },
  ลากิจ: { label: "ลากิจ", full: "ลากิจ", time: "", order: 8, chip: "bg-gray-100 text-gray-500", accent: "#9ca3af" },
  ลาป่วย: { label: "ลาป่วย", full: "ลาป่วย", time: "", order: 8, chip: "bg-gray-100 text-gray-500", accent: "#9ca3af" },
};

// กะทำงานหลัก เรียงตามเวลาเริ่มกะ ด(00:30)→ช(08:30)→บ(16:30) — ใช้แยกการ์ดในมุมมองรายวัน + นับสรุป
export const WORK_SHIFTS = ["ด", "ช", "บ"];

// สีวงกลม OT ตาม field class ของกะ (circle-dark/red/blue) + ชื่อสีไทย
export const OT_CIRCLE = {
  "circle-dark": { ring: "border-gray-500 text-gray-600", th: "ดำ" },
  "circle-red": { ring: "border-red-500 text-red-500", th: "แดง" },
  "circle-blue": { ring: "border-sky-500 text-sky-500", th: "น้ำเงิน" },
};

export const metaOf = (name) =>
  SHIFT_META[name] || { label: name, full: name, time: "", order: 50, chip: "bg-gray-100 text-gray-600", accent: "#9ca3af" };

export const nameOf = (u) => `${u?.firstname || ""} ${u?.lastname || ""}`.trim();

// กะของ user ในวันที่กำหนด (day = 1..31) เรียงตามเวลาเริ่มกะ
export const dutiesOfDay = (user, day) =>
  [...(user?.Duty || [])]
    .filter((d) => dayjs(d.datetime).date() === day)
    .map((d) => ({
      id: d.id,
      shifId: d.shifId ?? d.Shif?.id,
      name: d.Shif?.name,
      isOT: d.isOT || d.Shif?.isOT,
      isOnCall: d.isOnCall,
      Shif: d.Shif,
    }))
    .sort((a, b) => (metaOf(a.name).order) - (metaOf(b.name).order));
