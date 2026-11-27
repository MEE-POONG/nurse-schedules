// เครื่องจัดตารางเวรอัตโนมัติ (pure function — ไม่แตะ DB ทดสอบแบบ offline ได้)
// โมเดลจากข้อมูลการขึ้นเวรจริง: วันหนึ่งของพยาบาลคือ state หนึ่งใน
//   OFF, ช, บ, ด, ชบ (เช้าควบบ่าย), ดบ (ดึกควบบ่าย)
// แล้วค่อยติดป้าย OT ตามชนิดช่อง (slot) ที่ลงให้ ทำให้เกิดรูปแบบจริงอย่าง ช(OT)+บ, ด+บ(OT)
//
// Hard rules (จากข้อมูลจริง — คู่ที่ไม่เคยปรากฏเลย):
//  - มี "บ" เมื่อวาน → ห้าม "ด" วันนี้ (บ่ายเลิก 00:30 ดึกเริ่ม 00:30 = ทำงานต่อเนื่อง 16 ชม.)
//  - เวรควบได้เฉพาะ ชบ และ ดบ (ห้าม ชด)
//  - ดึกติดกันไม่เกิน maxNightStreak (จริงสูงสุด 3)
//  - ช่องที่มีเวร/ลา/อบรมอยู่แล้ว (fixed) จะไม่ถูกแตะ และถูกนับเป็นบริบทของกฎทุกข้อ

const { TRANSITION_SCORE, mergeConfig } = require("./config");

// ---------- utilities ----------

// PRNG แบบ deterministic (mulberry32) — ผลลัพธ์ reproducible ทุกครั้ง
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(arr, rnd) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const daysInMonth = (year, month) => new Date(year, month, 0).getDate(); // month 1-12
const dowOf = (year, month, day) => new Date(year, month - 1, day).getDay();
const isWeekendDay = (year, month, day) => {
  const dow = dowOf(year, month, day);
  return dow === 0 || dow === 6;
};

// state string ของวัน จาก components [{shift}] → 'OFF' | 'ช' | 'บ' | 'ด' | 'ชบ' | 'ดบ'
function stateOf(components) {
  if (!components || components.length === 0) return "OFF";
  const names = new Set(components.map((c) => c.shift));
  const work = ["ด", "ช", "บ"].filter((n) => names.has(n)).join("");
  return work || "OFF"; // วันลา/หยุด = OFF ในแง่การหมุนเวร
}

const variance = (nums) => {
  if (!nums.length) return 0;
  const mean = nums.reduce((s, x) => s + x, 0) / nums.length;
  return nums.reduce((s, x) => s + (x - mean) ** 2, 0) / nums.length;
};

// ---------- แกนหลัก ----------

/**
 * @param {Object} args
 * @param {number} args.year ค.ศ.
 * @param {number} args.month 1-12
 * @param {Array}  args.staff [{ id, name, isChief, isTrain }]
 * @param {Object} args.fixed  ช่องที่ห้ามแตะ: { "<userId>|<day>": [{ shift: 'ช'|'บ'|'ด'|'OFF'|'LEAVE', isOT }] }
 *                 shift 'OFF'/'LEAVE' = วันนั้นไม่ทำงาน (x/ลา/อบรม), งานจริงใช้ชื่อกะ
 * @param {Object} args.history เวรท้ายเดือนก่อน (บริบทต่อเนื่องข้ามเดือน): รูปแบบเดียวกับ fixed
 *                 แต่ day ≤ 0 (0 = วันสุดท้ายของเดือนก่อน, -1 = ก่อนหน้านั้น, …)
 *                 ใช้กับ: ห้าม บ่ายสิ้นเดือน→ดึกวันที่ 1, ดึกติดกันข้ามเดือน, ลูปหมุนต่อเนื่อง
 * @param {Object} args.preferences การจองเวร (ShiftPreference): { "<userId>|<day>": [{ shift: 'ช'|'บ'|'ด'|'x', priority, isReserved }] }
 *                 isReserved = จองแน่นอน → จัดให้ก่อนเป็นอันดับแรก (ถ้าไม่ขัด hard rules)
 *                 priority (เมื่อไม่ reserved): 1 ต้องการมาก, 2 ปกติ, 3 ไม่อยากทำ → เป็นคะแนนโน้มน้าว
 * @param {Object} args.configOverrides ปรับค่าจาก DEFAULT_CONFIG
 * @returns {{ assignments, violations, summary, config }}
 */
function generateSchedule({ year, month, staff, fixed = {}, history = {}, preferences = {}, configOverrides = {} }) {
  const config = mergeConfig(configOverrides);
  const N = daysInMonth(year, month);
  // คนที่จัดเวรให้ได้ = ไม่ได้ไปอบรมทั้งเดือน
  const active = staff.filter((s) => !s.isTrain);
  const chief = active.find((s) => s.isChief) || null;

  let best = null;
  for (let seed = 1; seed <= config.restarts; seed++) {
    const result = solveOnce({ year, month, N, staff: active, chief, fixed, history, preferences, config, seed });
    if (!best || result.objective < best.objective) best = result;
  }

  const { assignments, unfilled, relaxations } = best;

  // เติมวันว่างเป็น "หยุด" (x) ตามธรรมเนียมข้อมูลจริง
  if (config.writeOffDays) {
    for (const p of active) {
      for (let day = 1; day <= N; day++) {
        const key = `${p.id}|${day}`;
        const hasFixed = fixed[key] && fixed[key].length > 0;
        const hasNew = assignments.some((a) => a.userId === p.id && a.day === day);
        if (!hasFixed && !hasNew) {
          assignments.push({ userId: p.id, day, shift: "x", isOT: false, otClass: null });
        }
      }
    }
  }

  const { summary, violations } = evaluate({ year, month, N, staff: active, fixed, history, preferences, assignments, unfilled, config });

  const hardRelax = (relaxations || []).filter((r) => r.level >= 2);
  const paceRelax = (relaxations || []).filter((r) => r.level === 1);
  if (paceRelax.length) {
    violations.push({
      type: "relaxed",
      day: null,
      soft: true,
      message: `ผ่อนจังหวะกระจายวันหยุด ${paceRelax.length} ช่อง (วันที่ ${[...new Set(paceRelax.map((r) => r.day))].join(", ")}) — กำลังคนวันนั้นตึง`,
    });
  }
  if (hardRelax.length) {
    violations.push({
      type: "relaxed",
      day: null,
      soft: true,
      message: `ผ่อนเพดาน "ทำงานติดกันไม่เกิน ${config.rules.maxConsecutiveWork} วัน" ${hardRelax.length} ช่อง (วันที่ ${[
        ...new Set(hardRelax.map((r) => r.day)),
      ].join(", ")}) — ไม่มีคนอื่นลงช่องนั้นได้เลย ควรเพิ่มคนหรือลดช่องวันนั้น`,
    });
  }

  const capacity = analyzeCapacity({ year, month, staff, fixed, config });

  return { assignments, violations, summary, capacity, config, daysInMonth: N };
}

// จำนวนวันย้อนหลังของเดือนก่อนที่ต้องรู้ (ครอบคลุมกฎดึกติดกัน + โทษทำงานติดยาว)
const lookbackDays = (rules) => Math.max(rules.maxNightStreak, rules.softMaxConsecutiveWork, 3);

// จัดหนึ่งรอบด้วย seed ที่กำหนด
function solveOnce({ year, month, N, staff, chief, fixed, history, preferences, config, seed }) {
  const rnd = mulberry32(seed * 7919 + month * 131 + year);
  const T = TRANSITION_SCORE;
  const W = config.weights;
  const R = config.rules;
  const LOOKBACK = lookbackDays(R);
  const MIN_DAY = 1 - LOOKBACK;

  // ตารางระหว่างจัด: userId -> day -> [{shift, isOT, fixed}]
  // รวมวัน ≤ 0 = เวรท้ายเดือนก่อน (บริบทของกฎ ไม่ถูกจัด/ไม่ถูกนับยอดของเดือนนี้)
  const grid = {};
  for (const p of staff) grid[p.id] = {};

  // โหลด fixed + history เข้า grid (เป็นบริบทของกฎ แต่ห้ามแก้)
  for (const p of staff) {
    for (let day = MIN_DAY; day <= N; day++) {
      const cells = day >= 1 ? fixed[`${p.id}|${day}`] : history[`${p.id}|${day}`];
      if (cells && cells.length) {
        grid[p.id][day] = cells.map((c) => ({ shift: c.shift, isOT: !!c.isOT, fixed: true }));
      }
    }
  }

  // ตัวนับต่อคน (นับรวม fixed ที่เป็นงานจริง)
  const counts = {};
  for (const p of staff) {
    counts[p.id] = { total: 0, ด: 0, ช: 0, บ: 0, ot: 0, doubles: 0, weekendWork: 0, newWorkDays: 0 };
    for (let day = 1; day <= N; day++) {
      const comps = (grid[p.id][day] || []).filter((c) => ["ช", "บ", "ด"].includes(c.shift));
      for (const c of comps) {
        counts[p.id].total++;
        counts[p.id][c.shift]++;
        if (c.isOT) counts[p.id].ot++;
      }
      if (comps.length >= 2) counts[p.id].doubles++;
      if (comps.length && isWeekendDay(year, month, day)) counts[p.id].weekendWork++;
    }
  }

  const workComps = (uid, day) => (grid[uid][day] || []).filter((c) => ["ช", "บ", "ด"].includes(c.shift));
  // หัวหน้าหอหยุดเสาร์–อาทิตย์ (ไม่ถูกจัดเวรใดๆ รวม OT) — วันเหล่านี้ไม่นับเป็นวันที่จัดได้
  const chiefWeekendOff = (p, day) =>
    !!p.isChief && config.chief.morningOnly && config.chief.weekendOff && day >= 1 && isWeekendDay(year, month, day);
  const hasAnyCell = (uid, day) => (grid[uid][day] || []).length > 0;
  const hasFixedCell = (uid, day) => (grid[uid][day] || []).some((c) => c.fixed);

  const consecutiveWorkEndingAt = (uid, day) => {
    let n = 0;
    for (let d = day; d >= MIN_DAY; d--) {
      if (workComps(uid, d).length) n++;
      else break;
    }
    return n;
  };
  // ความยาวของ "ช่วงติดกัน" ถ้าลงเวรที่วัน day — นับทั้งก่อนและหลัง
  // ตอนไล่เติมช่องวันข้างหน้ายังว่าง (ค่าเท่ากับนับย้อนหลัง) แต่ตอนปรับสมดุลวันข้างหน้ามีเวรแล้ว
  const nightStreakIfAssigned = (uid, day) => {
    let n = 1;
    for (let d = day - 1; d >= MIN_DAY && workComps(uid, d).some((c) => c.shift === "ด"); d--) n++;
    for (let d = day + 1; d <= N && workComps(uid, d).some((c) => c.shift === "ด"); d++) n++;
    return n;
  };
  const workStreakIfAssigned = (uid, day) => {
    let n = 1;
    for (let d = day - 1; d >= MIN_DAY && workComps(uid, d).length; d--) n++;
    for (let d = day + 1; d <= N && workComps(uid, d).length; d++) n++;
    return n;
  };

  // ---- เป้าหมายต่อคน (ตามสัดส่วนวันที่ว่างให้จัดได้) ----
  const availDays = {};
  for (const p of staff) {
    let n = 0;
    for (let day = 1; day <= N; day++) if (!hasFixedCell(p.id, day) && !chiefWeekendOff(p, day)) n++;
    availDays[p.id] = n;
  }
  const totalAvail = Object.values(availDays).reduce((s, x) => s + x, 0) || 1;

  // slot ทั้งเดือนแต่ละชนิด → เป้าต่อคน
  const slotTotals = { ด: 0, บReg: 0, ชOT: 0, บOT: 0, ดOT: 0 };
  for (let day = 1; day <= N; day++) {
    const cov = isWeekendDay(year, month, day) ? config.coverage.weekend : config.coverage.weekday;
    slotTotals.ด += cov.night;
    slotTotals.บReg += cov.evening;
    slotTotals.ชOT += cov.morningOT;
    slotTotals.บOT += cov.eveningOT;
    slotTotals.ดOT += cov.nightOT;
  }
  // หัวหน้าไม่ร่วมวงหมุน ด/บ — เป้าของคนอื่นจึงหารเฉพาะ non-chief
  const rotStaff = staff.filter((p) => !(p.isChief && config.chief.morningOnly));
  const rotAvail = rotStaff.reduce((s, p) => s + availDays[p.id], 0) || 1;
  const targets = {};
  for (const p of staff) {
    const isRotating = rotStaff.includes(p);
    const shareRot = isRotating ? availDays[p.id] / rotAvail : 0;
    const shareAll = availDays[p.id] / totalAvail;
    targets[p.id] = {
      ด: slotTotals.ด * shareRot,
      บ: (slotTotals.บReg + slotTotals.บOT) * shareRot,
      ot: (slotTotals.ชOT + slotTotals.บOT + slotTotals.ดOT) * (config.chief.allowEveningOTDouble ? shareAll : shareRot),
      total: ((slotTotals.ด + slotTotals.บReg + slotTotals.ชOT + slotTotals.บOT + slotTotals.ดOT) * availDays[p.id]) / totalAvail,
    };
  }

  // ---- โควตาวันทำงาน/เวรควบต่อคน: กัน "วันหยุดขั้นต่ำ" ไว้ล่วงหน้า ----
  // ถ้าไม่กันไว้ engine จะเติมช่องไปวันต่อวันจนคนทำงานครบทั้งเดือนโดยไม่มีวันหยุดเลย
  const quota = {};
  for (const p of staff) {
    let fixedOff = 0; // วันที่ไม่ได้ทำงานอยู่แล้ว (ลา/อบรม/x ที่กรอกไว้ + เสาร์อาทิตย์ของหัวหน้า)
    for (let day = 1; day <= N; day++) {
      if (chiefWeekendOff(p, day)) {
        fixedOff++;
        continue;
      }
      const cells = grid[p.id][day] || [];
      if (cells.length && !cells.some((c) => ["ช", "บ", "ด"].includes(c.shift))) fixedOff++;
    }
    const offNeeded = Math.max(0, R.minOffPerMonth - fixedOff);
    const maxWorkDays = Math.max(0, availDays[p.id] - offNeeded); // เพดานวันทำงานใหม่ (hard)
    // เป้าเวรรวมของคนนี้ → แยกเป็น "กี่วันทำงาน" + "กี่เวรควบ"
    // ถ้าเป้าเวรมากกว่าจำนวนวันที่ทำได้ ส่วนเกินต้องมาจากเวรควบ (วางแผนไว้ล่วงหน้า ไม่ใช่ไปตันท้ายเดือน)
    const targetShifts = targets[p.id].total;
    const targetWorkDays = Math.min(maxWorkDays, Math.ceil(targetShifts));
    const targetDoubles = Math.min(R.maxDoublesPerMonth, Math.max(0, Math.ceil(targetShifts - targetWorkDays)));
    quota[p.id] = { maxWorkDays, offNeeded, targetWorkDays, targetDoubles };
  }
  // เป้าสะสม ณ วันที่ day (ใช้คุมจังหวะ: ไม่อัดงานต้นเดือนจนท้ายเดือนไม่มีคนลง)
  const workPaceAt = (uid, day) => (quota[uid].targetWorkDays * day) / N;
  const doublePaceAt = (uid, day) => (quota[uid].targetDoubles * day) / N;

  // ---- ตรวจสิทธิ์ลงช่อง (hard rules) ----
  // relaxLevel: 0 = เข้มทุกข้อ · 1 = ผ่อนจังหวะเดือน · 2 = ผ่อนเพดานทำงานติดกัน (ยังมีเพดานสูงสุด 2 เท่า)
  // ใช้ไล่ระดับเมื่อไม่มีใครลงช่องนั้นได้เลย — กติกาพักผ่อน/เวรควบ/วันหยุดขั้นต่ำ ไม่เคยถูกผ่อน
  function canAssign(p, day, shift, isOT, slotKind, relaxLevel = 0) {
    const uid = p.id;
    if (hasFixedCell(uid, day)) return false; // วันมีของเดิม (เวร/ลา/หยุดที่กรอกมือ) ไม่แตะ
    if (chiefWeekendOff(p, day)) return false; // หัวหน้าหอหยุดเสาร์–อาทิตย์
    // วันถูกบล็อกด้วย "จองหยุดแน่นอน" (x จาก pre-pass) แล้ว
    if ((grid[uid][day] || []).some((c) => !["ช", "บ", "ด"].includes(c.shift))) return false;
    const todays = workComps(uid, day);
    if (todays.length >= 2) return false;
    if (todays.some((c) => c.shift === shift)) return false; // กะซ้ำในวัน
    if (todays.length === 1) {
      const cur = todays[0].shift;
      // เวรควบที่อนุญาต: ช+บ, ด+บ เท่านั้น
      const combo = [cur, shift].sort().join("");
      if (!(combo === ["ช", "บ"].sort().join("") || combo === ["ด", "บ"].sort().join(""))) return false;
      if (counts[uid].doubles >= R.maxDoublesPerMonth) return false;
    }
    // ห้าม: เมื่อวานมีบ่าย → วันนี้ดึก (ทำงานต่อเนื่อง 16 ชม.)
    if (shift === "ด" && workComps(uid, day - 1).some((c) => c.shift === "บ")) return false; // รวมกรณีวันที่ 1 เทียบกับสิ้นเดือนก่อน
    // ห้าม: วันนี้ลงบ่าย แต่พรุ่งนี้มีดึก fixed หรือจองดึกแน่นอนไว้แล้ว
    if (shift === "บ" && day < N) {
      if (workComps(uid, day + 1).some((c) => c.shift === "ด")) return false;
      if ((preferences[`${uid}|${day + 1}`] || []).some((x) => x.isReserved && x.shift === "ด")) return false;
    }
    // ดึกติดกันเกินเพดาน (มองทั้งก่อน–หลัง)
    if (shift === "ด" && nightStreakIfAssigned(uid, day) > R.maxNightStreak) return false;
    if (todays.length === 0) {
      // โควตาวันทำงาน: ต้องเหลือวันหยุดขั้นต่ำตามกติกา
      if (R.guaranteeOffDays && counts[uid].newWorkDays >= quota[uid].maxWorkDays) return false;
      // ทำงานติดกันเกินเพดาน (ผ่อนที่ระดับ 2 แต่ไม่เกิน 2 เท่าของเพดาน)
      const streakCap = relaxLevel >= 2 ? R.maxConsecutiveWork * 2 : R.maxConsecutiveWork;
      if (workStreakIfAssigned(uid, day) > streakCap) return false;
      // ใช้โควตาวันทำงานล้ำหน้าจังหวะเดือนไปมาก → กันไว้ให้ปลายเดือนยังมีคนลงได้
      if (relaxLevel < 1 && counts[uid].newWorkDays >= workPaceAt(uid, day) + 2) return false;
    }
    // ข้อจำกัดหัวหน้า: ขึ้นเฉพาะเช้า + ควบบ่าย OT ได้ถ้าเปิดไว้
    if (p.isChief && config.chief.morningOnly) {
      if (shift === "ด") return false;
      if (shift === "บ" && !(isOT && config.chief.allowEveningOTDouble && todays.some((c) => c.shift === "ช"))) return false;
    }
    // ช่องเช้าในเวลา (morningReg) วันธรรมดาสงวนให้หัวหน้าก่อนผ่านคะแนน ไม่ hard
    return true;
  }

  // ---- คะแนนเลือกคน ----
  function score(p, day, shift, isOT, slotKind) {
    const uid = p.id;
    let s = 0;
    const before = stateOf(workComps(uid, day));
    const afterSet = workComps(uid, day).map((c) => c.shift).concat([shift]);
    const after = stateOf(afterSet.map((x) => ({ shift: x })));
    const prev = stateOf(workComps(uid, day - 1)); // วันที่ 1 ใช้เวรวันสิ้นเดือนก่อน (history) เป็นเมื่อวาน
    const tAfter = (T[prev] && T[prev][after]) || 0;
    const tBefore = before === "OFF" ? (T[prev] && T[prev].OFF) || 0 : (T[prev] && T[prev][before]) || 0;
    s += (W.transition * (tAfter - tBefore)) / 10;

    // สมดุลชนิดกะ
    const tg = targets[uid];
    if (shift === "ด") s += W.need * ((tg.ด - counts[uid].ด) / Math.max(tg.ด, 1));
    if (shift === "บ") s += W.need * ((tg.บ - counts[uid].บ) / Math.max(tg.บ, 1));
    if (isOT) s += W.need * ((tg.ot - counts[uid].ot) / Math.max(tg.ot, 1));

    // สมดุลภาระรวม
    s += W.total * ((tg.total - counts[uid].total) / Math.max(tg.total, 1));

    // เลี่ยงทำงานติดยาว
    const streak = consecutiveWorkEndingAt(uid, day - 1) + 1;
    if (streak > R.softMaxConsecutiveWork) s -= W.consecutive * (streak - R.softMaxConsecutiveWork);

    // สมดุลงานเสาร์–อาทิตย์
    if (isWeekendDay(year, month, day) && !workComps(uid, day).length) {
      const wkAvg = staff.reduce((sum, q) => sum + counts[q.id].weekendWork, 0) / staff.length;
      s -= W.weekend * Math.max(0, counts[uid].weekendWork - wkAvg);
    }

    // เวรควบ (16 ชม.) = ต้นทุนสุขภาพ: ลงเดี่ยวก่อนเสมอ และกระจายให้เท่ากันเมื่อจำเป็น
    const todays = workComps(uid, day);
    if (todays.length === 1) {
      // นี่คือเวรควบ 16 ชม. — เทียบกับเป้าควบของคนนี้ตามจังหวะเดือน
      // ยังควบน้อยกว่าเป้า = รับได้ (ความต้องการของหอบังคับให้มีควบอยู่แล้ว), เกินเป้า = หักตามส่วน
      const behind = doublePaceAt(uid, day) - counts[uid].doubles;
      s += W.doubleBalance * (behind >= 0 ? 0.5 : behind);
    } else {
      // ใช้วันทำงานเร็วกว่าจังหวะเดือน = วันหยุดจะไปกองท้ายเดือน → หักคะแนน
      s -= W.pace * Math.max(0, counts[uid].newWorkDays - workPaceAt(uid, day));
    }

    // โบนัสเวรควบรูปแบบที่ใช้จริง
    if (shift === "บ" && !isOT && todays.some((c) => c.shift === "ช" && c.isOT)) s += W.comboBonus; // ช(OT)+บ
    if (shift === "บ" && isOT && todays.some((c) => c.shift === "ด")) s += W.comboBonus; // ด+บ(OT)
    if (shift === "บ" && isOT && todays.some((c) => c.shift === "ช" && !c.isOT)) s += W.comboBonus * 0.6; // ช+บ(OT)

    // การจองแบบ "ระบุความต้องการ" (ไม่ reserved): โน้มน้าวคะแนน
    for (const pf of preferences[`${uid}|${day}`] || []) {
      if (pf.isReserved) continue; // จองแน่นอนถูกจัดไปแล้วใน pre-pass
      if (pf.shift === shift) {
        s += pf.priority === 1 ? W.preference : pf.priority === 2 ? W.preference * 0.6 : -W.preference; // p3 = ไม่อยากทำกะนี้
      } else if (pf.shift === "x") {
        // อยากหยุดวันนี้ → ลงเวรอะไรก็โดนหัก (p3 "ไม่อยากหยุด" = บวกเล็กน้อย)
        s += pf.priority === 3 ? W.preference * 0.2 : -(pf.priority === 1 ? W.preference : W.preference * 0.6);
      }
    }

    // หัวหน้าได้ช่องเช้าในเวลาเป็นอันดับแรกเสมอ
    if (slotKind === "morningReg" && p.isChief) s += 1000;
    // เช้า OT วันธรรมดา: กันหัวหน้าไม่ให้กินช่องของคนอื่น (หัวหน้าได้ morningReg แล้ว)
    if (slotKind === "morningOT" && p.isChief && !isWeekendDay(year, month, day)) s -= 8;

    return s;
  }

  function assign(p, day, shift, isOT) {
    grid[p.id][day] = grid[p.id][day] || [];
    grid[p.id][day].push({ shift, isOT, fixed: false });
    const comps = workComps(p.id, day);
    counts[p.id].total++;
    counts[p.id][shift]++;
    if (isOT) counts[p.id].ot++;
    if (comps.length === 2) counts[p.id].doubles++;
    if (comps.length === 1) counts[p.id].newWorkDays++; // เริ่มทำงานวันใหม่ → ใช้โควตาวันทำงาน 1 วัน
    if (comps.length === 1 && isWeekendDay(year, month, day)) counts[p.id].weekendWork++;
  }

  // ถอนเวรที่ระบบลงไว้ (ย้อนตัวนับให้ตรง) — ใช้ตอนปรับสมดุลหลังจัดเสร็จ
  function unassign(p, day, shift, isOT) {
    const cells = grid[p.id][day] || [];
    const i = cells.findIndex((c) => !c.fixed && c.shift === shift && !!c.isOT === !!isOT);
    if (i < 0) return false;
    const before = workComps(p.id, day).length;
    cells.splice(i, 1);
    const after = workComps(p.id, day).length;
    counts[p.id].total--;
    counts[p.id][shift]--;
    if (isOT) counts[p.id].ot--;
    if (before === 2 && after === 1) counts[p.id].doubles--;
    if (before === 1 && after === 0) {
      counts[p.id].newWorkDays--;
      if (isWeekendDay(year, month, day)) counts[p.id].weekendWork--;
    }
    return true;
  }

  // ---- เดินวันต่อวัน เติมช่องตามลำดับ: ดึก → บ่าย → เช้าในเวลา → เช้าOT → บ่ายOT → ดึกOT ----
  const unfilled = [];
  const relaxations = []; // ช่องที่ต้องผ่อนกติกา "ทำงานติดกันสูงสุด" เพราะไม่มีใครลงได้
  const newAssignments = [];
  for (let day = 1; day <= N; day++) {
    const cov = isWeekendDay(year, month, day) ? config.coverage.weekend : config.coverage.weekday;
    const slots = [];
    for (let i = 0; i < cov.night; i++) slots.push({ kind: "night", shift: "ด", isOT: false });
    for (let i = 0; i < cov.evening; i++) slots.push({ kind: "evening", shift: "บ", isOT: false });
    for (let i = 0; i < cov.morningReg; i++) slots.push({ kind: "morningReg", shift: "ช", isOT: false });
    for (let i = 0; i < cov.morningOT; i++) slots.push({ kind: "morningOT", shift: "ช", isOT: true });
    for (let i = 0; i < cov.eveningOT; i++) slots.push({ kind: "eveningOT", shift: "บ", isOT: true });
    for (let i = 0; i < cov.nightOT; i++) slots.push({ kind: "nightOT", shift: "ด", isOT: true });

    // "จองแน่นอน" (isReserved) — จัดให้ก่อนเป็นอันดับแรกของวัน (ถ้าไม่ขัด hard rules)
    for (const p of staff) {
      const dayPrefs = (preferences[`${p.id}|${day}`] || []).filter((x) => x.isReserved);
      if (!dayPrefs.length) continue;
      // กะทำงานก่อน แล้วค่อยจองหยุด (กันกรณีจองทั้งคู่ในวันเดียว)
      for (const pf of dayPrefs.filter((x) => ["ช", "บ", "ด"].includes(x.shift))) {
        if (canAssign(p, day, pf.shift, false, "reserved")) {
          assign(p, day, pf.shift, false);
          newAssignments.push({ userId: p.id, day, shift: pf.shift, isOT: false, otClass: null, reserved: true });
        }
        // ถ้าขัดกติกา จะไม่จัดให้ — evaluate จะรายงานเป็นคำเตือนให้แอดมินเห็น
      }
      const wantsOff = dayPrefs.some((x) => x.shift === "x");
      if (wantsOff && !(grid[p.id][day] || []).length) {
        grid[p.id][day] = [{ shift: "x", isOT: false, fixed: false }]; // บล็อกทั้งวัน (canAssign เห็นเป็น non-work)
        newAssignments.push({ userId: p.id, day, shift: "x", isOT: false, otClass: null, reserved: true });
      }
    }

    // นับเวรที่มีแล้วของวันนี้เข้า coverage ก่อน (fixed ที่กรอกมือ + จองแน่นอนที่เพิ่งจัด)
    const fixedCount = { night: 0, evening: 0, morningReg: 0, morningOT: 0, eveningOT: 0, nightOT: 0 };
    for (const p of staff) {
      for (const c of workComps(p.id, day)) {
        if (c.shift === "ด") fixedCount[c.isOT ? "nightOT" : "night"]++;
        else if (c.shift === "บ") fixedCount[c.isOT ? "eveningOT" : "evening"]++;
        else if (c.shift === "ช") fixedCount[c.isOT ? "morningOT" : "morningReg"]++;
      }
    }
    const need = [];
    const used = { ...fixedCount };
    for (const slot of slots) {
      if (used[slot.kind] > 0) used[slot.kind]--;
      else need.push(slot);
    }

    for (const slot of need) {
      const pool = shuffled(staff, rnd);
      let candidates = [];
      let level = 0;
      for (; level <= 2; level++) {
        candidates = pool.filter((p) => canAssign(p, day, slot.shift, slot.isOT, slot.kind, level));
        if (candidates.length) break;
      }
      if (!candidates.length) {
        unfilled.push({ day, slot: slot.kind, shift: slot.shift, isOT: slot.isOT });
        continue;
      }
      if (level > 0) relaxations.push({ day, slot: slot.kind, level });
      let bestP = null;
      let bestS = -Infinity;
      for (const p of candidates) {
        const sc = score(p, day, slot.shift, slot.isOT, slot.kind);
        if (sc > bestS) {
          bestS = sc;
          bestP = p;
        }
      }
      assign(bestP, day, slot.shift, slot.isOT);
      newAssignments.push({
        userId: bestP.id,
        day,
        shift: slot.shift,
        isOT: slot.isOT,
        otClass: slot.isOT ? config.otClass[slot.shift] : null,
      });
    }
  }

  // ---- ปรับสมดุลหลังจัดเสร็จ (local search) ----
  // การไล่เติมช่องทีละวันทำให้บางคนได้เวรดึก/OT/ภาระรวม มากกว่าคนอื่นหลายเวร
  // รอบนี้จะย้าย (หรือสลับ) เวรระหว่างคู่ "คนที่ได้มาก ↔ คนที่ได้น้อย"
  // และ **รับเฉพาะการย้ายที่ทำให้คะแนนความไม่สมดุลรวมลดลงจริง** จึงไม่มีทางแย่ลงกว่าเดิม
  const SLOT_KIND = {
    ด: { reg: "night", ot: "nightOT" },
    บ: { reg: "evening", ot: "eveningOT" },
    ช: { reg: "morningReg", ot: "morningOT" },
  };

  // คะแนนความไม่สมดุลรวม (น้ำหนักเดียวกับ objective ที่ใช้เลือกรอบ)
  const balanceCost = () =>
    variance(staff.map((p) => counts[p.id].total)) * 10 +
    variance(rotStaff.map((p) => counts[p.id].ด)) * 8 +
    variance(staff.map((p) => counts[p.id].ot)) * 6 +
    variance(staff.map((p) => counts[p.id].doubles)) * 6 +
    variance(rotStaff.map((p) => counts[p.id].weekendWork)) * 3;

  // ย้ายเวร a ของ hi ไปให้ lo (ถ้าทำได้และดีขึ้น) — คืน true เมื่อย้ายสำเร็จ
  // relaxLevel 1 = ไม่เอากติกา "จังหวะเดือน" มาคิด (จังหวะใช้ตอนไล่เติมช่อง ไม่ใช่ตอนปรับสมดุล)
  function tryMove(hi, lo, a, costBefore) {
    const kind = a.isOT ? SLOT_KIND[a.shift].ot : SLOT_KIND[a.shift].reg;
    if (!unassign(hi, a.day, a.shift, a.isOT)) return false;
    if (canAssign(lo, a.day, a.shift, a.isOT, kind, 1)) {
      assign(lo, a.day, a.shift, a.isOT);
      if (balanceCost() < costBefore) {
        a.userId = lo.id;
        return true;
      }
      unassign(lo, a.day, a.shift, a.isOT); // ไม่ดีขึ้น → คืนสภาพ
    }
    assign(hi, a.day, a.shift, a.isOT);
    return false;
  }

  // สลับเวรกันในวันเดียวกัน: hi ให้เวร a ไป แล้วรับเวร b ของ lo มาแทน
  function trySwap(hi, lo, a, b, costBefore) {
    const kindA = a.isOT ? SLOT_KIND[a.shift].ot : SLOT_KIND[a.shift].reg;
    const kindB = b.isOT ? SLOT_KIND[b.shift].ot : SLOT_KIND[b.shift].reg;
    if (!unassign(hi, a.day, a.shift, a.isOT)) return false;
    if (!unassign(lo, b.day, b.shift, b.isOT)) {
      assign(hi, a.day, a.shift, a.isOT);
      return false;
    }
    if (canAssign(lo, a.day, a.shift, a.isOT, kindA, 1) && canAssign(hi, b.day, b.shift, b.isOT, kindB, 1)) {
      assign(lo, a.day, a.shift, a.isOT);
      assign(hi, b.day, b.shift, b.isOT);
      if (balanceCost() < costBefore) {
        a.userId = lo.id;
        b.userId = hi.id;
        return true;
      }
      unassign(lo, a.day, a.shift, a.isOT); // ไม่ดีขึ้น → คืนสภาพทั้งคู่
      unassign(hi, b.day, b.shift, b.isOT);
    }
    assign(lo, b.day, b.shift, b.isOT);
    assign(hi, a.day, a.shift, a.isOT);
    return false;
  }

  function rebalance(metric, picker, pool) {
    const value = (p) => counts[p.id][metric];
    for (let guard = 0; guard < 60; guard++) {
      const sorted = [...pool].sort((a, b) => value(b) - value(a));
      let moved = false;
      // ไล่คู่ (คนที่ได้มาก, คนที่ได้น้อย) ทุกคู่ที่ต่างกัน ≥ 2 — ไม่หยุดที่คู่แรกที่ย้ายไม่ได้
      for (let i = 0; i < sorted.length && !moved; i++) {
        for (let j = sorted.length - 1; j > i && !moved; j--) {
          const hi = sorted[i];
          const lo = sorted[j];
          if (value(hi) - value(lo) < 2) continue;
          const costBefore = balanceCost();
          const movable = newAssignments.filter((a) => a.userId === hi.id && picker(a));
          for (const a of movable) {
            if (tryMove(hi, lo, a, costBefore)) {
              moved = true;
              break;
            }
            const swapTargets = newAssignments.filter(
              (b) => b.userId === lo.id && b.day === a.day && !b.reserved && ["ช", "บ", "ด"].includes(b.shift) && b.shift !== a.shift
            );
            for (const b of swapTargets) {
              if (trySwap(hi, lo, a, b, costBefore)) {
                moved = true;
                break;
              }
            }
            if (moved) break;
          }
        }
      }
      if (!moved) return;
    }
  }

  // ไล่จากหยาบไปละเอียด แล้วทำซ้ำ — ทุกการย้ายต้องทำให้คะแนนรวมดีขึ้น จึงวนซ้ำได้อย่างปลอดภัย
  // หัวหน้าหอที่ขึ้นเฉพาะเช้าในเวลา ไม่ใช่เป้าของการกระจาย OT (เว้นแต่เปิดให้ควบบ่าย OT)
  const otPool = config.chief.allowEveningOTDouble ? staff : rotStaff;
  for (let round = 0; round < 2; round++) {
    rebalance("total", (a) => !a.reserved, rotStaff);
    rebalance("ot", (a) => a.isOT && !a.reserved, otPool);
    rebalance("ด", (a) => a.shift === "ด" && !a.reserved, rotStaff);
  }

  // ---- objective สำหรับเลือกรอบที่ดีที่สุด ----
  const totals = staff.map((p) => counts[p.id].total);
  const nights = rotStaff.map((p) => counts[p.id].ด);
  const ots = staff.map((p) => counts[p.id].ot);
  const weekends = rotStaff.map((p) => counts[p.id].weekendWork);
  const doubles = staff.map((p) => counts[p.id].doubles);
  const doublesTotal = doubles.reduce((sum, x) => sum + x, 0);
  let softPenalty = 0;
  for (const p of staff) {
    for (let day = 1; day <= N; day++) {
      const streak = consecutiveWorkEndingAt(p.id, day);
      if (streak > R.softMaxConsecutiveWork && !workComps(p.id, day + 1).length) softPenalty += streak - R.softMaxConsecutiveWork;
    }
  }
  const objective =
    unfilled.length * 1000 +
    relaxations.reduce((sum, r) => sum + (r.level >= 2 ? 60 : 15), 0) +
    doublesTotal * 4 + // เวรควบยิ่งน้อยยิ่งดี (ถ้าเติมช่องได้เท่ากัน)
    variance(totals) * 10 +
    variance(nights) * 8 +
    variance(ots) * 6 +
    variance(doubles) * 6 +
    variance(weekends) * 3 +
    softPenalty;

  return { assignments: newAssignments, unfilled, relaxations, objective, seed };
}

// ---- ตรวจผล + สรุปสถิติ (ใช้กับผลรวม fixed ด้วย เพื่อโชว์ใน UI) ----
function evaluate({ year, month, N, staff, fixed, history, preferences, assignments, unfilled, config }) {
  const R = config.rules;
  const MIN_DAY = 1 - lookbackDays(R);
  const perUser = {};
  const grid = {};
  for (const p of staff) {
    perUser[p.id] = { name: p.name, isChief: !!p.isChief, ช: 0, บ: 0, ด: 0, ot: 0, doubles: 0, off: 0, weekendWork: 0, total: 0, maxStreak: 0 };
    grid[p.id] = {};
    for (let day = MIN_DAY; day <= N; day++) grid[p.id][day] = [];
  }
  const push = (uid, day, shift, isOT) => {
    if (grid[uid] && grid[uid][day]) grid[uid][day].push({ shift, isOT });
  };
  for (const [key, cells] of Object.entries(fixed)) {
    const [uid, dayStr] = key.split("|");
    for (const c of cells) push(uid, parseInt(dayStr, 10), c.shift, c.isOT);
  }
  for (const [key, cells] of Object.entries(history || {})) {
    const [uid, dayStr] = key.split("|");
    for (const c of cells) push(uid, parseInt(dayStr, 10), c.shift, c.isOT);
  }
  for (const a of assignments) push(a.userId, a.day, a.shift, a.isOT);

  const violations = [];
  for (const u of unfilled || []) {
    violations.push({
      type: "unfilled",
      day: u.day,
      message: `วันที่ ${u.day}: หาคนลงกะ${u.shift === "ด" ? "ดึก" : u.shift === "บ" ? "บ่าย" : "เช้า"}${u.isOT ? " (OT)" : ""}ไม่ได้`,
    });
  }

  const workOf = (uid, day) => (grid[uid][day] || []).filter((c) => ["ช", "บ", "ด"].includes(c.shift));

  for (const p of staff) {
    const st = perUser[p.id];
    // seed streak จากเวรท้ายเดือนก่อน — ทำงานติดกันนับต่อเนื่องข้ามเดือน
    let streak = 0;
    for (let d = 0; d >= MIN_DAY && workOf(p.id, d).length; d--) streak++;
    let nightStreak = 0;
    for (let d = 0; d >= MIN_DAY && workOf(p.id, d).some((c) => c.shift === "ด"); d--) nightStreak++;

    for (let day = 1; day <= N; day++) {
      const comps = workOf(p.id, day);
      for (const c of comps) {
        st.total++;
        st[c.shift]++;
        if (c.isOT) st.ot++;
      }
      if (comps.length >= 2) st.doubles++;
      if (comps.length === 0) st.off++;
      if (comps.length && isWeekendDay(year, month, day)) st.weekendWork++;
      streak = comps.length ? streak + 1 : 0;
      st.maxStreak = Math.max(st.maxStreak, streak);

      // ตรวจ hard rules ซ้ำ (รวมกรณีชนกับ fixed และรอยต่อเดือน: day 1 เทียบ day 0)
      const yestEvening = (grid[p.id][day - 1] || []).some((c) => c.shift === "บ");
      const todayNight = comps.some((c) => c.shift === "ด");
      if (yestEvening && todayNight)
        violations.push({
          type: "rest",
          day,
          message: `${p.name}: บ่าย${day === 1 ? "วันสิ้นเดือนก่อน" : `วันที่ ${day - 1}`} ต่อดึกวันที่ ${day} (ทำงานต่อเนื่อง 16 ชม.)`,
        });
      nightStreak = todayNight ? nightStreak + 1 : 0;
      if (todayNight && nightStreak > R.maxNightStreak)
        violations.push({ type: "night-streak", day, message: `${p.name}: เวรดึกติดกัน ${nightStreak} คืน ถึงวันที่ ${day} (เพดาน ${R.maxNightStreak}${nightStreak - (day - 1) > 0 ? " — นับรวมท้ายเดือนก่อน" : ""})` });
    }
    if (st.maxStreak > R.softMaxConsecutiveWork)
      violations.push({ type: "streak", day: null, message: `${p.name}: ทำงานติดกัน ${st.maxStreak} วัน (เป้าไม่เกิน ${R.softMaxConsecutiveWork})`, soft: true });
    if (st.off < R.minOffPerMonth)
      violations.push({ type: "off", day: null, message: `${p.name}: มีวันหยุดเพียง ${st.off} วัน (เป้าอย่างน้อย ${R.minOffPerMonth})`, soft: true });
  }

  // ตรวจการจองเวรเทียบผลจริง: จองแน่นอนที่จัดให้ไม่ได้ / ความต้องการลำดับสูงสุดที่ไม่สมหวัง
  const shiftTH = (sh) => (sh === "x" ? "หยุด" : sh === "ด" ? "เวรดึก" : sh === "บ" ? "เวรบ่าย" : "เวรเช้า");
  for (const [key, prefs] of Object.entries(preferences || {})) {
    const [uid, dayStr] = key.split("|");
    const day = parseInt(dayStr, 10);
    const p = staff.find((s) => s.id === uid);
    if (!p || day < 1 || day > N) continue;
    const comps = workOf(uid, day);
    for (const pf of prefs) {
      const fulfilled = pf.shift === "x" ? comps.length === 0 : comps.some((c) => c.shift === pf.shift);
      if (pf.isReserved && !fulfilled)
        violations.push({ type: "reservation", day, soft: true, message: `${p.name}: จองแน่นอน "${shiftTH(pf.shift)}" วันที่ ${day} แต่จัดให้ไม่ได้ (ชนเวรเดิม/ขัดกติกา — ควรคุยกับผู้จอง)` });
      else if (!pf.isReserved && pf.priority === 1 && !fulfilled)
        violations.push({ type: "preference", day, soft: true, message: `${p.name}: ต้องการ "${shiftTH(pf.shift)}" วันที่ ${day} (ลำดับสูงสุด) แต่ไม่ได้จัดให้` });
    }
  }

  const rot = staff.filter((p) => !(p.isChief && config.chief.morningOnly));
  const spread = (arr) => (arr.length ? Math.max(...arr) - Math.min(...arr) : 0);
  const summary = {
    perUser,
    fairness: {
      totalSpread: spread(rot.map((p) => perUser[p.id].total)),
      nightSpread: spread(rot.map((p) => perUser[p.id].ด)),
      otSpread: spread(rot.map((p) => perUser[p.id].ot)),
      weekendSpread: spread(rot.map((p) => perUser[p.id].weekendWork)),
    },
    hardViolations: violations.filter((v) => !v.soft).length,
    softWarnings: violations.filter((v) => v.soft).length,
  };
  return { summary, violations };
}

// ย่อรายการวันที่เป็นช่วง: [1,2,3,7,9,10] → "1–3, 7, 9–10"
function compressDays(days) {
  const out = [];
  let start = null;
  let prev = null;
  for (const d of [...days].sort((a, b) => a - b)) {
    if (start === null) start = d;
    else if (d !== prev + 1) {
      out.push(start === prev ? `${start}` : `${start}–${prev}`);
      start = d;
    }
    prev = d;
  }
  if (start !== null) out.push(start === prev ? `${start}` : `${start}–${prev}`);
  return out.join(", ");
}

// ---- ตรวจกำลังคนก่อนจัด (คำนวณล่วงหน้า ไม่ต้องรัน engine) ----
// ตอบคำถามที่สำคัญที่สุดของแอดมิน: "ตัวเลขที่ตั้งไว้ จัดออกมาเป็นตารางที่คนทำได้จริงไหม"
// ถ้าไม่ได้ จะบอกตรงๆ ว่าต้องลดกี่ช่อง/วัน หรือเพิ่มคนกี่คน
function analyzeCapacity({ year, month, staff, fixed = {}, config: configIn, configOverrides }) {
  const config = configIn && configIn.rules ? configIn : mergeConfig(configOverrides || {});
  const R = config.rules;
  const N = daysInMonth(year, month);
  const active = (staff || []).filter((s) => !s.isTrain);

  let weekdays = 0;
  let weekends = 0;
  let demandMorning = 0; // ช่องเวรเช้า (ในเวลา + OT)
  let demandOther = 0; // ช่องบ่าย/ดึก (ในเวลา + OT)
  for (let day = 1; day <= N; day++) {
    const we = isWeekendDay(year, month, day);
    const cov = we ? config.coverage.weekend : config.coverage.weekday;
    if (we) weekends++;
    else weekdays++;
    demandMorning += cov.morningReg + cov.morningOT;
    demandOther += cov.night + cov.evening + cov.eveningOT + cov.nightOT;
  }

  // เวร/ลาที่กรอกมือไว้แล้วในเดือนนี้
  const fixedWorkShifts = {}; // เวรทำงานที่กรอกไว้ (ลดความต้องการลง)
  const fixedDays = {}; // จำนวนวันที่มีของเดิม (ไม่ว่าจะเวรหรือลา)
  const fixedOffDays = {}; // วันลา/อบรม/x ที่กรอกไว้ = นับเป็นวันหยุดอยู่แล้ว
  const busyByDay = {}; // วันที่ -> คนที่มีของเดิมวันนั้น (รับเวรใหม่ไม่ได้)
  const fixedWorkByDay = {}; // วันที่ -> จำนวนเวรที่กรอกไว้ (หักออกจากช่องที่ต้องเติม)
  for (const [key, cells] of Object.entries(fixed)) {
    const [uid, dayStr] = key.split("|");
    const day = parseInt(dayStr, 10);
    fixedDays[uid] = (fixedDays[uid] || 0) + 1;
    (busyByDay[day] = busyByDay[day] || new Set()).add(uid);
    const works = (cells || []).filter((c) => ["ช", "บ", "ด"].includes(c.shift));
    if (works.length) {
      fixedWorkShifts[uid] = (fixedWorkShifts[uid] || 0) + works.length;
      fixedWorkByDay[day] = (fixedWorkByDay[day] || 0) + works.length;
    } else {
      fixedOffDays[uid] = (fixedOffDays[uid] || 0) + 1;
    }
  }

  const capOf = (p) => {
    const isMorningOnly = !!p.isChief && config.chief.morningOnly;
    const weekendBlocked = isMorningOnly && config.chief.weekendOff ? weekends : 0;
    const avail = Math.max(0, N - (fixedDays[p.id] || 0) - weekendBlocked);
    const offAlready = (fixedOffDays[p.id] || 0) + weekendBlocked;
    const offNeeded = Math.max(0, R.minOffPerMonth - offAlready);
    const workDays = Math.max(0, avail - offNeeded);
    const canDouble = !isMorningOnly || config.chief.allowEveningOTDouble;
    const doubles = canDouble ? Math.min(R.maxDoublesPerMonth, workDays) : 0;
    return { workDays, doubles, shifts: workDays + doubles, morningOnly: isMorningOnly };
  };

  const chiefs = active.filter((p) => p.isChief && config.chief.morningOnly);
  const rot = active.filter((p) => !(p.isChief && config.chief.morningOnly));
  const chiefCap = chiefs.reduce((sum, p) => sum + capOf(p).shifts, 0);
  const rotCap = rot.reduce((sum, p) => sum + capOf(p).shifts, 0);
  const rotWorkDays = rot.reduce((sum, p) => sum + capOf(p).workDays, 0);
  const fixedTotal = Object.values(fixedWorkShifts).reduce((sum, x) => sum + x, 0);

  // หัวหน้ารับได้เฉพาะเวรเช้า ส่วนที่เหลือตกเป็นภาระของวงหมุนเวร
  const morningByChief = Math.min(demandMorning, chiefCap);
  const demandTotal = demandMorning + demandOther;
  const rotDemand = Math.max(0, demandTotal - morningByChief - fixedTotal);

  // เสาร์–อาทิตย์: ถ้าช่องต่อวันมากกว่าหรือเท่าจำนวนคนในวงหมุนเวร = ทุกคนต้องขึ้นเวรทุกเสาร์อาทิตย์
  const weekendCov = config.coverage.weekend;
  const weekendSlotsPerDay =
    weekendCov.night + weekendCov.evening + weekendCov.morningReg + weekendCov.morningOT + weekendCov.eveningOT + weekendCov.nightOT;
  const weekendEveryoneWorks = rot.length > 0 && weekendSlotsPerDay >= rot.length;

  // ---- ความตึง "รายวัน" ----
  // รวมทั้งเดือนพอ ไม่ได้แปลว่าทุกวันพอ: วันที่คนลาพร้อมกันหลายคนอาจหาคนลงไม่ได้
  const chiefCanDouble = config.chief.allowEveningOTDouble;
  const tightDays = []; // วันที่ต้องมีเวรควบจึงจะครบ
  const impossibleDays = []; // วันที่แม้ทุกคนขึ้นเวรควบก็ยังไม่ครบ
  for (let day = 1; day <= N; day++) {
    const we = isWeekendDay(year, month, day);
    const cov = we ? config.coverage.weekend : config.coverage.weekday;
    const slots = cov.night + cov.evening + cov.morningReg + cov.morningOT + cov.eveningOT + cov.nightOT;
    const needed = slots - (fixedWorkByDay[day] || 0);
    const busy = busyByDay[day] || new Set();
    const availRot = rot.filter((p) => !busy.has(p.id)).length;
    const availChief = chiefs.filter((p) => !busy.has(p.id) && !(config.chief.weekendOff && we)).length;
    if (needed > availRot + availChief) tightDays.push(day);
    if (needed > availRot * 2 + availChief * (chiefCanDouble ? 2 : 1)) impossibleDays.push(day);
  }

  const perPerson = rot.length ? rotDemand / rot.length : 0;
  const workDaysPerPerson = rot.length ? rotWorkDays / rot.length : 0;
  const impliedDoubles = Math.max(0, perPerson - workDaysPerPerson);
  const feasible = rot.length > 0 && rotDemand <= rotCap && impossibleDays.length === 0;

  // ถ้าเกินกำลัง: บอกเป็นตัวเลขที่ลงมือได้
  const excess = Math.max(0, rotDemand - rotCap);
  const recommendations = [];
  if (!rot.length) {
    recommendations.push("ไม่มีพยาบาลในวงหมุนเวร (มีแต่หัวหน้า/คนอบรม) — จัดตารางไม่ได้");
  } else if (excess > 0) {
    recommendations.push(
      `กำลังคนไม่พอ ${excess} เวร: ลดช่องลง ${Math.ceil(excess / N)} ช่อง/วัน (เช่น เช้า OT หรือ บ่าย OT) หรือเพิ่มคน ${Math.ceil(
        excess / Math.max(1, rotCap / rot.length)
      )} คน`
    );
    recommendations.push(
      `ถ้าไม่ลด: ตารางจะออกมาโดยมีช่องขาดคน หรือ (ถ้าปิด "รับประกันวันหยุด") คนจะทำงานติดกันเกือบทั้งเดือน`
    );
  }
  if (impossibleDays.length) {
    recommendations.push(
      `วันที่ ${compressDays(impossibleDays)} มีคนว่างน้อยเกินไป — แม้ให้ทุกคนขึ้นเวรควบก็ยังไม่ครบ ` +
        `ต้องลดช่องของวันนั้น หรือเลื่อนวันลา/อบรมบางคน`
    );
  } else if (tightDays.length) {
    recommendations.push(
      `วันที่ ${compressDays(tightDays)} ต้องมีคนขึ้นเวรควบจึงจะครบ (คนว่างน้อยกว่าจำนวนช่อง) — ` +
        `ถ้าวันนั้นมีคนลาเพิ่มอีก จะเริ่มมีช่องขาดคน`
    );
  }
  if (weekendEveryoneWorks && rot.length) {
    recommendations.push(
      `เสาร์–อาทิตย์ต้องการ ${weekendSlotsPerDay} ช่อง/วัน แต่มีพยาบาลหมุนเวร ${rot.length} คน → ทุกคนต้องขึ้นเวรทุกเสาร์–อาทิตย์ ` +
        `(ไม่มีใครได้หยุดสุดสัปดาห์) — ลดช่องเสาร์–อาทิตย์ลงเหลือ ${Math.max(1, rot.length - 1)} ช่อง/วัน ถ้าต้องการให้หมุนกันหยุด`
    );
  }
  if (excess <= 0 && impliedDoubles > R.maxDoublesPerMonth * 0.8) {
    // ลดช่องลง 1 ช่อง/วัน = ความต้องการลด N เวร → เวรควบต่อคนลด N/จำนวนคน
    const saved = Math.max(0, impliedDoubles - N / rot.length);
    recommendations.push(
      `ทำได้ แต่ตึง: แต่ละคนต้องขึ้นเวรควบ ~${impliedDoubles.toFixed(1)} ครั้ง (เพดาน ${R.maxDoublesPerMonth}) — ` +
        `ลดช่อง OT ลง 1 ช่อง/วัน จะเหลือ ~${saved.toFixed(1)} ครั้ง`
    );
  }

  return {
    daysInMonth: N,
    weekdays,
    weekends,
    staffCount: active.length,
    rotCount: rot.length,
    chiefCount: chiefs.length,
    demand: { morning: demandMorning, other: demandOther, total: demandTotal, fixedAlready: fixedTotal, forRotation: rotDemand },
    supply: { chief: chiefCap, rotation: rotCap, headroom: rotCap - rotDemand },
    perPerson: {
      shifts: Math.round(perPerson * 10) / 10,
      workDays: Math.round(workDaysPerPerson * 10) / 10,
      doubles: Math.round(impliedDoubles * 10) / 10,
      offDays: R.minOffPerMonth,
    },
    weekend: { slotsPerDay: weekendSlotsPerDay, everyoneWorks: weekendEveryoneWorks },
    tightDays,
    impossibleDays,
    feasible,
    recommendations,
  };
}

module.exports = { generateSchedule, analyzeCapacity };
