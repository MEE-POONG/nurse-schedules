import { prisma } from "@/utils/prisma";
import dayjs from "dayjs";

export default async function handler(req, res) {
  const { method } = req;

  if (method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  try {
    const { month, year, mode, assignments, locationId } = req.body;

    if (!month || !year) {
      return res.status(400).json({ error: "Month and year are required" });
    }

    console.log(`Staff assignment for ${month}/${year}, mode: ${mode}`);

    // ลบการจัดสรรเดิมในเดือนนี้
    const startDate = dayjs().month(month).year(year).startOf("month");
    const endDate = startDate.endOf("month");

    await prisma.userDuty.deleteMany({
      where: {
        datetime: {
          gte: startDate.toDate(),
          lte: endDate.toDate()
        }
      }
    });

    let createdCount = 0;
    let errors = [];

    if (mode === "auto") {
      // จัดสรรอัตโนมัติ
      const result = await autoAssignStaff(locationId, month, year);
      createdCount = result.createdCount;
      errors = result.errors;
    } else if (mode === "manual" && assignments) {
      // จัดสรรด้วยตนเอง
      const result = await manualAssignStaff(assignments, month, year);
      createdCount = result.createdCount;
      errors = result.errors;
    }

    res.status(200).json({
      success: true,
      summary: {
        created: createdCount,
        errors: errors.length,
        errorDetails: errors
      }
    });

  } catch (error) {
    console.error("Error in staff assignment:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      error: "Failed to assign staff", 
      details: error.message 
    });
  }
}

async function autoAssignStaff(locationId, month, year) {
  let createdCount = 0;
  const errors = [];

  try {
    // ดึงข้อมูลพนักงานทั้งหมด
    const allStaff = await prisma.user.findMany({
      where: {
        isActive: true
      },
      include: {
        Position: true,
        Title: true
      }
    });

    // ดึงข้อมูลแผนก
    const locations = await prisma.location.findMany();

    // กฎการจัดสรรอัตโนมัติ
    const assignmentRules = {
      "ICU": {
        minStaff: 8,
        maxStaff: 12,
        positions: ["พยาบาลวิชาชีพ"],
        priority: 1
      },
      "พาสุข1": {
        minStaff: 6,
        maxStaff: 10,
        positions: ["พยาบาลวิชาชีพ", "พนักงานช่วยเหลือ"],
        priority: 2
      },
      "พาสุข2": {
        minStaff: 6,
        maxStaff: 10,
        positions: ["พยาบาลวิชาชีพ", "พนักงานช่วยเหลือ"],
        priority: 2
      },
      "ER": {
        minStaff: 4,
        maxStaff: 8,
        positions: ["พยาบาลวิชาชีพ"],
        priority: 3
      }
    };

    // จัดสรรพนักงานตามกฎ
    const assignments = [];
    
    for (const location of locations) {
      const rule = assignmentRules[location.name];
      if (!rule) continue;

      // กรองพนักงานที่เหมาะสมกับแผนกนี้
      const eligibleStaff = allStaff.filter(staff => 
        rule.positions.includes(staff.Position?.name)
      );

      // จัดสรรจำนวนพนักงานตามกฎ
      const staffCount = Math.min(
        Math.max(rule.minStaff, Math.floor(eligibleStaff.length * 0.8)),
        rule.maxStaff
      );

      // เลือกพนักงานตามลำดับความสำคัญ
      const selectedStaff = eligibleStaff.slice(0, staffCount);

      // สร้างการจัดสรร
      for (const staff of selectedStaff) {
        assignments.push({
          userId: staff.id,
          locationId: location.id,
          priority: rule.priority
        });
      }
    }

    // สร้าง UserDuty records
    const startDate = dayjs().month(month).year(year).startOf("month");
    const endDate = startDate.endOf("month");

    for (const assignment of assignments) {
      try {
        let currentDate = startDate;
        while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, "day")) {
          await prisma.userDuty.create({
            data: {
              userId: assignment.userId,
              locationId: assignment.locationId,
              datetime: currentDate.toDate(),
              isTrain: false,
              TrainingName: ""
            }
          });
          currentDate = currentDate.add(1, "day");
        }
        createdCount++;
      } catch (error) {
        errors.push({
          userId: assignment.userId,
          locationId: assignment.locationId,
          error: error.message
        });
      }
    }

  } catch (error) {
    errors.push({
      type: "general",
      error: error.message
    });
  }

  return { createdCount, errors };
}

async function manualAssignStaff(assignments, month, year) {
  let createdCount = 0;
  const errors = [];

  try {
    const startDate = dayjs().month(month).year(year).startOf("month");
    const endDate = startDate.endOf("month");

    for (const assignment of assignments) {
      if (!assignment.userId || !assignment.locationId) {
        errors.push({
          assignment: assignment,
          error: "Missing userId or locationId"
        });
        continue;
      }

      try {
        // สร้าง UserDuty record สำหรับทุกวันในเดือน
        let currentDate = startDate;
        while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, "day")) {
          await prisma.userDuty.create({
            data: {
              userId: assignment.userId,
              locationId: assignment.locationId,
              datetime: currentDate.toDate(),
              isTrain: assignment.isTrain || false,
              TrainingName: assignment.TrainingName || ""
            }
          });
          currentDate = currentDate.add(1, "day");
        }
        createdCount++;
      } catch (error) {
        errors.push({
          assignment: assignment,
          error: error.message
        });
      }
    }

  } catch (error) {
    errors.push({
      type: "general",
      error: error.message
    });
  }

  return { createdCount, errors };
} 