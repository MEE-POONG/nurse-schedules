import { useState, useEffect } from "react";
import useAxios from "axios-hooks";
import dayjs from "dayjs";
import "dayjs/locale/th";

dayjs.locale("th");

const OfficialScheduleTable = ({ month, year, locationFilter = null, generatedSchedule = null }) => {
  const [selectedLocation, setSelectedLocation] = useState(locationFilter || "");
  const [processedUsers, setProcessedUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  const firstDay = dayjs().month(month).year(year).startOf("month");
  const lastDay = dayjs().month(month).year(year).endOf("month");
  const daysInMonth = lastDay.date();
  const monthTH = dayjs().month(month).format("MMMM");
  const yearTH = (year + 543).toString();

  // ดึงข้อมูลพนักงานและเวร (เฉพาะเมื่อไม่มี generatedSchedule)
  const [{ data: userData, loading: userLoading }] = useAxios({
    url: `/api/user/selectMonth?month=${month}&year=${year}`,
    method: "GET"
  }, { skip: !!generatedSchedule });

  // ดึงข้อมูลแผนก
  const [{ data: locations }] = useAxios({
    url: "/api/location",
    method: "GET"
  });



  // กรองข้อมูลตามแผนกที่เลือก
  const filteredUsers = generatedSchedule ? 
    processedUsers :
    (userData?.filter(user => {
      if (!selectedLocation) return true;
      return user.UserDuty?.locationId === selectedLocation;
    }) || []);

  // สร้าง array วันที่ในเดือน
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i);

  // ฟังก์ชันสำหรับแสดงสัญลักษณ์เวร
  const getShiftSymbol = (duties, day) => {
    const dayDuties = duties?.filter(duty => 
      dayjs(duty.datetime).date() === day + 1
    );
    
    if (!dayDuties || dayDuties.length === 0) return "";
    
    // ถ้ามีเวรเดียว
    if (dayDuties.length === 1) {
      const duty = dayDuties[0];
      const shiftName = duty.Shif.name;
      
      // ตรวจสอบ on-call (วงกลมแดง)
      if (duty.isOnCall) {
        return (
          <span className="inline-flex justify-center items-center w-6 h-6 text-xs font-bold text-white bg-red-600 rounded-full">
            {shiftName}
          </span>
        );
      }
      
      // ตรวจสอบ OT (วงกลมรอบตัวอักษร)
      if (duty.Shif.isOT) {
        return (
          <span className="inline-flex justify-center items-center w-6 h-6 text-xs font-bold text-red-600 rounded-full border-2 border-red-600">
            {shiftName}
          </span>
        );
      }
      
      // เวรปกติ
      const shiftMap = {
        "ช": "ช",
        "บ": "บ", 
        "ด": "ด",
        "R": "R",
        "x": "x" // วันหยุด
      };
      
      return shiftMap[shiftName] || "";
    }
    
    // ถ้ามีเวรควบ (หลายเวรในวันเดียวกัน) แสดง inline ไม่ตัดบรรทัด
    return (
      <span className="inline-flex gap-1 items-center">
        {dayDuties.map((duty, idx) => {
          const shiftName = duty.Shif.name;
          // ตรวจสอบ on-call
          if (duty.isOnCall) {
            return (
              <span key={duty.datetime + "oncall"} className="inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-600 rounded-full mr-0.5">
                {shiftName}
              </span>
            );
          }
          // ตรวจสอบ OT
          if (duty.Shif.isOT) {
            return (
              <span key={duty.datetime + "ot"} className="inline-flex items-center justify-center w-4 h-4 text-xs font-bold border-2 border-red-600 text-red-600 rounded-full mr-0.5">
                {shiftName}
              </span>
            );
          }
          return <span key={duty.datetime + "normal"}>{shiftName}</span>;
        })}
      </span>
    );
  };

  // คำนวณสรุปเวร
  const calculateShiftSummary = (duties) => {
    const summary = {
      morning: 0,
      afternoon: 0, 
      night: 0,
      rest: 0,
      ot: 0,
      onCall: 0,
      total: 0
    };

    duties?.forEach(duty => {
      // นับ on-call
      if (duty.isOnCall) {
        summary.onCall++;
      }
      
      // นับ OT
      if (duty.Shif.isOT) {
        summary.ot++;
      }
      
      // นับเวรปกติ
      switch (duty.Shif.name) {
        case "ช": summary.morning++; break;
        case "บ": summary.afternoon++; break;
        case "ด": summary.night++; break;
        case "R": 
        case "x": summary.rest++; break;
      }
    });

    summary.total = summary.morning + summary.afternoon + summary.night + summary.rest;
    return summary;
  };

  // ฟังก์ชันสำหรับแปลงชื่อเวร
  function getShiftName(shifId) {
    const shiftMap = {
      "66c74ecaaf47d3097ba9acb3": "ช", // เช้า
      "66c74ecaaf47d3097ba9acb4": "บ", // บ่าย
      "66c74ecaaf47d3097ba9acb5": "ด", // ดึก
      "66c74ecaaf47d3097ba9acb6": "x", // วันหยุด
    };
    
    return shiftMap[shifId] || "ไม่ทราบ";
  }

  // ประมวลผลข้อมูลเวรที่สร้างขึ้น
  const processGeneratedSchedule = async () => {
    if (!generatedSchedule?.schedule) return [];
    
    setLoadingUsers(true);
    
    try {
      // ดึงข้อมูลพนักงานเพื่อหาชื่อ-สกุล
      const userIds = [...new Set(generatedSchedule.schedule.map(shift => shift.userId))];
      const usersResponse = await fetch(`/api/user?ids=${userIds.join(',')}`);
      console.log(usersResponse);
      const users = await usersResponse.json();

      
      
      // สร้าง map ของ userId กับข้อมูลพนักงาน
      const userMap = {};
      users.forEach(user => {
        userMap[user.id] = user;
      });
      
      // จัดกลุ่มเวรตาม userId
      const scheduleByUser = {};
      
      generatedSchedule.schedule.forEach(shift => {
        if (!scheduleByUser[shift.userId]) {
          const user = userMap[shift.userId];
          scheduleByUser[shift.userId] = {
            id: shift.userId,
            firstname: user?.firstname || "",
            lastname: user?.lastname || "",
            Title: { name: user?.Title?.name || "" },
            Position: { name: user?.Position?.name || "พยาบาล" },
            UserDuty: { Location: { name: "แผนกพยาบาล" } },
            Duty: []
          };
        }
        
        scheduleByUser[shift.userId].Duty.push({
          datetime: shift.datetime,
          Shif: {
            name: getShiftName(shift.shifId),
            isOT: shift.isOT
          },
          isOnCall: shift.isOnCall || false
        });
      });
      
      return Object.values(scheduleByUser);
    } catch (error) {
      console.error("Error processing generated schedule:", error);
      return [];
    } finally {
      setLoadingUsers(false);
    }
  };

  // useEffect สำหรับประมวลผลข้อมูลเมื่อ generatedSchedule เปลี่ยน
  useEffect(() => {
    if (generatedSchedule) {
      processGeneratedSchedule().then(setProcessedUsers);
    } else {
      setProcessedUsers([]);
    }
  }, [generatedSchedule]);

  if ((userLoading && !generatedSchedule) || loadingUsers) {
    return <div className="p-8 text-center">กำลังโหลดข้อมูล...</div>;
  }

  return (
    <div className="overflow-x-auto p-6 mx-auto max-w-full bg-white">
      {/* หัวข้อหลัก */}
      <div className="mb-6 text-center">
        <h1 className="mb-2 text-lg font-bold">
          ตารางการปฎิบัติงานเวลาราชการ นอกเวลาราชการและวันหยุดราชการ
        </h1>
        <h2 className="mb-2 text-base font-medium">
          เพื่อให้บริการรักษาพยาบาลและสนับสนุนงานบริการอื่นๆ
        </h2>
        <h3 className="text-base font-medium">
          ประจำเดือน {monthTH} พ.ศ. {yearTH}
        </h3>
      </div>

      {/* เลือกแผนก (เฉพาะเมื่อไม่ใช่ generatedSchedule) */}
      {!generatedSchedule && (
        <div className="flex gap-4 items-center mb-4">
          <label className="font-medium">แผนก:</label>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- แสดงทุกแผนก --</option>
            {locations?.map(location => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* แสดงข้อมูลเมื่อใช้ generatedSchedule */}
      {generatedSchedule && (
        <div className="p-3 mb-4 bg-green-50 rounded border border-green-200">
          <h4 className="mb-2 font-medium text-green-800">📋 ข้อมูลตารางเวรที่สร้างขึ้น</h4>
          <div className="text-sm text-green-700">
            <p>• จำนวนเวรทั้งหมด: {generatedSchedule.schedule?.length || 0} เวร</p>
            <p>• จำนวนพนักงาน: {filteredUsers.length} คน</p>
            {generatedSchedule.violations?.length > 0 && (
              <p>• ข้อจำกัดที่ละเมิด: {generatedSchedule.violations.length} รายการ</p>
            )}
          </div>
        </div>
      )}

      {/* ตารางหลัก */}
      <div className="overflow-x-auto border border-black">
        <table className="w-full text-xs border border-black border-collapse">
          {/* หัวตาราง */}
          <thead>
            <tr className="bg-gray-100">
              <td 
                className="border border-black p-2 text-center font-medium min-w-[40px]"
                rowSpan={2}
              >
                ลำดับ
              </td>
              <td 
                className="border border-black p-2 text-center font-medium min-w-[200px]"
                rowSpan={2}
              >
                ชื่อ - สกุล
              </td>
              <td 
                className="border border-black p-2 text-center font-medium min-w-[120px]"
                rowSpan={2}
              >
                ตำแหน่ง
              </td>
              <td 
                className="border border-black p-2 text-center font-medium min-w-[100px]"
                rowSpan={2}
              >
                งานที่ปฏิบัติ
              </td>
              <td 
                className="p-2 font-medium text-center border border-black"
                colSpan={daysInMonth}
              >
                วันที่ปฏิบัติงาน
              </td>
              <td 
                className="p-2 font-medium text-center border border-black"
                colSpan={7}
              >
                สรุป
              </td>
            </tr>
            <tr className="bg-gray-100">
              {/* วันที่ */}
              {daysArray.map(day => {
                const date = dayjs().month(month).year(year).date(day + 1);
                const dayOfWeek = date.format("ddd");
                const isWeekend = ["เสาร์", "อาทิตย์"].includes(dayOfWeek);
                
                return (
                  <td 
                    key={day}
                    className={`border border-black p-1 text-center min-w-[25px] ${
                      isWeekend ? "bg-yellow-100" : "bg-white"
                    }`}
                  >
                    <div className="text-xs">{day + 1}</div>
                    <div className="text-xs text-gray-600">{dayOfWeek}</div>
                  </td>
                );
              })}
              
              {/* สรุป */}
              <td className="border border-black p-1 text-center min-w-[30px] bg-blue-50">
                <div className="text-xs">เช้า</div>
                <div className="text-xs">(ช)</div>
              </td>
              <td className="border border-black p-1 text-center min-w-[30px] bg-orange-50">
                <div className="text-xs">บ่าย</div>
                <div className="text-xs">(บ)</div>
              </td>
              <td className="border border-black p-1 text-center min-w-[30px] bg-purple-50">
                <div className="text-xs">ดึก</div>
                <div className="text-xs">(ด)</div>
              </td>
              <td className="border border-black p-1 text-center min-w-[30px] bg-green-50">
                <div className="text-xs">พัก</div>
                <div className="text-xs">(R)</div>
              </td>
              <td className="border border-black p-1 text-center min-w-[30px] bg-red-50">
                <div className="text-xs">ล่วง</div>
                <div className="text-xs">(OT)</div>
              </td>
              <td className="border border-black p-1 text-center min-w-[30px] bg-pink-50">
                <div className="text-xs">On-Call</div>
                <div className="text-xs">(OC)</div>
              </td>
              <td className="border border-black p-1 text-center min-w-[30px] bg-gray-50">
                <div className="text-xs">รวม</div>
                <div className="text-xs">วัน</div>
              </td>
            </tr>
          </thead>

          {/* เนื้อหาตาราง */}
          <tbody>
            {filteredUsers.map((person, index) => {
              const summary = calculateShiftSummary(person.Duty);
              
              return (
                <tr key={person.id || index} className="hover:bg-gray-50">
                  <td className="p-1 text-center border border-black">
                    {person.firstname ? index + 1 : ""}
                  </td>
                  <td className="p-1 text-left border border-black">
                    <div className="text-xs">
                      {person.Title?.name} {person.firstname} {person.lastname}
                    </div>
                  </td>
                  <td className="p-1 text-center border border-black">
                    <div className="text-xs">{person.Position?.name}</div>
                  </td>
                  <td className="p-1 text-center border border-black">
                    <div className="text-xs">{person.UserDuty?.Location?.name}</div>
                  </td>
                  
                  {/* วันที่ปฏิบัติงาน */}
                  {daysArray.map(day => {
                    const date = dayjs().month(month).year(year).date(day + 1);
                    const isWeekend = ["เสาร์", "อาทิตย์"].includes(date.format("ddd"));
                    const shiftSymbol = getShiftSymbol(person.Duty, day);
                    
                    return (
                      <td 
                        key={day}
                        className={`border border-black p-1 text-center ${
                          isWeekend ? "bg-yellow-50" : "bg-white"
                        }`}
                      >
                        {shiftSymbol}
                      </td>
                    );
                  })}
                  
                  {/* สรุป */}
                  <td className="p-1 text-center bg-blue-50 border border-black">
                    {summary.morning || ""}
                  </td>
                  <td className="p-1 text-center bg-orange-50 border border-black">
                    {summary.afternoon || ""}
                  </td>
                  <td className="p-1 text-center bg-purple-50 border border-black">
                    {summary.night || ""}
                  </td>
                  <td className="p-1 text-center bg-green-50 border border-black">
                    {summary.rest || ""}
                  </td>
                  <td className="p-1 text-center bg-red-50 border border-black">
                    {summary.ot || ""}
                  </td>
                  <td className="p-1 text-center bg-pink-50 border border-black">
                    {summary.onCall || ""}
                  </td>
                  <td className="p-1 font-medium text-center bg-gray-50 border border-black">
                    {summary.total || ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* คำอธิบายสัญลักษณ์ */}
      <div className="p-4 mt-4 bg-gray-50 rounded">
        <h4 className="mb-2 font-medium">คำอธิบายสัญลักษณ์:</h4>
        <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-6">
          <div className="flex gap-2 items-center">
            <span className="font-bold text-blue-600">ช</span>
            <span>= เวรเช้า (เวลาราชการ)</span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="font-bold text-orange-600">บ</span>
            <span>= เวรบ่าย (นอกเวลาราชการ)</span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="font-bold text-purple-600">ด</span>
            <span>= เวรดึก (นอกเวลาราชการ)</span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="font-bold text-green-600">R</span>
            <span>= วันหยุดราชการ</span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="font-bold text-red-600">OT</span>
            <span>= ล่วงเวลา</span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="inline-flex justify-center items-center w-4 h-4 text-xs font-bold text-white bg-red-600 rounded-full">ช</span>
            <span>= On-Call (วงกลมแดง)</span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="font-bold text-red-600">x</span>
            <span>= วันหยุดราชการหรือลาพัก</span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="font-bold text-red-600">ชบ</span>
            <span>= เวรควบ (เช้า+บ่าย)</span>
          </div>
        </div>
      </div>

      {/* ข้อมูลเพิ่มเติม */}
      <div className="mt-4 text-sm text-gray-600">
        <p>จำนวนพนักงานทั้งหมด: {filteredUsers.length} คน</p>
        <p>วันที่พิมพ์: {dayjs().format("DD/MM/YYYY HH:mm")} น.</p>
      </div>
    </div>
  );
};

export default OfficialScheduleTable; 