import { prisma } from "@/utils/prisma";
import dayjs from "dayjs";

export default async function handler(req, res) {
  const { method } = req;

  if (method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  try {
    const { locationId, month, year, weeks = 4, criteria } = req.body;

    if (!locationId || !month || !year) {
      return res.status(400).json({ error: "Location ID, month, and year are required" });
    }

    console.log(`Auto assigning staff for ${month}/${year}, ${weeks} weeks, location: ${locationId}`);

    // ดึงข้อมูลพนักงานทั้งหมด
    const allStaff = await getAllStaff(locationId);
    console.log(`Total staff found: ${allStaff.length}`);

    // ดึงประวัติการทำงาน
    const workHistory = await getWorkHistory(locationId, month, year);
    console.log(`Work history found: ${workHistory.length} records`);

    // คำนวณคะแนนความเหมาะสมของแต่ละคน
    const staffScores = calculateStaffScores(allStaff, workHistory, criteria);

    // จัดสรรบุคลากรตามคะแนน
    const assignment = assignStaffByScores(staffScores, locationId, month, year, weeks);

    res.status(200).json({
      success: true,
      assignment: assignment,
      summary: {
        totalStaff: allStaff.length,
        assignedStaff: assignment.assignedStaff.length,
        unassignedStaff: assignment.unassignedStaff.length,
        averageScore: assignment.averageScore,
        scoreDistribution: assignment.scoreDistribution
      }
    });

  } catch (error) {
    console.error("Error auto assigning staff:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      error: "Failed to auto assign staff", 
      details: error.message 
    });
  }
}

async function getAllStaff(locationId) {
  // ดึงพนักงานที่ active ทั้งหมด
  const staff = await prisma.user.findMany({
    where: {
      isActive: true
    },
    include: {
      Position: true,
      Title: true,
      UserDuty: {
        where: {
          locationId: locationId,
          isTrain: { not: true }
        }
      }
    }
  });

  return staff;
}

async function getWorkHistory(locationId, month, year) {
  const startDate = dayjs().month(month).year(year).subtract(3, "months").startOf("month");
  const endDate = dayjs().month(month).year(year).endOf("month");

  const history = await prisma.duty.findMany({
    where: {
      datetime: {
        gte: startDate.toDate(),
        lte: endDate.toDate()
      },
      locationId: locationId
    },
    include: {
      User: true,
      Shif: true
    }
  });

  return history;
}

function calculateStaffScores(staff, workHistory, criteria = {}) {
  const scores = [];

  for (const person of staff) {
    let score = 0;
    const stats = calculatePersonStats(person, workHistory);

    // 1. คะแนนจากประสบการณ์ (Experience Score)
    const experienceScore = calculateExperienceScore(person, stats);
    score += experienceScore * (criteria.experienceWeight || 0.3);

    // 2. คะแนนจากความพร้อม (Availability Score)
    const availabilityScore = calculateAvailabilityScore(person, stats);
    score += availabilityScore * (criteria.availabilityWeight || 0.25);

    // 3. คะแนนจากสมดุลงาน (Work Balance Score)
    const workBalanceScore = calculateWorkBalanceScore(person, stats);
    score += workBalanceScore * (criteria.workBalanceWeight || 0.2);

    // 4. คะแนนจากทักษะ (Skill Score)
    const skillScore = calculateSkillScore(person, stats);
    score += skillScore * (criteria.skillWeight || 0.15);

    // 5. คะแนนจากความเหมาะสม (Fitness Score)
    const fitnessScore = calculateFitnessScore(person, stats);
    score += fitnessScore * (criteria.fitnessWeight || 0.1);

    scores.push({
      person: person,
      totalScore: score,
      breakdown: {
        experience: experienceScore,
        availability: availabilityScore,
        workBalance: workBalanceScore,
        skill: skillScore,
        fitness: fitnessScore
      },
      stats: stats
    });
  }

  // เรียงลำดับตามคะแนนจากสูงไปต่ำ
  scores.sort((a, b) => b.totalScore - a.totalScore);

  return scores;
}

function calculatePersonStats(person, workHistory) {
  const personHistory = workHistory.filter(h => h.userId === person.id);
  
  const stats = {
    totalShifts: personHistory.length,
    totalHours: 0,
    shiftTypes: {},
    consecutiveDays: 0,
    maxConsecutiveDays: 0,
    averageShiftsPerMonth: 0,
    lastWorkDate: null,
    daysSinceLastWork: 0,
    weekendShifts: 0,
    holidayShifts: 0,
    nightShifts: 0,
    onCallShifts: 0,
    doubleShifts: 0
  };

  // คำนวณสถิติต่างๆ
  for (const record of personHistory) {
    const shiftName = record.Shif?.name;
    const workDate = dayjs(record.datetime);
    
    // นับประเภทเวร
    stats.shiftTypes[shiftName] = (stats.shiftTypes[shiftName] || 0) + 1;
    
    // คำนวณชั่วโมงทำงาน
    if (shiftName === "M" || shiftName === "A" || shiftName === "N") {
      stats.totalHours += 8;
    } else if (shiftName === "MA" || shiftName === "NA") {
      stats.totalHours += 16;
    } else if (shiftName === "OC") {
      stats.totalHours += 24;
    }
    
    // ตรวจสอบเวรพิเศษ
    if (workDate.day() === 0 || workDate.day() === 6) {
      stats.weekendShifts++;
    }
    
    if (isHoliday(workDate)) {
      stats.holidayShifts++;
    }
    
    if (shiftName === "N") {
      stats.nightShifts++;
    }
    
    if (shiftName === "OC") {
      stats.onCallShifts++;
    }
    
    if (shiftName === "MA" || shiftName === "NA") {
      stats.doubleShifts++;
    }
    
    // อัพเดทวันที่ทำงานล่าสุด
    if (!stats.lastWorkDate || workDate.isAfter(stats.lastWorkDate)) {
      stats.lastWorkDate = workDate;
    }
  }
  
  // คำนวณวันเฉลี่ยต่อเดือน
  const monthsWorked = Math.max(1, dayjs().diff(dayjs().subtract(3, "months"), "month"));
  stats.averageShiftsPerMonth = stats.totalShifts / monthsWorked;
  
  // คำนวณวันที่ไม่ได้ทำงาน
  if (stats.lastWorkDate) {
    stats.daysSinceLastWork = dayjs().diff(stats.lastWorkDate, "day");
  }
  
  return stats;
}

function calculateExperienceScore(person, stats) {
  let score = 0;
  
  // คะแนนจากตำแหน่ง
  if (person.isChief) {
    score += 10;
  } else if (person.isElderly) {
    score += 8;
  } else {
    score += 5;
  }
  
  // คะแนนจากประสบการณ์การทำงาน
  score += Math.min(10, stats.totalShifts / 10);
  
  // คะแนนจากความหลากหลายของเวร
  const shiftTypeCount = Object.keys(stats.shiftTypes).length;
  score += Math.min(5, shiftTypeCount * 2);
  
  return Math.min(25, score);
}

function calculateAvailabilityScore(person, stats) {
  let score = 0;
  
  // คะแนนจากความพร้อม (ไม่ทำงานติดต่อกันมากเกินไป)
  if (stats.maxConsecutiveDays <= 5) {
    score += 10;
  } else if (stats.maxConsecutiveDays <= 7) {
    score += 5;
  }
  
  // คะแนนจากความสม่ำเสมอ
  const consistencyScore = Math.min(10, (stats.averageShiftsPerMonth / 20) * 10);
  score += consistencyScore;
  
  // คะแนนจากความยืดหยุ่น (ทำงานวันหยุด/เสาร์อาทิตย์)
  score += Math.min(5, (stats.weekendShifts + stats.holidayShifts) / 5);
  
  return Math.min(25, score);
}

function calculateWorkBalanceScore(person, stats) {
  let score = 0;
  
  // คะแนนจากสมดุลงาน (ไม่ทำงานหนักเกินไป)
  const averageShiftsPerMonth = stats.averageShiftsPerMonth;
  if (averageShiftsPerMonth >= 15 && averageShiftsPerMonth <= 25) {
    score += 10;
  } else if (averageShiftsPerMonth >= 10 && averageShiftsPerMonth <= 30) {
    score += 5;
  }
  
  // คะแนนจากความสมดุลของประเภทเวร
  const nightShiftRatio = stats.nightShifts / Math.max(1, stats.totalShifts);
  if (nightShiftRatio >= 0.2 && nightShiftRatio <= 0.4) {
    score += 5;
  }
  
  const onCallRatio = stats.onCallShifts / Math.max(1, stats.totalShifts);
  if (onCallRatio >= 0.1 && onCallRatio <= 0.3) {
    score += 5;
  }
  
  return Math.min(20, score);
}

function calculateSkillScore(person, stats) {
  let score = 0;
  
  // คะแนนจากทักษะการทำงานเวรหนัก
  if (stats.nightShifts > 0) {
    score += Math.min(5, stats.nightShifts / 2);
  }
  
  if (stats.onCallShifts > 0) {
    score += Math.min(5, stats.onCallShifts / 2);
  }
  
  if (stats.doubleShifts > 0) {
    score += Math.min(5, stats.doubleShifts);
  }
  
  // คะแนนจากความหลากหลายของประสบการณ์
  const shiftVariety = Object.keys(stats.shiftTypes).length;
  score += Math.min(5, shiftVariety);
  
  return Math.min(20, score);
}

function calculateFitnessScore(person, stats) {
  let score = 0;
  
  // คะแนนจากความเหมาะสมทางกายภาพ
  if (person.isPregnant) {
    score += 15; // ให้คะแนนสูงสำหรับคนท้อง
  } else if (person.isElderly) {
    score += 10; // ให้คะแนนสูงสำหรับผู้สูงอายุ
  } else {
    score += 5;
  }
  
  // คะแนนจากความพร้อม (ไม่ได้ทำงานนานเกินไป)
  if (stats.daysSinceLastWork <= 7) {
    score += 5;
  } else if (stats.daysSinceLastWork <= 14) {
    score += 3;
  }
  
  return Math.min(20, score);
}

function assignStaffByScores(staffScores, locationId, month, year, weeks) {
  const assignedStaff = [];
  const unassignedStaff = [];
  
  // คำนวณจำนวนพนักงานที่ต้องการ
  const totalDays = weeks * 7;
  const requiredStaff = Math.ceil(totalDays * 0.8); // 80% ของวันทั้งหมด
  
  // จัดสรรพนักงานตามคะแนน
  for (let i = 0; i < staffScores.length; i++) {
    const staffScore = staffScores[i];
    
    if (i < requiredStaff) {
      assignedStaff.push({
        ...staffScore,
        assignmentReason: "High score",
        priority: i + 1
      });
    } else {
      unassignedStaff.push({
        ...staffScore,
        assignmentReason: "Lower score",
        priority: i + 1
      });
    }
  }
  
  // คำนวณสถิติ
  const totalScores = staffScores.map(s => s.totalScore);
  const averageScore = totalScores.reduce((sum, score) => sum + score, 0) / totalScores.length;
  
  // จัดกลุ่มคะแนน
  const scoreDistribution = {
    excellent: totalScores.filter(s => s >= 20).length,
    good: totalScores.filter(s => s >= 15 && s < 20).length,
    fair: totalScores.filter(s => s >= 10 && s < 15).length,
    poor: totalScores.filter(s => s < 10).length
  };
  
  return {
    assignedStaff,
    unassignedStaff,
    averageScore,
    scoreDistribution,
    totalRequired: requiredStaff,
    totalAvailable: staffScores.length
  };
}

function isHoliday(date) {
  const holidays = [
    "2025-01-01", "2025-02-12", "2025-04-07", "2025-04-13", "2025-04-14", "2025-04-15", "2025-04-16",
    "2025-05-01", "2025-05-05", "2025-05-09", "2025-05-12", "2025-06-02", "2025-06-03", "2025-06-09",
    "2025-07-10", "2025-07-11", "2025-07-28", "2025-08-11", "2025-08-12", "2025-10-13", "2025-10-23",
    "2025-12-05", "2025-12-10", "2025-12-31"
  ];
  
  return holidays.includes(date.format("YYYY-MM-DD"));
}