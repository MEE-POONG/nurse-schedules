import { prisma } from "@/utils/prisma";
import dayjs from "dayjs";

// ข้อจำกัดการทำงาน
const CONSTRAINTS = {
  MAX_CONSECUTIVE_DAYS: 8, // เพิ่มจาก 5 เป็น 8
  MAX_SHIFTS_PER_MONTH: 30, // เพิ่มจาก 22 เป็น 30
  MAX_OT_PER_MONTH: 8,
  FORBIDDEN_CONSECUTIVE_SHIFTS: [
    ["ด", "ช"], // ไม่ให้เวรดึกตามด้วยเวรเช้า
    ["บ", "ช"]  // ไม่ให้เวรบ่ายตามด้วยเวรเช้า
  ]
};

// --- เพิ่มวันหยุดนักขัตฤกษ์ ---
const HOLIDAYS = [
  "2025-01-01", "2025-02-12", "2025-04-07", "2025-04-13", "2025-04-14", "2025-04-15", "2025-04-16",
  "2025-05-01", "2025-05-05", "2025-05-09", "2025-05-12", "2025-06-02", "2025-06-03", "2025-06-09",
  "2025-07-10", "2025-07-11", "2025-07-28", "2025-08-11", "2025-08-12", "2025-10-13", "2025-10-23",
  "2025-12-05", "2025-12-10", "2025-12-31"
];
function isHoliday(date) {
  return HOLIDAYS.includes(date.format("YYYY-MM-DD"));
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

    // ดึงข้อมูลที่จำเป็น
    const firstDay = dayjs().month(month).year(year).startOf("month");
    const lastDay = dayjs().month(month).year(year).endOf("month");
    const daysInMonth = lastDay.date();

    // ดึงรายชื่อพนักงานที่ทำงานในแผนกนี้
    const staff = await getActiveStaff(locationId, month, year);
    console.log(`Total staff found: ${staff.length}`);
    console.log(`Staff names:`, staff.map(s => `${s.firstname} ${s.lastname} (${s.isChief ? 'Chief' : s.isElderly ? 'Elderly' : 'Normal'})`));
    
    // ดึงข้อมูลการจองเวร
    const preferences = await getShiftPreferences(month, year, locationId);
    console.log(`Shift preferences found: ${preferences.length}`);
    
    // ดึงประวัติการทำงานเดือนก่อน
    const previousHistory = await getPreviousMonthHistory(month, year, locationId);
    console.log(`Previous month history found: ${previousHistory.length}`);
    
    // ดึงข้อมูลประเภทกะ
    const shifts = await getAvailableShifts();
    console.log(`Available shifts:`, shifts.map(s => s.name));

    // สร้างตารางเวรอัตโนมัติ
    const schedule = await generateAutoSchedule({
      staff,
      preferences,
      previousHistory,
      shifts,
      month,
      year,
      daysInMonth,
      locationId
    });

    res.status(200).json({
      success: true,
      schedule: schedule,
      summary: {
        totalStaff: staff.length,
        totalDays: daysInMonth,
        constraintViolations: schedule.violations || []
      }
    });

  } catch (error) {
    console.error("Error generating auto schedule:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ error: "Failed to generate automatic schedule", details: error.message });
  }
}

async function getActiveStaff(locationId, month, year) {
  const firstDay = dayjs().month(month).year(year).startOf("month");
  
  // ดึงพนักงานที่ active ทั้งหมด
  let whereClause = {
    isActive: true
  };

  // ถ้าระบุ locationId และมี UserDuty ในแผนกนั้น ให้กรองตามนั้น
  if (locationId) {
    const staffWithDuty = await prisma.user.findMany({
      where: {
        isActive: true,
        UserDuty: {
          some: {
            AND: {
              datetime: { gte: firstDay.toDate() },
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
            datetime: { gte: firstDay.toDate() },
            locationId: locationId
          }
        }
      }
    });

    // ถ้ามีพนักงานที่มี UserDuty ในแผนกนั้น ให้ใช้รายชื่อนั้น
    if (staffWithDuty.length > 0) {
      console.log(`Found ${staffWithDuty.length} active staff with duty for location ${locationId}`);
      return staffWithDuty;
    }
  }

  // ถ้าไม่ระบุ locationId หรือไม่มี UserDuty ในแผนกนั้น ให้ดึงพนักงาน active ทั้งหมด
  const allStaff = await prisma.user.findMany({
    where: whereClause,
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

  console.log(`Found ${allStaff.length} active staff total`);
  return allStaff;
}

async function getShiftPreferences(month, year, locationId) {
  const firstDay = dayjs().month(month).year(year).startOf("month");
  const lastDay = dayjs().month(month).year(year).endOf("month");

  return await prisma.shiftPreference.findMany({
    where: {
      datetime: {
        gte: firstDay.toDate(),
        lte: lastDay.toDate()
      },
      locationId: locationId
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
}

async function getPreviousMonthHistory(month, year, locationId) {
  const prevMonth = dayjs().month(month).year(year).subtract(1, "month");
  const firstDay = prevMonth.startOf("month");
  const lastDay = prevMonth.endOf("month");

  return await prisma.duty.findMany({
    where: {
      datetime: {
        gte: firstDay.toDate(),
        lte: lastDay.toDate()
      },
      locationId: locationId
    },
    include: {
      User: true,
      Shif: true
    }
  });
}

async function getAvailableShifts() {
  return await prisma.shif.findMany({
    where: {
      OR: [
        {
          isShif: true,
          name: {
            in: ["ช", "บ", "ด"]
          }
        },
        {
          name: "x"
        }
      ]
    }
  });
}

async function generateAutoSchedule({ staff, preferences, previousHistory, shifts, month, year, daysInMonth, locationId }) {
  const schedule = [];
  const violations = [];
  const staffStats = {};

  // เตรียมสถิติพนักงาน
  staff.forEach(person => {
    staffStats[person.id] = {
      totalShifts: 0,
      consecutiveDays: 0,
      lastShift: null,
      otCount: 0,
      shiftCounts: { "ช": 0, "บ": 0, "ด": 0 },
      assignedShiftsToday: [], // สำหรับตรวจสอบเวรควบ/เวร on-call
      assignedOnCallToday: false
    };
  });

  // สร้างแผนที่การจองเวร
  const reservationMap = createReservationMap(preferences);

  // กำหนดจำนวนเวรแต่ละกะ/วัน
  const SHIFT_REQUIREMENTS = {
    "ช": { regular: 4, oncall: 1 },
    "บ": { regular: 2, oncall: 1 },
    "ด": { regular: 2, oncall: 1 }
  };

  // ฟังก์ชันสำหรับดึงจำนวนเวรที่ต้องการตามวัน
  function getShiftRequirements(shiftName, currentDate) {
    const baseReq = SHIFT_REQUIREMENTS[shiftName];
    if (!baseReq) return { regular: 0, oncall: 0 };
    
    // เสาร์-อาทิตย์ และวันหยุดนักขัตฤกษ์: ช เหลือ 3 + OC1
    if ((shiftName === "ช") && ([0, 6].includes(currentDate.day()) || isHoliday(currentDate))) {
      return { regular: 3, oncall: 1 };
    }
    
    return baseReq;
  }

  // --- Assign เวร x (วันหยุด) ให้แต่ละคน 7-8 วัน/เดือน เป็น block ขนาดสุ่ม ---
  const dayOffMap = {};
  staff.forEach(person => {
    // สุ่มจำนวนวันหยุดรวม 7 หรือ 8 วัน
    const totalDayOff = 7 + (Math.random() < 0.5 ? 0 : 1);
    dayOffMap[person.id] = [];
    
    // สุ่มเลือก block ขนาดต่างๆ ที่รวมกันได้ totalDayOff วัน
    const possibleBlockSizes = [2, 3, 4, 5, 6, 7, 8];
    let remainingDays = totalDayOff;
    const selectedBlocks = [];
    
    while (remainingDays > 0) {
      // กรอง block size ที่ไม่เกินจำนวนวันที่เหลือ
      const availableSizes = possibleBlockSizes.filter(size => size <= remainingDays);
      if (availableSizes.length === 0) break;
      
      // สุ่มเลือก block size
      const blockSize = availableSizes[Math.floor(Math.random() * availableSizes.length)];
      selectedBlocks.push(blockSize);
      remainingDays -= blockSize;
    }
    
    // ถ้าเหลือวันน้อย ให้เพิ่มเป็น block เล็กๆ
    if (remainingDays > 0) {
      selectedBlocks.push(remainingDays);
    }
    
    // สุ่มเลือกวันเริ่มต้นของแต่ละ block
    const allDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    for (const blockSize of selectedBlocks) {
      if (allDays.length < blockSize) break;
      
      // หาวันเริ่มต้นที่สามารถวาง block ได้ (ไม่ overlap กับ block อื่น)
      let startDay = null;
      let attempts = 0;
      const maxAttempts = 50;
      
      while (attempts < maxAttempts) {
        const randomIndex = Math.floor(Math.random() * allDays.length);
        const candidateStart = allDays[randomIndex];
        
        // ตรวจสอบว่า block นี้จะไม่ overlap กับ block อื่น
        let canPlace = true;
        for (let i = 0; i < blockSize; i++) {
          const checkDay = candidateStart + i;
          if (checkDay > daysInMonth || !allDays.includes(checkDay)) {
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
      
      // ถ้าไม่สามารถหาตำแหน่งได้ ให้สุ่มเลือกวันที่เหลือ
      if (startDay === null) {
        for (let i = 0; i < blockSize && allDays.length > 0; i++) {
          const idx = Math.floor(Math.random() * allDays.length);
          const day = allDays.splice(idx, 1)[0];
          dayOffMap[person.id].push(day);
        }
      } else {
        // วาง block ตามปกติ
        for (let i = 0; i < blockSize; i++) {
          const day = startDay + i;
          const dayIndex = allDays.indexOf(day);
          if (dayIndex !== -1) {
            allDays.splice(dayIndex, 1);
            dayOffMap[person.id].push(day);
          }
        }
      }
    }
  });

  const MAX_ATTEMPTS = 20;
  for (let day = 1; day <= daysInMonth; day++) {
    let attempt = 0;
    let valid = false;
    let lastDaySchedule = [];
    let lastDayStats = {};
    while (!valid && attempt < MAX_ATTEMPTS) {
      // 1. ลบ assignment ของวันนั้นออกจาก schedule และ reset staffStats เฉพาะวันนั้น
      removeAssignmentsForDay(schedule, staffStats, day, month, year);
             // 2. assign เวรและ on-call ตาม logic ปกติ (copy logic เดิมสำหรับ 1 วัน)
       assignShiftsForDay({
         staff, staffStats, shifts, day, month, year, locationId, dayOffMap, schedule, reservationMap, violations, SHIFT_REQUIREMENTS, getShiftRequirements
       });
      // 3. ตรวจสอบว่าเงื่อนไขครบไหม
             valid = checkDayConstraints(schedule, staffStats, day, shifts, SHIFT_REQUIREMENTS, month, year, getShiftRequirements);
      attempt++;
      if (valid) {
        lastDaySchedule = schedule.filter(s => dayjs(s.datetime).date() === day && dayjs(s.datetime).month() === month && dayjs(s.datetime).year() === year);
        lastDayStats = Object.fromEntries(Object.entries(staffStats).map(([k, v]) => [k, { ...v }]));
      }
    }
    if (!valid) {
      // ถ้าไม่สามารถจัดให้ตรงเงื่อนไขได้ในวันนั้น ให้ใช้รอบล่าสุด (อาจละเมิด)
      // หรือ log แจ้งเตือน
      // (ไม่ต้องทำอะไรเพิ่ม เพราะ schedule, staffStats จะเป็นรอบล่าสุดอยู่แล้ว)
    }
  }

  return {
    schedule: schedule,
    violations: violations,
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

function assignShiftForDay(day, shift, staff, staffStats, reservationMap, violations, currentDate) {
  const dateStr = currentDate.format("YYYY-MM-DD");
  const reservationKey = `${dateStr}_${shift.id}`;
  const reservations = reservationMap[reservationKey] || [];

  // ตรวจสอบการจองก่อน
  const reservedStaff = reservations.find(r => r.isReserved);
  if (reservedStaff) {
    const staff_member = staff.find(s => s.id === reservedStaff.userId);
    if (staff_member && isAssignmentValid(staff_member, shift, staffStats, day, violations)) {
      return staff_member;
    }
  }

  // ตรวจสอบความชอบลำดับต่อไป
  for (const reservation of reservations.sort((a, b) => a.priority - b.priority)) {
    const staff_member = staff.find(s => s.id === reservation.userId);
    if (staff_member && isAssignmentValid(staff_member, shift, staffStats, day, violations)) {
      return staff_member;
    }
  }

  // จัดเวรแบบหมุนเวียนตามความเป็นธรรม
  const availableStaff = staff
    .filter(person => isAssignmentValid(person, shift, staffStats, day, violations))
    .sort((a, b) => {
      // เรียงตามจำนวนเวรที่ทำน้อยที่สุด
      const aStats = staffStats[a.id];
      const bStats = staffStats[b.id];
      
      // คำนวณคะแนนความเหมาะสม
      let aScore = calculateAssignmentScore(aStats, shift.name, day);
      let bScore = calculateAssignmentScore(bStats, shift.name, day);
      
      // เพิ่มคะแนนสำหรับคนที่ทำเวรนี้น้อยที่สุดในรอบนี้
      const allScores = availableStaff.map(person => {
        const stats = staffStats[person.id];
        return calculateAssignmentScore(stats, shift.name, day);
      });
      const minScore = Math.min(...allScores);
      
      if (aScore === minScore) aScore += 100;
      if (bScore === minScore) bScore += 100;
      
      return bScore - aScore; // คะแนนสูงสุดก่อน
    });

  return availableStaff[0] || null;
}

function isAssignmentValid(staff, shift, staffStats, day, violations, schedule, shifts, currentDate) {
  const stats = staffStats[staff.id];

  // ตรวจสอบการทำงานติดต่อกันเกินลิมิต (เพิ่มความยืดหยุ่น)
  if (stats.consecutiveDays >= CONSTRAINTS.MAX_CONSECUTIVE_DAYS + 5) { // เพิ่มจาก +3 เป็น +5
    violations.push({
      type: "MAX_CONSECUTIVE_DAYS",
      userId: staff.id,
      day: day,
      current: stats.consecutiveDays
    });
    // ไม่ return false เพื่อให้สามารถจัดเวรได้ในกรณีจำเป็น
    // return false;
  }

  // ตรวจสอบเวรผิดกฎระหว่างวัน
  if (schedule && shifts && currentDate) {
    const userId = staff.id;
    const prevDate = currentDate.subtract(1, "day");
    const prevShifts = schedule
      .filter(s => s.userId === userId && dayjs(s.datetime).isSame(prevDate, "day"))
      .map(s => shifts.find(shiftObj => shiftObj.id === s.shifId)?.name);
    
    // วันนี้ ด วันถัดไปห้าม ช
    if (prevShifts.includes("ด") && shift.name === "ช") return false;
    
    // วันนี้ ด วันถัดไปห้าม ชบ
    if (prevShifts.includes("ด") && (shift.name === "ช" || shift.name === "บ")) return false;
    
    // วันนี้ บ วันถัดไปห้าม ด
    if (prevShifts.includes("บ") && shift.name === "ด") return false;
    
    // วันนี้ บ วันถัดไปห้าม ดบ
    if (prevShifts.includes("บ") && (shift.name === "ด" || shift.name === "บ")) return false;
    
    // วันนี้ ชบ วันถัดไปห้าม ด
    if (prevShifts.includes("ช") && prevShifts.includes("บ") && shift.name === "ด") return false;
    
    // วันนี้ ชบ วันถัดไปห้าม ดบ
    if (prevShifts.includes("ช") && prevShifts.includes("บ") && (shift.name === "ด" || shift.name === "บ")) return false;
    
    // วันนี้ ดบ วันถัดไปห้าม ด
    if (prevShifts.includes("ด") && prevShifts.includes("บ") && shift.name === "ด") return false;
    
    // วันนี้ ดบ วันถัดไปห้าม ดบ
    if (prevShifts.includes("ด") && prevShifts.includes("บ") && (shift.name === "ด" || shift.name === "บ")) return false;
  }

  // ตรวจสอบการเวรที่ไม่ควรติดกัน (ยืดหยุ่นมากขึ้น)
  if (stats.lastShift && day > 1) {
    const forbidden = CONSTRAINTS.FORBIDDEN_CONSECUTIVE_SHIFTS.find(
      pair => pair[0] === stats.lastShift && pair[1] === shift.name
    );
    
    if (forbidden && stats.totalShifts > 5) { // ให้ละเมิดได้มากขึ้น
      violations.push({
        type: "FORBIDDEN_CONSECUTIVE",
        userId: staff.id,
        day: day,
        previous: stats.lastShift,
        current: shift.name
      });
      // ไม่ return false เพื่อให้สามารถจัดเวรได้
    }
  }

  // ตรวจสอบจำนวนเวรต่อเดือน (เพิ่มลิมิตให้มากขึ้น)
  if (stats.totalShifts >= CONSTRAINTS.MAX_SHIFTS_PER_MONTH + 8) {
    violations.push({
      type: "MAX_SHIFTS_PER_MONTH",
      userId: staff.id,
      day: day,
      current: stats.totalShifts
    });
    return false;
  }

  // ตรวจสอบ "ชบ" ไม่เกิน 3 วันติด
  if (schedule && shifts && currentDate) {
    const userId = staff.id;
    // ตรวจสอบย้อนหลัง 2 วัน
    let consecutiveChb = 0;
    for (let i = 1; i <= 2; i++) {
      const prevDate = currentDate.subtract(i, "day");
      const prevShifts = schedule
        .filter(s => s.userId === userId && dayjs(s.datetime).isSame(prevDate, "day"))
        .map(s => shifts.find(shiftObj => shiftObj.id === s.shifId)?.name);
      if (prevShifts.includes("ช") && prevShifts.includes("บ")) {
        consecutiveChb++;
      } else {
        break;
      }
    }
    // วันนี้จะกลายเป็น "ชบ" หรือไม่?
    const todayShifts = staffStats[userId].assignedShiftsToday.slice();
    if (!todayShifts.includes(shift.name) && (shift.name === "ช" || shift.name === "บ")) {
      todayShifts.push(shift.name);
    }
    if (todayShifts.includes("ช") && todayShifts.includes("บ")) {
      consecutiveChb++;
    }
    if (consecutiveChb > 3 - 1) { // ถ้า 2 วันก่อนหน้า + วันนี้ = 3 วันติด
      return false;
    }
  }

  return true;
}

function calculateAssignmentScore(stats, shiftName, day) {
  let score = 0;
  
  // คะแนนพื้นฐานจากจำนวนเวรที่ทำน้อย (ให้ความสำคัญสูงสุด)
  score += (CONSTRAINTS.MAX_SHIFTS_PER_MONTH - stats.totalShifts) * 50;
  
  // คะแนนจากจำนวนเวรประเภทนี้ที่ทำน้อย (เฉลี่ยประเภทเวร)
  score += (15 - stats.shiftCounts[shiftName]) * 20;
  
  // คะแนนจากเวรหนัก (ดึก, บ่าย) ที่ทำน้อย (เฉลี่ยเวรหนัก)
  if (shiftName === "ด" || shiftName === "บ") {
    score += (12 - stats.shiftCounts[shiftName]) * 15;
  }
  
  // ลดคะแนนถ้าทำงานติดต่อกันมาก (ป้องกันการทำงานติดต่อกันเกินไป)
  if (stats.consecutiveDays > 0) {
    score -= stats.consecutiveDays * 10;
  }
  
  // คะแนนเพิ่มสำหรับคนที่พักนานแล้ว (ให้โอกาสคนที่พักนาน)
  if (stats.consecutiveDays === 0) {
    score += 20;
  }
  
  // คะแนนเพิ่มสำหรับคนที่ยังไม่เคยทำเวรนี้เลย
  if (stats.shiftCounts[shiftName] === 0) {
    score += 30;
  }
  
  // คะแนนเพิ่มสำหรับคนที่ทำเวรนี้น้อยที่สุดในรอบนี้
  // (จะถูกปรับในส่วนที่เรียกใช้ฟังก์ชันนี้)
  
  return score;
}

function updateStaffStats(stats, shift, day) {
  stats.totalShifts++;
  stats.shiftCounts[shift.name]++;
  stats.lastShift = shift.name;
  
  // อัพเดทการทำงานติดต่อกัน
  if (shift.name !== "R" && shift.name !== "x") {
    stats.consecutiveDays++;
  } else {
    stats.consecutiveDays = 0;
  }
  
  // Debug log
  console.log(`Updated stats for shift ${shift.name}: consecutiveDays = ${stats.consecutiveDays}, totalShifts = ${stats.totalShifts}`);
}

// ฟังก์ชันช่วย
function removeAssignmentsForDay(schedule, staffStats, day, month, year) {
  // ลบ assignment ของวันนั้นออกจาก schedule
  for (let i = schedule.length - 1; i >= 0; i--) {
    const s = schedule[i];
    const d = dayjs(s.datetime);
    if (d.date() === day && d.month() === month && d.year() === year) {
      schedule.splice(i, 1);
    }
  }
  // reset assignedShiftsToday, assignedOnCallToday เฉพาะวันนั้น
  Object.values(staffStats).forEach(stats => {
    stats.assignedShiftsToday = [];
    stats.assignedOnCallToday = false;
  });
}

// checkDayConstraints: ตรวจสอบว่าในวันนั้นตรงตามเงื่อนไขทุกข้อหรือไม่ (return true/false)
function checkDayConstraints(schedule, staffStats, day, shifts, SHIFT_REQUIREMENTS, month, year, getShiftRequirements) {
  const currentDate = dayjs().month(month).year(year).date(day);
  // 1. เช็คจำนวนเวรและ on-call
  for (const shiftName of ["ช", "บ", "ด"]) {
    const shiftObj = shifts.find(s => s.name === shiftName);
    if (!shiftObj) continue;
    const requirements = getShiftRequirements(shiftName, currentDate);
    const assignedCount = schedule.filter(s =>
      dayjs(s.datetime).date() === day &&
      dayjs(s.datetime).month() === month &&
      dayjs(s.datetime).year() === year &&
      s.shifId === shiftObj.id &&
      !s.isOnCall
    ).length;
    if (assignedCount !== requirements.regular) return false;
    const assignedOnCall = schedule.filter(s =>
      dayjs(s.datetime).date() === day &&
      dayjs(s.datetime).month() === month &&
      dayjs(s.datetime).year() === year &&
      s.shifId === shiftObj.id &&
      s.isOnCall
    ).length;
    if (assignedOnCall !== requirements.oncall) return false;
  }
  // 2. เช็คไม่มีเวรผิดกฎ/ไม่มีวันว่าง/ไม่มีเวรควบผิดกฎ ฯลฯ (สามารถเพิ่มได้)
  // ... (สามารถเพิ่ม logic ตรวจสอบอื่นๆ ได้ที่นี่) ...
  return true;
}

// assignShiftsForDay: copy logic assign เวรและ on-call สำหรับ 1 วัน (เหมือนใน loop เดิม)
function assignShiftsForDay({ staff, staffStats, shifts, day, month, year, locationId, dayOffMap, schedule, reservationMap, violations, SHIFT_REQUIREMENTS, getShiftRequirements }) {
  const currentDate = dayjs().month(month).year(year).date(day);
  const dateStr = currentDate.format("YYYY-MM-DD");

  // เตรียม track การ assign เวรของแต่ละคนในวันนี้
  Object.values(staffStats).forEach(s => { 
    s.assignedShiftsToday = []; 
    s.assignedOnCallToday = false; 
  });

  // --- Assign เวร x (วันหยุด) ---
  staff.forEach(person => {
    if (person.isChief || person.isPregnant || person.isElderly) {
      // กลุ่มพิเศษ: วันหยุดคือ เสาร์, อาทิตย์, วันหยุดนักขัตฤกษ์
      if ([0, 6].includes(currentDate.day()) || isHoliday(currentDate)) {
        schedule.push({
          userId: person.id,
          shifId: shifts.find(s => s.name === "x")?.id,
          locationId: locationId,
          datetime: currentDate.toDate(),
          isOT: false,
          assignedBy: "auto"
        });
        staffStats[person.id].assignedShiftsToday.push("x");
      }
    } else {
      // คนทั่วไป: ใช้ dayOffMap ตามเดิม
      if (dayOffMap[person.id].includes(day)) {
        schedule.push({
          userId: person.id,
          shifId: shifts.find(s => s.name === "x")?.id,
          locationId: locationId,
          datetime: currentDate.toDate(),
          isOT: false,
          assignedBy: "auto"
        });
        staffStats[person.id].assignedShiftsToday.push("x");
      }
    }
  });

  // Debug: Log special group assignments
  const specialGroups = staff.filter(person => person.isChief || person.isPregnant || person.isElderly);
  console.log(`Day ${day}: Special groups (${specialGroups.length}):`, specialGroups.map(p => `${p.firstname} ${p.lastname} (${p.isChief ? 'Chief' : p.isPregnant ? 'Pregnant' : 'Elderly'})`));
  console.log(`Day ${day}: Special groups assigned shifts:`, specialGroups.map(p => staffStats[p.id].assignedShiftsToday));

  // --- Assign เวรเช้าให้กลุ่มพิเศษ (หัวหน้า/คนท้อง/ผู้สูงอายุ) เฉพาะวันจันทร์-ศุกร์ที่ไม่ใช่วันหยุดและไม่ใช่วันหยุดนักขัตฤกษ์ ---
  const morningShiftObj = shifts.find(s => s.name === "ช");
  staff.filter(person => (person.isChief || person.isPregnant || person.isElderly)).forEach(person => {
    if (
      !staffStats[person.id].assignedShiftsToday.includes("x") &&
      [1,2,3,4,5].includes(currentDate.day()) && // 1=จันทร์ ... 5=ศุกร์
      !isHoliday(currentDate)
    ) {
      schedule.push({
        userId: person.id,
        shifId: morningShiftObj?.id,
        locationId: locationId,
        datetime: currentDate.toDate(),
        isOT: false,
        assignedBy: "auto-morning-only"
      });
      staffStats[person.id].assignedShiftsToday.push("ช");
      updateStaffStats(staffStats[person.id], morningShiftObj, day);
    }
  });

  // --- Assign เวรจริง (ช, บ, ด) ตามจำนวนที่กำหนด (ไม่มี on-call) ---
  for (let round = 0; round < 3; round++) { // เพิ่มจาก 2 เป็น 3 รอบ
    for (const shiftName of ["ช", "บ", "ด"]) {
      const shiftObj = shifts.find(s => s.name === shiftName);
      if (!shiftObj) continue;
      const requirements = getShiftRequirements(shiftName, currentDate);
      const totalRequired = requirements.regular; // ไม่มี on-call
      let assignedCount = schedule.filter(s =>
        dayjs(s.datetime).isSame(currentDate, "day") &&
        s.shifId === shiftObj.id
      ).length;
      
      // ถ้าไม่สามารถหา staff ได้ ให้ลดจำนวนที่ต้องการ
      let targetRequired = totalRequired;
      if (round === 2) {
        targetRequired = Math.max(1, Math.floor(totalRequired * 0.7)); // รอบสุดท้าย: ลดจำนวนลง 30%
      }
      
      while (assignedCount < targetRequired) {
        let availableStaff = staff.filter(person => {
          const stats = staffStats[person.id];
          if (person.isChief || person.isPregnant || person.isElderly) return false;
          if (stats.assignedShiftsToday.includes("x")) return false;
          if (round === 0 && stats.assignedShiftsToday.length > 0) return false; // รอบแรก: เฉพาะคนที่ยังไม่มีเวร
          if (round === 1) {
            if (stats.assignedShiftsToday.length !== 1) return false; // รอบสอง: เฉพาะคนที่มีเวรเดียว
            const prev = stats.assignedShiftsToday[0];
            if (!((prev === "ช" && shiftName === "บ") || (prev === "ด" && shiftName === "บ"))) return false;
          }
          if (round === 2) {
            // รอบสุดท้าย: ยืดหยุ่นมากขึ้น
            if (stats.assignedShiftsToday.length >= 2) return false; // ไม่เกิน 2 เวรต่อวัน
          }
          return isAssignmentValid(person, shiftObj, staffStats, day, violations, schedule, shifts, currentDate);
        });
        
        if (availableStaff.length === 0) {
          // ถ้าไม่มี staff ที่เหมาะสม ให้ใช้ staff ที่มีอยู่ (ยกเว้นกลุ่มพิเศษ)
          availableStaff = staff.filter(person => {
            const stats = staffStats[person.id];
            if (person.isChief || person.isPregnant || person.isElderly) return false;
            if (stats.assignedShiftsToday.includes("x")) return false;
            if (stats.assignedShiftsToday.length >= 2) return false;
            return true; // ไม่ตรวจสอบ constraints อื่นๆ
          });
        }
        
        if (availableStaff.length === 0) break;
        
        const selected = availableStaff.sort((a, b) => {
          const aStats = staffStats[a.id];
          const bStats = staffStats[b.id];
          const aScore = calculateAssignmentScore(aStats, shiftName, day);
          const bScore = calculateAssignmentScore(bStats, shiftName, day);
          return bScore - aScore;
        })[0];
        
        schedule.push({
          userId: selected.id,
          shifId: shiftObj.id,
          locationId: locationId,
          datetime: currentDate.toDate(),
          isOT: false,
          assignedBy: "auto"
        });
        staffStats[selected.id].assignedShiftsToday.push(shiftName);
        updateStaffStats(staffStats[selected.id], shiftObj, day);
        assignedCount++;
      }
    }
  }

  // --- เปลี่ยนเวรจริงเป็น on-call ---
  for (const shiftName of ["ช", "บ", "ด"]) {
    const shiftObj = shifts.find(s => s.name === shiftName);
    if (!shiftObj) continue;
    // หา schedule ของเวรจริงในกะนี้วันนี้ (รวมทุกคนที่ได้เวรจริงในกะนี้)
    const realShifts = schedule.filter(s =>
      dayjs(s.datetime).isSame(currentDate, "day") &&
      s.shifId === shiftObj.id &&
      !s.isOnCall
    );
    if (realShifts.length === 0) continue;
    // สุ่มเลือก 1 คนเป็น on-call
    const selected = realShifts[Math.floor(Math.random() * realShifts.length)];
    selected.isOnCall = true;
    // ลบออกจาก assignedShiftsToday (เพื่อให้ summary ถูกต้อง)
    if (staffStats[selected.userId].assignedShiftsToday.includes(shiftName)) {
      staffStats[selected.userId].assignedShiftsToday = staffStats[selected.userId].assignedShiftsToday.filter(s => s !== shiftName);
    }
    staffStats[selected.userId].assignedOnCallToday = true;
  }
}