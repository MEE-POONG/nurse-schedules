import { prisma } from "@/utils/prisma";

// การกำหนดค่าเริ่มต้นสำหรับระบบจัดตารางเวรอัตโนมัติ
const DEFAULT_CONFIG = {
  // 1. ตารางน้ำหนักงาน (Work-load Weights)
  shiftWeights: {
    "M": { weight: 1.0, hours: 8, description: "08:00–16:00" },
    "A": { weight: 1.0, hours: 8, description: "16:00–00:00" },
    "N": { weight: 1.2, hours: 8, description: "00:00–08:00" },
    "MA": { weight: 2.1, hours: 16, description: "08:00–00:00" },
    "NA": { weight: 2.3, hours: 16, description: "00:00–00:00(+1)" },
    "OC": { weight: 0.6, hours: 24, description: "สแตนด์บาย 24 ชม." },
    "OFF": { weight: 0.0, hours: 0, description: "วันหยุด" }
  },

  // 2. น้ำหนักพิเศษสำหรับกลุ่มบุคลากรพิเศษ
  specialShiftWeights: {
    "HD": { "M": 1.3, description: "หัวหน้า: เวรเช้ามีน้ำหนัก 1.3" },
    "PG": { "M": 1.2, description: "คนท้อง: เวรเช้ามีน้ำหนัก 1.2" },
    "SR": { "M": 1.1, description: "ผู้สูงอายุ: เวรเช้ามีน้ำหนัก 1.1" }
  },

  // 3. กติกาการหมุนเวร (Shift-Rotation Rules)
  shiftRules: {
    H1: { description: "Rest หลังเวรเดี่ยว ≥ 12 ชม.", minRestHours: 12, isHard: true },
    H2: { description: "Rest หลังเวรควบ ≥ 24 ชม.", minRestHours: 24, isHard: true },
    H3: { description: "Rest หลัง On-Call ≥ 12 ชม.", minRestHours: 12, isHard: true },
    H4: { description: "ไม่เกิน 4 N ภายใน 14 วัน", maxNightPer14d: 4, isHard: true },
    H5: { description: "ไม่เกิน 2 เวรควบ/เดือน/คน และคั่น ≥ 3 วัน", maxDoublePerMonth: 2, minDaysBetweenDouble: 3, isHard: false },
    H6: { description: "ไม่เกิน 4 On-Call/เดือน/คน และห้าม OC ติด OC", maxOnCallPerMonth: 4, noConsecutiveOnCall: true, isHard: true },
    H7: { description: "เวรชนิดเดียวกันติดกันได้สูงสุด 2 ครั้ง", maxConsecutiveSame: 2, isHard: false },
    H8: { description: "ลูปหมุนมาตรฐาน: M → A → N → OC", rotationPattern: ["M", "A", "N", "OC"], isHard: false },
    H9: { description: "วันหยุด (OFF) ขั้นต่ำ 1 วันต่อ 7 วัน", minDayOffPer7d: 1, isHard: true },
    H10: { description: "ถ้า role ∈ {HD, PG, SR} → อนุญาตเฉพาะเวร M", specialMorningOnly: true, isHard: true },
    H11: { description: "ถ้า role ∈ {HD, PG, SR} และ day ∈ Weekend ∪ PublicHoliday → ต้องเป็น OFF", specialWeekendOff: true, isHard: true },
    H12: { description: "OFF เสาร์-อาทิตย์และนักขัตฤกษ์ ต้องเท่า ๆ กัน ± 1 วัน ระหว่างสมาชิกใน กลุ่มทั่วไป", generalWeekendBalance: true, isHard: false }
  },

  // 4. คะแนนเป้าหมาย (Objective Function Weights)
  objectiveWeights: {
    workBalance: 10,
    dayOffBalance: 10,
    doubleShiftExcess: 5,
    onCallExcess: 5,
    consecutiveExcess: 2,
    specialWorkBalance: 8,
    generalWeekendBalance: 6
  },

  // 5. จำนวนเวรที่ต้องการต่อวัน
  shiftRequirements: {
    "M": { regular: 4, oncall: 1 },
    "A": { regular: 2, oncall: 1 },
    "N": { regular: 2, oncall: 1 }
  },

  // 6. การตั้งค่ากลุ่มบุคลากรพิเศษ
  specialStaff: {
    roles: ["HD", "PG", "SR"],
    descriptions: {
      "HD": "หัวหน้า (Head)",
      "PG": "คนท้อง (Pregnant)",
      "SR": "ผู้สูงอายุ (Senior, ≥ 55 yr)"
    },
    constraints: {
      "HD": {
        allowedShifts: ["M", "OFF"],
        weekendOff: true,
        holidayOff: true,
        description: "• จัดเวรได้เฉพาะ เช้า (M) • OFF ทุก Sat-Sun & Public Holiday"
      },
      "PG": {
        allowedShifts: ["M", "OFF"],
        weekendOff: true,
        holidayOff: true,
        description: "• เฉพาะ เช้า (M) • OFF ทุก Sat-Sun & Public Holiday"
      },
      "SR": {
        allowedShifts: ["M", "OFF"],
        weekendOff: true,
        holidayOff: true,
        description: "• เฉพาะ เช้า (M) • OFF ทุก Sat-Sun & Public Holiday"
      }
    }
  },

  // 7. การตั้งค่าทั่วไป
  general: {
    maxAttemptsPerDay: 20,
    doubleShiftProbability: 0.3,
    holidayShiftReduction: 0.7,
    enableSpecialGroups: true,
    specialGroups: ["isChief", "isPregnant", "isElderly"],
    weekendDays: [0, 6], // 0 = อาทิตย์, 6 = เสาร์
    holidays: [
      "2025-01-01", "2025-02-12", "2025-04-07", "2025-04-13", "2025-04-14", "2025-04-15", "2025-04-16",
      "2025-05-01", "2025-05-05", "2025-05-09", "2025-05-12", "2025-06-02", "2025-06-03", "2025-06-09",
      "2025-07-10", "2025-07-11", "2025-07-28", "2025-08-11", "2025-08-12", "2025-10-13", "2025-10-23",
      "2025-12-05", "2025-12-10", "2025-12-31"
    ]
  }
};

export default async function handler(req, res) {
  const { method } = req;

  if (method === "GET") {
    return await getConfig(req, res);
  } else if (method === "POST") {
    return await updateConfig(req, res);
  } else if (method === "PUT") {
    return await resetConfig(req, res);
  } else {
    res.setHeader("Allow", ["GET", "POST", "PUT"]);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }
}

async function getConfig(req, res) {
  try {
    const { locationId } = req.query;

    // ดึงการกำหนดค่าจากฐานข้อมูล
    let config = await prisma.configuration.findFirst({
      where: {
        departmentor: locationId || "default"
      }
    });

    if (!config) {
      // ถ้าไม่มี ให้ใช้ค่าเริ่มต้น
      config = {
        id: "default",
        departmentor: locationId || "default",
        leader: "default",
        director: "default",
        autoScheduleConfig: DEFAULT_CONFIG
      };
    }

    // ถ้าไม่มี autoScheduleConfig ให้ใช้ค่าเริ่มต้น
    if (!config.autoScheduleConfig) {
      config.autoScheduleConfig = DEFAULT_CONFIG;
    }

    res.status(200).json({
      success: true,
      config: config.autoScheduleConfig,
      locationId: locationId || "default"
    });

  } catch (error) {
    console.error("Error getting config:", error);
    res.status(500).json({ 
      error: "Failed to get configuration",
      details: error.message 
    });
  }
}

async function updateConfig(req, res) {
  try {
    const { locationId, config } = req.body;

    if (!config) {
      return res.status(400).json({ error: "Configuration data is required" });
    }

    // ตรวจสอบความถูกต้องของการกำหนดค่า
    const validationResult = validateConfig(config);
    if (!validationResult.isValid) {
      return res.status(400).json({ 
        error: "Invalid configuration",
        details: validationResult.errors 
      });
    }

    // อัพเดทหรือสร้างการกำหนดค่าใหม่
    const updatedConfig = await prisma.configuration.upsert({
      where: {
        departmentor: locationId || "default"
      },
      update: {
        autoScheduleConfig: config,
        updatedAt: new Date()
      },
      create: {
        departmentor: locationId || "default",
        leader: "auto-schedule",
        director: "system",
        autoScheduleConfig: config
      }
    });

    res.status(200).json({
      success: true,
      message: "Configuration updated successfully",
      config: updatedConfig.autoScheduleConfig,
      locationId: locationId || "default"
    });

  } catch (error) {
    console.error("Error updating config:", error);
    res.status(500).json({ 
      error: "Failed to update configuration",
      details: error.message 
    });
  }
}

async function resetConfig(req, res) {
  try {
    const { locationId } = req.body;

    // รีเซ็ตการกำหนดค่าเป็นค่าเริ่มต้น
    const resetConfig = await prisma.configuration.upsert({
      where: {
        departmentor: locationId || "default"
      },
      update: {
        autoScheduleConfig: DEFAULT_CONFIG,
        updatedAt: new Date()
      },
      create: {
        departmentor: locationId || "default",
        leader: "auto-schedule",
        director: "system",
        autoScheduleConfig: DEFAULT_CONFIG
      }
    });

    res.status(200).json({
      success: true,
      message: "Configuration reset to default successfully",
      config: resetConfig.autoScheduleConfig,
      locationId: locationId || "default"
    });

  } catch (error) {
    console.error("Error resetting config:", error);
    res.status(500).json({ 
      error: "Failed to reset configuration",
      details: error.message 
    });
  }
}

function validateConfig(config) {
  const errors = [];

  // ตรวจสอบ shiftWeights
  if (!config.shiftWeights || typeof config.shiftWeights !== "object") {
    errors.push("shiftWeights must be an object");
  } else {
    const requiredShifts = ["M", "A", "N", "MA", "NA", "OC", "OFF"];
    for (const shift of requiredShifts) {
      if (!config.shiftWeights[shift]) {
        errors.push(`Missing shift weight for ${shift}`);
      } else if (typeof config.shiftWeights[shift].weight !== "number") {
        errors.push(`Invalid weight for shift ${shift}`);
      }
    }
  }

  // ตรวจสอบ specialShiftWeights
  if (!config.specialShiftWeights || typeof config.specialShiftWeights !== "object") {
    errors.push("specialShiftWeights must be an object");
  } else {
    const requiredSpecialRoles = ["HD", "PG", "SR"];
    for (const role of requiredSpecialRoles) {
      if (!config.specialShiftWeights[role]) {
        errors.push(`Missing special shift weight for role ${role}`);
      } else if (typeof config.specialShiftWeights[role]["M"] !== "number") {
        errors.push(`Invalid special weight for role ${role}`);
      }
    }
  }

  // ตรวจสอบ shiftRules
  if (!config.shiftRules || typeof config.shiftRules !== "object") {
    errors.push("shiftRules must be an object");
  } else {
    const requiredRules = ["H1", "H2", "H3", "H4", "H5", "H6", "H7", "H8", "H9", "H10", "H11", "H12"];
    for (const rule of requiredRules) {
      if (!config.shiftRules[rule]) {
        errors.push(`Missing rule ${rule}`);
      }
    }
  }

  // ตรวจสอบ objectiveWeights
  if (!config.objectiveWeights || typeof config.objectiveWeights !== "object") {
    errors.push("objectiveWeights must be an object");
  } else {
    const requiredWeights = ["workBalance", "dayOffBalance", "doubleShiftExcess", "onCallExcess", "consecutiveExcess", "specialWorkBalance", "generalWeekendBalance"];
    for (const weight of requiredWeights) {
      if (typeof config.objectiveWeights[weight] !== "number") {
        errors.push(`Invalid objective weight for ${weight}`);
      }
    }
  }

  // ตรวจสอบ shiftRequirements
  if (!config.shiftRequirements || typeof config.shiftRequirements !== "object") {
    errors.push("shiftRequirements must be an object");
  } else {
    const requiredShifts = ["M", "A", "N"];
    for (const shift of requiredShifts) {
      if (!config.shiftRequirements[shift]) {
        errors.push(`Missing shift requirement for ${shift}`);
      } else if (typeof config.shiftRequirements[shift].regular !== "number" || 
                 typeof config.shiftRequirements[shift].oncall !== "number") {
        errors.push(`Invalid shift requirement for ${shift}`);
      }
    }
  }

  // ตรวจสอบ specialStaff
  if (!config.specialStaff || typeof config.specialStaff !== "object") {
    errors.push("specialStaff must be an object");
  } else {
    if (!Array.isArray(config.specialStaff.roles)) {
      errors.push("specialStaff.roles must be an array");
    }
    if (!config.specialStaff.constraints || typeof config.specialStaff.constraints !== "object") {
      errors.push("specialStaff.constraints must be an object");
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

// API สำหรับดึงการกำหนดค่าเฉพาะส่วน
export async function getShiftWeights(locationId) {
  const config = await prisma.configuration.findFirst({
    where: { departmentor: locationId || "default" }
  });

  return config?.autoScheduleConfig?.shiftWeights || DEFAULT_CONFIG.shiftWeights;
}

export async function getSpecialShiftWeights(locationId) {
  const config = await prisma.configuration.findFirst({
    where: { departmentor: locationId || "default" }
  });

  return config?.autoScheduleConfig?.specialShiftWeights || DEFAULT_CONFIG.specialShiftWeights;
}

export async function getShiftRules(locationId) {
  const config = await prisma.configuration.findFirst({
    where: { departmentor: locationId || "default" }
  });

  return config?.autoScheduleConfig?.shiftRules || DEFAULT_CONFIG.shiftRules;
}

export async function getObjectiveWeights(locationId) {
  const config = await prisma.configuration.findFirst({
    where: { departmentor: locationId || "default" }
  });

  return config?.autoScheduleConfig?.objectiveWeights || DEFAULT_CONFIG.objectiveWeights;
}

export async function getShiftRequirements(locationId) {
  const config = await prisma.configuration.findFirst({
    where: { departmentor: locationId || "default" }
  });

  return config?.autoScheduleConfig?.shiftRequirements || DEFAULT_CONFIG.shiftRequirements;
}

export async function getSpecialStaffConfig(locationId) {
  const config = await prisma.configuration.findFirst({
    where: { departmentor: locationId || "default" }
  });

  return config?.autoScheduleConfig?.specialStaff || DEFAULT_CONFIG.specialStaff;
}

export async function getGeneralConfig(locationId) {
  const config = await prisma.configuration.findFirst({
    where: { departmentor: locationId || "default" }
  });

  return config?.autoScheduleConfig?.general || DEFAULT_CONFIG.general;
} 