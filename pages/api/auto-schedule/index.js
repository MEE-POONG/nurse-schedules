// API จัดตารางเวรอัตโนมัติ (ระบบใหม่ — โมเดลจากข้อมูลการขึ้นเวรจริง ดู AUTO_SCHEDULE.md)
// GET  → ค่าตั้งต้นของ config (ให้ UI แสดงฟอร์มตั้งค่า)
// POST → สร้างตารางเวร (พรีวิว ไม่บันทึก) { year, month(1-12), locationId, config? }
import { prisma } from "@/utils/prisma";
import dayjs from "dayjs";
import { generateSchedule } from "@/utils/scheduleEngine/engine";
import { DEFAULT_CONFIG } from "@/utils/scheduleEngine/config";

const WORK_NAMES = ["ช", "บ", "ด"];

export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({ config: DEFAULT_CONFIG });
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { year, month, locationId, config: configOverrides } = req.body;
    const y = parseInt(year, 10);
    const m = parseInt(month, 10); // 1-12
    if (!y || !m || m < 1 || m > 12 || !locationId) {
      return res.status(400).json({ success: false, message: "ต้องระบุ year, month (1-12), locationId" });
    }

    const firstDay = dayjs(`${y}-${String(m).padStart(2, "0")}-01`).startOf("month");
    const lastDay = firstDay.endOf("month");

    // พนักงานของแผนกในเดือนนั้น (ตาม UserDuty เหมือนตารางเวรหลัก)
    const users = await prisma.user.findMany({
      include: {
        UserDuty: {
          where: {
            datetime: { gte: firstDay.format(), lte: lastDay.format() },
            locationId,
          },
        },
        Duty: {
          include: { Shif: true },
          where: {
            datetime: { gte: firstDay.format(), lte: lastDay.format() },
          },
        },
      },
      where: {
        isActive: true,
        UserDuty: {
          some: {
            datetime: { gte: firstDay.format(), lte: lastDay.format() },
            locationId,
          },
        },
      },
    });

    if (!users.length) {
      return res.status(400).json({
        success: false,
        message: "ยังไม่มีพนักงานในแผนกนี้สำหรับเดือนที่เลือก — ไปที่แท็บ 'จัดพนักงานเข้าแผนก' ก่อน",
      });
    }

    const staff = users
      .map((u) => ({
        id: u.id,
        name: `${u.firstname || ""} ${u.lastname || ""}`.trim(),
        isChief: !!u.isChief,
        isTrain: !!u.UserDuty[0]?.isTrain,
        seq: u.SequenceNo ?? 999,
      }))
      .sort((a, b) => a.seq - b.seq);

    // เวรที่มีอยู่แล้วในเดือน = ช่องห้ามแตะ (fixed) — engine จะเติมเฉพาะช่องว่าง
    const fixed = {};
    const fixedCells = []; // ไว้แสดงใน UI ด้วยชื่อกะจริง (อบรม/ลาพัก/R/x ฯลฯ)
    for (const u of users) {
      for (const d of u.Duty) {
        const day = dayjs(d.datetime).date();
        const name = d.Shif?.name;
        if (!name) continue;
        const isWork = WORK_NAMES.includes(name);
        const isOT = !!(d.isOT || d.Shif?.isOT);
        const key = `${u.id}|${day}`;
        fixed[key] = fixed[key] || [];
        fixed[key].push(isWork ? { shift: name, isOT } : { shift: "LEAVE", isOT: false });
        fixedCells.push({ userId: u.id, day, shift: name, isOT, otClass: d.Shif?.isOT ? d.Shif?.class : null, fixed: true });
      }
    }

    // เวรท้ายเดือนก่อน (7 วันสุดท้าย) = บริบทต่อเนื่องข้ามเดือน:
    // ห้าม บ่ายสิ้นเดือน→ดึกวันที่ 1, นับดึกติดกันข้ามเดือน, ลูปหมุนต่อจากของจริง
    const prevStart = firstDay.subtract(7, "day");
    const prevMonthLastDate = firstDay.subtract(1, "day").date();
    const prevDuties = await prisma.duty.findMany({
      where: {
        userId: { in: staff.map((s) => s.id) },
        datetime: { gte: prevStart.format(), lt: firstDay.format() },
      },
      include: { Shif: true },
    });
    const history = {};
    for (const d of prevDuties) {
      const name = d.Shif?.name;
      if (!name) continue;
      // day 0 = วันสุดท้ายของเดือนก่อน, -1 = ก่อนหน้านั้น, …
      const dayOffset = dayjs(d.datetime).date() - prevMonthLastDate;
      const isWork = WORK_NAMES.includes(name);
      const key = `${d.userId}|${dayOffset}`;
      (history[key] = history[key] || []).push(
        isWork ? { shift: name, isOT: !!(d.isOT || d.Shif?.isOT) } : { shift: "LEAVE", isOT: false }
      );
    }

    // การจองเวร (ShiftPreference) ของเดือนนี้ — จองแน่นอนจัดให้ก่อน, ระบุความต้องการเป็นคะแนนโน้มน้าว
    const prefRows = await prisma.shiftPreference.findMany({
      where: {
        userId: { in: staff.map((s) => s.id) },
        datetime: { gte: firstDay.format(), lte: lastDay.format() },
      },
      include: { Shif: true },
    });
    const preferences = {};
    const preferenceCells = []; // ให้ UI แสดงประกอบ
    for (const r of prefRows) {
      const name = r.Shif?.name;
      if (!name || !["ช", "บ", "ด", "x"].includes(name)) continue; // หน้าจองให้จองได้เฉพาะ ช/บ/ด/x
      const day = dayjs(r.datetime).date();
      const key = `${r.userId}|${day}`;
      (preferences[key] = preferences[key] || []).push({ shift: name, priority: r.priority, isReserved: r.isReserved });
      preferenceCells.push({ userId: r.userId, day, shift: name, priority: r.priority, isReserved: r.isReserved });
    }

    const result = generateSchedule({ year: y, month: m, staff, fixed, history, preferences, configOverrides });

    return res.status(200).json({
      success: true,
      year: y,
      month: m,
      daysInMonth: result.daysInMonth,
      staff,
      assignments: result.assignments, // เวรที่ระบบเสนอ (ยังไม่บันทึก)
      fixedCells, // เวร/ลา/อบรมที่มีอยู่แล้ว (ห้ามแตะ)
      historyCount: prevDuties.length, // เวรท้ายเดือนก่อนที่นำมาเป็นบริบทต่อเนื่อง
      preferenceCells, // การจองเวรของเดือนนี้ (จองแน่นอน + ระบุความต้องการ)
      summary: result.summary,
      violations: result.violations,
      config: result.config,
    });
  } catch (error) {
    console.error("auto-schedule error:", error);
    return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดในการจัดตารางเวร", error: String(error?.message || error) });
  }
}
