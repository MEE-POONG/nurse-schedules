import { prisma } from "@/utils/prisma";
import dayjs from "dayjs";

export default async function handler(req, res) {
  try {
    const { month = dayjs().month(), year = dayjs().year(), locationId } = req.query;

    const firstDay = dayjs().month(month).year(year).startOf("month");
    
    // ตรวจสอบข้อมูลพื้นฐาน
    const debugInfo = {
      month: parseInt(month),
      year: parseInt(year),
      firstDay: firstDay.format(),
      locationId: locationId
    };

    // 1. ตรวจสอบ locations ทั้งหมด
    const allLocations = await prisma.location.findMany();
    debugInfo.allLocations = allLocations;

    // 2. ตรวจสอบ users ทั้งหมดที่ active
    const allUsers = await prisma.user.findMany({
      where: { isActive: true },
      include: {
        Position: true,
        Title: true,
        UserDuty: {
          where: {
            datetime: { gte: firstDay.toDate() }
          }
        }
      }
    });
    debugInfo.allUsers = allUsers.length;
    debugInfo.usersWithDuty = allUsers.filter(u => u.UserDuty.length > 0).length;

    // 3. ตรวจสอบ UserDuty ในเดือนนี้
    const userDuties = await prisma.userDuty.findMany({
      where: {
        datetime: { gte: firstDay.toDate() },
        ...(locationId && { locationId: locationId })
      },
      include: {
        User: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            isActive: true
          }
        },
        Location: true
      }
    });
    debugInfo.userDuties = userDuties;

    // 4. ตรวจสอบ shifts ที่มีอยู่
    const shifts = await prisma.shif.findMany({
      where: {
        isShif: true,
        name: { in: ["ช", "บ", "ด"] }
      }
    });
    debugInfo.shifts = shifts;

    // 5. ตรวจสอบ preferences ในเดือนนี้
    const preferences = await prisma.shiftPreference.findMany({
      where: {
        datetime: {
          gte: firstDay.toDate(),
          lte: dayjs().month(month).year(year).endOf("month").toDate()
        },
        ...(locationId && { locationId: locationId })
      }
    });
    debugInfo.preferences = preferences.length;

    // 6. ตรวจสอบ duties ที่มีอยู่แล้วในเดือนนี้
    const existingDuties = await prisma.duty.findMany({
      where: {
        datetime: {
          gte: firstDay.toDate(),
          lte: dayjs().month(month).year(year).endOf("month").toDate()
        },
        ...(locationId && { locationId: locationId })
      }
    });
    debugInfo.existingDuties = existingDuties.length;

    res.status(200).json(debugInfo);

  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ error: error.message });
  }
}