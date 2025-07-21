import { useState, useEffect } from "react";
import useAxios from "axios-hooks";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { authProvider } from "src/authProvider";
import OfficialScheduleTable from "@/components/OfficialScheduleTable/OfficialScheduleTable";

dayjs.locale("th");

const AutoSchedulePanel = ({ month, year, locationId, onScheduleGenerated }) => {
  const [generatedSchedule, setGeneratedSchedule] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [showOfficialTable, setShowOfficialTable] = useState(false);

  const currentUser = authProvider.getIdentity();

  // สร้างตารางอัตโนมัติ
  const [{ loading: generateLoading }, executeGenerate] = useAxios(
    { url: "/api/auto-schedule", method: "POST" },
    { manual: true }
  );

  // บันทึกตารางเวร
  const [{ loading: applyLoading }, executeApply] = useAxios(
    { url: "/api/auto-schedule/apply", method: "POST" },
    { manual: true }
  );

  // ดึงข้อมูลการจองที่มีอยู่
  const [{ data: preferences, loading: preferencesLoading }] = useAxios({
    url: `/api/shift-preference?month=${month}&year=${year}`,
    method: "GET"
  });

  const handleGenerateSchedule = async () => {
    try {
      const result = await executeGenerate({
        data: {
          month: month,
          year: year,
          locationId: locationId
        }
      });

      // ตรวจสอบรูปแบบข้อมูลที่ได้รับ
      console.log("API Response:", result.data);
      
      // จัดการข้อมูลที่ได้รับจาก API
      const scheduleData = result.data.schedule || result.data;
      
      setGeneratedSchedule(scheduleData);
      setShowPreview(true);
    } catch (error) {
      console.error("Error generating schedule:", error);
      alert("เกิดข้อผิดพลาดในการสร้างตารางอัตโนมัติ");
    }
  };

  const handleApplySchedule = async () => {
    if (!generatedSchedule?.schedule) return;

    try {
      const result = await executeApply({
        data: {
          schedule: generatedSchedule.schedule,
          month: month,
          year: year,
          locationId: locationId,
          replaceExisting: replaceExisting
        }
      });

      alert(`บันทึกตารางเวรสำเร็จ!\nสร้างเวรใหม่: ${result.data.summary.created} เวร\nข้อผิดพลาด: ${result.data.summary.errors} รายการ`);
      
      setGeneratedSchedule(null);
      setShowPreview(false);
      onScheduleGenerated && onScheduleGenerated();
      
    } catch (error) {
      console.error("Error applying schedule:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกตารางเวร");
    }
  };

  if (!currentUser?.isAdmin) {
    return (
      <div className="p-4 bg-red-50 rounded-md border border-red-200">
        <p className="text-red-600">เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถใช้ฟีเจอร์นี้ได้</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="mb-4 text-xl font-bold">จัดตารางเวรอัตโนมัติ</h2>
      
      {/* สถิติการจอง */}
      <div className="p-4 mb-6 bg-blue-50 rounded-md">
        <h3 className="mb-2 font-medium text-blue-800">สถิติการจองเวรประจำเดือน</h3>
        {preferencesLoading ? (
          <p>กำลังโหลด...</p>
        ) : (
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">การจองทั้งหมด:</span>
              <span className="ml-2">{preferences?.length || 0} รายการ</span>
            </div>
            <div>
              <span className="font-medium">จองแน่นอน:</span>
              <span className="ml-2">{preferences?.filter(p => p.isReserved)?.length || 0} รายการ</span>
            </div>
            <div>
              <span className="font-medium">ความชอบ:</span>
              <span className="ml-2">{preferences?.filter(p => !p.isReserved)?.length || 0} รายการ</span>
            </div>
          </div>
        )}
      </div>

      {/* ปุ่มสร้างตาราง */}
      <div className="mb-4">
        <button
          onClick={handleGenerateSchedule}
          disabled={generateLoading}
          className="px-6 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generateLoading ? "กำลังสร้างตาราง..." : "สร้างตารางเวรอัตโนมัติ"}
        </button>
      </div>

      {/* แสดงผลการสร้างตาราง */}
      {showPreview && generatedSchedule && (
        <div className="p-4 rounded-md border border-gray-200">
          <h3 className="mb-4 text-lg font-medium">ตัวอย่างตารางเวรที่สร้างขึ้น</h3>
          
          {/* แสดงข้อมูลดีบัก */}
          <div className="p-2 mb-4 text-xs bg-gray-100 rounded">
            <div>Schedule array length: {generatedSchedule.schedule?.length || 0}</div>
            <div>Violations array length: {generatedSchedule.violations?.length || 0}</div>
            <div>Staff stats keys: {Object.keys(generatedSchedule.staffStats || {}).length}</div>
          </div>

          {/* แสดงเมื่อไม่มีข้อมูล */}
          {(!generatedSchedule.schedule || generatedSchedule.schedule.length === 0) && (
            <div className="p-4 mb-4 text-center bg-yellow-50 rounded border border-yellow-200">
              <p className="text-yellow-800">ไม่พบข้อมูลตารางเวรที่สร้างขึ้น</p>
              <p className="text-sm text-yellow-600">กรุณาตรวจสอบการตั้งค่าหรือลองสร้างใหม่</p>
            </div>
          )}
          
          {/* สถิติผลการสร้าง */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div className="p-3 bg-green-50 rounded">
              <div className="font-medium text-green-800">จำนวนเวรที่สร้าง</div>
              <div className="text-2xl font-bold text-green-600">
                {generatedSchedule.schedule?.length || 0}
              </div>
            </div>
            <div className="p-3 bg-yellow-50 rounded">
              <div className="font-medium text-yellow-800">ข้อจำกัดที่ละเมิด</div>
              <div className="text-2xl font-bold text-yellow-600">
                {generatedSchedule.violations?.length || 0}
              </div>
            </div>
          </div>

          {/* รายการข้อจำกัดที่ละเมิด */}
          {generatedSchedule.violations?.length > 0 && (
            <div className="p-3 mb-4 bg-red-50 rounded border border-red-200">
              <h4 className="mb-2 font-medium text-red-800">ข้อจำกัดที่ไม่สามารถปฏิบัติได้:</h4>
              <ul className="space-y-1 text-sm text-red-600">
                {generatedSchedule.violations.slice(0, 5).map((violation, index) => (
                  <li key={index}>
                    {getViolationMessage(violation)}
                  </li>
                ))}
                {generatedSchedule.violations.length > 5 && (
                  <li className="text-gray-500">และอีก {generatedSchedule.violations.length - 5} รายการ</li>
                )}
              </ul>
            </div>
          )}

          {/* ตารางเวรที่สร้างขึ้น */}
          {generatedSchedule.schedule?.length > 0 && (
            <div className="p-3 mb-4 bg-green-50 rounded border border-green-200">
              <h4 className="mb-2 font-medium text-green-800">ตารางเวรที่สร้างขึ้น ({generatedSchedule.schedule.length} เวร):</h4>
              <div className="overflow-y-auto max-h-60">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-green-200">
                      <th className="p-2 text-left">วันที่</th>
                      <th className="p-2 text-left">วัน</th>
                      <th className="p-2 text-left">พนักงาน</th>
                      <th className="p-2 text-left">เวร</th>
                      <th className="p-2 text-left">OT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generatedSchedule.schedule.map((shift, index) => (
                      <tr key={index} className="border-b border-green-100">
                        <td className="p-2">
                          {dayjs(shift.datetime).format("DD/MM")}
                        </td>
                        <td className="p-2">
                          {dayjs(shift.datetime).format("ddd")}
                        </td>
                        <td className="p-2">
                          <span className="text-xs text-gray-600">
                            {shift.userId.slice(-6)}
                          </span>
                        </td>
                        <td className="p-2">
                          <span className="px-2 py-1 text-xs text-blue-800 bg-blue-100 rounded-full">
                            {getShiftName(shift.shifId)}
                          </span>
                        </td>
                        <td className="p-2">
                          {shift.isOT ? (
                            <span className="px-2 py-1 text-xs text-orange-800 bg-orange-100 rounded-full">
                              OT
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ตารางเวรจัดกลุ่มตามวัน */}
          {generatedSchedule.schedule?.length > 0 && (
            <div className="p-3 mb-4 bg-indigo-50 rounded border border-indigo-200">
              <h4 className="mb-2 font-medium text-indigo-800">ตารางเวรจัดกลุ่มตามวัน:</h4>
              <div className="overflow-y-auto max-h-60">
                {getScheduleByDate(generatedSchedule.schedule).map((daySchedule, index) => (
                  <div key={index} className="p-2 mb-3 bg-white rounded border">
                    <div className="mb-2 font-medium text-gray-800">
                      {dayjs(daySchedule.date).format("dddd DD/MM/YYYY")}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {daySchedule.shifts.map((shift, shiftIndex) => (
                        <div key={shiftIndex} className="p-2 text-center bg-gray-50 rounded">
                          <div className="mb-1 text-xs text-gray-600">
                            {getShiftName(shift.shifId)}
                          </div>
                          <div className="text-xs font-medium">
                            ID: {shift.userId.slice(-6)}
                          </div>
                          {shift.isOT && (
                            <div className="mt-1 text-xs text-orange-600">OT</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* สถิติพนักงาน */}
          {generatedSchedule.staffStats && (
            <div className="p-3 mb-4 bg-blue-50 rounded border border-blue-200">
              <h4 className="mb-2 font-medium text-blue-800">สถิติพนักงาน:</h4>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {Object.entries(generatedSchedule.staffStats).map(([userId, stats]) => (
                  <div key={userId} className="p-2 bg-white rounded border">
                    <div className="mb-1 text-xs text-gray-600">
                      ID: {userId.slice(-6)}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">เวรทั้งหมด:</span> {stats.totalShifts} เวร
                    </div>
                    <div className="text-xs text-gray-600">
                      ช: {stats.shiftCounts.ช || 0} | บ: {stats.shiftCounts.บ || 0} | ด: {stats.shiftCounts.ด || 0}
                    </div>
                    <div className="text-xs text-gray-600">
                      ทำงานติดต่อ: {stats.consecutiveDays} วัน
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ตัวเลือกการบันทึก */}
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={replaceExisting}
                onChange={(e) => setReplaceExisting(e.target.checked)}
                className="mr-2 w-4 h-4 text-blue-600"
              />
              <span className="text-sm">
                แทนที่ตารางเวรที่มีอยู่ (จะลบเวรเดิมทั้งหมดในเดือนนี้)
              </span>
            </label>
          </div>

          {/* ปุ่มฟังก์ชันเพิ่มเติม */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => setShowOfficialTable(!showOfficialTable)}
              className="px-4 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {showOfficialTable ? "ซ่อนตารางทางการ" : "แสดงตารางทางการ"}
            </button>
            
            <button
              onClick={() => window.print()}
              className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              🖨️ พิมพ์ตาราง
            </button>
          </div>

          {/* ปุ่มบันทึก */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowPreview(false)}
              className="px-4 py-2 text-gray-700 bg-gray-300 rounded-md hover:bg-gray-400"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleApplySchedule}
              disabled={applyLoading}
              className="px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {applyLoading ? "กำลังบันทึก..." : "บันทึกตารางเวร"}
            </button>
          </div>
        </div>
      )}

      {/* ตารางทางการ */}
      {showOfficialTable && (
        <div className="p-4 mt-6 rounded-md border border-gray-200">
          <h3 className="mb-4 text-lg font-medium">ตารางการปฏิบัติงานแบบทางการ</h3>
          <div className="p-4 mb-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="mb-2 font-medium text-blue-800">📋 คำแนะนำ</h4>
            <ul className="space-y-1 text-sm text-blue-700">
              <li>• ตารางนี้แสดงการปฏิบัติงานแบบทางการตามรูปแบบของหน่วยงานราชการ</li>
              <li>• ข้อมูลจะอัพเดทหลังจากบันทึกตารางเวรเรียบร้อยแล้ว</li>
              <li>• สามารถพิมพ์ตารางนี้เพื่อนำเสนออย่างเป็นทางการได้</li>
            </ul>
          </div>
          
                    <OfficialScheduleTable 
            month={month} 
            year={year} 
            locationFilter={locationId}
            generatedSchedule={generatedSchedule}
          />
        </div>
      )}
    </div>
  );
};

function getViolationMessage(violation) {
  const messages = {
    MAX_CONSECUTIVE_DAYS: `พนักงาน ID ${violation.userId} ทำงานติดต่อกันเกิน ${violation.current} วัน ในวันที่ ${violation.day}`,
    FORBIDDEN_CONSECUTIVE: `พนักงาน ID ${violation.userId} ไม่สามารถเวร ${violation.previous} ตามด้วย ${violation.current} ในวันที่ ${violation.day}`,
    MAX_SHIFTS_PER_MONTH: `พนักงาน ID ${violation.userId} เวรเกิน ${violation.current} เวรต่อเดือน ในวันที่ ${violation.day}`,
  };
  
  return messages[violation.type] || `ข้อจำกัด ${violation.type} สำหรับพนักงาน ID ${violation.userId}`;
}

function getShiftName(shifId) {
  // สำหรับตอนนี้ใช้ mapping แบบง่ายๆ ก่อน
  const shiftMap = {
    "66c74ecaaf47d3097ba9acb3": "ช", // เช้า
    "66c74ecaaf47d3097ba9acb4": "บ", // บ่าย
    "66c74ecaaf47d3097ba9acb5": "ด", // ดึก
    "66c74ecaaf47d3097ba9acb6": "x", // วันหยุด
  };
  
  return shiftMap[shifId] || `ไม่ทราบ (${shifId?.slice(-6) || 'N/A'})`;
}

function getScheduleByDate(schedule) {
  const scheduleByDate = {};

  schedule.forEach((shift) => {
    const date = dayjs(shift.datetime).format("YYYY-MM-DD");
    if (!scheduleByDate[date]) {
      scheduleByDate[date] = { date, shifts: [] };
    }
    scheduleByDate[date].shifts.push(shift);
  });

  return Object.values(scheduleByDate);
}

export default AutoSchedulePanel;