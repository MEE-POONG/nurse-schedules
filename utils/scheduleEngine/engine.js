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
 * @param {Object} args.configOverrides ปรับค่าจาก DEFAULT_CONFIG
 * @returns {{ assignments, violations, summary, config }}
 */
function generateSchedule({ year, month, staff, fixed = {}, configOverrides = {} }) {
  const config = mergeConfig(configOverrides);
  const N = daysInMonth(year, month);
  // คนที่จัดเวรให้ได้ = ไม่ได้ไปอบรมทั้งเดือน
  const active = staff.filter((s) => !s.isTrain);
  const chief = active.find((s) => s.isChief) || null;

  let best = null;
  for (let seed = 1; seed <= config.restarts; seed++) {
    const result = solveOnce({ year, month, N, staff: active, chief, fixed, config, seed });
    if (!best || result.objective < best.objective) best = result;
  }

  const { assignments, unfilled } = best;

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

  const { summary, violations } = evaluate({ year, month, N, staff: active, fixed, assignments, unfilled, config });

  return { assignments, violations, summary, config, daysInMonth: N };
}

// จัดหนึ่งรอบด้วย seed ที่กำหนด
function solveOnce({ year, month, N, staff, chief, fixed, config, seed }) {
  const rnd = mulberry32(seed * 7919 + month * 131 + year);
  const T = TRANSITION_SCORE;
  const W = config.weights;
  const R = config.rules;

  // ตารางระหว่างจัด: userId -> day -> [{shift, isOT, fixed}]
  const grid = {};
  for (const p of staff) grid[p.id] = {};

  // โหลด fixed เข้า grid (เป็นบริบทของกฎ แต่ห้ามแก้)
  for (const p of staff) {
    for (let day = 1; day <= N; day++) {
      const cells = fixed[`${p.id}|${day}`];
      if (cells && cells.length) {
        grid[p.id][day] = cells.map((c) => ({ shift: c.shift, isOT: !!c.isOT, fixed: true }));
      }
    }
  }

  // ตัวนับต่อคน (นับรวม fixed ที่เป็นงานจริง)
  const counts = {};
  for (const p of staff) {
    counts[p.id] = { total: 0, ด: 0, ช: 0, บ: 0, ot: 0, doubles: 0, weekendWork: 0 };
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
  const hasAnyCell = (uid, day) => (grid[uid][day] || []).length > 0;
  const hasFixedCell = (uid, day) => (grid[uid][day] || []).some((c) => c.fixed);

  // จำนวนดึกติดกันจบที่วัน day
  const nightStreakEndingAt = (uid, day) => {
    let n = 0;
    for (let d = day; d >= 1; d--) {
      if (workComps(uid, d).some((c) => c.shift === "ด")) n++;
      else break;
    }
    return n;
  };
  const consecutiveWorkEndingAt = (uid, day) => {
    let n = 0;
    for (let d = day; d >= 1; d--) {
      if (workComps(uid, d).length) n++;
      else break;
    }
    return n;
  };

  // ---- เป้าหมายต่อคน (ตามสัดส่วนวันที่ว่างให้จัดได้) ----
  const availDays = {};
  for (const p of staff) {
    let n = 0;
    for (let day = 1; day <= N; day++) if (!hasFixedCell(p.id, day)) n++;
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

  // ---- ตรวจสิทธิ์ลงช่อง (hard rules) ----
  function canAssign(p, day, shift, isOT, slotKind) {
    const uid = p.id;
    if (hasFixedCell(uid, day)) return false; // วันมีของเดิม (เวร/ลา/หยุดที่กรอกมือ) ไม่แตะ
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
    if (shift === "ด" && day > 1 && workComps(uid, day - 1).some((c) => c.shift === "บ")) return false;
    // ห้าม: วันนี้ลงบ่าย แต่พรุ่งนี้มีดึก fixed อยู่แล้ว
    if (shift === "บ" && day < N && workComps(uid, day + 1).some((c) => c.shift === "ด")) return false;
    // ดึกติดกันเกินเพดาน
    if (shift === "ด" && nightStreakEndingAt(uid, day - 1) >= R.maxNightStreak) return false;
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
    const prev = day > 1 ? stateOf(workComps(uid, day - 1)) : "OFF";
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

    // โบนัสเวรควบรูปแบบที่ใช้จริง
    const todays = workComps(uid, day);
    if (shift === "บ" && !isOT && todays.some((c) => c.shift === "ช" && c.isOT)) s += W.comboBonus; // ช(OT)+บ
    if (shift === "บ" && isOT && todays.some((c) => c.shift === "ด")) s += W.comboBonus; // ด+บ(OT)
    if (shift === "บ" && isOT && todays.some((c) => c.shift === "ช" && !c.isOT)) s += W.comboBonus * 0.6; // ช+บ(OT)

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
    if (comps.length === 1 && isWeekendDay(year, month, day)) counts[p.id].weekendWork++;
  }

  // ---- เดินวันต่อวัน เติมช่องตามลำดับ: ดึก → บ่าย → เช้าในเวลา → เช้าOT → บ่ายOT → ดึกOT ----
  const unfilled = [];
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

    // นับ fixed ของวันนี้เข้า coverage ก่อน (เช่น มีคนกรอกดึกไว้แล้ว 1 คน ก็เติมอีก 1 พอ)
    const fixedCount = { night: 0, evening: 0, morningReg: 0, morningOT: 0, eveningOT: 0, nightOT: 0 };
    for (const p of staff) {
      for (const c of workComps(p.id, day).filter((x) => x.fixed)) {
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
      const candidates = shuffled(staff, rnd).filter((p) => canAssign(p, day, slot.shift, slot.isOT, slot.kind));
      if (!candidates.length) {
        unfilled.push({ day, slot: slot.kind, shift: slot.shift, isOT: slot.isOT });
        continue;
      }
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

  // ---- objective สำหรับเลือกรอบที่ดีที่สุด ----
  const totals = staff.map((p) => counts[p.id].total);
  const nights = rotStaff.map((p) => counts[p.id].ด);
  const ots = staff.map((p) => counts[p.id].ot);
  const weekends = rotStaff.map((p) => counts[p.id].weekendWork);
  let softPenalty = 0;
  for (const p of staff) {
    for (let day = 1; day <= N; day++) {
      const streak = consecutiveWorkEndingAt(p.id, day);
      if (streak > R.softMaxConsecutiveWork && !workComps(p.id, day + 1).length) softPenalty += streak - R.softMaxConsecutiveWork;
    }
  }
  const objective =
    unfilled.length * 1000 + variance(totals) * 10 + variance(nights) * 8 + variance(ots) * 6 + variance(weekends) * 3 + softPenalty;

  return { assignments: newAssignments, unfilled, objective, seed };
}

// ---- ตรวจผล + สรุปสถิติ (ใช้กับผลรวม fixed ด้วย เพื่อโชว์ใน UI) ----
function evaluate({ year, month, N, staff, fixed, assignments, unfilled, config }) {
  const R = config.rules;
  const perUser = {};
  const grid = {};
  for (const p of staff) {
    perUser[p.id] = { name: p.name, isChief: !!p.isChief, ช: 0, บ: 0, ด: 0, ot: 0, doubles: 0, off: 0, weekendWork: 0, total: 0, maxStreak: 0 };
    grid[p.id] = {};
    for (let day = 1; day <= N; day++) grid[p.id][day] = [];
  }
  const push = (uid, day, shift, isOT) => {
    if (grid[uid] && grid[uid][day]) grid[uid][day].push({ shift, isOT });
  };
  for (const [key, cells] of Object.entries(fixed)) {
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

  for (const p of staff) {
    const st = perUser[p.id];
    let streak = 0;
    for (let day = 1; day <= N; day++) {
      const comps = grid[p.id][day].filter((c) => ["ช", "บ", "ด"].includes(c.shift));
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

      // ตรวจ hard rules ซ้ำ (รวมกรณีชนกับ fixed)
      if (day > 1) {
        const yestEvening = grid[p.id][day - 1].some((c) => c.shift === "บ");
        const todayNight = comps.some((c) => c.shift === "ด");
        if (yestEvening && todayNight)
          violations.push({ type: "rest", day, message: `${p.name}: บ่ายวันที่ ${day - 1} ต่อดึกวันที่ ${day} (ทำงานต่อเนื่อง 16 ชม.)` });
      }
    }
    if (st.maxStreak > R.softMaxConsecutiveWork)
      violations.push({ type: "streak", day: null, message: `${p.name}: ทำงานติดกัน ${st.maxStreak} วัน (เป้าไม่เกิน ${R.softMaxConsecutiveWork})`, soft: true });
    if (st.off < R.minOffPerMonth)
      violations.push({ type: "off", day: null, message: `${p.name}: มีวันหยุดเพียง ${st.off} วัน (เป้าอย่างน้อย ${R.minOffPerMonth})`, soft: true });
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

module.exports = { generateSchedule };
