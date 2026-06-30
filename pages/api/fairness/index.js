import { prisma } from "@/utils/prisma";
import dayjs from "dayjs";

// น้ำหนักความหนักของแต่ละกะ — สะท้อนความอดนอน/โหลดงาน (ปรับค่าได้ที่นี่)
// เช้า 1.0, บ่าย 1.2 (เลิก 00:30 กระทบการพักผ่อน), ดึก 1.5 (ทำกลางคืน หนักสุด)
const SHIFT_WEIGHT = { ช: 1.0, บ: 1.2, ด: 1.5 };
// โบนัสเวรควบ "เช้า-บ่าย" ที่ทำต่อเนื่อง 16 ชม. (08:30–00:30) หนักกว่าทำคนละวัน
const DOUBLE_SHIFT_BONUS = 0.5;

// สรุปสถิติความเป็นธรรมของการจัดเวรต่อคนในเดือนที่เลือก
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const month = parseInt(req.query.month);
  const year = parseInt(req.query.year);
  const firstDay = dayjs().month(month).year(year).startOf("month");
  const lastDay = dayjs().month(month).year(year).endOf("month");

  try {
    const users = await prisma.user.findMany({
      include: {
        Duty: {
          include: { Shif: true },
          where: {
            AND: { datetime: { gte: firstDay.format() } },
            datetime: { lte: lastDay.format() },
          },
        },
        OnCallDuty: {
          where: {
            AND: { datetime: { gte: firstDay.format() } },
            datetime: { lte: lastDay.format() },
          },
        },
        UserDuty: {
          where: {
            AND: {
              datetime: { gte: firstDay.format() },
              locationId: { not: null },
            },
          },
        },
        Position: true,
        Title: true,
      },
      where: {
        isPartTime: false,
        UserDuty: {
          some: {
            AND: {
              datetime: { gte: firstDay.format() },
              locationId: { not: null },
            },
          },
        },
      },
    });

    const isOT = (d) => !!(d.isOT || d.Shif?.isOT);

    const result = users
      .map((u) => {
        const reg = (name) =>
          u.Duty.filter((d) => d.Shif?.name === name && !isOT(d)).length;
        const otOf = (name) =>
          u.Duty.filter((d) => d.Shif?.name === name && isOT(d)).length;

        const morning = reg("ช");
        const afternoon = reg("บ");
        const night = reg("ด");
        const otTotal = u.Duty.filter((d) => isOT(d)).length;
        const dayOff = u.Duty.filter((d) => ["x", "R"].includes(d.Shif?.name)).length;
        const onCall = u.OnCallDuty.length;
        const workShifts = morning + afternoon + night;
        const weekendShifts = u.Duty.filter(
          (d) =>
            ["ช", "บ", "ด"].includes(d.Shif?.name) &&
            [0, 6].includes(dayjs(d.datetime).day())
        ).length;

        // คะแนนภาระงาน: ถ่วงน้ำหนักตามความหนักของกะ + โบนัสเวรควบ
        const byDate = {};
        u.Duty.forEach((d) => {
          if (!["ช", "บ", "ด"].includes(d.Shif?.name)) return;
          const date = dayjs(d.datetime).format("YYYY-MM-DD");
          (byDate[date] = byDate[date] || []).push(d.Shif.name);
        });
        let dutyDays = 0;
        let doubleShiftDays = 0;
        let workloadScore = 0;
        Object.values(byDate).forEach((names) => {
          dutyDays++;
          const base = names.reduce((a, n) => a + (SHIFT_WEIGHT[n] || 1), 0);
          // โบนัสเฉพาะเวรควบเช้า-บ่าย (ทำต่อเนื่อง 16 ชม.)
          const isMorningAfternoon = names.includes("ช") && names.includes("บ");
          if (isMorningAfternoon) doubleShiftDays++;
          workloadScore += base + (isMorningAfternoon ? DOUBLE_SHIFT_BONUS : 0);
        });
        workloadScore = Math.round(workloadScore * 10) / 10;

        return {
          id: u.id,
          firstname: u.firstname,
          lastname: u.lastname,
          title: u.Title?.name || "",
          position: u.Position?.name || "",
          morning,
          afternoon,
          night,
          otMorning: otOf("ช"),
          otAfternoon: otOf("บ"),
          otNight: otOf("ด"),
          ot: otTotal,
          dayOff,
          onCall,
          weekendShifts,
          workShifts,
          totalShifts: workShifts + otTotal,
          dutyDays,
          doubleShiftDays,
          workloadScore,
        };
      })
      .filter((u) => u.firstname)
      .sort((a, b) => b.workloadScore - a.workloadScore);

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
}
