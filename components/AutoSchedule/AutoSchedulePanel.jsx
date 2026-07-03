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

      // จัดเก็บเป็น object เดียวให้ตรงกับที่ส่วนแสดงผลใช้งาน
      const data = result.data || {};
      setGeneratedSchedule({
        schedule: data.schedule || [],
        violations: data.violations || data.summary?.constraintViolations || [],
        staffStats: data.staffStats || {},
        summary: data.summary || {},
      });
      setShowPreview(true);
    } catch (error) {
      console.error("Error generating schedule:", error);
      alert("เกิดข้อผิดพลาดในการสร้างตารางอัตโนมัติ: " + (error?.response?.data?.details || error.message));
    }
  };

  const handleApplySchedule = async () => {
    if (!generatedSchedule?.schedule?.length) return;

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

      const s = result.data?.summary || {};
      alert(`บันทึกตารางเวรสำเร็จ!\nสร้าง/อัปเดต: ${s.created ?? 0} เวร\nลบของเดิม: ${s.deleted ?? 0} เวร\nข้อผิดพลาด: ${s.errors ?? 0} รายการ`);

      setGeneratedSchedule(null);
      setShowPreview(false);
      onScheduleGenerated && onScheduleGenerated();

    } catch (error) {
      console.error("Error applying schedule:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกตารางเวร: " + (error?.response?.data?.details || error.message));
    }
  };

  if (!currentUser?.isAdmin) {
    return (
      <div className="p-4 rounded-xl bg-rose-500/[0.07] ring-1 ring-rose-500/20">
        <p className="text-sm font-medium text-rose-600">เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถใช้ฟีเจอร์นี้ได้</p>
      </div>
    );
  }

  return (
    <div className="p-6 card">
      <h2 className="flex gap-2 items-center mb-5 text-base font-bold tracking-tight text-gray-900">
        <span className="w-1 h-4 rounded-full bg-gradient-to-b from-teal-500 to-emerald-500" />
        จัดตารางเวรอัตโนมัติ
      </h2>

      {/* สถิติการจอง */}
      {preferencesLoading ? (
        <p className="mb-6 text-sm text-gray-500">กำลังโหลด...</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 mb-6 text-center">
          <div className="py-3 rounded-xl bg-sky-500/[0.07]">
            <div className="text-xl font-bold text-sky-600">{preferences?.length || 0}</div>
            <div className="text-[11px] font-medium text-sky-600/70">การจองทั้งหมด</div>
          </div>
          <div className="py-3 rounded-xl bg-emerald-500/[0.07]">
            <div className="text-xl font-bold text-emerald-600">{preferences?.filter(p => p.isReserved)?.length || 0}</div>
            <div className="text-[11px] font-medium text-emerald-600/70">จองแน่นอน</div>
          </div>
          <div className="py-3 rounded-xl bg-gray-500/[0.07]">
            <div className="text-xl font-bold text-gray-700">{preferences?.filter(p => !p.isReserved)?.length || 0}</div>
            <div className="text-[11px] font-medium text-gray-500">ความชอบ</div>
          </div>
        </div>
      )}

      {/* ปุ่มสร้างตาราง */}
      <div className="mb-4">
        <button
          onClick={handleGenerateSchedule}
          disabled={generateLoading}
          className="px-6 py-2.5 btn-brand disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generateLoading ? "กำลังสร้างตาราง..." : "✨ สร้างตารางเวรอัตโนมัติ"}
        </button>
      </div>

      {/* แสดงผลการสร้างตาราง */}
      {showPreview && generatedSchedule && (
        <div className="p-5 rounded-2xl ring-1 ring-gray-200">
          <h3 className="mb-4 text-base font-bold tracking-tight text-gray-900">ตัวอย่างตารางเวรที่สร้างขึ้น</h3>

          {/* แสดงเมื่อไม่มีข้อมูล */}
          {(!generatedSchedule.schedule || generatedSchedule.schedule.length === 0) && (
            <div className="p-4 mb-4 text-center rounded-xl bg-amber-500/[0.08] ring-1 ring-amber-500/20">
              <p className="font-medium text-amber-800">ไม่พบข้อมูลตารางเวรที่สร้างขึ้น</p>
              <p className="text-sm text-amber-600">กรุณาตรวจสอบการตั้งค่าหรือลองสร้างใหม่</p>
            </div>
          )}

          {/* สถิติผลการสร้าง */}
          <div className="grid grid-cols-2 gap-2 mb-4 text-center">
            <div className="py-3 rounded-xl bg-emerald-500/[0.07]">
              <div className="text-2xl font-bold text-emerald-600">
                {generatedSchedule.schedule?.length || 0}
              </div>
              <div className="text-[11px] font-medium text-emerald-600/70">จำนวนเวรที่สร้าง</div>
            </div>
            <div className="py-3 rounded-xl bg-amber-500/[0.08]">
              <div className="text-2xl font-bold text-amber-600">
                {generatedSchedule.violations?.length || 0}
              </div>
              <div className="text-[11px] font-medium text-amber-600/70">ข้อจำกัดที่ละเมิด</div>
            </div>
          </div>

          {/* รายการข้อจำกัดที่ละเมิด */}
          {generatedSchedule.violations?.length > 0 && (
            <div className="p-3.5 mb-4 rounded-xl bg-rose-500/[0.06] ring-1 ring-rose-500/15">
              <h4 className="mb-2 text-xs font-bold text-rose-700">ข้อจำกัดที่ไม่สามารถปฏิบัติได้:</h4>
              <ul className="space-y-1 text-sm text-rose-600">
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
            <div className="p-3.5 mb-4 rounded-xl bg-emerald-500/[0.05] ring-1 ring-emerald-500/15">
              <h4 className="mb-2 text-xs font-bold text-emerald-700">ตารางเวรที่สร้างขึ้น ({generatedSchedule.schedule.length} เวร):</h4>
              <div className="overflow-y-auto max-h-60 thin-scroll">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-xs font-semibold text-gray-500 border-b border-emerald-500/20">
                      <th className="p-2 text-left">วันที่</th>
                      <th className="p-2 text-left">วัน</th>
                      <th className="p-2 text-left">พนักงาน</th>
                      <th className="p-2 text-left">เวร</th>
                      <th className="p-2 text-left">OT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generatedSchedule.schedule.map((shift, index) => (
                      <tr key={index} className="border-b border-emerald-500/10">
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
            <div className="p-3.5 mb-4 rounded-xl bg-indigo-500/[0.05] ring-1 ring-indigo-500/15">
              <h4 className="mb-2 text-xs font-bold text-indigo-700">ตารางเวรจัดกลุ่มตามวัน:</h4>
              <div className="overflow-y-auto max-h-60 thin-scroll">
                {getScheduleByDate(generatedSchedule.schedule).map((daySchedule, index) => (
                  <div key={index} className="p-2.5 mb-3 bg-white rounded-xl ring-1 ring-gray-200/70">
                    <div className="mb-2 text-sm font-semibold text-gray-800">
                      {dayjs(daySchedule.date).format("dddd DD/MM/YYYY")}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {daySchedule.shifts.map((shift, shiftIndex) => (
                        <div key={shiftIndex} className="p-2 text-center rounded-lg bg-gray-50">
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
            <div className="p-3.5 mb-4 rounded-xl bg-sky-500/[0.05] ring-1 ring-sky-500/15">
              <h4 className="mb-2 text-xs font-bold text-sky-700">สถิติพนักงาน:</h4>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {Object.entries(generatedSchedule.staffStats).map(([userId, stats]) => (
                  <div key={userId} className="p-2.5 bg-white rounded-xl ring-1 ring-gray-200/70">
                    <div className="mb-1 text-xs text-gray-600">
                      ID: {userId.slice(-6)}
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">เวรทั้งหมด:</span> {stats.totalWorkload ?? 0} เวร
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
            <label className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl cursor-pointer transition-all ${
              replaceExisting ? "ring-2 ring-teal-500/70 bg-teal-600/[0.07]" : "ring-1 ring-gray-200 hover:ring-teal-300/70"
            }`}>
              <input
                type="checkbox"
                checked={replaceExisting}
                onChange={(e) => setReplaceExisting(e.target.checked)}
                className="w-4 h-4 accent-teal-700"
              />
              <span className="text-sm font-medium text-gray-700">
                แทนที่ตารางเวรที่มีอยู่ (จะลบเวรเดิมของแผนกนี้ในเดือนนี้ก่อนบันทึกใหม่)
              </span>
            </label>
          </div>

          {/* ปุ่มฟังก์ชันเพิ่มเติม */}
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={() => setShowOfficialTable(!showOfficialTable)}
              className="px-4 py-2 text-sm font-semibold text-violet-700 bg-white rounded-xl border shadow-sm transition-colors border-violet-200/80 hover:bg-violet-50 hover:border-violet-300"
            >
              {showOfficialTable ? "ซ่อนตารางทางการ" : "แสดงตารางทางการ"}
            </button>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 text-sm font-semibold text-teal-700 bg-white rounded-xl border shadow-sm transition-colors border-teal-200/80 hover:bg-teal-50 hover:border-teal-300"
            >
              🖨️ พิมพ์ตาราง
            </button>
          </div>

          {/* ปุ่มบันทึก */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowPreview(false)}
              className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl transition-colors hover:bg-gray-200"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleApplySchedule}
              disabled={applyLoading}
              className="px-6 py-2.5 btn-brand disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {applyLoading ? "กำลังบันทึก..." : "บันทึกตารางเวร"}
            </button>
          </div>
        </div>
      )}

      {/* ตารางทางการ */}
      {showOfficialTable && (
        <div className="p-5 mt-6 rounded-2xl ring-1 ring-gray-200">
          <h3 className="mb-4 text-base font-bold tracking-tight text-gray-900">ตารางการปฏิบัติงานแบบทางการ</h3>
          <div className="p-4 mb-4 rounded-xl bg-sky-500/[0.06] ring-1 ring-sky-500/15">
            <h4 className="mb-2 text-xs font-bold text-sky-700">📋 คำแนะนำ</h4>
            <ul className="space-y-1 text-sm text-gray-600">
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
    // ข้อจำกัดเดิม
    MAX_CONSECUTIVE_DAYS: `พนักงาน ID ${violation.userId} ทำงานติดต่อกันเกิน ${violation.current} วัน ในวันที่ ${violation.day}`,
    FORBIDDEN_CONSECUTIVE: `พนักงาน ID ${violation.userId} ไม่สามารถเวร ${violation.previous} ตามด้วย ${violation.current} ในวันที่ ${violation.day}`,
    MAX_SHIFTS_PER_MONTH: `พนักงาน ID ${violation.userId} เวรเกิน ${violation.current} เวรต่อเดือน ในวันที่ ${violation.day}`,
    
    // ข้อจำกัดใหม่สำหรับระบบ 2 กะ + On-Call
    DUPLICATE_SHIFT_REMOVED: `ลบเวรซ้ำของพนักงาน ID ${violation.userId} ในวันที่ ${violation.date} (เวร: ${violation.removedShift})`,
    INSUFFICIENT_REST: `พนักงาน ID ${violation.userId} พักผ่อนไม่เพียงพอในวันที่ ${violation.date} (ต้องการ: ${violation.requiredRest} ชม., ได้รับ: ${violation.actualRest} ชม.)`,
    INSUFFICIENT_STAFF: `ไม่พอบุคลากรสำหรับเวร ${violation.shift} ในวันที่ ${violation.date} (ต้องการ: ${violation.required}, ได้รับ: ${violation.assigned})`,
    
    // ข้อจำกัดกลุ่มบุคลากรพิเศษ
    SPECIAL_STAFF_VIOLATION: `กลุ่มบุคลากรพิเศษ ID ${violation.userId} ละเมิดข้อจำกัดในวันที่ ${violation.date}`,
    SPECIAL_WEEKEND_VIOLATION: `กลุ่มบุคลากรพิเศษ ID ${violation.userId} ทำงานในวันหยุดเสาร์-อาทิตย์ในวันที่ ${violation.date}`,
    
    // ข้อจำกัดทั่วไป
    MAX_NIGHT_SHIFTS: `พนักงาน ID ${violation.userId} เกินจำนวนเวรดึกที่กำหนด (สูงสุด: ${violation.maxNightPer14d} เวร/14 วัน)`,
    MAX_DOUBLE_SHIFTS: `พนักงาน ID ${violation.userId} เกินจำนวนเวรควบที่กำหนด (สูงสุด: ${violation.maxDoublePerMonth} เวร/เดือน)`,
    MAX_ONCALL_SHIFTS: `พนักงาน ID ${violation.userId} เกินจำนวน On-Call ที่กำหนด (สูงสุด: ${violation.maxOnCallPerMonth} ครั้ง/เดือน)`,
    CONSECUTIVE_ONCALL: `พนักงาน ID ${violation.userId} มี On-Call ติดกันในวันที่ ${violation.date}`,
    MAX_CONSECUTIVE_SAME: `พนักงาน ID ${violation.userId} มีเวร ${violation.shiftType} ติดกันเกิน ${violation.maxConsecutiveSame} ครั้ง`,
    INSUFFICIENT_DAYOFFS: `พนักงาน ID ${violation.userId} มีวันหยุดไม่เพียงพอ (ขั้นต่ำ: ${violation.minDayOffPer7d} วัน/7 วัน)`,
  };
  
  return messages[violation.type] || `ข้อจำกัด ${violation.type} สำหรับพนักงาน ID ${violation.userId || 'ไม่ระบุ'}`;
}

function getShiftName(shifId) {
  // Mapping สำหรับระบบเวร 2 กะ + On-Call
  const shiftMap = {
    // เวรหลัก
    "M": "M", // เช้า (Morning)
    "A": "A", // บ่าย (Afternoon) 
    "N": "N", // ดึก (Night)
    
    // เวรควบ
    "MA": "MA", // เช้า+บ่าย
    "NA": "NA", // ดึก+บ่าย
    
    // On-Call และวันหยุด
    "OC": "OC", // On-Call
    "OFF": "OFF", // วันหยุด
    
    // Legacy mapping (ถ้ายังมี)
    "66c74ecaaf47d3097ba9acb3": "M", // เช้า
    "66c74ecaaf47d3097ba9acb4": "A", // บ่าย
    "66c74ecaaf47d3097ba9acb5": "N", // ดึก
    "66c74ecaaf47d3097ba9acb6": "OFF", // วันหยุด
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