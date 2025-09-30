// Simple script to run diagnosis for the auto-schedule system
// Run this with: node run-diagnosis.js

const { runDiagnosis } = require('./diagnose-auto-schedule.js');

async function main() {
  console.log('🚀 Starting Auto-Schedule System Diagnosis...\n');
  
  try {
    const results = await runDiagnosis();
    
    console.log('\n📊 Diagnosis Results Summary:');
    console.log('=============================');
    
    if (results.dbHealth) {
      console.log(`✅ Database: Connected (${results.dbHealth.activeUsers.length} active users)`);
    } else {
      console.log('❌ Database: Connection failed');
    }
    
    if (results.shifts) {
      console.log(`✅ Shifts: ${results.shifts.shifts.length} available`);
      if (results.shifts.missingShifts.length > 0) {
        console.log(`⚠️  Missing shifts: ${results.shifts.missingShifts.join(', ')}`);
      }
    } else {
      console.log('❌ Shifts: Failed to load');
    }
    
    if (results.locations) {
      console.log(`✅ Locations: ${results.locations.length} found`);
    } else {
      console.log('❌ Locations: Failed to load');
    }
    
    if (results.config) {
      console.log('✅ Configuration: Loaded successfully');
    } else {
      console.log('❌ Configuration: Failed to load');
    }
    
    if (results.generation) {
      console.log(`✅ Schedule Generation: ${results.generation.schedule?.length || 0} shifts created`);
    } else {
      console.log('❌ Schedule Generation: Failed or no data');
    }
    
    console.log('\n🎯 Next Steps:');
    console.log('1. If database connection failed, check your DATABASE_URL');
    console.log('2. If no users found, create at least one active user');
    console.log('3. If shifts are missing, create the required shifts (M, A, N, MA, NA, OC, OFF)');
    console.log('4. If schedule generation failed, check the console logs for specific errors');
    
  } catch (error) {
    console.error('💥 Diagnosis failed:', error);
  }
}

// Run the diagnosis
main().catch(console.error); 