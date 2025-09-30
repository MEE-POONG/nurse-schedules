# Auto-Schedule System Troubleshooting Guide

## Overview
This guide helps diagnose and fix issues with the nurse scheduling system when it shows 0 results.

## Quick Diagnosis

### 1. Run the Diagnostic Script
```bash
node run-diagnosis.js
```

This will check:
- Database connectivity
- Available users and staff
- Shift availability
- Configuration settings
- Schedule generation capability

### 2. Browser Console Diagnosis
Open your browser's developer console and run:
```javascript
// Load the diagnostic script
const script = document.createElement('script');
script.src = '/diagnose-auto-schedule.js';
document.head.appendChild(script);

// Run diagnosis after script loads
script.onload = () => {
  window.diagnoseAutoSchedule.runDiagnosis();
};
```

## Common Issues and Solutions

### Issue 1: No Staff Found
**Symptoms:** "Total staff found: 0" in console logs

**Solutions:**
1. **Check if users exist:**
   ```sql
   -- Check all users
   SELECT * FROM User WHERE isActive = true;
   ```

2. **Create a test user:**
   ```javascript
   // Via API or database
   {
     "firstname": "Test",
     "lastname": "User",
     "isActive": true,
     "isAdmin": true,
     "positionId": "your-position-id",
     "titleId": "your-title-id"
   }
   ```

3. **Check location filtering:**
   - If `locationId` is provided, ensure users are assigned to that location
   - Try without `locationId` to use all active users

### Issue 2: No Shifts Available
**Symptoms:** "Available shifts: 0" in console logs

**Solutions:**
1. **Check existing shifts:**
   ```sql
   SELECT * FROM Shif;
   ```

2. **Create required shifts:**
   ```javascript
   // Required shifts for the system
   const requiredShifts = [
     { name: "M", isShif: true, description: "Morning Shift" },
     { name: "A", isShif: true, description: "Afternoon Shift" },
     { name: "N", isShif: true, description: "Night Shift" },
     { name: "MA", isShif: true, description: "Morning + Afternoon" },
     { name: "NA", isShif: true, description: "Night + Afternoon" },
     { name: "OC", isShif: true, description: "On-Call" },
     { name: "OFF", isShif: false, isDayOff: true, description: "Day Off" }
   ];
   ```

3. **Check shift mapping:**
   - The system maps shift names to internal codes
   - Ensure shift names match the expected format

### Issue 3: Database Connection Issues
**Symptoms:** "Error getting active staff" or connection timeouts

**Solutions:**
1. **Check DATABASE_URL:**
   ```bash
   echo $DATABASE_URL
   ```

2. **Test database connection:**
   ```javascript
   // Test with Prisma
   npx prisma db pull
   npx prisma generate
   ```

3. **Check MongoDB connection:**
   ```bash
   # If using MongoDB
   mongosh "your-connection-string"
   ```

### Issue 4: Configuration Issues
**Symptoms:** "Configuration failed to load" or missing rules

**Solutions:**
1. **Reset configuration:**
   ```bash
   curl -X PUT http://localhost:6040/api/auto-schedule/config \
     -H "Content-Type: application/json" \
     -d '{"locationId": "default"}'
   ```

2. **Check configuration endpoint:**
   ```bash
   curl http://localhost:6040/api/auto-schedule/config
   ```

### Issue 5: Schedule Generation Fails
**Symptoms:** "Schedule generation completed" but 0 items created

**Solutions:**
1. **Check console logs for specific errors**
2. **Verify all prerequisites:**
   - At least 1 active user
   - At least 1 valid shift
   - Valid month/year parameters

3. **Test with minimal data:**
   ```javascript
   // Test with basic parameters
   {
     "month": 0,
     "year": 2025,
     "weeks": 1
   }
   ```

## Step-by-Step Fix Process

### Step 1: Verify Basic Setup
```bash
# 1. Check if server is running
curl http://localhost:6040/api/user

# 2. Check database connection
npx prisma db pull

# 3. Run diagnosis
node run-diagnosis.js
```

### Step 2: Create Required Data
If diagnosis shows missing data:

1. **Create users:**
   ```javascript
   // Via your admin interface or API
   POST /api/user
   {
     "firstname": "Test",
     "lastname": "Nurse",
     "isActive": true,
     "positionId": "position-id",
     "titleId": "title-id"
   }
   ```

2. **Create shifts:**
   ```javascript
   // Via your admin interface or API
   POST /api/shif
   {
     "name": "M",
     "isShif": true,
     "description": "Morning Shift"
   }
   ```

3. **Create locations (if needed):**
   ```javascript
   POST /api/location
   {
     "name": "Main Ward"
   }
   ```

### Step 3: Test Schedule Generation
```javascript
// Test with minimal parameters
fetch('/api/auto-schedule', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    month: 0,
    year: 2025,
    weeks: 1
  })
})
.then(res => res.json())
.then(data => console.log('Result:', data));
```

### Step 4: Check Frontend
1. **Verify API calls in browser console**
2. **Check for JavaScript errors**
3. **Verify authentication (admin access required)**

## Advanced Troubleshooting

### Debug Mode
Enable detailed logging by adding to your environment:
```bash
DEBUG=prisma:*
NODE_ENV=development
```

### Database Inspection
```sql
-- Check all tables
SHOW TABLES;

-- Check user data
SELECT id, firstname, lastname, isActive, isChief, isPregnant, isElderly 
FROM User 
WHERE isActive = true;

-- Check shift data
SELECT id, name, isShif, isDayOff 
FROM Shif;

-- Check duty assignments
SELECT COUNT(*) as total_duties 
FROM Duty 
WHERE datetime >= '2025-01-01';
```

### API Testing
Test individual endpoints:
```bash
# Test user endpoint
curl http://localhost:6040/api/user

# Test shift endpoint
curl http://localhost:6040/api/shif

# Test auto-schedule endpoint
curl -X POST http://localhost:6040/api/auto-schedule \
  -H "Content-Type: application/json" \
  -d '{"month":0,"year":2025,"weeks":1}'
```

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "No staff found" | No active users in database | Create at least one active user |
| "No shifts available" | Missing required shifts | Create shifts: M, A, N, MA, NA, OC, OFF |
| "Database connection failed" | Invalid DATABASE_URL | Check and fix connection string |
| "Configuration not found" | Missing config in database | Reset configuration to defaults |
| "Schedule generation failed" | Algorithm constraints not met | Check staff availability and shift requirements |

## Performance Optimization

If the system is slow:
1. **Reduce weeks parameter** (start with 1-2 weeks)
2. **Limit staff count** for testing
3. **Simplify shift requirements**
4. **Check database indexes**

## Support

If issues persist:
1. Run the diagnostic script and share the output
2. Check browser console for JavaScript errors
3. Check server logs for API errors
4. Verify all prerequisites are met

## Quick Fix Checklist

- [ ] At least 1 active user exists
- [ ] Required shifts are created (M, A, N, MA, NA, OC, OFF)
- [ ] Database connection is working
- [ ] Configuration is loaded
- [ ] Admin user is logged in
- [ ] No JavaScript errors in browser console
- [ ] API endpoints are responding
- [ ] Month/year parameters are valid 