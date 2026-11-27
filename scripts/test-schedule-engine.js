#!/usr/bin/env node
// ชุดทดสอบเครื่องจัดตารางเวรอัตโนมัติ (ไม่ต้องต่อฐานข้อมูล ไม่ต้องลง dependency)
//   node scripts/test-schedule-engine.js
// ตรวจทั้งกติกาบังคับ (hard rules) และคุณภาพตาราง (วันหยุด/เวรควบ/ความสมดุล)
// ที่มาของตัวเลขเป้าหมาย: AUTO_SCHEDULE.md

const { generateSchedule, analyzeCapacity } = require("../utils/scheduleEngine/engine");
const { DEFAULT_CONFIG } = require("../utils/scheduleEngine/config");

let failed = 0;
let passed = 0;
const check = (label, ok, detail = "") => {
  if (ok) {
    passed++;
  } else {
    failed++;
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
};

const mkStaff = (n, opts = {}) =>
  [...Array(n)].map((_, i) => ({
    id: `u${i}`,
    name: `N${i}`,
    isChief: opts.noChief ? false : i === 0,
    isTrain: false,
    seq: i,
  }));

const WORK = ["ช", "บ", "ด"];
const isWeekend = (y, m, d) => [0, 6].includes(new Date(y, m - 1, d).getDay());

// สร้างตาราง userId -> day -> [cell] จากผลลัพธ์ + ช่องที่กรอกไว้เดิม
function buildGrid(result, fixed, history) {
  const grid = {};
  const put = (uid, day, cell) => {
    grid[uid] = grid[uid] || {};
    (grid[uid][day] = grid[uid][day] || []).push(cell);
  };
  for (const [key, cells] of Object.entries(history || {})) {
    const [uid, d] = key.split("|");
    cells.forEach((c) => put(uid, parseInt(d, 10), c));
  }
  for (const [key, cells] of Object.entries(fixed || {})) {
    const [uid, d] = key.split("|");
    cells.forEach((c) => put(uid, parseInt(d, 10), c));
  }
  for (const a of result.assignments) put(a.userId, a.day, a);
  return grid;
}

// ตรวจกติกาที่ต้องจริงทุกกรณี ไม่ว่ากำลังคนจะพอหรือไม่
function assertInvariants(label, result, args, cfg) {
  const { year, month, staff } = args;
  const N = result.daysInMonth;
  const grid = buildGrid(result, args.fixed, args.history);
  const workOf = (uid, day) => (grid[uid]?.[day] || []).filter((c) => WORK.includes(c.shift));

  for (const p of staff.filter((s) => !s.isTrain)) {
    let nightStreak = 0;
    let doubles = 0;
    let off = 0;
    for (let day = 1; day <= N; day++) {
      const today = workOf(p.id, day);
      const yest = workOf(p.id, day - 1);

      // พักผ่อน: บ่ายเมื่อวาน → ห้ามดึกวันนี้ (ทำงานต่อเนื่อง 16 ชม.)
      if (today.some((c) => c.shift === "ด") && yest.some((c) => c.shift === "บ"))
        check(`${label}: ${p.name} บ่ายวันที่ ${day - 1} ต่อดึกวันที่ ${day}`, false);

      // เวรควบได้เฉพาะ ชบ และ ดบ
      if (today.length > 2) check(`${label}: ${p.name} วันที่ ${day} มี ${today.length} กะในวันเดียว`, false);
      if (today.length === 2) {
        doubles++;
        // เรียงด้วย sort() เหมือน engine เพื่อเทียบคู่ที่อนุญาต (ช+บ, ด+บ)
        const combo = today.map((c) => c.shift).sort().join("");
        const ok = combo === ["ช", "บ"].sort().join("") || combo === ["ด", "บ"].sort().join("");
        check(`${label}: ${p.name} วันที่ ${day} เวรควบ "${combo}" ไม่อนุญาต`, ok);
      }
      if (!today.length) off++;

      // ดึกติดกันไม่เกินเพดาน
      nightStreak = today.some((c) => c.shift === "ด") ? nightStreak + 1 : 0;
      check(`${label}: ${p.name} ดึกติดกัน ${nightStreak} คืน ถึงวันที่ ${day}`, nightStreak <= cfg.rules.maxNightStreak);

      // หัวหน้าหอ: เฉพาะเวรเช้า และหยุดเสาร์–อาทิตย์
      if (p.isChief && cfg.chief.morningOnly) {
        const bad = today.filter((c) => c.shift !== "ช" && !c.fixed);
        check(`${label}: หัวหน้าขึ้นเวร ${bad.map((c) => c.shift).join("")} วันที่ ${day}`, bad.length === 0);
        if (cfg.chief.weekendOff && isWeekend(year, month, day))
          check(`${label}: หัวหน้าขึ้นเวรวันเสาร์–อาทิตย์ (วันที่ ${day})`, today.length === 0);
      }

      // ห้ามทับช่องที่กรอกไว้เดิม (วันที่มีของเดิมต้องไม่มี assignment ใหม่เลย)
      if ((args.fixed || {})[`${p.id}|${day}`]?.length) {
        const added = result.assignments.filter((a) => a.userId === p.id && a.day === day);
        check(`${label}: ${p.name} วันที่ ${day} ระบบลงเวรทับช่องที่กรอกไว้แล้ว`, added.length === 0);
      }
    }
    check(`${label}: ${p.name} เวรควบ ${doubles} ครั้ง เกินเพดาน ${cfg.rules.maxDoublesPerMonth}`, doubles <= cfg.rules.maxDoublesPerMonth);
    if (cfg.rules.guaranteeOffDays)
      check(`${label}: ${p.name} มีวันหยุด ${off} วัน (ขั้นต่ำ ${cfg.rules.minOffPerMonth})`, off >= cfg.rules.minOffPerMonth);
  }

  // ทุกคนต้องมีแถวสรุป และจำนวน assignment ต้องไม่ซ้ำช่องเดิม
  for (const p of staff.filter((s) => !s.isTrain))
    check(`${label}: ไม่มีสรุปของ ${p.name}`, !!result.summary.perUser[p.id]);
}

const cases = [
  { label: "8 คน ก.พ.2026", args: { year: 2026, month: 2, staff: mkStaff(8) }, expectFeasible: true },
  { label: "8 คน ม.ค.2026 (31 วัน)", args: { year: 2026, month: 1, staff: mkStaff(8) }, expectFeasible: true },
  { label: "8 คน เม.ย.2026 (30 วัน)", args: { year: 2026, month: 4, staff: mkStaff(8) }, expectFeasible: true },
  { label: "8 คน ก.พ.2027 (ปีอื่น)", args: { year: 2027, month: 2, staff: mkStaff(8) }, expectFeasible: true },
  { label: "10 คน", args: { year: 2026, month: 3, staff: mkStaff(10) }, expectFeasible: true },
  { label: "12 คน", args: { year: 2026, month: 3, staff: mkStaff(12) }, expectFeasible: true },
  { label: "ไม่มีหัวหน้าหอ", args: { year: 2026, month: 2, staff: mkStaff(8, { noChief: true }) }, expectFeasible: true },
  {
    label: "มีคนลา 10 วัน",
    args: {
      year: 2026,
      month: 2,
      staff: mkStaff(8),
      fixed: Object.fromEntries([...Array(10)].map((_, i) => [`u3|${i + 1}`, [{ shift: "LEAVE", isOT: false }]])),
    },
    expectFeasible: true,
  },
  {
    label: "มีเวรกรอกมือไว้",
    args: {
      year: 2026,
      month: 2,
      staff: mkStaff(8),
      fixed: {
        "u1|5": [{ shift: "ด", isOT: false }],
        "u2|5": [{ shift: "บ", isOT: false }],
        "u4|12": [{ shift: "ช", isOT: true }],
      },
    },
    expectFeasible: true,
  },
  {
    label: "ต่อเนื่องจากท้ายเดือนก่อน",
    args: {
      year: 2026,
      month: 2,
      staff: mkStaff(8),
      history: {
        "u1|0": [{ shift: "บ", isOT: false }], // บ่ายวันสิ้นเดือน → ห้ามดึกวันที่ 1
        "u2|0": [{ shift: "ด", isOT: false }],
        "u2|-1": [{ shift: "ด", isOT: false }],
        "u2|-2": [{ shift: "ด", isOT: false }], // ดึกครบ 3 คืน → ห้ามดึกวันที่ 1
      },
    },
    expectFeasible: true,
  },
  {
    label: "มีการจองเวร",
    args: {
      year: 2026,
      month: 2,
      staff: mkStaff(8),
      preferences: {
        "u5|10": [{ shift: "ด", priority: 1, isReserved: true }],
        "u6|10": [{ shift: "x", priority: 1, isReserved: true }],
        "u7|11": [{ shift: "ช", priority: 1, isReserved: false }],
      },
    },
    expectFeasible: true,
  },
  { label: "กำลังคนไม่พอ (6 คน)", args: { year: 2026, month: 2, staff: mkStaff(6) }, expectFeasible: false },
  {
    // รวมทั้งเดือนกำลังคนพอ แต่ต้นเดือนลาพร้อมกัน 3 คน → ต้องเตือนว่าวันนั้นตึง
    label: "ลาพร้อมกัน 3 คน ต้นเดือน",
    args: {
      year: 2026,
      month: 1,
      staff: mkStaff(8),
      fixed: Object.fromEntries(
        [1, 2, 3].flatMap((u) => [...Array(10)].map((_, i) => [`u${u}|${i + 1}`, [{ shift: "LEAVE", isOT: false }]]))
      ),
    },
    expectFeasible: true,
    allowUnfilled: true,
    expectTightDays: true,
  },
];

console.log("ทดสอบเครื่องจัดตารางเวรอัตโนมัติ\n");
for (const c of cases) {
  const args = { fixed: {}, history: {}, preferences: {}, configOverrides: {}, ...c.args };
  const t = Date.now();
  const r = generateSchedule(args);
  const ms = Date.now() - t;
  const cfg = r.config;
  const hard = r.violations.filter((v) => !v.soft);
  const per = Object.values(r.summary.perUser);
  const rng = (f) => `${Math.min(...per.map(f))}-${Math.max(...per.map(f))}`;

  assertInvariants(c.label, r, args, cfg);
  check(`${c.label}: feasible ควรเป็น ${c.expectFeasible}`, r.capacity.feasible === c.expectFeasible, `ได้ ${r.capacity.feasible}`);
  if (c.expectTightDays)
    check(`${c.label}: ต้องเตือนว่ามีวันที่กำลังคนตึง`, r.capacity.tightDays.length > 0 && r.capacity.recommendations.length > 0);
  if (c.expectFeasible && !c.allowUnfilled) {
    check(`${c.label}: มีช่องขาดคน ${hard.length} ช่อง`, hard.length === 0);
    check(`${c.label}: ความสมดุลเวรรวมต่างกัน ${r.summary.fairness.totalSpread}`, r.summary.fairness.totalSpread <= 6, "ควร ≤ 6");
    check(`${c.label}: เวรดึกต่างกัน ${r.summary.fairness.nightSpread}`, r.summary.fairness.nightSpread <= 3, "ควร ≤ 3");
  } else if (!c.expectFeasible) {
    check(`${c.label}: ต้องมีคำแนะนำว่าต้องลดช่อง/เพิ่มคนเท่าไร`, r.capacity.recommendations.length > 0);
  }
  check(`${c.label}: ช้าเกินไป (${ms}ms)`, ms < 5000);

  console.log(
    `  ${c.label.padEnd(26)} ${String(ms).padStart(4)}ms  ขาดคน ${String(hard.length).padStart(2)}  ` +
      `หยุด ${rng((p) => p.off).padEnd(5)} ควบ ${rng((p) => p.doubles).padEnd(5)} รวม ${rng((p) => p.total).padEnd(6)} ` +
      `ติดกัน ${String(Math.max(...per.map((p) => p.maxStreak))).padStart(2)}`
  );
}

// ผลลัพธ์ต้องเหมือนกันทุกครั้ง (deterministic — ไม่ใช้ Math.random)
const a = generateSchedule({ year: 2026, month: 5, staff: mkStaff(8), fixed: {}, history: {}, preferences: {} });
const b = generateSchedule({ year: 2026, month: 5, staff: mkStaff(8), fixed: {}, history: {}, preferences: {} });
check("ผลลัพธ์ซ้ำได้ (deterministic)", JSON.stringify(a.assignments) === JSON.stringify(b.assignments));

// ตรวจกำลังคนล่วงหน้าต้องตอบได้โดยไม่ต้องจัดตาราง
const cap = analyzeCapacity({ year: 2026, month: 1, staff: mkStaff(8), fixed: {}, config: DEFAULT_CONFIG });
check("ตรวจกำลังคน: นับช่องทั้งเดือนถูก", cap.demand.total === 248, `ได้ ${cap.demand.total}`);
check("ตรวจกำลังคน: บอกจำนวนคนในวงหมุนเวร", cap.rotCount === 7, `ได้ ${cap.rotCount}`);

console.log(`\n${failed === 0 ? "✅" : "❌"} ผ่าน ${passed} ข้อ · ไม่ผ่าน ${failed} ข้อ`);
process.exit(failed === 0 ? 0 : 1);
