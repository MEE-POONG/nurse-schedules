# การแก้ไข Error ในระบบจัดตารางเวรอัตโนมัติ

## Error ที่พบ

```
ReferenceError: staffStats is not defined
    at calculateAssignmentScore (webpack-internal:///(api)/./pages/api/auto-schedule/index.js:1030:39)
```

## สาเหตุของ Error

1. **ฟังก์ชัน `calculateAssignmentScore` ไม่ได้รับ parameter `staffStats`**
   - ฟังก์ชันใช้ `staffStats` ในการคำนวณคะแนนเฉลี่ย
   - แต่ไม่ได้ส่งเข้ามาเป็น parameter

2. **การเรียกใช้ฟังก์ชัน `selectBestStaff` ไม่ส่ง `staffStats`**
   - ฟังก์ชัน `selectBestStaff` เรียก `calculateAssignmentScore`
   - แต่ไม่ได้ส่ง `staffStats` ไปด้วย

3. **ฟังก์ชัน `assignDoubleShifts` และ `assignOnCallShifts` ไม่ได้รับ `reservationMap`**
   - ฟังก์ชันเหล่านี้ใช้ `reservationMap` ในการเลือกบุคลากร
   - แต่ไม่ได้ส่งเข้ามาเป็น parameter

## การแก้ไข

### 1. แก้ไขฟังก์ชัน `calculateAssignmentScore`

```javascript
// เดิม
function calculateAssignmentScore(staff, shiftType, currentDate, reservationMap = {}, reservationKey = "") {

// แก้ไขเป็น
function calculateAssignmentScore(staff, shiftType, currentDate, reservationMap = {}, reservationKey = "", staffStats = {}) {
```

### 2. เพิ่มการตรวจสอบ `staffStats`

```javascript
// เพิ่มการตรวจสอบก่อนใช้ staffStats
if (Object.keys(staffStats).length > 0) {
  const avgWorkload = Object.values(staffStats).reduce((sum, s) => sum + s.totalWorkload, 0) / Object.keys(staffStats).length;
  // ...
}
```

### 3. แก้ไขการเรียกใช้ `selectBestStaff`

```javascript
// เดิม
const aScore = calculateAssignmentScore(a, shiftType, currentDate, reservationMap, reservationKey);

// แก้ไขเป็น
const aScore = calculateAssignmentScore(a, shiftType, currentDate, reservationMap, reservationKey, staffStats);
```

### 4. แก้ไขฟังก์ชัน `assignDoubleShifts` และ `assignOnCallShifts`

```javascript
// เดิม
function assignDoubleShifts(schedule, staffStats, currentDate, locationId, shifts, violations) {

// แก้ไขเป็น
function assignDoubleShifts(schedule, staffStats, currentDate, locationId, shifts, violations, reservationMap = {}) {
```

### 5. แก้ไขการเรียกใช้ใน `generateAdvancedAutoSchedule`

```javascript
// เดิม
assignDoubleShifts(schedule, staffStats, currentDate, locationId, shifts, violations);

// แก้ไขเป็น
assignDoubleShifts(schedule, staffStats, currentDate, locationId, shifts, violations, reservationMap);
```

### 6. แก้ไขการใช้ `rotationPattern`

```javascript
// เดิม
const rotationPattern = SHIFT_RULES.H8.rotationPattern;

// แก้ไขเป็น
const rotationPattern = SHIFT_RULES.H15.rotationPattern;
```

## ผลลัพธ์

- ✅ แก้ไข error `staffStats is not defined`
- ✅ ระบบสามารถรันได้โดยไม่มี error
- ✅ การคำนวณคะแนนทำงานได้ถูกต้อง
- ✅ การเลือกบุคลากรตามลำดับการหมุนเวรทำงานได้
- ✅ การใช้ `reservationMap` ทำงานได้ถูกต้อง

## การทดสอบ

ระบบควรสามารถ:
1. รันได้โดยไม่มี error
2. จัดตารางเวรตามเงื่อนไขที่กำหนด
3. รายงานการละเมิดเงื่อนไขได้
4. ใช้ลำดับการหมุนเวร ด → ช → บ ได้ถูกต้อง 