#!/usr/bin/env node
// สกัดค่าตั้งต้นของเครื่องจัดตารางเวรจาก "เวรจริง" ในฐานข้อมูล
//
//   DATABASE_URL="mongodb+srv://..." node scripts/analyze-real-duty.js [--months=8] [--location=ICU]
//
// อ่าน Duty ย้อนหลังตามจำนวนเดือนที่ระบุ แล้วรายงาน
//   1) กำลังคนจริงต่อกะต่อวัน (มัธยฐาน แยกวันธรรมดา/เสาร์–อาทิตย์) → ใช้เป็น coverage
//   2) ภาระต่อคนต่อเดือน (เวรรวม/ดึก/OT/เวรควบ/วันหยุด/ทำงานติดกัน) → ใช้ตั้งเพดานกติกา
//   3) ตารางความถี่การหมุนเวร เมื่อวาน→วันนี้ → ใช้เป็น TRANSITION_SCORE
//   4) JSON ของ config ที่แนะนำ (คัดลอกไปวางใน utils/scheduleEngine/config.js ได้)
// สคริปต์นี้อ่านอย่างเดียว ไม่เขียนอะไรลงฐานข้อมูล

const { PrismaClient } = require("@prisma/client");

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=") : fallback;
};

const MONTHS = parseInt(arg("months", "8"), 10);
const LOCATION = arg("location", null); // ชื่อแผนก เช่น ICU (ไม่ระบุ = ทุกแผนก)
const WORK = ["ช", "บ", "ด"];

const median = (nums) => {
  if (!nums.length) return 0;
  const a = [...nums].sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
};
const pct = (nums, p) => {
  if (!nums.length) return 0;
  const a = [...nums].sort((x, y) => x - y);
  return a[Math.min(a.length - 1, Math.floor((a.length * p) / 100))];
};
const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const isWeekend = (d) => [0, 6].includes(d.getDay());

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("ต้องตั้ง DATABASE_URL ก่อน เช่น\n  DATABASE_URL='mongodb+srv://…' node scripts/analyze-real-duty.js");
    process.exit(1);
  }
  const prisma = new PrismaClient();
  const since = new Date();
  since.setMonth(since.getMonth() - MONTHS);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  let locationId = null;
  if (LOCATION) {
    const loc = await prisma.location.findFirst({ where: { name: { contains: LOCATION } } });
    if (!loc) {
      console.error(`ไม่พบแผนกชื่อ "${LOCATION}"`);
      process.exit(1);
    }
    locationId = loc.id;
    console.log(`แผนก: ${loc.name}`);
  }

  const duties = await prisma.duty.findMany({
    where: { datetime: { gte: since }, ...(locationId ? { locationId } : {}) },
    include: { Shif: true, User: true },
    orderBy: { datetime: "asc" },
  });
  console.log(`ช่วงข้อมูล: ${since.toISOString().slice(0, 10)} → ปัจจุบัน · Duty ${duties.length} รายการ\n`);
  if (!duties.length) {
    console.log("ไม่มีข้อมูลในช่วงนี้");
    await prisma.$disconnect();
    return;
  }

  // ---- 1) กำลังคนจริงต่อกะต่อวัน ----
  // perDay[วันที่][ชนิดช่อง] = จำนวนคน
  const perDay = new Map();
  const cellOf = (d) => {
    const name = d.Shif?.name;
    if (!WORK.includes(name)) return null;
    const ot = !!(d.isOT || d.Shif?.isOT);
    if (name === "ด") return ot ? "nightOT" : "night";
    if (name === "บ") return ot ? "eveningOT" : "evening";
    return ot ? "morningOT" : "morningReg";
  };
  for (const d of duties) {
    const key = new Date(d.datetime).toISOString().slice(0, 10);
    if (!perDay.has(key)) perDay.set(key, { night: 0, evening: 0, morningReg: 0, morningOT: 0, eveningOT: 0, nightOT: 0 });
    const cell = cellOf(d);
    if (cell) perDay.get(key)[cell]++;
  }
  const buckets = { weekday: [], weekend: [] };
  for (const [key, counts] of perDay) {
    const d = new Date(`${key}T00:00:00`);
    buckets[isWeekend(d) ? "weekend" : "weekday"].push(counts);
  }
  const coverage = {};
  const FIELDS = ["night", "evening", "morningReg", "morningOT", "eveningOT", "nightOT"];
  console.log("== 1) กำลังคนจริงต่อกะต่อวัน (มัธยฐาน · p25–p75) ==");
  for (const dayType of ["weekday", "weekend"]) {
    coverage[dayType] = {};
    const rows = buckets[dayType];
    console.log(`  ${dayType === "weekday" ? "จันทร์–ศุกร์" : "เสาร์–อาทิตย์"} (${rows.length} วัน)`);
    for (const f of FIELDS) {
      const vals = rows.map((r) => r[f]);
      coverage[dayType][f] = Math.round(median(vals));
      console.log(`    ${f.padEnd(11)} มัธยฐาน ${String(coverage[dayType][f]).padStart(2)}  (p25 ${pct(vals, 25)} – p75 ${pct(vals, 75)})`);
    }
  }

  // ---- 2) ภาระต่อคนต่อเดือน ----
  // byUserMonth[userId][เดือน] = { วัน -> [กะ] }
  const byUserMonth = new Map();
  for (const d of duties) {
    const dt = new Date(d.datetime);
    const uid = d.userId;
    const mk = monthKey(dt);
    if (!byUserMonth.has(uid)) byUserMonth.set(uid, new Map());
    const months = byUserMonth.get(uid);
    if (!months.has(mk)) months.set(mk, { name: `${d.User?.firstname || ""} ${d.User?.lastname || ""}`.trim(), days: new Map() });
    const rec = months.get(mk);
    const day = dt.getDate();
    if (!rec.days.has(day)) rec.days.set(day, []);
    rec.days.get(day).push({ name: d.Shif?.name, isOT: !!(d.isOT || d.Shif?.isOT) });
  }
  const stats = { total: [], night: [], ot: [], doubles: [], off: [], streak: [] };
  for (const [, months] of byUserMonth) {
    for (const [mk, rec] of months) {
      const [y, m] = mk.split("-").map(Number);
      const N = new Date(y, m, 0).getDate();
      let total = 0;
      let night = 0;
      let ot = 0;
      let doubles = 0;
      let off = 0;
      let streak = 0;
      let maxStreak = 0;
      for (let day = 1; day <= N; day++) {
        const cells = (rec.days.get(day) || []).filter((c) => WORK.includes(c.name));
        total += cells.length;
        night += cells.filter((c) => c.name === "ด").length;
        ot += cells.filter((c) => c.isOT).length;
        if (cells.length >= 2) doubles++;
        if (cells.length === 0) off++;
        streak = cells.length ? streak + 1 : 0;
        maxStreak = Math.max(maxStreak, streak);
      }
      if (!total) continue; // เดือนที่คนนี้ไม่ได้อยู่หอนี้
      stats.total.push(total);
      stats.night.push(night);
      stats.ot.push(ot);
      stats.doubles.push(doubles);
      stats.off.push(off);
      stats.streak.push(maxStreak);
    }
  }
  console.log("\n== 2) ภาระจริงต่อคนต่อเดือน ==");
  for (const [label, key] of [
    ["เวรรวม", "total"],
    ["เวรดึก", "night"],
    ["เวร OT", "ot"],
    ["เวรควบ", "doubles"],
    ["วันหยุด", "off"],
    ["ทำงานติดกันสูงสุด", "streak"],
  ]) {
    const v = stats[key];
    console.log(
      `  ${label.padEnd(20)} มัธยฐาน ${String(median(v)).padStart(4)}  ช่วง ${Math.min(...v)}–${Math.max(...v)}  p90 ${pct(v, 90)}`
    );
  }

  // ---- 3) การหมุนเวร เมื่อวาน → วันนี้ ----
  const stateOf = (cells) => {
    const work = WORK.filter((n) => cells.some((c) => c.name === n));
    return ["ด", "ช", "บ"].filter((n) => work.includes(n)).join("") || "OFF";
  };
  const trans = new Map();
  for (const [, months] of byUserMonth) {
    for (const [mk, rec] of months) {
      const [y, m] = mk.split("-").map(Number);
      const N = new Date(y, m, 0).getDate();
      for (let day = 2; day <= N; day++) {
        const a = stateOf(rec.days.get(day - 1) || []);
        const b = stateOf(rec.days.get(day) || []);
        const k = `${a}→${b}`;
        trans.set(k, (trans.get(k) || 0) + 1);
      }
    }
  }
  console.log("\n== 3) การหมุนเวร เมื่อวาน→วันนี้ (20 คู่ที่พบมากสุด) ==");
  [...trans.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([k, n]) => console.log(`  ${k.padEnd(12)} ${n}`));
  const risky = [...trans.entries()].filter(([k]) => /^(บ|ชบ|ดบ)→(ด|ดบ)$/.test(k));
  console.log(
    `  คู่ "มีบ่ายเมื่อวาน → ดึกวันนี้" (กติกาห้าม): ${risky.length ? risky.map(([k, n]) => `${k}=${n}`).join(", ") : "ไม่พบเลย ✓"}`
  );

  // ---- 4) config ที่แนะนำ ----
  console.log("\n== 4) ค่าที่แนะนำสำหรับ utils/scheduleEngine/config.js ==");
  console.log(
    JSON.stringify(
      {
        coverage,
        rules: {
          maxNightStreak: Math.max(2, pct(stats.streak, 90) > 0 ? Math.min(3, pct(stats.night, 90)) : 3),
          maxDoublesPerMonth: Math.max(1, pct(stats.doubles, 90)),
          maxConsecutiveWork: Math.max(4, median(stats.streak)),
          softMaxConsecutiveWork: Math.max(5, pct(stats.streak, 75)),
          minOffPerMonth: Math.max(2, Math.round(median(stats.off))),
        },
      },
      null,
      2
    )
  );
  console.log(
    "\nหมายเหตุ: ตัวเลขพวกนี้คือ 'สิ่งที่เคยทำมา' ไม่ใช่ 'สิ่งที่ควรเป็น' —" +
      " ถ้าของจริงเคยหนักเกินไป ให้ตั้งเพดานตามที่หอยอมรับได้แทน แล้วดูผลที่การ์ด 'ตรวจกำลังคน'"
  );

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("อ่านข้อมูลไม่สำเร็จ:", e.message);
  process.exit(1);
});
