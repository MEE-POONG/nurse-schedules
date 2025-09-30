// Diagnostic script for Auto-Schedule System
// This script helps identify issues with the nurse scheduling system

const BASE_URL = 'http://localhost:6040/api';

// Helper function for API calls
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

// 1. Check database connectivity and basic data
async function checkDatabaseHealth() {
  console.log('=== ตรวจสอบสุขภาพฐานข้อมูล ===');
  
  try {
    // Check if we can connect to the database
    const users = await callAPI('/user');
    console.log(`✅ พบผู้ใช้ทั้งหมด: ${users.length} คน`);
    
    const activeUsers = users.filter(u => u.isActive);
    console.log(`✅ ผู้ใช้ที่ใช้งานอยู่: ${activeUsers.length} คน`);
    
    // Check special staff
    const chiefs = users.filter(u => u.isChief);
    const pregnant = users.filter(u => u.isPregnant);
    const elderly = users.filter(u => u.isElderly);
    
    console.log(`✅ หัวหน้า (HD): ${chiefs.length} คน`);
    console.log(`✅ คนท้อง (PG): ${pregnant.length} คน`);
    console.log(`✅ ผู้สูงอายุ (SR): ${elderly.length} คน`);
    
    return { users, activeUsers, chiefs, pregnant, elderly };
  } catch (error) {
    console.error('❌ ไม่สามารถเชื่อมต่อฐานข้อมูลได้:', error);
    return null;
  }
}

// 2. Check shifts availability
async function checkShifts() {
  console.log('\n=== ตรวจสอบเวรที่มีอยู่ ===');
  
  try {
    const shifts = await callAPI('/shif');
    console.log(`✅ พบเวรทั้งหมด: ${shifts.length} เวร`);
    
    // Check for required shifts
    const requiredShifts = ['M', 'A', 'N', 'MA', 'NA', 'OC', 'OFF'];
    const foundShifts = [];
    
    shifts.forEach(shift => {
      console.log(`  - ${shift.name} (ID: ${shift.id.slice(-6)}) - isShif: ${shift.isShif}`);
      if (requiredShifts.includes(shift.name)) {
        foundShifts.push(shift.name);
      }
    });
    
    const missingShifts = requiredShifts.filter(s => !foundShifts.includes(s));
    if (missingShifts.length > 0) {
      console.log(`❌ เวรที่ขาดหายไป: ${missingShifts.join(', ')}`);
    } else {
      console.log('✅ พบเวรที่จำเป็นครบถ้วน');
    }
    
    return { shifts, foundShifts, missingShifts };
  } catch (error) {
    console.error('❌ ไม่สามารถดึงข้อมูลเวรได้:', error);
    return null;
  }
}

// 3. Check locations
async function checkLocations() {
  console.log('\n=== ตรวจสอบสถานที่ ===');
  
  try {
    const locations = await callAPI('/location');
    console.log(`✅ พบสถานที่ทั้งหมด: ${locations.length} แห่ง`);
    
    locations.forEach(location => {
      console.log(`  - ${location.name} (ID: ${location.id.slice(-6)})`);
    });
    
    return locations;
  } catch (error) {
    console.error('❌ ไม่สามารถดึงข้อมูลสถานที่ได้:', error);
    return null;
  }
}

// 4. Check shift preferences
async function checkShiftPreferences(month = 0, year = 2025) {
  console.log('\n=== ตรวจสอบการจองเวร ===');
  
  try {
    const preferences = await callAPI(`/shift-preference?month=${month}&year=${year}`);
    console.log(`✅ พบการจองเวร: ${preferences.length} รายการ`);
    
    if (preferences.length > 0) {
      const reserved = preferences.filter(p => p.isReserved);
      const preferences_only = preferences.filter(p => !p.isReserved);
      
      console.log(`  - จองแน่นอน: ${reserved.length} รายการ`);
      console.log(`  - ความชอบ: ${preferences_only.length} รายการ`);
    }
    
    return preferences;
  } catch (error) {
    console.error('❌ ไม่สามารถดึงข้อมูลการจองเวรได้:', error);
    return [];
  }
}

// 5. Test auto-schedule generation
async function testAutoScheduleGeneration(month = 0, year = 2025, locationId = null) {
  console.log('\n=== ทดสอบการสร้างตารางเวรอัตโนมัติ ===');
  
  try {
    const requestData = {
      month: month,
      year: year,
      locationId: locationId,
      weeks: 4
    };
    
    console.log('📤 ส่งคำขอ:', requestData);
    
    const result = await callAPI('/auto-schedule', 'POST', requestData);
    
    console.log('📥 ผลลัพธ์:');
    console.log(`  - สถานะ: ${result.success ? 'สำเร็จ' : 'ล้มเหลว'}`);
    console.log(`  - จำนวนเวรที่สร้าง: ${result.schedule?.length || 0}`);
    console.log(`  - จำนวนข้อผิดพลาด: ${result.violations?.length || 0}`);
    
    if (result.summary) {
      console.log(`  - พนักงานทั้งหมด: ${result.summary.totalStaff}`);
      console.log(`  - พนักงานพิเศษ: ${result.summary.specialStaff}`);
      console.log(`  - พนักงานทั่วไป: ${result.summary.normalStaff}`);
      console.log(`  - จำนวนวัน: ${result.summary.totalDays}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ การสร้างตารางเวรล้มเหลว:', error);
    return null;
  }
}

// 6. Check configuration
async function checkConfiguration(locationId = null) {
  console.log('\n=== ตรวจสอบการตั้งค่า ===');
  
  try {
    const config = await callAPI(`/auto-schedule/config?locationId=${locationId || 'default'}`);
    console.log('✅ การตั้งค่าพบ:', config.success ? 'สำเร็จ' : 'ล้มเหลว');
    
    if (config.config) {
      console.log(`  - เวรที่กำหนด: ${Object.keys(config.config.shiftWeights || {}).length} เวร`);
      console.log(`  - กฎที่กำหนด: ${Object.keys(config.config.shiftRules || {}).length} กฎ`);
      console.log(`  - กลุ่มพิเศษ: ${config.config.specialStaff?.roles?.join(', ') || 'ไม่มี'}`);
    }
    
    return config;
  } catch (error) {
    console.error('❌ ไม่สามารถดึงการตั้งค่าได้:', error);
    return null;
  }
}

// 7. Create sample data for testing
async function createSampleData() {
  console.log('\n=== สร้างข้อมูลตัวอย่าง ===');
  
  try {
    // Check if we need to create sample shifts
    const shifts = await callAPI('/shif');
    const requiredShifts = ['M', 'A', 'N', 'MA', 'NA', 'OC', 'OFF'];
    const existingShiftNames = shifts.map(s => s.name);
    const missingShifts = requiredShifts.filter(s => !existingShiftNames.includes(s));
    
    if (missingShifts.length > 0) {
      console.log(`⚠️  ต้องการสร้างเวร: ${missingShifts.join(', ')}`);
      console.log('💡 กรุณาสร้างเวรเหล่านี้ในระบบก่อนทดสอบ');
    } else {
      console.log('✅ เวรครบถ้วนแล้ว');
    }
    
    // Check if we need sample users
    const users = await callAPI('/user');
    if (users.length === 0) {
      console.log('⚠️  ไม่พบผู้ใช้ในระบบ');
      console.log('💡 กรุณาสร้างผู้ใช้อย่างน้อย 1 คนก่อนทดสอบ');
    } else {
      console.log('✅ พบผู้ใช้ในระบบแล้ว');
    }
    
    return { missingShifts, hasUsers: users.length > 0 };
  } catch (error) {
    console.error('❌ ไม่สามารถตรวจสอบข้อมูลตัวอย่างได้:', error);
    return null;
  }
}

// 8. Run comprehensive diagnosis
async function runDiagnosis() {
  console.log('🔍 เริ่มการวินิจฉัยระบบจัดตารางเวรอัตโนมัติ\n');
  
  const results = {};
  
  // Step 1: Database health
  results.dbHealth = await checkDatabaseHealth();
  
  // Step 2: Shifts
  results.shifts = await checkShifts();
  
  // Step 3: Locations
  results.locations = await checkLocations();
  
  // Step 4: Configuration
  results.config = await checkConfiguration();
  
  // Step 5: Sample data
  results.sampleData = await createSampleData();
  
  // Step 6: Shift preferences
  results.preferences = await checkShiftPreferences();
  
  // Step 7: Test generation (only if we have basic data)
  if (results.dbHealth && results.shifts && results.shifts.shifts.length > 0) {
    results.generation = await testAutoScheduleGeneration();
  }
  
  // Summary
  console.log('\n=== สรุปผลการวินิจฉัย ===');
  
  const issues = [];
  const recommendations = [];
  
  if (!results.dbHealth) {
    issues.push('❌ ไม่สามารถเชื่อมต่อฐานข้อมูลได้');
    recommendations.push('ตรวจสอบการเชื่อมต่อฐานข้อมูลและ DATABASE_URL');
  }
  
  if (!results.shifts || results.shifts.missingShifts.length > 0) {
    issues.push('❌ เวรไม่ครบถ้วน');
    recommendations.push('สร้างเวรที่ขาดหายไป: ' + results.shifts?.missingShifts?.join(', '));
  }
  
  if (!results.dbHealth?.activeUsers || results.dbHealth.activeUsers.length === 0) {
    issues.push('❌ ไม่มีผู้ใช้ที่ใช้งานอยู่');
    recommendations.push('สร้างผู้ใช้อย่างน้อย 1 คนและตั้งค่า isActive = true');
  }
  
  if (!results.generation || results.generation.schedule?.length === 0) {
    issues.push('❌ การสร้างตารางเวรไม่สำเร็จ');
    recommendations.push('ตรวจสอบการตั้งค่าและข้อมูลพื้นฐาน');
  }
  
  if (issues.length === 0) {
    console.log('✅ ระบบทำงานปกติ');
  } else {
    console.log('พบปัญหา:');
    issues.forEach(issue => console.log(issue));
    
    console.log('\nคำแนะนำ:');
    recommendations.forEach(rec => console.log(rec));
  }
  
  return results;
}

// Export functions for use in browser console
if (typeof window !== 'undefined') {
  window.diagnoseAutoSchedule = {
    runDiagnosis,
    checkDatabaseHealth,
    checkShifts,
    checkLocations,
    checkShiftPreferences,
    testAutoScheduleGeneration,
    checkConfiguration,
    createSampleData
  };
  
  console.log('🔧 Diagnostic functions loaded. Use window.diagnoseAutoSchedule.runDiagnosis() to start diagnosis.');
}

// Run diagnosis if this script is executed directly
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runDiagnosis,
    checkDatabaseHealth,
    checkShifts,
    checkLocations,
    checkShiftPreferences,
    testAutoScheduleGeneration,
    checkConfiguration,
    createSampleData
  };
} 