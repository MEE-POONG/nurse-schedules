import { prisma } from "@/utils/prisma";
import dayjs from "dayjs";

// ระบบจัดตารางเวรอัตโนมัติ 2 กะ + On-Call
// ตามเงื่อนไข: ภาระงาน–วันหยุด–On-Call เท่าๆ กัน
// รองรับกลุ่มบุคลากรพิเศษ: หัวหน้า (HD), คนท้อง (PG), ผู้สูงอายุ (SR)

// 1. ตารางน้ำหนักงาน (Work-load Weights) - ตามเงื่อนไขใหม่
const SHIFT_WEIGHTS = {
  // เวรเดี่ยว
  "ด": { weight: 1.2, hours: 8, description: "00:00–08:00" },      // ดึก
  "ช": { weight: 1.0, hours: 8, description: "08:00–16:00" },      // เช้า
  "บ": { weight: 1.0, hours: 8, description: "16:00–00:00" },      // บ่าย
  
  // เวรควบ (เฉพาะที่อนุญาต)
  "ช/บ": { weight: 2.1, hours: 16, description: "08:00–00:00" },   // เช้า+บ่าย
  "ด/บ": { weight: 2.3, hours: 16, description: "00:00–00:00(+1)" }, // ดึก+บ่าย
  "OCช/บ": { weight: 2.1, hours: 16, description: "On-Call เช้า+บ่าย" }, // On-Call เช้า+บ่าย
  "ช/OCบ": { weight: 2.1, hours: 16, description: "เช้า+On-Call บ่าย" }, // เช้า+On-Call บ่าย
  "OCด/บ": { weight: 2.3, hours: 16, description: "On-Call ดึก+บ่าย" }, // On-Call ดึก+บ่าย
  "ด/OCบ": { weight: 2.3, hours: 16, description: "ดึก+On-Call บ่าย" }, // ดึก+On-Call บ่าย
  
  // On-Call เดี่ยว
  "OCด": { weight: 1.8, hours: 8, description: "On-Call ดึก" },    // On-Call ดึก
  "OCช": { weight: 1.6, hours: 8, description: "On-Call เช้า" },   // On-Call เช้า
  "OCบ": { weight: 1.6, hours: 8, description: "On-Call บ่าย" },   // On-Call บ่าย
  
  // วันหยุด
  "x": { weight: 0.0, hours: 0, description: "วันหยุด" }           // วันหยุด
};

// น้ำหนักพิเศษสำหรับกลุ่มบุคลากรพิเศษ (เพิ่มภาระงานเพื่อชดเชยข้อจำกัด)
const SPECIAL_SHIFT_WEIGHTS = {
  "HD": { "ช": 1.3 }, // หัวหน้า: เวรเช้ามีน้ำหนัก 1.3
  "PG": { "ช": 1.2 }, // คนท้อง: เวรเช้ามีน้ำหนัก 1.2
  "SR": { "ช": 1.1 }  // ผู้สูงอายุ: เวรเช้ามีน้ำหนัก 1.1
};

// 2. กติกาการหมุนเวร (Shift-Rotation Rules)
const SHIFT_RULES = {
  H1: { description: "Rest หลังเวรเดี่ยว ≥ 12 ชม.", minRestHours: 12 },
  H2: { description: "Rest หลังเวรควบ ≥ 24 ชม.", minRestHours: 24 },
  H3: { description: "Rest หลัง On-Call ≥ 12 ชม.", minRestHours: 12 },
  H4: { description: "ไม่เกิน 6 N ภายใน 14 วัน (อิงเวรจริง ดึก ~7/เดือน)", maxNightPer14d: 6 },
  H5: { description: "เวรควบ ≤ 10/เดือน/คน และคั่น ≥ 1 วัน (อิงเวรจริง ~7/เดือน)", maxDoublePerMonth: 10, minDaysBetweenDouble: 1 },
  H6: { description: "ไม่เกิน 4 On-Call/เดือน/คน และห้าม OC ติด OC", maxOnCallPerMonth: 4, noConsecutiveOnCall: true },
  H7: { description: "เวรชนิดเดียวกันติดกันได้สูงสุด 2 ครั้ง", maxConsecutiveSame: 2 },
  H8: { description: "ลูปหมุนมาตรฐาน: ด → ช → บ", rotationPattern: ["ด", "ช", "บ"] },
  H9: { description: "วันหยุด (OFF) ขั้นต่ำ 1 วันต่อ 7 วัน", minDayOffPer7d: 1 },
  // กติกาใหม่สำหรับกลุ่มบุคลากรพิเศษ
  H10: { description: "ถ้า role ∈ {HD, PG, SR} → อนุญาตเฉพาะเวร ช", specialMorningOnly: true },
  H11: { description: "ถ้า role ∈ {HD, PG, SR} และ day ∈ Weekend ∪ PublicHoliday → ต้องเป็น OFF", specialWeekendOff: true },
  H12: { description: "OFF เสาร์-อาทิตย์และนักขัตฤกษ์ ต้องเท่า ๆ กัน ± 1 วัน ระหว่างสมาชิกใน กลุ่มทั่วไป", generalWeekendBalance: true },
  // กติกาใหม่สำหรับการห้ามเวรซ้ำติดกัน
  H13: { description: "ห้าม ช/ช, บ/บ, ช/OCช, บ/OCบ", forbiddenConsecutive: ["ช/ช", "บ/บ", "ช/OCช", "บ/OCบ"] },
  // กติกาใหม่สำหรับเวรที่อนุญาต
  H14: { description: "เวรที่อนุญาต: ช/บ, ด/บ, OCช/บ, ช/OCบ, OCด/บ, ด/OCบ, ด, ช, บ, OCด, OCช, OCบ, x", 
         allowedShifts: ["ช/บ", "ด/บ", "OCช/บ", "ช/OCบ", "OCด/บ", "ด/OCบ", "ด", "ช", "บ", "OCด", "OCช", "OCบ", "x"] },
  // กติกาใหม่สำหรับการหมุนเวรตามลำดับ
  H15: { description: "ลำดับการหมุนเวร: ด → ช → บ", rotationPattern: ["ด", "ช", "บ"] }
};

// 3. คะแนนเป้าหมาย (Objective Function Weights)
const OBJECTIVE_WEIGHTS = {
  workBalance: 10,      // สมดุลงาน
  dayOffBalance: 10,    // สมดุลวันหยุด
  doubleShiftExcess: 5, // เวรควบเกินโควตา
  onCallExcess: 5,      // On-Call เกินโควตา
  consecutiveExcess: 2, // เวรซ้ำติดเกิน 2 ครั้ง
  specialWorkBalance: 8, // สมดุลงานกลุ่มพิเศษ
  generalWeekendBalance: 6 // สมดุลวันหยุดเสาร์-อาทิตย์กลุ่มทั่วไป
};

// วันหยุดนักขัตฤกษ์ 2025
const HOLIDAYS_2025 = [
  "2025-01-01", "2025-02-12", "2025-04-07", "2025-04-13", "2025-04-14", "2025-04-15", "2025-04-16",
  "2025-05-01", "2025-05-05", "2025-05-09", "2025-05-12", "2025-06-02", "2025-06-03", "2025-06-09",
  "2025-07-10", "2025-07-11", "2025-07-28", "2025-08-11", "2025-08-12", "2025-10-13", "2025-10-23",
  "2025-12-05", "2025-12-10", "2025-12-31"
];

// กลุ่มบุคลากรพิเศษ
const SPECIAL_ROLES = ["HD", "PG", "SR"];

function isHoliday(date) {
  return HOLIDAYS_2025.includes(date.format("YYYY-MM-DD"));
}

function isWeekend(date) {
  return [0, 6].includes(date.day()); // 0 = อาทิตย์, 6 = เสาร์
}

function isWeekendOrHoliday(date) {
  return isWeekend(date) || isHoliday(date);
}

function getStaffRole(staff) {
  if (staff.isChief) return "HD";
  if (staff.isPregnant) return "PG";
  if (staff.isElderly) return "SR";
  return "NORMAL";
}

function isSpecialRole(staff) {
  return SPECIAL_ROLES.includes(getStaffRole(staff));
}

function getShiftWeight(staff, shiftType) {
  const role = getStaffRole(staff);
  if (SPECIAL_SHIFT_WEIGHTS[role] && SPECIAL_SHIFT_WEIGHTS[role][shiftType]) {
    return SPECIAL_SHIFT_WEIGHTS[role][shiftType];
  }
  return SHIFT_WEIGHTS[shiftType]?.weight || 0;
}

function isEligibleForShift(staff, shiftType) {
  const role = getStaffRole(staff);
  
  // ตรวจสอบว่าเวรนี้อยู่ในรายการที่อนุญาตหรือไม่
  const allowedShifts = SHIFT_RULES.H14.allowedShifts;
  if (!allowedShifts.includes(shiftType)) {
    return false;
  }
  
  // กลุ่มพิเศษทำได้เฉพาะเวรเช้าและวันหยุด
  if (SPECIAL_ROLES.includes(role)) {
    return shiftType === "ช" || shiftType === "x";
  }
  
  // กลุ่มทั่วไปทำได้ทุกเวรที่อนุญาต
  return true;
}

export default async function handler(req, res) {
  const { method } = req;

  if (method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  try {
    const { month, year, locationId } = req.body;

    if (!month || !year) {
      return res.status(400).json({ error: "Month and year are required" });
    }

    // จัดตารางให้ครอบคลุม "ทั้งเดือนจริง" (30/31 วัน) ไม่ใช่แค่ 4 สัปดาห์ (28 วัน)
    const startDate = dayjs().month(month).year(year).startOf("month");
    const endDate = dayjs().month(month).year(year).endOf("month");
    const totalDays = endDate.diff(startDate, "day") + 1;
    const weeks = Math.ceil(totalDays / 7);

    console.log(`Generating auto schedule for ${month}/${year}, ${totalDays} days (${weeks} weeks), location: ${locationId}`);

    // ดึงรายชื่อพนักงาน
    const staff = await getActiveStaff(locationId, month, year);
    console.log(`Total staff found: ${staff.length}`);

    // ตรวจสอบว่ามีพนักงานหรือไม่
    if (staff.length === 0) {
      console.log("No staff found - returning empty schedule");
      return res.status(200).json({
        success: true,
        schedule: [],
        summary: {
          totalStaff: 0,
          specialStaff: 0,
          normalStaff: 0,
          totalDays: totalDays,
          weeks: weeks,
          constraintViolations: [],
          objectiveScore: 0,
          workBalance: { average: 0, maxDeviation: 0, isBalanced: true },
          dayOffBalance: { average: 0, maxDeviation: 0, isBalanced: true },
          specialWorkBalance: { average: 0, maxDeviation: 0, isBalanced: true },
          generalWeekendBalance: { average: 0, maxDeviation: 0, isBalanced: true }
        }
      });
    }

    // แยกกลุ่มบุคลากร
    const specialStaff = staff.filter(s => isSpecialRole(s));
    const normalStaff = staff.filter(s => !isSpecialRole(s));
    
    console.log(`Special staff (HD/PG/SR): ${specialStaff.length}`);
    console.log(`Normal staff: ${normalStaff.length}`);

    // ดึงข้อมูลการจองเวร
    const preferences = await getShiftPreferences(month, year, locationId);
    console.log(`Shift preferences found: ${preferences.length}`);

    // ดึงประวัติการทำงานเดือนก่อน
    const previousHistory = await getPreviousMonthHistory(month, year, locationId);
    console.log(`Previous month history found: ${previousHistory.length}`);

    // ดึงข้อมูลประเภทกะ
    const shifts = await getAvailableShifts();
    console.log(`Available shifts:`, shifts.map(s => s.name));

    // ตรวจสอบว่ามีเวรหรือไม่
    if (shifts.length === 0) {
      console.log("No shifts found - returning empty schedule");
      return res.status(200).json({
        success: true,
        schedule: [],
        summary: {
          totalStaff: staff.length,
          specialStaff: specialStaff.length,
          normalStaff: normalStaff.length,
          totalDays: totalDays,
          weeks: weeks,
          constraintViolations: [],
          objectiveScore: 0,
          workBalance: { average: 0, maxDeviation: 0, isBalanced: true },
          dayOffBalance: { average: 0, maxDeviation: 0, isBalanced: true },
          specialWorkBalance: { average: 0, maxDeviation: 0, isBalanced: true },
          generalWeekendBalance: { average: 0, maxDeviation: 0, isBalanced: true }
        }
      });
    }

    // สร้างตารางเวรอัตโนมัติ
    console.log("Starting schedule generation...");
    console.log("Staff count:", staff.length);
    console.log("Shifts available:", shifts.length);
    console.log("Total days:", totalDays);
    
    const schedule = await generateAdvancedAutoSchedule({
      staff,
      specialStaff,
      normalStaff,
      preferences,
      previousHistory,
      shifts,
      startDate,
      endDate,
      totalDays,
      locationId,
      weeks
    });
    
    console.log("Schedule generation completed");
    console.log("Generated schedule items:", schedule.schedule.length);
    console.log("Violations:", schedule.violations.length);

    res.status(200).json({
      success: true,
      schedule: schedule.schedule,
      violations: schedule.violations || [],
      staffStats: schedule.staffStats || {},
      summary: {
        totalStaff: staff.length,
        specialStaff: specialStaff.length,
        normalStaff: normalStaff.length,
        totalDays: totalDays,
        weeks: weeks,
        constraintViolations: schedule.violations || [],
        objectiveScore: schedule.objectiveScore,
        workBalance: schedule.workBalance,
        dayOffBalance: schedule.dayOffBalance,
        specialWorkBalance: schedule.specialWorkBalance,
        generalWeekendBalance: schedule.generalWeekendBalance
      }
    });

  } catch (error) {
    console.error("Error generating auto schedule:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ error: "Failed to generate automatic schedule", details: error.message });
  }
}

async function getActiveStaff(locationId, month, year) {
  const startDate = dayjs().month(month).year(year).startOf("month");
  
  try {
    // ถ้ามี locationId ให้ดึงพนักงานที่ถูกจัดสรรในแผนกนั้น
    if (locationId) {
      const staffWithDuty = await prisma.user.findMany({
        where: {
          isActive: true,
          UserDuty: {
            some: {
              AND: {
                datetime: { gte: startDate.toDate() },
                locationId: locationId,
                isTrain: { not: true }
              }
            }
          }
        },
        include: {
          Position: true,
          Title: true,
          UserDuty: {
            where: {
              datetime: { gte: startDate.toDate() },
              locationId: locationId
            }
          }
        }
      });

      if (staffWithDuty.length > 0) {
        console.log(`Found ${staffWithDuty.length} active staff with duty for location ${locationId}`);
        return staffWithDuty;
      } else {
        console.log(`No staff assigned to location ${locationId}, using all active staff`);
      }
    }

    // ถ้าไม่มี locationId หรือไม่มีพนักงานในแผนกนั้น ให้ดึงพนักงานทั้งหมด
    const allStaff = await prisma.user.findMany({
      where: {
        isActive: true
      },
      include: {
        Position: true,
        Title: true,
        UserDuty: {
          where: {
            datetime: { gte: startDate.toDate() }
          }
        }
      }
    });

    console.log(`Found ${allStaff.length} active staff total`);
    return allStaff;
  } catch (error) {
    console.error("Error getting active staff:", error);
    // Return empty array instead of throwing error
    return [];
  }
}

async function getShiftPreferences(month, year, locationId) {
  try {
    const startDate = dayjs().month(month).year(year).startOf("month");
    const endDate = dayjs().month(month).year(year).endOf("month");

    return await prisma.shiftPreference.findMany({
      where: {
        datetime: {
          gte: startDate.toDate(),
          lte: endDate.toDate()
        },
        ...(locationId && { locationId: locationId })
      },
      include: {
        User: true,
        Shif: true
      },
      orderBy: [
        { priority: "asc" },
        { createdAt: "asc" }
      ]
    });
  } catch (error) {
    console.error("Error getting shift preferences:", error);
    return [];
  }
}

async function getPreviousMonthHistory(month, year, locationId) {
  try {
    const prevMonth = dayjs().month(month).year(year).subtract(1, "month");
    const startDate = prevMonth.startOf("month");
    const endDate = prevMonth.endOf("month");

    return await prisma.duty.findMany({
      where: {
        datetime: {
          gte: startDate.toDate(),
          lte: endDate.toDate()
        },
        ...(locationId && { locationId: locationId })
      },
      include: {
        User: true,
        Shif: true
      }
    });
  } catch (error) {
    console.error("Error getting previous month history:", error);
    return [];
  }
}

async function getAvailableShifts() {
  try {
    // ดึงข้อมูลเวรทั้งหมด
    const allShifts = await prisma.shif.findMany();
    console.log("All available shifts:", allShifts.map(s => ({ id: s.id, name: s.name, isShif: s.isShif })));
    
    // สร้าง mapping สำหรับเวรเก่าและใหม่
    const shiftMapping = {
      // เวรใหม่ (ระบบ 2 กะ + On-Call)
      "M": "ช", // เช้า
      "A": "บ", // บ่าย
      "N": "ด", // ดึก
      "MA": "ช/บ", // เช้า+บ่าย
      "NA": "ด/บ", // ดึก+บ่าย
      "OC": "OCช", // On-Call (default to morning)
      "OFF": "x", // วันหยุด
      
      // เวรเก่า (ระบบ 3 กะ)
      "ช": "ช", // เช้า
      "บ": "บ", // บ่าย
      "ด": "ด", // ดึก
      "ช/บ": "ช/บ", // เช้า+บ่าย
      "ด/บ": "ด/บ", // ดึก+บ่าย
      "OCช/บ": "OCช/บ", // On-Call เช้า+บ่าย
      "ช/OCบ": "ช/OCบ", // เช้า+On-Call บ่าย
      "OCด/บ": "OCด/บ", // On-Call ดึก+บ่าย
      "ด/OCบ": "ด/OCบ", // ดึก+On-Call บ่าย
      "OCด": "OCด", // On-Call ดึก
      "OCช": "OCช", // On-Call เช้า
      "OCบ": "OCบ", // On-Call บ่าย
      "x": "x" // วันหยุด
    };
    
    // กรองเวรที่ต้องการ - รวมกะ OT (isOT=true) ด้วย เพื่อให้จัดเวร OT/เวรควบได้
    const filteredShifts = allShifts.filter(shift => {
      const mappedName = shiftMapping[shift.name];
      return mappedName && (mappedName === "x" || shift.isShif === true || shift.isOT === true);
    });
    
    // ถ้าไม่มีเวรที่กรองแล้ว ให้ใช้เวรทั้งหมด
    if (filteredShifts.length === 0) {
      console.log("No filtered shifts found, using all shifts");
      return allShifts;
    }
    
    console.log("Filtered shifts for auto-schedule:", filteredShifts.map(s => ({ id: s.id, name: s.name, mappedName: shiftMapping[s.name] })));
    
    return filteredShifts;
  } catch (error) {
    console.error("Error getting available shifts:", error);
    return [];
  }
}

async function generateAdvancedAutoSchedule({ staff, specialStaff, normalStaff, preferences, previousHistory, shifts, startDate, endDate, totalDays, locationId, weeks }) {
  const schedule = [];
  const violations = [];
  const staffStats = {};

      // เตรียมสถิติพนักงาน
    staff.forEach(person => {
      const role = getStaffRole(person);
      staffStats[person.id] = {
        role: role,
        totalWorkload: 0,
        totalDayOffs: 0,
        weekendOffs: 0, // เพิ่มการนับวันหยุดเสาร์-อาทิตย์
        consecutiveDays: 0,
        lastShift: null,
        lastShiftDate: null,
        shiftCounts: { "ช": 0, "บ": 0, "ด": 0, "ช/บ": 0, "ด/บ": 0, "OCช/บ": 0, "ช/OCบ": 0, "OCด/บ": 0, "ด/OCบ": 0, "OCด": 0, "OCช": 0, "OCบ": 0, "x": 0 },
        doubleShiftCount: 0,
        onCallCount: 0,
        nightShiftCount: 0,
        consecutiveSameShift: 0,
        lastDoubleShiftDate: null,
        lastOnCallDate: null,
        assignedShiftsToday: [],
        assignedOnCallToday: false
      };
    });

  // สร้างแผนที่การจองเวร
  const reservationMap = createReservationMap(preferences);

  // กำหนดจำนวนเวรแต่ละกะ/วัน - ตามเงื่อนไขใหม่
  // จำนวนเวร "regular" ต่อกะต่อวัน อิงจากเวรจริงของ ICU (เฉลี่ย มี.ค.–พ.ค. 2026)
  // หมายเหตุ: on-call จัดแยกใน OnCallDuty ไม่ใช่ที่นี่ → oncall = 0
  const SHIFT_REQUIREMENTS = {
    "ช": { regular: 2, oncall: 0 },
    "บ": { regular: 2, oncall: 0 },
    "ด": { regular: 2, oncall: 0 }
  };

  // วันหยุด (เสาร์-อาทิตย์/นักขัตฤกษ์): เวรเช้า regular ลดเหลือ 1 (จากเวรจริง weekend ช≈0–1)
  const WEEKEND_REQUIREMENTS = {
    "ช": { regular: 1, oncall: 0 },
    "บ": { regular: 2, oncall: 0 },
    "ด": { regular: 2, oncall: 0 }
  };

  // ฟังก์ชันสำหรับดึงจำนวนเวรที่ต้องการตามวัน
  function getShiftRequirements(shiftName, currentDate) {
    const baseReq = SHIFT_REQUIREMENTS[shiftName];
    if (!baseReq) return { regular: 0, oncall: 0 };

    if (isWeekendOrHoliday(currentDate)) {
      return WEEKEND_REQUIREMENTS[shiftName] || baseReq;
    }
    return baseReq;
  }

  // สร้างตารางเวรวันหยุด (OFF) แบบสมดุล
  console.log("Generating balanced day offs...");
  const dayOffSchedule = generateBalancedDayOffs(staff, startDate, endDate, weeks);
  console.log("Day off schedule generated for", Object.keys(dayOffSchedule).length, "staff members");

  // สร้างตารางเวรหลัก
  for (let day = 0; day < totalDays; day++) {
    const currentDate = startDate.add(day, "day");
    const dateStr = currentDate.format("YYYY-MM-DD");

    console.log(`Processing day ${day + 1}/${totalDays}: ${dateStr}`);

    // Reset daily stats
    Object.values(staffStats).forEach(stats => {
      stats.assignedShiftsToday = [];
      stats.assignedOnCallToday = false;
    });

    // เคารพการจองแน่นอน (isReserved) ก่อน: จัดกะ/วันหยุดที่พยาบาลจองไว้
    honorReservations(schedule, staffStats, currentDate, locationId, shifts, preferences);

    // Assign วันหยุดตามที่กำหนดไว้
    assignDayOffs(schedule, staffStats, dayOffSchedule, currentDate, locationId, shifts);

    // Assign วันหยุดเสาร์-อาทิตย์และวันหยุดนักขัตฤกษ์สำหรับกลุ่มพิเศษ
    assignSpecialWeekendOffs(schedule, staffStats, currentDate, locationId, shifts);

    // Assign เวรหลัก (M, A, N)
    assignMainShifts(schedule, staffStats, currentDate, locationId, shifts, SHIFT_REQUIREMENTS, getShiftRequirements, reservationMap, violations);

    // Assign OT เช้า + เวรควบ (ช(OT)+บ, ด+บ(OT)) ตามรูปแบบจริง
    // หมายเหตุ: on-call จัดแยกใน OnCallDuty ไม่ทำที่นี่
    assignOTAndDoubles(schedule, staffStats, currentDate, locationId, shifts);

    // ตรวจสอบและแก้ไขข้อขัดแย้ง
    resolveConflicts(schedule, staffStats, currentDate, violations, shifts);

    // เติมวันหยุด (x) ให้คนที่ยังไม่มีเวร/หยุดในวันนี้ เพื่อไม่ให้เหลือช่องว่าง
    fillRemainingAsOff(schedule, staffStats, currentDate, locationId, shifts);
  }

  // คำนวณคะแนนเป้าหมาย
  const objectiveScore = calculateObjectiveScore(staffStats, violations);
  const workBalance = calculateWorkBalance(staffStats);
  const dayOffBalance = calculateDayOffBalance(staffStats);
  const specialWorkBalance = calculateSpecialWorkBalance(staffStats, specialStaff);
  const generalWeekendBalance = calculateGeneralWeekendBalance(staffStats, normalStaff);

  return {
    schedule: schedule,
    violations: violations,
    objectiveScore: objectiveScore,
    workBalance: workBalance,
    dayOffBalance: dayOffBalance,
    specialWorkBalance: specialWorkBalance,
    generalWeekendBalance: generalWeekendBalance,
    staffStats: staffStats
  };
}

function createReservationMap(preferences) {
  const map = {};
  
  preferences.forEach(pref => {
    const dateStr = dayjs(pref.datetime).format("YYYY-MM-DD");
    const key = `${dateStr}_${pref.shifId}`;
    
    if (!map[key]) {
      map[key] = [];
    }
    
    map[key].push({
      userId: pref.userId,
      priority: pref.priority,
      isReserved: pref.isReserved
    });
  });

  return map;
}

function generateBalancedDayOffs(staff, startDate, endDate, weeks) {
  const dayOffSchedule = {};
  const totalDays = endDate.diff(startDate, "day") + 1;
  
  // แยกกลุ่มบุคลากร
  const specialStaff = staff.filter(s => isSpecialRole(s));
  const normalStaff = staff.filter(s => !isSpecialRole(s));
  
  // คำนวณจำนวนวันหยุดที่ต้องการต่อคน
  const minDayOffsPerWeek = SHIFT_RULES.H9.minDayOffPer7d;
  const totalDayOffsNeeded = Math.floor((totalDays / 7) * minDayOffsPerWeek);
  
  // สร้างวันหยุดสำหรับกลุ่มทั่วไป
  normalStaff.forEach(person => {
    dayOffSchedule[person.id] = [];
    
    // สุ่มจำนวนวันหยุดรวม (ให้มีความหลากหลาย)
    const totalDayOffs = totalDayOffsNeeded + Math.floor(Math.random() * 3); // +0 ถึง +2 วัน
    
    // สร้าง block วันหยุด
    let remainingDays = totalDayOffs;
    const blocks = [];
    
    while (remainingDays > 0) {
      const blockSize = Math.min(remainingDays, 1 + Math.floor(Math.random() * 3)); // 1-3 วัน
      blocks.push(blockSize);
      remainingDays -= blockSize;
    }
    
    // วาง block วันหยุด
    const availableDays = Array.from({ length: totalDays }, (_, i) => i);
    
    for (const blockSize of blocks) {
      if (availableDays.length < blockSize) break;
      
      // หาตำแหน่งที่เหมาะสม
      let startDay = null;
      let attempts = 0;
      const maxAttempts = 20;
      
      while (attempts < maxAttempts && availableDays.length >= blockSize) {
        const randomIndex = Math.floor(Math.random() * availableDays.length);
        const candidateStart = availableDays[randomIndex];
        
        // ตรวจสอบว่า block นี้จะไม่ overlap
        let canPlace = true;
        for (let i = 0; i < blockSize; i++) {
          const checkDay = candidateStart + i;
          if (checkDay >= totalDays || !availableDays.includes(checkDay)) {
            canPlace = false;
            break;
          }
        }
        
        if (canPlace) {
          startDay = candidateStart;
          break;
        }
        attempts++;
      }
      
      if (startDay !== null) {
        for (let i = 0; i < blockSize; i++) {
          const day = startDay + i;
          const dayIndex = availableDays.indexOf(day);
          if (dayIndex !== -1) {
            availableDays.splice(dayIndex, 1);
            dayOffSchedule[person.id].push(day);
          }
        }
      }
    }
  });
  
  // กลุ่มพิเศษไม่ต้องสร้างวันหยุดเพิ่ม เพราะจะถูกกำหนดให้หยุดเสาร์-อาทิตย์และวันหยุดนักขัตฤกษ์
  specialStaff.forEach(person => {
    dayOffSchedule[person.id] = [];
  });
  
  return dayOffSchedule;
}

// เคารพการจอง "แน่นอน" (isReserved): จัดกะหรือวันหยุดที่พยาบาลจองไว้ก่อนการจัดอัตโนมัติ
// - จอง x (หยุด) → ให้หยุดวันนั้น (กันไม่ให้ถูกจัดเวร)
// - จอง ช/บ/ด → จัดกะนั้นให้แน่นอน
function honorReservations(schedule, staffStats, currentDate, locationId, shifts, preferences) {
  const dateStr = currentDate.format("YYYY-MM-DD");
  const idToShift = {};
  shifts.forEach((s) => { idToShift[s.id] = s; });

  (preferences || [])
    .filter((p) => p.isReserved && dayjs(p.datetime).format("YYYY-MM-DD") === dateStr)
    .forEach((p) => {
      const stats = staffStats[p.userId];
      if (!stats || stats.assignedShiftsToday.length > 0) return; // จัดไปแล้ววันนี้
      const shiftObj =
        idToShift[p.shifId] ||
        (p.Shif && shifts.find((s) => s.name === p.Shif.name && !s.isOT));
      if (!shiftObj) return;
      const name = shiftObj.name;

      schedule.push({
        userId: p.userId,
        shifId: shiftObj.id,
        locationId,
        datetime: currentDate.toDate(),
        isOT: !!shiftObj.isOT,
        isOnCall: false,
        shiftType: name,
        assignedBy: "reserved",
      });

      if (["ช", "บ", "ด"].includes(name)) updateStaffStats(stats, name, currentDate);
      stats.assignedShiftsToday.push(name);
      if (["x", "R"].includes(name)) stats.totalDayOffs++;
    });
}

function assignDayOffs(schedule, staffStats, dayOffSchedule, currentDate, locationId, shifts) {
  const dayIndex = currentDate.diff(dayjs().month(currentDate.month()).year(currentDate.year()).startOf("month"), "day");
  
  // หาเวรวันหยุด (รองรับทั้งเวรเก่าและใหม่)
  const offShift = shifts.find(s => {
    const mappedName = getShiftTypeById(s.name);
    return mappedName === "x";
  });
  
  if (!offShift) {
    console.log("No OFF shift found");
    return;
  }
  
  Object.entries(dayOffSchedule).forEach(([userId, days]) => {
    // ข้ามถ้าวันนี้ถูกจัด (เช่น จองเวร/จองหยุดไว้แล้ว) เพื่อไม่ให้ซ้ำ
    if (days.includes(dayIndex) && staffStats[userId].assignedShiftsToday.length === 0) {
      schedule.push({
        userId: userId,
        shifId: offShift.id,
        locationId: locationId,
        datetime: currentDate.toDate(),
        isOT: false,
        isOnCall: false,
        assignedBy: "auto-dayoff"
      });
      
      staffStats[userId].assignedShiftsToday.push("x");
      staffStats[userId].totalDayOffs++;
      staffStats[userId].consecutiveDays = 0;
    }
  });
}

function assignSpecialWeekendOffs(schedule, staffStats, currentDate, locationId, shifts) {
  // ตรวจสอบว่าเป็นเสาร์-อาทิตย์หรือวันหยุดนักขัตฤกษ์หรือไม่
  if (!isWeekendOrHoliday(currentDate)) return;
  
  // หาเวรวันหยุด (รองรับทั้งเวรเก่าและใหม่)
  const offShift = shifts.find(s => {
    const mappedName = getShiftTypeById(s.name);
    return mappedName === "x";
  });
  
  if (!offShift) {
    console.log("No OFF shift found for special weekend offs");
    return;
  }
  
  // หาคนในกลุ่มพิเศษที่ยังไม่ได้ถูกจัดเวรในวันนี้
  Object.entries(staffStats).forEach(([userId, stats]) => {
    if (SPECIAL_ROLES.includes(stats.role) && stats.assignedShiftsToday.length === 0) {
      schedule.push({
        userId: userId,
        shifId: offShift.id,
        locationId: locationId,
        datetime: currentDate.toDate(),
        isOT: false,
        isOnCall: false,
        assignedBy: "auto-special-weekend-off"
      });
      
      stats.assignedShiftsToday.push("x");
      stats.totalDayOffs++;
      stats.weekendOffs++; // เพิ่มการนับวันหยุดเสาร์-อาทิตย์
      stats.consecutiveDays = 0;
    }
  });
}

function assignMainShifts(schedule, staffStats, currentDate, locationId, shifts, SHIFT_REQUIREMENTS, getShiftRequirements, reservationMap, violations) {
  // จัดดึก/บ่ายก่อนเช้า เพราะเวรเช้ามี OT เสริม (ช OT) อยู่แล้ว
  // ถ้าจัดเช้าก่อนจะแย่งคนจนดึก/บ่ายไม่ครบ
  const shiftTypes = ["ด", "บ", "ช"];
  
  for (const shiftType of shiftTypes) {
    // หาเวรที่ตรงกับ shiftType (รองรับทั้งเวรเก่าและใหม่)
    const shiftObj = shifts.find(s => {
      const mappedName = getShiftTypeById(s.name);
      return mappedName === shiftType;
    });
    
    if (!shiftObj) {
      console.log(`No shift found for type: ${shiftType}`);
      continue;
    }
    
    const requirements = getShiftRequirements(shiftType, currentDate);
    let assignedCount = 0;
    
    // Assign เวรหลัก
    while (assignedCount < requirements.regular) {
      const availableStaff = getAvailableStaffForShift(staffStats, shiftType, currentDate, violations);
      
      if (availableStaff.length === 0) {
        violations.push({
          type: "INSUFFICIENT_STAFF",
          shift: shiftType,
          date: currentDate.format("YYYY-MM-DD"),
          required: requirements.regular,
          assigned: assignedCount
        });
        break;
      }
      
      const selectedStaff = selectBestStaff(availableStaff, staffStats, shiftType, currentDate, reservationMap);
      
      schedule.push({
        userId: selectedStaff.id,
        shifId: shiftObj.id,
        locationId: locationId,
        datetime: currentDate.toDate(),
        isOT: false,
        isOnCall: false,
        shiftType: shiftType,
        assignedBy: "auto-main"
      });

      updateStaffStats(staffStats[selectedStaff.id], shiftType, currentDate);
      // บันทึกว่าวันนี้ทำกะนี้แล้ว เพื่อให้จัดเวร OT/ควบต่อยอดได้ และกันเวรหลักซ้ำ
      staffStats[selectedStaff.id].assignedShiftsToday.push(shiftType);
      assignedCount++;
    }
  }
}

// หา Shif object ตามชื่อกะ + สถานะ OT + สี (class)
function findShiftObj(shifts, name, { isOT = false, cls = null } = {}) {
  const matches = shifts.filter((s) => s.name === name && !!s.isOT === !!isOT);
  if (cls) {
    const byClass = matches.find((s) => s.class === cls);
    if (byClass) return byClass;
  }
  return matches[0] || null;
}

// จัดเวร OT และเวรควบตามรูปแบบจริงของ ICU (อิงเวรจริง มี.ค.–พ.ค. 2026):
//  - เช้า OT (circle-dark) ~2 คน/วันธรรมดา มักทำควบกับบ่าย → เวรควบ ช(OT)+บ (เด่นสุด)
//  - บ่าย OT (circle-red) ~1 คน/วันธรรมดา มักทำควบกับดึก → เวรควบ ด+บ(OT)
// เก็บเป็น 2 Duty แยกในวันเดียว (DB ไม่มีกะ "ช/บ"); on-call จัดแยกใน OnCallDuty จึงไม่ทำที่นี่
function assignOTAndDoubles(schedule, staffStats, currentDate, locationId, shifts) {
  const weekend = isWeekendOrHoliday(currentDate);
  const chOT = findShiftObj(shifts, "ช", { isOT: true, cls: "circle-dark" });
  const baOT = findShiftObj(shifts, "บ", { isOT: true, cls: "circle-red" });

  const pushOT = (userId, shiftObj, baseType) => {
    const stats = staffStats[userId];
    schedule.push({
      userId,
      shifId: shiftObj.id,
      locationId,
      datetime: currentDate.toDate(),
      isOT: true,
      isOnCall: false,
      shiftType: baseType,
      assignedBy: "auto-ot",
    });
    stats.shiftCounts[baseType] = (stats.shiftCounts[baseType] || 0) + 1;
    stats.totalWorkload += SHIFT_WEIGHTS[baseType]?.weight || 1;
    const becomesDouble = stats.assignedShiftsToday.length >= 1;
    stats.assignedShiftsToday.push(baseType);
    if (becomesDouble) {
      stats.doubleShiftCount++;
      stats.lastDoubleShiftDate = currentDate;
    }
  };

  // เช้า OT — ให้คนที่ทำบ่ายอยู่แล้วก่อน (เวรควบ ช(OT)+บ) แล้วจึงคนว่าง
  if (chOT) {
    const target = weekend ? 0 : 2;
    let n = 0;
    const pick = (filterFn) => {
      for (const [id, s] of Object.entries(staffStats)) {
        if (n >= target) break;
        if (SPECIAL_ROLES.includes(s.role)) continue;       // กลุ่มพิเศษไม่ทำ OT
        if (s.assignedShiftsToday.includes("ช")) continue;  // มีเช้าแล้ว
        if (s.doubleShiftCount >= SHIFT_RULES.H5.maxDoublePerMonth) continue;
        if (!filterFn(s)) continue;
        pushOT(id, chOT, "ช");
        n++;
      }
    };
    pick((s) => s.assignedShiftsToday.includes("บ")); // ควบกับบ่าย
    pick((s) => s.assignedShiftsToday.length === 0);  // คนว่าง (เช้า OT เดี่ยว)
  }

  // บ่าย OT — ให้คนที่ทำดึกอยู่แล้ว (เวรควบ ด+บ(OT)) เฉพาะวันธรรมดา
  if (baOT && !weekend) {
    const target = 1;
    let n = 0;
    for (const [id, s] of Object.entries(staffStats)) {
      if (n >= target) break;
      if (SPECIAL_ROLES.includes(s.role)) continue;
      if (s.assignedShiftsToday.includes("บ")) continue;
      if (!s.assignedShiftsToday.includes("ด")) continue;
      if (s.doubleShiftCount >= SHIFT_RULES.H5.maxDoublePerMonth) continue;
      pushOT(id, baOT, "บ");
      n++;
    }
  }
}

// เติมวันหยุด (x) ให้พนักงานที่วันนี้ยังไม่มีเวรหรือวันหยุด เพื่อให้ตารางเต็มไม่มีช่องว่าง
function fillRemainingAsOff(schedule, staffStats, currentDate, locationId, shifts) {
  const offShift = shifts.find((s) => s.name === "x");
  if (!offShift) return;
  const dateStr = currentDate.format("YYYY-MM-DD");
  Object.entries(staffStats).forEach(([userId, stats]) => {
    const hasAny = schedule.some(
      (s) => s.userId === userId && dayjs(s.datetime).format("YYYY-MM-DD") === dateStr
    );
    if (!hasAny) {
      schedule.push({
        userId,
        shifId: offShift.id,
        locationId,
        datetime: currentDate.toDate(),
        isOT: false,
        isOnCall: false,
        shiftType: "x",
        assignedBy: "auto-fill-off",
      });
      stats.totalDayOffs++;
    }
  });
}

function assignOnCallShifts(schedule, staffStats, currentDate, locationId, shifts, violations, reservationMap = {}) {
  // ใช้เฉพาะ On-Call ที่อนุญาตตาม H14
  const allowedOnCallShifts = SHIFT_RULES.H14.allowedShifts.filter(shift => 
    shift.startsWith('OC')
  );
  
  for (const shiftType of allowedOnCallShifts) {
    // หาเวร On-Call (รองรับทั้งเวรเก่าและใหม่)
    const onCallShift = shifts.find(s => {
      const mappedName = getShiftTypeById(s.name);
      return mappedName === shiftType;
    });
    
    if (!onCallShift) {
      console.log(`No On-Call shift found for type: ${shiftType}`);
      continue;
    }
    
    // Assign On-Call 1 คนต่อวัน (เฉพาะกลุ่มทั่วไป)
    const availableStaff = getAvailableStaffForOnCall(staffStats, currentDate, violations);
    
    if (availableStaff.length > 0) {
      const selectedStaff = selectBestStaff(availableStaff, staffStats, shiftType, currentDate, reservationMap);
      
      schedule.push({
        userId: selectedStaff.id,
        shifId: onCallShift.id,
        locationId: locationId,
        datetime: currentDate.toDate(),
        isOT: false,
        isOnCall: true,
        assignedBy: "auto-oncall"
      });
      
      updateStaffStats(staffStats[selectedStaff.id], shiftType, currentDate);
    }
  }
}

function getAvailableStaffForShift(staffStats, shiftType, currentDate, violations) {
  return Object.entries(staffStats)
    .filter(([userId, stats]) => {
      // ตรวจสอบข้อจำกัดต่างๆ
      if (stats.assignedShiftsToday.length > 0) return false;
      if (!isEligibleForShift({ id: userId, ...stats }, shiftType)) return false;
      if (!isValidShiftAssignment(stats, shiftType, currentDate)) return false;
      return true;
    })
    .map(([userId, stats]) => ({ id: userId, ...stats }));
}

function getAvailableStaffForDoubleShift(staffStats, shiftType, currentDate, violations) {
  return Object.entries(staffStats)
    .filter(([userId, stats]) => {
      if (stats.assignedShiftsToday.length > 0) return false;
      if (SPECIAL_ROLES.includes(stats.role)) return false; // กลุ่มพิเศษไม่ทำเวรควบ
      if (stats.doubleShiftCount >= SHIFT_RULES.H5.maxDoublePerMonth) return false;
      if (stats.lastDoubleShiftDate && currentDate.diff(stats.lastDoubleShiftDate, "day") < SHIFT_RULES.H5.minDaysBetweenDouble) return false;
      if (!isValidShiftAssignment(stats, shiftType, currentDate)) return false;
      return true;
    })
    .map(([userId, stats]) => ({ id: userId, ...stats }));
}

function getAvailableStaffForOnCall(staffStats, currentDate, violations) {
  return Object.entries(staffStats)
    .filter(([userId, stats]) => {
      if (SPECIAL_ROLES.includes(stats.role)) return false; // กลุ่มพิเศษไม่ทำ On-Call
      if (stats.onCallCount >= SHIFT_RULES.H6.maxOnCallPerMonth) return false;
      if (stats.lastOnCallDate && currentDate.diff(stats.lastOnCallDate, "day") < 1) return false; // ไม่ติดกัน
      if (!isValidShiftAssignment(stats, "OC", currentDate)) return false;
      return true;
    })
    .map(([userId, stats]) => ({ id: userId, ...stats }));
}

function isValidShiftAssignment(stats, shiftType, currentDate) {
  // ตรวจสอบ H14: เวรที่อนุญาต
  if (!SHIFT_RULES.H14.allowedShifts.includes(shiftType)) {
    return false;
  }
  
  // ตรวจสอบข้อจำกัด H1-H4, H6, H9
  if (stats.lastShift && stats.lastShiftDate) {
    const daysSinceLastShift = currentDate.diff(stats.lastShiftDate, "day");
    const minRestHours = getMinRestHours(stats.lastShift);
    const minRestDays = minRestHours / 24;
    
    if (daysSinceLastShift < minRestDays) {
      return false;
    }
  }
  
  // ตรวจสอบ H4: ไม่เกิน 4 ด ภายใน 14 วัน (เฉพาะกลุ่มทั่วไป)
  if (shiftType === "ด" && !SPECIAL_ROLES.includes(stats.role) && stats.nightShiftCount >= SHIFT_RULES.H4.maxNightPer14d) {
    return false;
  }
  
  // ตรวจสอบ H7: เวรชนิดเดียวกันติดกันได้สูงสุด 2 ครั้ง
  if (stats.lastShift === shiftType && stats.consecutiveSameShift >= SHIFT_RULES.H7.maxConsecutiveSame) {
    return false;
  }
  
  // ตรวจสอบ H13: ห้ามเวรซ้ำติดกันที่ห้าม
  if (stats.lastShift && SHIFT_RULES.H13.forbiddenConsecutive.includes(`${stats.lastShift}/${shiftType}`)) {
    return false;
  }
  
  // ตรวจสอบการห้ามเวรซ้ำในวันเดียวกัน
  if (stats.assignedShiftsToday.includes(shiftType)) {
    return false;
  }
  
  // ตรวจสอบการห้ามเวรซ้ำติดกันในวันเดียวกัน (เช่น ด/ด, ช/ช, บ/บ)
  if (stats.assignedShiftsToday.some(assignedShift => {
    return SHIFT_RULES.H13.forbiddenConsecutive.includes(`${assignedShift}/${shiftType}`) ||
           SHIFT_RULES.H13.forbiddenConsecutive.includes(`${shiftType}/${assignedShift}`);
  })) {
    return false;
  }
  
  // หมายเหตุ: ไม่บังคับลำดับหมุนเวร ด→ช→บ แบบเป๊ะ (H15) เพราะเวรจริงของ ICU
  // ไม่ได้หมุนตามลำดับนั้น การบังคับทำให้กรองคนออกมากจนจัดเวรไม่ครบ
  return true;
}

function getMinRestHours(lastShift) {
  if (["MA", "NA"].includes(lastShift)) {
    return SHIFT_RULES.H2.minRestHours;
  } else if (lastShift === "OC") {
    return SHIFT_RULES.H3.minRestHours;
  } else {
    return SHIFT_RULES.H1.minRestHours;
  }
}

function selectBestStaff(availableStaff, staffStats, shiftType, currentDate, reservationMap = {}) {
  const dateStr = currentDate.format("YYYY-MM-DD");
  const reservationKey = `${dateStr}_${shiftType}`;
  
  // เรียงลำดับตามคะแนนและลำดับการหมุนเวร
  return availableStaff.sort((a, b) => {
    const aScore = calculateAssignmentScore(a, shiftType, currentDate, reservationMap, reservationKey, staffStats);
    const bScore = calculateAssignmentScore(b, shiftType, currentDate, reservationMap, reservationKey, staffStats);
    
    // ถ้าคะแนนต่างกันมาก ให้ใช้คะแนนเป็นหลัก
    if (Math.abs(aScore - bScore) > 10) {
      return bScore - aScore;
    }
    
    // ถ้าคะแนนใกล้เคียงกัน ให้พิจารณาลำดับการหมุนเวร
    const aRotationScore = calculateRotationScore(a, shiftType);
    const bRotationScore = calculateRotationScore(b, shiftType);
    
    return bRotationScore - aRotationScore;
  })[0];
}

function calculateRotationScore(staff, shiftType) {
  // คำนวณคะแนนตามลำดับการหมุนเวร ด → ช → บ
  const rotationPattern = SHIFT_RULES.H15.rotationPattern;
  const lastShift = staff.lastShift;
  
  if (!lastShift || !["ด", "ช", "บ"].includes(lastShift) || !["ด", "ช", "บ"].includes(shiftType)) {
    return 0;
  }
  
  const lastShiftIndex = rotationPattern.indexOf(lastShift);
  const currentShiftIndex = rotationPattern.indexOf(shiftType);
  const expectedNextIndex = (lastShiftIndex + 1) % rotationPattern.length;
  
  // ถ้าตามลำดับการหมุนเวร ให้คะแนนสูง
  if (currentShiftIndex === expectedNextIndex) {
    return 10;
  }
  
  // ถ้าไม่ตามลำดับ ให้คะแนนต่ำ
  return -5;
}

function calculateAssignmentScore(staff, shiftType, currentDate, reservationMap = {}, reservationKey = "", staffStats = {}) {
  let score = 0;
  
  // คะแนนพื้นฐานจากภาระงานที่ทำน้อย
  if (Object.keys(staffStats).length > 0) {
    const avgWorkload = Object.values(staffStats).reduce((sum, s) => sum + s.totalWorkload, 0) / Object.keys(staffStats).length;
    score += (avgWorkload - staff.totalWorkload) * 10;
    
    // คะแนนจากจำนวนเวรประเภทนี้ที่ทำน้อย
    const avgShiftCount = Object.values(staffStats).reduce((sum, s) => sum + (s.shiftCounts[shiftType] || 0), 0) / Object.keys(staffStats).length;
    score += (avgShiftCount - (staff.shiftCounts[shiftType] || 0)) * 5;
    
    // คะแนนจากวันหยุดที่ทำน้อย
    const avgDayOffs = Object.values(staffStats).reduce((sum, s) => sum + s.totalDayOffs, 0) / Object.keys(staffStats).length;
    score += (avgDayOffs - staff.totalDayOffs) * 3;
  }
  
  // ลดคะแนนถ้าทำงานติดต่อกันมาก
  if (staff.consecutiveDays > 0) {
    score -= staff.consecutiveDays * 2;
  }
  
  // คะแนนเพิ่มสำหรับคนที่พักนานแล้ว
  if (staff.consecutiveDays === 0) {
    score += 5;
  }
  
  // คะแนนจากความชอบการจองเวร
  if (reservationMap[reservationKey]) {
    const userReservation = reservationMap[reservationKey].find(r => r.userId === staff.id);
    if (userReservation) {
      if (userReservation.isReserved) {
        score += 50; // จองแน่นอน - ให้คะแนนสูงมาก
      } else {
        score += 20; // ความชอบ - ให้คะแนนปานกลาง
      }
      // ลดคะแนนตามลำดับความสำคัญ (priority สูง = คะแนนต่ำ)
      score -= (userReservation.priority - 1) * 5;
    }
  }
  
  // คะแนนพิเศษสำหรับกลุ่มบุคลากรพิเศษ
  if (SPECIAL_ROLES.includes(staff.role)) {
    if (shiftType === "ช") {
      score += 15; // กลุ่มพิเศษชอบเวรเช้า
    } else if (shiftType === "x") {
      score += 10; // กลุ่มพิเศษชอบวันหยุด
    }
  }
  
  // คะแนนพิเศษสำหรับวันหยุดเสาร์-อาทิตย์และวันหยุดนักขัตฤกษ์
  if (isWeekendOrHoliday(currentDate)) {
    if (shiftType === "x") {
      score += 8; // ชอบวันหยุดในวันหยุด
    } else {
      score -= 5; // ไม่ชอบทำงานในวันหยุด
    }
  }
  
  // คะแนนพิเศษสำหรับการหมุนเวรตามลำดับ ด → ช → บ
  const rotationPattern = SHIFT_RULES.H15.rotationPattern;
  if (staff.lastShift) {
    const lastShiftIndex = rotationPattern.indexOf(staff.lastShift);
    const currentShiftIndex = rotationPattern.indexOf(shiftType);
    
    if (lastShiftIndex !== -1 && currentShiftIndex !== -1) {
      // ถ้าเวรถัดไปตามลำดับการหมุนเวร ให้คะแนนเพิ่ม
      const expectedNextIndex = (lastShiftIndex + 1) % rotationPattern.length;
      if (currentShiftIndex === expectedNextIndex) {
        score += 10; // ให้คะแนนเพิ่มสำหรับการหมุนเวรตามลำดับ
      } else {
        score -= 5; // ลดคะแนนถ้าไม่ตามลำดับ
      }
    }
  }
  
  return score;
}



function updateStaffStats(stats, shiftType, currentDate) {
  // ใช้น้ำหนักพิเศษสำหรับกลุ่มพิเศษ
  const weight = getShiftWeight({ id: stats.id, ...stats }, shiftType);
  stats.totalWorkload += weight;
  
  // ใช้ shiftType ที่ถูกต้อง (อาจเป็นชื่อเวรเก่าหรือใหม่)
  const mappedShiftType = getShiftTypeById(shiftType) || shiftType;
  
  stats.shiftCounts[mappedShiftType]++;
  stats.lastShift = mappedShiftType;
  stats.lastShiftDate = currentDate;
  
  if (shiftType !== "x") {
    stats.consecutiveDays++;
  } else {
    stats.consecutiveDays = 0;
  }
  
  if (["ช/บ", "ด/บ", "OCช/บ", "ช/OCบ", "OCด/บ", "ด/OCบ"].includes(shiftType)) {
    stats.doubleShiftCount++;
    stats.lastDoubleShiftDate = currentDate;
  }
  
  if (["OCด", "OCช", "OCบ"].includes(shiftType)) {
    stats.onCallCount++;
    stats.lastOnCallDate = currentDate;
  }
  
  if (shiftType === "ด") {
    stats.nightShiftCount++;
  }
  
  if (stats.lastShift === shiftType) {
    stats.consecutiveSameShift++;
  } else {
    stats.consecutiveSameShift = 1;
  }
}

function resolveConflicts(schedule, staffStats, currentDate, violations, shifts = []) {
  const dateStr = currentDate.format("YYYY-MM-DD");

  // map ObjectId ของกะ → ชื่อกะ (ช/บ/ด/x) เพื่อระบุชนิดเวรของ schedule item ได้ถูกต้อง
  // (getShiftTypeById คืน null เมื่อรับ ObjectId)
  const idToType = {};
  shifts.forEach((s) => { idToType[s.id] = s.name; });
  const typeOf = (item) => item.shiftType || idToType[item.shifId] || getShiftTypeById(item.shifId);

  // ตรวจสอบการขัดแย้งของเวรในวันเดียวกัน
  const dailyShifts = schedule.filter(s =>
    dayjs(s.datetime).format("YYYY-MM-DD") === dateStr
  );
  
  // ตรวจสอบพนักงานที่ถูกจัดเวรซ้ำในวันเดียวกัน
  const userShiftsToday = {};
  dailyShifts.forEach(shift => {
    if (!userShiftsToday[shift.userId]) {
      userShiftsToday[shift.userId] = [];
    }
    userShiftsToday[shift.userId].push(shift);
  });
  
  // แก้ไขการขัดแย้ง
  Object.entries(userShiftsToday).forEach(([userId, shifts]) => {
    if (shifts.length > 1) {
      // ตรวจสอบเวรที่ไม่อนุญาตตาม H14
      shifts.forEach(shift => {
        const shiftType = typeOf(shift);
        if (!SHIFT_RULES.H14.allowedShifts.includes(shiftType)) {
          violations.push({
            type: "FORBIDDEN_SHIFT",
            shift: shiftType,
            date: dateStr,
            userId: userId,
            description: `เวร ${shiftType} ไม่อนุญาตตามเงื่อนไข H14`
          });
          
          // ลบเวรที่ไม่อนุญาต
          const removeIndex = schedule.findIndex(s => 
            s.userId === shift.userId && 
            s.datetime.getTime() === shift.datetime.getTime() &&
            s.shifId === shift.shifId
          );
          if (removeIndex !== -1) {
            schedule.splice(removeIndex, 1);
          }
        }
      });
      
      // ตรวจสอบเวรซ้ำติดกันที่ห้าม
      const forbiddenPairs = [];
      for (let i = 0; i < shifts.length; i++) {
        for (let j = i + 1; j < shifts.length; j++) {
          const shift1Type = typeOf(shifts[i]);
          const shift2Type = typeOf(shifts[j]);
          
          if (SHIFT_RULES.H13.forbiddenConsecutive.includes(`${shift1Type}/${shift2Type}`) ||
              SHIFT_RULES.H13.forbiddenConsecutive.includes(`${shift2Type}/${shift1Type}`)) {
            forbiddenPairs.push([shifts[i], shifts[j]]);
          }
        }
      }
      
      // ลบเวรที่ขัดแย้งกับเงื่อนไขห้ามเวรซ้ำติดกัน
      forbiddenPairs.forEach(([shift1, shift2]) => {
        const shift1Type = typeOf(shift1);
        const shift2Type = typeOf(shift2);
        
        violations.push({
          type: "FORBIDDEN_CONSECUTIVE",
          shift1: shift1Type,
          shift2: shift2Type,
          date: dateStr,
          userId: userId,
          description: `เวร ${shift1Type} และ ${shift2Type} ห้ามติดกันตามเงื่อนไข H13`
        });
        
        // ลบเวรที่มีน้ำหนักต่ำกว่า
        const shift1Weight = SHIFT_WEIGHTS[shift1Type]?.weight || 0;
        const shift2Weight = SHIFT_WEIGHTS[shift2Type]?.weight || 0;
        const shiftToRemove = shift1Weight < shift2Weight ? shift1 : shift2;
        
        const removeIndex = schedule.findIndex(s => 
          s.userId === shiftToRemove.userId && 
          s.datetime.getTime() === shiftToRemove.datetime.getTime() &&
          s.shifId === shiftToRemove.shifId
        );
        
        if (removeIndex !== -1) {
          schedule.splice(removeIndex, 1);
          
          // อัพเดทสถิติ
          const stats = staffStats[userId];
          if (stats) {
            const shiftType = typeOf(shiftToRemove);
            if (shiftType) {
              stats.shiftCounts[shiftType] = Math.max(0, stats.shiftCounts[shiftType] - 1);
              stats.totalWorkload -= getShiftWeight({ id: userId, ...stats }, shiftType);
              // ลบออกจาก assignedShiftsToday
              const todayIndex = stats.assignedShiftsToday.indexOf(shiftType);
              if (todayIndex !== -1) {
                stats.assignedShiftsToday.splice(todayIndex, 1);
              }
            }
          }
          
          violations.push({
            type: "FORBIDDEN_CONSECUTIVE_REMOVED",
            userId: userId,
            date: dateStr,
            removedShift: shiftToRemove.shifId,
            reason: `Forbidden consecutive shift: ${typeOf(shift1)}/${typeOf(shift2)}`
          });
        }
      });
      
      // ถ้ายังมีเวรมากกว่า 1 เวรในวันเดียวกัน ให้เก็บเวรที่มีน้ำหนักสูงสุด
      const remainingShifts = schedule.filter(s => 
        s.userId === userId && 
        dayjs(s.datetime).format("YYYY-MM-DD") === dateStr
      );
      
      // เวรควบที่ถูกต้องตามเวรจริง (ช+บ หรือ ด+บ) ไม่ต้องลบ
      const baseTypes = [...new Set(remainingShifts.map(typeOf))].sort();
      const pairKey = baseTypes.join("+");
      const isAllowedDouble = remainingShifts.length === 2 && (pairKey === "ช+บ" || pairKey === "ด+บ");

      if (remainingShifts.length > 1 && !isAllowedDouble) {
        const sortedShifts = remainingShifts.sort((a, b) => {
          const aWeight = SHIFT_WEIGHTS[typeOf(a)]?.weight || 0;
          const bWeight = SHIFT_WEIGHTS[typeOf(b)]?.weight || 0;
          return bWeight - aWeight;
        });

        // ลบเวรที่มีน้ำหนักต่ำกว่า
        for (let i = 1; i < sortedShifts.length; i++) {
          const shiftToRemove = sortedShifts[i];
          const removeIndex = schedule.findIndex(s => 
            s.userId === shiftToRemove.userId && 
            s.datetime.getTime() === shiftToRemove.datetime.getTime() &&
            s.shifId === shiftToRemove.shifId
          );
          
          if (removeIndex !== -1) {
            schedule.splice(removeIndex, 1);
            
            // อัพเดทสถิติ
            const stats = staffStats[userId];
            if (stats) {
              const shiftType = typeOf(shiftToRemove);
              if (shiftType) {
                stats.shiftCounts[shiftType] = Math.max(0, stats.shiftCounts[shiftType] - 1);
                stats.totalWorkload -= getShiftWeight({ id: userId, ...stats }, shiftType);
                // ลบออกจาก assignedShiftsToday
                const todayIndex = stats.assignedShiftsToday.indexOf(shiftType);
                if (todayIndex !== -1) {
                  stats.assignedShiftsToday.splice(todayIndex, 1);
                }
              }
            }
            
            violations.push({
              type: "DUPLICATE_SHIFT_REMOVED",
              userId: userId,
              date: dateStr,
              removedShift: shiftToRemove.shifId,
              reason: "Duplicate shift assignment on same day"
            });
          }
        }
      }
    }
  });
  
  // หมายเหตุ: ไม่ตรวจ rest ซ้ำที่นี่ เพราะ isValidShiftAssignment เช็กเวลาพัก
  // ตั้งแต่ตอน assign แล้ว (ตอนนั้น lastShiftDate ยังเป็นเวรก่อนหน้า เทียบได้ถูกต้อง)
  // เดิมโค้ดส่วนนี้รัน "หลัง" updateStaffStats ทำให้ lastShiftDate = วันนี้
  // → daysSinceLastShift = 0 < minRestDays → ลบเวรที่เพิ่งจัดทิ้งทุกอัน เหลือแต่ off

  // ไม่รายงาน ROTATION_VIOLATION แล้ว (ด→ช→บ ไม่ใช่กฎที่เวรจริงทำตาม จึงเป็น noise)
}

// ฟังก์ชันช่วยสำหรับการแปลง shift ID เป็นชื่อเวร
function getShiftTypeById(shifId) {
  // สร้าง mapping สำหรับเวรเก่าและใหม่
  const shiftMapping = {
    // เวรใหม่ (ระบบ 2 กะ + On-Call)
    "M": "ช", // เช้า
    "A": "บ", // บ่าย
    "N": "ด", // ดึก
    "MA": "ช/บ", // เช้า+บ่าย
    "NA": "ด/บ", // ดึก+บ่าย
    "OC": "OCช", // On-Call (default to morning)
    "OFF": "x", // วันหยุด
    
    // เวรเก่า (ระบบ 3 กะ) - เฉพาะที่อนุญาตตาม H14
    "ช": "ช", // เช้า
    "บ": "บ", // บ่าย
    "ด": "ด", // ดึก
    "ช/บ": "ช/บ", // เช้า+บ่าย
    "ด/บ": "ด/บ", // ดึก+บ่าย
    "OCช/บ": "OCช/บ", // On-Call เช้า+บ่าย
    "ช/OCบ": "ช/OCบ", // เช้า+On-Call บ่าย
    "OCด/บ": "OCด/บ", // On-Call ดึก+บ่าย
    "ด/OCบ": "ด/OCบ", // ดึก+On-Call บ่าย
    "OCด": "OCด", // On-Call ดึก
    "OCช": "OCช", // On-Call เช้า
    "OCบ": "OCบ", // On-Call บ่าย
    "x": "x" // วันหยุด
    
    // ไม่รวม "ชด" เพราะไม่อนุญาตตาม H14
  };
  
  // ถ้า shifId เป็น string ที่มีชื่อเวร
  if (typeof shifId === "string") {
    // ตรวจสอบว่าเป็นชื่อเวรโดยตรงหรือไม่
    if (shiftMapping[shifId]) {
      return shiftMapping[shifId];
    }
    
    // ตรวจสอบว่าเป็น ID ที่มีชื่อเวรหรือไม่
    for (const [shiftName, mappedName] of Object.entries(shiftMapping)) {
      if (shifId.includes(shiftName)) {
        return mappedName;
      }
    }
  }
  
  return null;
}

function calculateObjectiveScore(staffStats, violations) {
  let score = 0;
  
  // คำนวณสมดุลงาน
  const workloads = Object.values(staffStats).map(s => s.totalWorkload);
  const avgWorkload = workloads.reduce((sum, w) => sum + w, 0) / workloads.length;
  const workBalancePenalty = workloads.reduce((sum, w) => sum + Math.abs(w - avgWorkload), 0);
  score += workBalancePenalty * OBJECTIVE_WEIGHTS.workBalance;
  
  // คำนวณสมดุลวันหยุด
  const dayOffs = Object.values(staffStats).map(s => s.totalDayOffs);
  const avgDayOffs = dayOffs.reduce((sum, d) => sum + d, 0) / dayOffs.length;
  const dayOffBalancePenalty = dayOffs.reduce((sum, d) => sum + Math.abs(d - avgDayOffs), 0);
  score += dayOffBalancePenalty * OBJECTIVE_WEIGHTS.dayOffBalance;
  
  // คำนวณเวรควบเกินโควตา
  const doubleShiftExcess = Object.values(staffStats).reduce((sum, s) => {
    return sum + Math.max(0, s.doubleShiftCount - SHIFT_RULES.H5.maxDoublePerMonth);
  }, 0);
  score += doubleShiftExcess * OBJECTIVE_WEIGHTS.doubleShiftExcess;
  
  // คำนวณ On-Call เกินโควตา
  const onCallExcess = Object.values(staffStats).reduce((sum, s) => {
    return sum + Math.max(0, s.onCallCount - SHIFT_RULES.H6.maxOnCallPerMonth);
  }, 0);
  score += onCallExcess * OBJECTIVE_WEIGHTS.onCallExcess;
  
  // คำนวณเวรซ้ำติดเกิน 2 ครั้ง
  const consecutiveExcess = Object.values(staffStats).reduce((sum, s) => {
    return sum + Math.max(0, s.consecutiveSameShift - SHIFT_RULES.H7.maxConsecutiveSame);
  }, 0);
  score += consecutiveExcess * OBJECTIVE_WEIGHTS.consecutiveExcess;
  
  return score;
}

function calculateWorkBalance(staffStats) {
  const workloads = Object.values(staffStats).map(s => s.totalWorkload);
  const avgWorkload = workloads.reduce((sum, w) => sum + w, 0) / workloads.length;
  const maxDeviation = Math.max(...workloads.map(w => Math.abs(w - avgWorkload)));
  
  return {
    average: avgWorkload,
    maxDeviation: maxDeviation,
    isBalanced: maxDeviation <= 1.0
  };
}

function calculateDayOffBalance(staffStats) {
  const dayOffs = Object.values(staffStats).map(s => s.totalDayOffs);
  const avgDayOffs = dayOffs.reduce((sum, d) => sum + d, 0) / dayOffs.length;
  const maxDeviation = Math.max(...dayOffs.map(d => Math.abs(d - avgDayOffs)));
  
  return {
    average: avgDayOffs,
    maxDeviation: maxDeviation,
    isBalanced: maxDeviation <= 1
  };
}

function calculateSpecialWorkBalance(staffStats, specialStaff) {
  if (specialStaff.length === 0) {
    return { average: 0, maxDeviation: 0, isBalanced: true };
  }
  
  const specialWorkloads = specialStaff.map(staff => staffStats[staff.id].totalWorkload);
  const avgWorkload = specialWorkloads.reduce((sum, w) => sum + w, 0) / specialWorkloads.length;
  const maxDeviation = Math.max(...specialWorkloads.map(w => Math.abs(w - avgWorkload)));
  
  return {
    average: avgWorkload,
    maxDeviation: maxDeviation,
    isBalanced: maxDeviation <= 1.0
  };
}

function calculateGeneralWeekendBalance(staffStats, normalStaff) {
  if (normalStaff.length === 0) {
    return { average: 0, maxDeviation: 0, isBalanced: true };
  }
  
  const weekendOffs = normalStaff.map(staff => staffStats[staff.id].weekendOffs);
  const avgWeekendOffs = weekendOffs.reduce((sum, w) => sum + w, 0) / weekendOffs.length;
  const maxDeviation = Math.max(...weekendOffs.map(w => Math.abs(w - avgWeekendOffs)));
  
  return {
    average: avgWeekendOffs,
    maxDeviation: maxDeviation,
    isBalanced: maxDeviation <= 1
  };
}