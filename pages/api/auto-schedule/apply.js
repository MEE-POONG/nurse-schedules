import { prisma } from "@/utils/prisma";
import dayjs from "dayjs";

export default async function handler(req, res) {
  const { method } = req;

  if (method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  try {
    const { schedule, month, year, locationId, replaceExisting = false } = req.body;

    if (!schedule || !Array.isArray(schedule)) {
      return res.status(400).json({ error: "Invalid schedule data" });
    }

    if (!month || !year) {
      return res.status(400).json({ error: "Month and year are required" });
    }

    const firstDay = dayjs().month(month).year(year).startOf("month");
    const lastDay = dayjs().month(month).year(year).endOf("month");

    // หากเลือกที่จะแทนที่ตารางเดิม ให้ลบเวรเก่าก่อน
    if (replaceExisting) {
      await prisma.duty.deleteMany({
        where: {
          datetime: {
            gte: firstDay.toDate(),
            lte: lastDay.toDate()
          },
          locationId: locationId
        }
      });
    }

    // บันทึกตารางเวรใหม่
    const createdDuties = [];
    const errors = [];

    for (const shift of schedule) {
      try {
        // ตรวจสอบว่ามีเวรซ้ำหรือไม่ (กรณีไม่แทนที่เวรเดิม)
        if (!replaceExisting) {
          const existing = await prisma.duty.findFirst({
            where: {
              userId: shift.userId,
              shifId: shift.shifId,
              datetime: new Date(shift.datetime),
              locationId: locationId
            }
          });

          if (existing) {
            errors.push({
              userId: shift.userId,
              datetime: shift.datetime,
              error: "Duty already exists"
            });
            continue;
          }
        }

        const duty = await prisma.duty.create({
          data: {
            userId: shift.userId,
            shifId: shift.shifId,
            locationId: locationId,
            datetime: new Date(shift.datetime),
            isOT: shift.isOT || false
          },
          include: {
            User: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                Title: true,
                Position: true
              }
            },
            Shif: true,
            Location: true
          }
        });

        createdDuties.push(duty);

        // บันทึกประวัติการทำงาน
        await prisma.shiftHistory.create({
          data: {
            userId: shift.userId,
            shifId: shift.shifId,
            locationId: locationId,
            datetime: new Date(shift.datetime),
            isOT: shift.isOT || false
          }
        });

      } catch (error) {
        console.error(`Error creating duty for user ${shift.userId}:`, error);
        errors.push({
          userId: shift.userId,
          datetime: shift.datetime,
          error: error.message
        });
      }
    }

    // อัพเดทสถานะการจองที่ได้รับการจัดเวรแล้ว
    const assignedPreferences = await updateAssignedPreferences(createdDuties, month, year);

    res.status(200).json({
      success: true,
      message: "Auto schedule applied successfully",
      summary: {
        totalShifts: schedule.length,
        created: createdDuties.length,
        errors: errors.length,
        assignedPreferences: assignedPreferences
      },
      createdDuties: createdDuties,
      errors: errors
    });

  } catch (error) {
    console.error("Error applying auto schedule:", error);
    res.status(500).json({ error: "Failed to apply automatic schedule" });
  }
}

async function updateAssignedPreferences(createdDuties, month, year) {
  const firstDay = dayjs().month(month).year(year).startOf("month");
  const lastDay = dayjs().month(month).year(year).endOf("month");
  
  let updatedCount = 0;

  for (const duty of createdDuties) {
    try {
      // หาการจองที่ตรงกับเวรที่ถูกจัด
      const preference = await prisma.shiftPreference.findFirst({
        where: {
          userId: duty.userId,
          shifId: duty.shifId,
          datetime: {
            gte: dayjs(duty.datetime).startOf("day").toDate(),
            lte: dayjs(duty.datetime).endOf("day").toDate()
          }
        }
      });

      if (preference) {
        // อัพเดทสถานะเป็น "ได้รับการจัดแล้ว"
        await prisma.shiftPreference.update({
          where: { id: preference.id },
          data: { 
            isReserved: true,
            updatedAt: new Date()
          }
        });
        updatedCount++;
      }
    } catch (error) {
      console.error(`Error updating preference for duty ${duty.id}:`, error);
    }
  }

  return updatedCount;
}