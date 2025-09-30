import { prisma } from "@/utils/prisma";
import dayjs from "dayjs";

export default async function handler(req, res) {
  const { method } = req;

  if (method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  try {
    const { schedule, locationId, month, year, weeks } = req.body;

    if (!schedule || !Array.isArray(schedule)) {
      return res.status(400).json({ error: "Schedule array is required" });
    }

    if (!locationId) {
      return res.status(400).json({ error: "Location ID is required" });
    }

    console.log(`Applying auto schedule for ${month}/${year}, ${weeks} weeks, location: ${locationId}`);
    console.log(`Total schedule items: ${schedule.length}`);

    // เริ่ม transaction
    const result = await prisma.$transaction(async (tx) => {
      const appliedSchedule = [];
      const errors = [];

      for (const item of schedule) {
        try {
          // ตรวจสอบว่ามีข้อมูลที่จำเป็นครบ
          if (!item.userId || !item.shifId || !item.datetime) {
            errors.push({
              item: item,
              error: "Missing required fields: userId, shifId, or datetime"
            });
            continue;
          }

          // ตรวจสอบว่าผู้ใช้มีอยู่จริง
          const user = await tx.user.findUnique({
            where: { id: item.userId }
          });

          if (!user) {
            errors.push({
              item: item,
              error: `User not found: ${item.userId}`
            });
            continue;
          }

          // ตรวจสอบว่ากะมีอยู่จริง
          const shift = await tx.shif.findUnique({
            where: { id: item.shifId }
          });

          if (!shift) {
            errors.push({
              item: item,
              error: `Shift not found: ${item.shifId}`
            });
            continue;
          }

          // ตรวจสอบว่ามีการจัดเวรซ้ำหรือไม่
          const existingDuty = await tx.duty.findFirst({
            where: {
              userId: item.userId,
              datetime: new Date(item.datetime),
              locationId: locationId
            }
          });

          if (existingDuty) {
            // อัพเดทเวรที่มีอยู่
            const updatedDuty = await tx.duty.update({
              where: { id: existingDuty.id },
              data: {
                shifId: item.shifId,
                isOT: item.isOT || false,
                isOnCall: item.isOnCall || false
              }
            });

            appliedSchedule.push({
              ...item,
              id: updatedDuty.id,
              action: "updated",
              originalShiftId: existingDuty.shifId
            });

            console.log(`Updated duty: User ${user.firstname} ${user.lastname}, Date ${dayjs(item.datetime).format("YYYY-MM-DD")}, Shift ${shift.name}`);
          } else {
            // สร้างเวรใหม่
            const newDuty = await tx.duty.create({
              data: {
                userId: item.userId,
                shifId: item.shifId,
                locationId: locationId,
                datetime: new Date(item.datetime),
                isOT: item.isOT || false,
                isOnCall: item.isOnCall || false
              }
            });

            appliedSchedule.push({
              ...item,
              id: newDuty.id,
              action: "created"
            });

            console.log(`Created duty: User ${user.firstname} ${user.lastname}, Date ${dayjs(item.datetime).format("YYYY-MM-DD")}, Shift ${shift.name}`);
          }

        } catch (error) {
          console.error("Error processing schedule item:", error);
          errors.push({
            item: item,
            error: error.message
          });
        }
      }

      // บันทึกประวัติการจัดเวร
      if (appliedSchedule.length > 0) {
        const shiftHistoryPromises = appliedSchedule.map(item => 
          tx.shiftHistory.create({
            data: {
              userId: item.userId,
              shifId: item.shifId,
              locationId: locationId,
              datetime: new Date(item.datetime),
              isOT: item.isOT || false
            }
          })
        );

        await Promise.all(shiftHistoryPromises);
        console.log(`Created ${shiftHistoryPromises.length} shift history records`);
      }

      return {
        appliedSchedule,
        errors,
        summary: {
          totalItems: schedule.length,
          applied: appliedSchedule.length,
          errors: errors.length,
          successRate: ((appliedSchedule.length / schedule.length) * 100).toFixed(2) + "%"
        }
      };

    });

    res.status(200).json({
      success: true,
      message: "Auto schedule applied successfully",
      data: result
    });

  } catch (error) {
    console.error("Error applying auto schedule:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      error: "Failed to apply automatic schedule", 
      details: error.message 
    });
  }
}