// ตัวอย่างการทดสอบระบบจัดตารางเวรอัตโนมัติ
// ไฟล์นี้ใช้สำหรับทดสอบ API ต่างๆ ของระบบ
// รองรับการทดสอบกลุ่มบุคลากรพิเศษ (HD, PG, SR)

const BASE_URL = 'http://localhost:6040/api';

// ฟังก์ชันช่วยสำหรับการเรียก API
async function callAPI(endpoint, method = 'GET', data = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(`API Error: ${result.error || response.statusText}`);
    }

    return result;
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error);
    throw error;
  }
}

// 1. ทดสอบการดึงการกำหนดค่า
async function testGetConfig() {
  console.log('=== ทดสอบการดึงการกำหนดค่า ===');
  
  try {
    const config = await callAPI('/auto-schedule/config?locationId=test-location');
    console.log('การกำหนดค่า:', config);
    
    // ตรวจสอบการกำหนดค่ากลุ่มบุคลากรพิเศษ
    if (config.config.specialStaff) {
      console.log('✅ การกำหนดค่ากลุ่มบุคลากรพิเศษ:', config.config.specialStaff);
    } else {
      console.log('❌ ไม่พบการกำหนดค่ากลุ่มบุคลากรพิเศษ');
    }
    
    return config;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการดึงการกำหนดค่า:', error);
  }
}

// 2. ทดสอบการอัพเดทการกำหนดค่า
async function testUpdateConfig() {
  console.log('=== ทดสอบการอัพเดทการกำหนดค่า ===');
  
  const testConfig = {
    shiftWeights: {
      "M": { weight: 1.0, hours: 8, description: "08:00–16:00" },
      "A": { weight: 1.0, hours: 8, description: "16:00–00:00" },
      "N": { weight: 1.2, hours: 8, description: "00:00–08:00" },
      "MA": { weight: 2.1, hours: 16, description: "08:00–00:00" },
      "NA": { weight: 2.3, hours: 16, description: "00:00–00:00(+1)" },
      "OC": { weight: 0.6, hours: 24, description: "สแตนด์บาย 24 ชม." },
      "OFF": { weight: 0.0, hours: 0, description: "วันหยุด" }
    },
    specialShiftWeights: {
      "HD": { "M": 1.3, description: "หัวหน้า: เวรเช้ามีน้ำหนัก 1.3" },
      "PG": { "M": 1.2, description: "คนท้อง: เวรเช้ามีน้ำหนัก 1.2" },
      "SR": { "M": 1.1, description: "ผู้สูงอายุ: เวรเช้ามีน้ำหนัก 1.1" }
    },
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
    objectiveWeights: {
      workBalance: 10,
      dayOffBalance: 10,
      doubleShiftExcess: 5,
      onCallExcess: 5,
      consecutiveExcess: 2,
      specialWorkBalance: 8,
      generalWeekendBalance: 6
    },
    shiftRequirements: {
      "M": { regular: 4, oncall: 1 },
      "A": { regular: 2, oncall: 1 },
      "N": { regular: 2, oncall: 1 }
    },
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
    general: {
      maxAttemptsPerDay: 20,
      doubleShiftProbability: 0.3,
      holidayShiftReduction: 0.7,
      enableSpecialGroups: true,
      specialGroups: ["isChief", "isPregnant", "isElderly"],
      weekendDays: [0, 6],
      holidays: [
        "2025-01-01", "2025-02-12", "2025-04-07", "2025-04-13", "2025-04-14", "2025-04-15", "2025-04-16",
        "2025-05-01", "2025-05-05", "2025-05-09", "2025-05-12", "2025-06-02", "2025-06-03", "2025-06-09",
        "2025-07-10", "2025-07-11", "2025-07-28", "2025-08-11", "2025-08-12", "2025-10-13", "2025-10-23",
        "2025-12-05", "2025-12-10", "2025-12-31"
      ]
    }
  };

  try {
    const result = await callAPI('/auto-schedule/config', 'POST', {
      locationId: 'test-location',
      config: testConfig
    });
    console.log('อัพเดทการกำหนดค่าสำเร็จ:', result);
    return result;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการอัพเดทการกำหนดค่า:', error);
  }
}

// 3. ทดสอบการจัดสรรบุคลากรอัตโนมัติ
async function testAutoAssignStaff() {
  console.log('=== ทดสอบการจัดสรรบุคลากรอัตโนมัติ ===');
  
  try {
    const result = await callAPI('/auto-assign-staff', 'POST', {
      locationId: 'test-location',
      month: 7, // สิงหาคม
      year: 2025,
      weeks: 4,
      criteria: {
        experienceWeight: 0.3,
        availabilityWeight: 0.25,
        workBalanceWeight: 0.2,
        skillWeight: 0.15,
        fitnessWeight: 0.1
      }
    });
    
    console.log('การจัดสรรบุคลากร:', result);
    console.log('จำนวนพนักงานที่จัดสรร:', result.summary.assignedStaff);
    console.log('จำนวนพนักงานที่ไม่ได้จัดสรร:', result.summary.unassignedStaff);
    console.log('คะแนนเฉลี่ย:', result.summary.averageScore);
    console.log('การกระจายคะแนน:', result.summary.scoreDistribution);
    
    return result;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการจัดสรรบุคลากร:', error);
  }
}

// 4. ทดสอบการสร้างตารางเวรอัตโนมัติ
async function testGenerateAutoSchedule() {
  console.log('=== ทดสอบการสร้างตารางเวรอัตโนมัติ ===');
  
  try {
    const result = await callAPI('/auto-schedule', 'POST', {
      month: 7, // สิงหาคม
      year: 2025,
      locationId: 'test-location',
      weeks: 4
    });
    
    console.log('สร้างตารางเวรสำเร็จ');
    console.log('จำนวนเวรทั้งหมด:', result.schedule.length);
    console.log('จำนวนพนักงาน:', result.summary.totalStaff);
    console.log('จำนวนพนักงานพิเศษ:', result.summary.specialStaff);
    console.log('จำนวนพนักงานทั่วไป:', result.summary.normalStaff);
    console.log('จำนวนวัน:', result.summary.totalDays);
    console.log('คะแนนเป้าหมาย:', result.summary.objectiveScore);
    console.log('สมดุลงาน:', result.summary.workBalance);
    console.log('สมดุลวันหยุด:', result.summary.dayOffBalance);
    console.log('สมดุลงานกลุ่มพิเศษ:', result.summary.specialWorkBalance);
    console.log('สมดุลวันหยุดเสาร์-อาทิตย์กลุ่มทั่วไป:', result.summary.generalWeekendBalance);
    
    // แสดงตัวอย่างเวร 5 รายการแรก
    console.log('ตัวอย่างเวร 5 รายการแรก:');
    result.schedule.slice(0, 5).forEach((shift, index) => {
      console.log(`${index + 1}. User: ${shift.userId}, Shift: ${shift.shifId}, Date: ${shift.datetime}, OnCall: ${shift.isOnCall}, AssignedBy: ${shift.assignedBy}`);
    });
    
    return result;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการสร้างตารางเวร:', error);
  }
}

// 5. ทดสอบการประยุกต์ใช้ตารางเวร
async function testApplySchedule(schedule) {
  console.log('=== ทดสอบการประยุกต์ใช้ตารางเวร ===');
  
  try {
    const result = await callAPI('/auto-schedule/apply', 'POST', {
      schedule: schedule,
      locationId: 'test-location',
      month: 7,
      year: 2025,
      weeks: 4
    });
    
    console.log('ประยุกต์ใช้ตารางเวรสำเร็จ');
    console.log('จำนวนรายการทั้งหมด:', result.data.summary.totalItems);
    console.log('จำนวนรายการที่ประยุกต์ใช้:', result.data.summary.applied);
    console.log('จำนวนข้อผิดพลาด:', result.data.summary.errors);
    console.log('อัตราความสำเร็จ:', result.data.summary.successRate);
    
    return result;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการประยุกต์ใช้ตารางเวร:', error);
  }
}

// 6. ทดสอบการรีเซ็ตการกำหนดค่า
async function testResetConfig() {
  console.log('=== ทดสอบการรีเซ็ตการกำหนดค่า ===');
  
  try {
    const result = await callAPI('/auto-schedule/config', 'PUT', {
      locationId: 'test-location'
    });
    
    console.log('รีเซ็ตการกำหนดค่าสำเร็จ:', result);
    return result;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการรีเซ็ตการกำหนดค่า:', error);
  }
}

// 7. ทดสอบการตรวจสอบข้อจำกัดกลุ่มบุคลากรพิเศษ
async function testSpecialStaffConstraints() {
  console.log('=== ทดสอบการตรวจสอบข้อจำกัดกลุ่มบุคลากรพิเศษ ===');
  
  try {
    const result = await callAPI('/auto-schedule', 'POST', {
      month: 7,
      year: 2025,
      locationId: 'test-location',
      weeks: 4
    });
    
    if (result.schedule && result.schedule.length > 0) {
      console.log('ตรวจสอบข้อจำกัดกลุ่มบุคลากรพิเศษ...');
      
      // ตรวจสอบว่ากลุ่มพิเศษทำได้เฉพาะเวรเช้าและวันหยุด
      const specialStaffShifts = result.schedule.filter(shift => {
        // ต้องมีข้อมูลพนักงานเพื่อตรวจสอบ role
        // ในที่นี้เราจะตรวจสอบจาก assignedBy
        return shift.assignedBy === "auto-special-weekend-off" || 
               (shift.shifId && (shift.shifId.includes("M") || shift.shifId.includes("OFF")));
      });
      
      console.log(`พบเวรของกลุ่มพิเศษ: ${specialStaffShifts.length} รายการ`);
      
      // ตรวจสอบการละเมิดข้อจำกัด
      const violations = result.summary.constraintViolations || [];
      const specialViolations = violations.filter(v => 
        v.type === "SPECIAL_STAFF_VIOLATION" || 
        v.type === "SPECIAL_WEEKEND_VIOLATION"
      );
      
      if (specialViolations.length > 0) {
        console.log('❌ พบการละเมิดข้อจำกัดกลุ่มพิเศษ:', specialViolations);
      } else {
        console.log('✅ ไม่พบการละเมิดข้อจำกัดกลุ่มพิเศษ');
      }
    }
    
    return result;
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการทดสอบข้อจำกัดกลุ่มพิเศษ:', error);
  }
}

// ฟังก์ชันทดสอบแบบครบวงจร
async function runFullTest() {
  console.log('🚀 เริ่มทดสอบระบบจัดตารางเวรอัตโนมัติ (รวมกลุ่มบุคลากรพิเศษ)');
  console.log('========================================================');
  
  try {
    // 1. ทดสอบการกำหนดค่า
    await testGetConfig();
    await testUpdateConfig();
    
    // 2. ทดสอบการจัดสรรบุคลากร
    await testAutoAssignStaff();
    
    // 3. ทดสอบการสร้างตารางเวร
    const scheduleResult = await testGenerateAutoSchedule();
    
    // 4. ทดสอบการตรวจสอบข้อจำกัดกลุ่มบุคลากรพิเศษ
    await testSpecialStaffConstraints();
    
    if (scheduleResult && scheduleResult.schedule) {
      // 5. ทดสอบการประยุกต์ใช้ตารางเวร
      await testApplySchedule(scheduleResult.schedule);
    }
    
    // 6. ทดสอบการรีเซ็ตการกำหนดค่า
    await testResetConfig();
    
    console.log('✅ การทดสอบเสร็จสิ้น');
    
  } catch (error) {
    console.error('❌ การทดสอบล้มเหลว:', error);
  }
}

// ฟังก์ชันทดสอบเฉพาะส่วน
async function testSpecificFunction(functionName) {
  console.log(`🧪 ทดสอบฟังก์ชัน: ${functionName}`);
  
  switch (functionName) {
    case 'config':
      await testGetConfig();
      break;
    case 'update-config':
      await testUpdateConfig();
      break;
    case 'assign-staff':
      await testAutoAssignStaff();
      break;
    case 'generate-schedule':
      await testGenerateAutoSchedule();
      break;
    case 'special-constraints':
      await testSpecialStaffConstraints();
      break;
    case 'reset-config':
      await testResetConfig();
      break;
    default:
      console.log('ฟังก์ชันที่รองรับ: config, update-config, assign-staff, generate-schedule, special-constraints, reset-config');
  }
}

// ฟังก์ชันสำหรับการวิเคราะห์ผลลัพธ์
function analyzeScheduleResult(result) {
  if (!result || !result.schedule) {
    console.log('ไม่มีข้อมูลตารางเวรให้วิเคราะห์');
    return;
  }
  
  console.log('📊 การวิเคราะห์ตารางเวร (รวมกลุ่มบุคลากรพิเศษ)');
  console.log('==============================================');
  
  const schedule = result.schedule;
  
  // นับประเภทเวร
  const shiftCounts = {};
  const userShifts = {};
  const specialStaffShifts = {};
  const normalStaffShifts = {};
  
  schedule.forEach(shift => {
    // นับประเภทเวร
    shiftCounts[shift.shifId] = (shiftCounts[shift.shifId] || 0) + 1;
    
    // นับเวรต่อคน
    if (!userShifts[shift.userId]) {
      userShifts[shift.userId] = {
        total: 0,
        shifts: {},
        onCall: 0,
        role: null // จะต้องมีข้อมูล role จาก staffStats
      };
    }
    userShifts[shift.userId].total++;
    userShifts[shift.userId].shifts[shift.shifId] = (userShifts[shift.userId].shifts[shift.shifId] || 0) + 1;
    if (shift.isOnCall) {
      userShifts[shift.userId].onCall++;
    }
    
    // แยกกลุ่มพิเศษและกลุ่มทั่วไป
    if (shift.assignedBy === "auto-special-weekend-off") {
      if (!specialStaffShifts[shift.userId]) {
        specialStaffShifts[shift.userId] = { total: 0, shifts: {} };
      }
      specialStaffShifts[shift.userId].total++;
      specialStaffShifts[shift.userId].shifts[shift.shifId] = (specialStaffShifts[shift.userId].shifts[shift.shifId] || 0) + 1;
    } else {
      if (!normalStaffShifts[shift.userId]) {
        normalStaffShifts[shift.userId] = { total: 0, shifts: {} };
      }
      normalStaffShifts[shift.userId].total++;
      normalStaffShifts[shift.userId].shifts[shift.shifId] = (normalStaffShifts[shift.userId].shifts[shift.shifId] || 0) + 1;
    }
  });
  
  console.log('จำนวนเวรแต่ละประเภท:', shiftCounts);
  console.log('จำนวนคนที่ได้รับมอบหมาย:', Object.keys(userShifts).length);
  console.log('จำนวนคนกลุ่มพิเศษ:', Object.keys(specialStaffShifts).length);
  console.log('จำนวนคนกลุ่มทั่วไป:', Object.keys(normalStaffShifts).length);
  
  // คำนวณสถิติ
  const totalShifts = Object.values(userShifts).map(u => u.total);
  const avgShiftsPerUser = totalShifts.reduce((sum, count) => sum + count, 0) / totalShifts.length;
  const maxShiftsPerUser = Math.max(...totalShifts);
  const minShiftsPerUser = Math.min(...totalShifts);
  
  console.log('สถิติการกระจายเวร:');
  console.log(`- เฉลี่ยต่อคน: ${avgShiftsPerUser.toFixed(2)} เวร`);
  console.log(`- สูงสุดต่อคน: ${maxShiftsPerUser} เวร`);
  console.log(`- ต่ำสุดต่อคน: ${minShiftsPerUser} เวร`);
  
  // ตรวจสอบการกระจาย On-Call
  const onCallCounts = Object.values(userShifts).map(u => u.onCall);
  const avgOnCallPerUser = onCallCounts.reduce((sum, count) => sum + count, 0) / onCallCounts.length;
  console.log(`- On-Call เฉลี่ยต่อคน: ${avgOnCallPerUser.toFixed(2)} ครั้ง`);
  
  // วิเคราะห์กลุ่มพิเศษ
  if (Object.keys(specialStaffShifts).length > 0) {
    console.log('\n📋 การวิเคราะห์กลุ่มบุคลากรพิเศษ:');
    Object.entries(specialStaffShifts).forEach(([userId, stats]) => {
      console.log(`- User ${userId}: ${stats.total} เวร, ประเภท: ${Object.keys(stats.shifts).join(', ')}`);
    });
  }
  
  // ตรวจสอบการละเมิดข้อจำกัด
  if (result.summary.constraintViolations && result.summary.constraintViolations.length > 0) {
    console.log('\n⚠️ การละเมิดข้อจำกัด:');
    result.summary.constraintViolations.forEach(violation => {
      console.log(`- ${violation.type}: ${violation.description || 'ไม่ระบุรายละเอียด'}`);
    });
  }
}

// ตัวอย่างการใช้งาน
if (typeof window !== 'undefined') {
  // ถ้าใช้ใน browser
  window.testAutoSchedule = {
    runFullTest,
    testSpecificFunction,
    analyzeScheduleResult,
    testGetConfig,
    testUpdateConfig,
    testAutoAssignStaff,
    testGenerateAutoSchedule,
    testApplySchedule,
    testResetConfig,
    testSpecialStaffConstraints
  };
} else {
  // ถ้าใช้ใน Node.js
  module.exports = {
    runFullTest,
    testSpecificFunction,
    analyzeScheduleResult,
    testGetConfig,
    testUpdateConfig,
    testAutoAssignStaff,
    testGenerateAutoSchedule,
    testApplySchedule,
    testResetConfig,
    testSpecialStaffConstraints
  };
  
  // รันการทดสอบถ้าเรียกไฟล์นี้โดยตรง
  if (require.main === module) {
    runFullTest();
  }
}

console.log(`
📋 คำแนะนำการใช้งาน (รวมกลุ่มบุคลากรพิเศษ):

1. รันการทดสอบครบวงจร:
   runFullTest()

2. ทดสอบฟังก์ชันเฉพาะ:
   testSpecificFunction('config')
   testSpecificFunction('assign-staff')
   testSpecificFunction('generate-schedule')
   testSpecificFunction('special-constraints')

3. วิเคราะห์ผลลัพธ์:
   analyzeScheduleResult(result)

4. ตรวจสอบการกำหนดค่า:
   testGetConfig()

5. อัพเดทการกำหนดค่า:
   testUpdateConfig()

6. จัดสรรบุคลากร:
   testAutoAssignStaff()

7. สร้างตารางเวร:
   testGenerateAutoSchedule()

8. ตรวจสอบข้อจำกัดกลุ่มพิเศษ:
   testSpecialStaffConstraints()

9. ประยุกต์ใช้ตารางเวร:
   testApplySchedule(schedule)

10. รีเซ็ตการกำหนดค่า:
    testResetConfig()

🔍 ฟีเจอร์ใหม่ที่รองรับ:
- กลุ่มบุคลากรพิเศษ: HD (หัวหน้า), PG (คนท้อง), SR (ผู้สูงอายุ)
- ข้อจำกัดพิเศษ: เวรเช้าอย่างเดียว, หยุดเสาร์-อาทิตย์, หยุดวันหยุดนักขัตฤกษ์
- การวิเคราะห์แยกกลุ่ม: สมดุลงานกลุ่มพิเศษ, สมดุลวันหยุดเสาร์-อาทิตย์กลุ่มทั่วไป
- การตรวจสอบการละเมิดข้อจำกัดกลุ่มพิเศษ
`); 