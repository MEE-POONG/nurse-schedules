import { prisma } from "@/utils/prisma";
import dayjs from "dayjs";

// ถอดคนออกจากตารางเวรของเดือน: ลบเวรปกติ + เวร On-Call + การจัดขึ้นเวร (UserDuty) ของเดือนนั้นทั้งหมด
export default async function handler(req, res) {
  const { method } = req;

  if (method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  const { userId, month, year } = req.body || {};

  if (!userId || month == null || year == null) {
    return res.status(400).json({ error: "userId, month and year are required" });
  }

  const firstDay = dayjs().year(+year).month(+month).startOf("month").toDate();
  const lastDay = dayjs().year(+year).month(+month).endOf("month").toDate();
  const range = { gte: firstDay, lte: lastDay };

  try {
    const result = await prisma.$transaction(async (tx) => {
      const duties = await tx.duty.deleteMany({
        where: { userId, datetime: range },
      });
      const onCallDuties = await tx.onCallDuty.deleteMany({
        where: { userId, datetime: range },
      });
      const assignments = await tx.userDuty.deleteMany({
        where: { userId, datetime: range },
      });
      return {
        duties: duties.count,
        onCallDuties: onCallDuties.count,
        assignments: assignments.count,
      };
    });

    res.status(200).json({ success: true, deleted: result });
  } catch (error) {
    console.error("Error removing user from month:", error);
    res.status(500).json({ error: "Failed to remove user from month", details: error.message });
  }
}
