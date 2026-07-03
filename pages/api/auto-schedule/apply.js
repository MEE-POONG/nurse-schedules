// บันทึกตารางเวรที่พรีวิวแล้วลง Duty
// POST { year, month(1-12), locationId, mode: 'fill' | 'replace', items: [{userId, day, shift, isOT, otClass}] }
//  - fill    = เติมเฉพาะช่องที่ยังว่าง (ข้ามช่องที่มีเวรอยู่แล้ว)
//  - replace = ล้างเวรทำงาน (ช/บ/ด ทั้งปกติและ OT) และวันหยุด x ของเดือนนั้นก่อน แล้วบันทึกใหม่
//              *ไม่แตะ* ลาพัก/ลากิจ/ลาป่วย/อบรม/R ที่กรอกไว้
import { prisma } from "@/utils/prisma";
import dayjs from "dayjs";

const WORK_NAMES = ["ช", "บ", "ด"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { year, month, locationId, mode = "fill", items } = req.body;
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    if (!y || !m || m < 1 || m > 12 || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ success: false, message: "ข้อมูลไม่ครบ: ต้องมี year, month, items" });
    }

    const mm = String(m).padStart(2, "0");
    const firstDay = dayjs(`${y}-${mm}-01`).startOf("month");
    const lastDay = firstDay.endOf("month");

    // เตรียมตัวจับคู่กะ → Shif id
    const shifts = await prisma.shif.findMany();
    const resolveShif = (item) => {
      if (item.shift === "x") return shifts.find((s) => s.name === "x" && s.isDayOff) || shifts.find((s) => s.name === "x");
      if (!WORK_NAMES.includes(item.shift)) return null;
      if (item.isOT) {
        return (
          shifts.find((s) => s.name === item.shift && s.isOT && s.class === item.otClass) ||
          shifts.find((s) => s.name === item.shift && s.isOT)
        );
      }
      return shifts.find((s) => s.name === item.shift && s.isShif) || shifts.find((s) => s.name === item.shift && !s.isOT && !s.isDayOff);
    };

    const userIds = [...new Set(items.map((i) => i.userId))];

    // เวรที่มีอยู่แล้วของคนเหล่านี้ในเดือนนี้
    const existing = await prisma.duty.findMany({
      where: {
        userId: { in: userIds },
        datetime: { gte: firstDay.format(), lte: lastDay.format() },
      },
      include: { Shif: true },
    });

    let deleted = 0;
    if (mode === "replace") {
      // ลบเฉพาะเวรทำงาน (ปกติ/OT) และวันหยุด x — คงลา/อบรม/R ไว้
      const deletableIds = existing
        .filter((d) => {
          const n = d.Shif?.name;
          return WORK_NAMES.includes(n) || n === "x";
        })
        .map((d) => d.id);
      if (deletableIds.length) {
        const delRes = await prisma.duty.deleteMany({ where: { id: { in: deletableIds } } });
        deleted = delRes.count;
      }
    }

    // ช่องที่ยังถือว่า "มีของ" หลังการลบ (สำหรับ mode fill และกันซ้ำ)
    const occupied = new Set(
      existing
        .filter((d) => (mode === "replace" ? !(WORK_NAMES.includes(d.Shif?.name) || d.Shif?.name === "x") : true))
        .map((d) => `${d.userId}|${dayjs(d.datetime).date()}`)
    );

    const toCreate = [];
    let skipped = 0;
    let unresolved = 0;
    for (const item of items) {
      const key = `${item.userId}|${item.day}`;
      if (occupied.has(key)) {
        skipped++;
        continue; // มีเวร/ลาอยู่แล้ว ไม่ทับ
      }
      const shif = resolveShif(item);
      if (!shif) {
        unresolved++;
        continue;
      }
      toCreate.push({
        userId: item.userId,
        shifId: shif.id,
        locationId: locationId || null,
        isOT: !!item.isOT,
        datetime: dayjs(`${y}-${mm}-${String(item.day).padStart(2, "0")}`).add(7, "hour").format(),
      });
    }

    // หมายเหตุ: เวรควบ = duty 2 รายการในวันเดียว → occupied ต้องไม่บล็อกรายการที่สองของ item ชุดเดียวกัน
    // (occupied มาจากเวรเดิมใน DB เท่านั้น จึงไม่บล็อกกันเอง)

    let created = 0;
    if (toCreate.length) {
      const createRes = await prisma.duty.createMany({ data: toCreate });
      created = createRes.count;
    }

    return res.status(200).json({
      success: true,
      message: `บันทึกแล้ว ${created} เวร${deleted ? ` (ล้างของเดิม ${deleted})` : ""}${skipped ? ` ข้าม ${skipped} ช่องที่มีเวรอยู่แล้ว` : ""}`,
      summary: { created, deleted, skipped, unresolved, mode },
    });
  } catch (error) {
    console.error("auto-schedule apply error:", error);
    return res.status(500).json({ success: false, message: "บันทึกตารางเวรไม่สำเร็จ", error: String(error?.message || error) });
  }
}
