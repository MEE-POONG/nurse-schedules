// ค่าตั้งต้นของเครื่องจัดตารางเวรอัตโนมัติ
// ทุกตัวเลขสกัดจากข้อมูลการขึ้นเวรจริงของ ICU (Duty ส.ค. 2024 – ก.ค. 2026, วิเคราะห์ละเอียด 8 เดือนล่าสุด)
// ดูหลักฐานและที่มาใน AUTO_SCHEDULE.md

// จำนวนคนที่ต้องมีต่อกะต่อวัน (ค่ามัธยฐานจากข้อมูลจริง)
// morningReg = เช้าในเวลา (วันธรรมดาคือหัวหน้า), morningOT = เช้า OT (แกนหลักของ OT)
const DEFAULT_COVERAGE = {
  weekday: { night: 2, evening: 2, morningReg: 1, morningOT: 2, eveningOT: 1, nightOT: 0 },
  weekend: { night: 2, evening: 2, morningReg: 0, morningOT: 3, eveningOT: 1, nightOT: 0 },
};

const DEFAULT_RULES = {
  maxNightStreak: 3, // ดึกติดกันสูงสุด (ข้อมูลจริงไม่เคยเกิน 3)
  maxDoublesPerMonth: 12, // เวรควบ (ชบ/ดบ) ต่อคนต่อเดือน (ข้อมูลจริง ~4–10)
  softMaxConsecutiveWork: 7, // ทำงานติดกันเกินนี้เริ่มโดนหักคะแนน (soft)
  minOffPerMonth: 4, // เป้าวันหยุดขั้นต่ำต่อคน (ข้อมูลจริง 3–8, soft)
};

// พฤติกรรมหัวหน้า (สกัดจากเวรจริงของหัวหน้าหอ: ขึ้นเช้าเกือบทุกวัน ไม่ขึ้นบ่าย/ดึกปกติ)
const DEFAULT_CHIEF = {
  morningOnly: true, // ขึ้นเฉพาะเวรเช้า
  weekendMorningIsOT: true, // เช้าเสาร์–อาทิตย์ของหัวหน้านับเป็น OT
  allowEveningOTDouble: true, // ควบ เช้า + บ่าย OT ได้ (พบจริงบ่อย)
};

// สี OT ที่ใช้บันทึก (field class ของ Shif) ตามที่หน่วยงานใช้จริง
// เช้า OT = วงดำ, บ่าย OT = วงแดง, ดึก OT = วงดำ (วงน้ำเงินสงวนไว้กรอกมือ/on-call)
const DEFAULT_OT_CLASS = { ช: "circle-dark", บ: "circle-red", ด: "circle-dark" };

// น้ำหนักคะแนนตอนเลือกคนลงกะ
const DEFAULT_WEIGHTS = {
  transition: 6, // เดินตามลูปหมุนเวรจริง
  need: 8, // สมดุลจำนวนกะแต่ละชนิดต่อคน
  total: 10, // สมดุลภาระงานรวมต่อคน
  consecutive: 5, // เลี่ยงทำงานติดกันยาวเกิน
  weekend: 3, // สมดุลการทำงานเสาร์–อาทิตย์
  comboBonus: 5, // ชอบเวรควบรูปแบบที่ใช้จริง: ช(OT)+บ และ ด+บ(OT)
};

// คะแนนการหมุนเวร "เมื่อวาน → วันนี้" (0–10) normalize จากตารางความถี่จริง
// เช่น ช→ด พบ 206 ครั้ง (มากสุด) = 10, ชบ→ช 206 = 10, ดบ→ชบ 63 = 9 ตามสัดส่วนของแต่ละแถว
// คู่ที่ไม่พบเลยในข้อมูลจริงและอันตราย (มีบ่ายเมื่อวาน → ดึกวันนี้ = ทำงานต่อเนื่อง 16 ชม.) เป็น hard rule ใน engine
const TRANSITION_SCORE = {
  OFF: { OFF: 6, ช: 8, ชบ: 8, ด: 5, บ: 4, ดบ: 2 },
  ช: { ด: 10, ช: 4, ชบ: 4, ดบ: 3, OFF: 3, บ: 1 },
  บ: { ชบ: 8, ช: 6, OFF: 4, บ: 3 },
  ด: { ด: 8, ดบ: 7, ชบ: 6, OFF: 6, ช: 4, บ: 3 },
  ชบ: { ช: 10, ชบ: 7, OFF: 5, บ: 2 },
  ดบ: { ชบ: 9, ช: 6, OFF: 5, บ: 2 },
};

const DEFAULT_CONFIG = {
  coverage: DEFAULT_COVERAGE,
  rules: DEFAULT_RULES,
  chief: DEFAULT_CHIEF,
  otClass: DEFAULT_OT_CLASS,
  weights: DEFAULT_WEIGHTS,
  writeOffDays: true, // เติมกะ "x" (หยุด) ให้วันว่างอัตโนมัติ (ตามธรรมเนียมข้อมูลจริง)
  restarts: 8, // จำนวนรอบสุ่ม (deterministic seed) แล้วเลือกผลที่ดีที่สุด
};

// รวม config จาก client เข้ากับค่าตั้งต้น (merge ตื้นทีละหมวด)
function mergeConfig(overrides = {}) {
  const merged = {
    ...DEFAULT_CONFIG,
    ...overrides,
    coverage: {
      weekday: { ...DEFAULT_COVERAGE.weekday, ...(overrides.coverage?.weekday || {}) },
      weekend: { ...DEFAULT_COVERAGE.weekend, ...(overrides.coverage?.weekend || {}) },
    },
    rules: { ...DEFAULT_RULES, ...(overrides.rules || {}) },
    chief: { ...DEFAULT_CHIEF, ...(overrides.chief || {}) },
    otClass: { ...DEFAULT_OT_CLASS, ...(overrides.otClass || {}) },
    weights: { ...DEFAULT_WEIGHTS, ...(overrides.weights || {}) },
  };
  // กันค่าพัง: จำนวนคนต่อกะต้องเป็น int >= 0
  for (const dayType of ["weekday", "weekend"]) {
    for (const key of Object.keys(merged.coverage[dayType])) {
      const v = parseInt(merged.coverage[dayType][key], 10);
      merged.coverage[dayType][key] = Number.isFinite(v) && v >= 0 ? Math.min(v, 20) : 0;
    }
  }
  merged.restarts = Math.min(Math.max(parseInt(merged.restarts, 10) || 8, 1), 30);
  return merged;
}

module.exports = { DEFAULT_CONFIG, TRANSITION_SCORE, mergeConfig };
