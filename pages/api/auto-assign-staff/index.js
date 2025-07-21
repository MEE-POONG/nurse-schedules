import { prisma } from "@/utils/prisma";
import dayjs from "dayjs";

export default async function handler(req, res) {
  const { method } = req;

  if (method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  try {
    const { month, year, assignments = "auto" } = req.body;

    if (!month || !year) {
      return res.status(400).json({ error: "Month and year are required" });
    }

    const firstDay = dayjs().month(month).year(year).startOf("month");
    const assignmentDate = firstDay.date(15); // วันที่ 15 ของเดือน

    // ลบ UserDuty เดิมในเดือนนี้ก่อน (ถ้ามี)
    await prisma.userDuty.deleteMany({
      where: {
        datetime: {
          gte: firstDay.toDate(),
          lte: firstDay.endOf("month").toDate()
        }
      }
    });

    let result;

    if (assignments === "auto") {
      // จัดพนักงานอัตโนมัติ
      result = await autoAssignStaffToDepartments(assignmentDate);
    } else if (Array.isArray(assignments)) {
      // จัดพนักงานตามที่กำหนด
      result = await manualAssignStaff(assignments, assignmentDate);
    } else {
      return res.status(400).json({ error: "Invalid assignments format" });
    }

    res.status(200).json({
      success: true,
      message: "Staff assigned to departments successfully",
      month: month,
      year: year,
      summary: result
    });

  } catch (error) {
    console.error("Error auto-assigning staff:", error);
    res.status(500).json({ error: "Failed to assign staff to departments" });
  }
}

async function autoAssignStaffToDepartments(assignmentDate) {
  // ดึงข้อมูลพนักงานทั้งหมดที่ active
  const allStaff = await prisma.user.findMany({
    where: {
      isActive: true,
      isPartTime: false // เน้นพนักงานประจำก่อน
    },
    include: {
      Position: true,
      Location: true
    }
  });

  // ดึงข้อมูลแผนกทั้งหมด
  const allLocations = await prisma.location.findMany();

  const assignments = [];
  const summary = {
    totalStaff: allStaff.length,
    totalLocations: allLocations.length,
    assigned: 0,
    unassigned: 0,
    byLocation: {}
  };

  // กฎการจัดพนักงาน
  const assignmentRules = {
    "ICU": {
      positions: ["พยาบาลวิชาชีพ"],
      minStaff: 8,
      maxStaff: 12
    },
    "พาสุข1": {
      positions: ["พยาบาลวิชาชีพ", "พนักงานช่วยเหลือคนไข้"],
      minStaff: 6,
      maxStaff: 10
    },
    "พาสุข2": {
      positions: ["พยาบาลวิชาชีพ", "พนักงานช่วยเหลือคนไข้"],
      minStaff: 6,
      maxStaff: 10
    },
    "ER": {
      positions: ["พยาบาลวิชาชีพ"],
      minStaff: 4,
      maxStaff: 8
    }
  };

  // จัดเรียงพนักงานตามลำดับความสำคัญ
  const sortedStaff = allStaff.sort((a, b) => {
    // จัดตาม Position ก่อน (พยาบาลวิชาชีพ > พนักงานช่วยเหลือ > พนักงานเปล)
    const positionPriority = {
      "พยาบาลวิชาชีพ": 1,
      "พนักงานช่วยเหลือคนไข้": 2,
      "พนักงานเปล": 3
    };
    
    const aPriority = positionPriority[a.Position?.name] || 4;
    const bPriority = positionPriority[b.Position?.name] || 4;
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    // ถ้าเท่ากันให้จัดตาม Location เดิม (ถ้ามี)
    if (a.locationId && !b.locationId) return -1;
    if (!a.locationId && b.locationId) return 1;
    
    return 0;
  });

  // เริ่มจัดพนักงาน
  for (const location of allLocations) {
    const locationRule = assignmentRules[location.name];
    summary.byLocation[location.name] = { assigned: 0, target: locationRule?.minStaff || 3 };
    
    if (!locationRule) continue;

    // หาพนักงานที่เหมาะสมสำหรับแผนกนี้
    const eligibleStaff = sortedStaff.filter(staff => {
      // ตรวจสอบว่าตำแหน่งเหมาะสม
      const positionMatch = locationRule.positions.includes(staff.Position?.name);
      // ตรวจสอบว่ายังไม่ได้ถูกจัดไป
      const notAssigned = !assignments.find(a => a.userId === staff.id);
      // ต้องการให้คนที่เคยอยู่แผนกนี้กลับมา
      const previousLocation = staff.locationId === location.id;
      
      return positionMatch && notAssigned && (previousLocation || assignments.filter(a => a.locationId === location.id).length < locationRule.minStaff);
    });

    // จัดพนักงานเข้าแผนก
    const assignCount = Math.min(eligibleStaff.length, locationRule.maxStaff);
    for (let i = 0; i < assignCount; i++) {
      const staff = eligibleStaff[i];
      assignments.push({
        userId: staff.id,
        locationId: location.id,
        datetime: assignmentDate.toDate(),
        isTrain: false,
        TrainingName: ""
      });
      summary.byLocation[location.name].assigned++;
    }
  }

  // จัดพนักงานที่เหลือเข้าแผนกที่ยังไม่เต็ม
  const unassignedStaff = sortedStaff.filter(staff => 
    !assignments.find(a => a.userId === staff.id)
  );

  for (const staff of unassignedStaff) {
    // หาแผนกที่ยังขาดคน
    const availableLocation = allLocations.find(location => {
      const locationRule = assignmentRules[location.name];
      if (!locationRule) return false;
      
      const currentCount = summary.byLocation[location.name].assigned;
      const positionMatch = locationRule.positions.includes(staff.Position?.name);
      
      return positionMatch && currentCount < locationRule.maxStaff;
    });

    if (availableLocation) {
      assignments.push({
        userId: staff.id,
        locationId: availableLocation.id,
        datetime: assignmentDate.toDate(),
        isTrain: false,
        TrainingName: ""
      });
      summary.byLocation[availableLocation.name].assigned++;
    }
  }

  // บันทึกลงฐานข้อมูล
  const createdAssignments = await prisma.userDuty.createMany({
    data: assignments
  });

  summary.assigned = assignments.length;
  summary.unassigned = allStaff.length - assignments.length;

  return summary;
}

async function manualAssignStaff(assignments, assignmentDate) {
  // สำหรับการจัดแบบ manual
  const processedAssignments = assignments.map(assignment => ({
    userId: assignment.userId,
    locationId: assignment.locationId,
    datetime: assignmentDate.toDate(),
    isTrain: assignment.isTrain || false,
    TrainingName: assignment.TrainingName || ""
  }));

  const createdAssignments = await prisma.userDuty.createMany({
    data: processedAssignments
  });

  return {
    totalAssignments: assignments.length,
    created: createdAssignments.count
  };
}