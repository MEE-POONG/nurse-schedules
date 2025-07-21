import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import Layout from "@/components/Layout/Layout";
import AutoSchedulePanel from "@/components/AutoSchedule/AutoSchedulePanel";
import StaffAssignmentPanel from "@/components/StaffAssignment/StaffAssignmentPanel";
import MonthYearSelector from "@/components/MonthYearSelector/MonthYearSelector";
import useAxios from "axios-hooks";
import { authProvider } from "src/authProvider";

export default function AutoSchedulePage() {
  const { dateStore } = useSelector((state) => ({ ...state }));
  const [selectedLocation, setSelectedLocation] = useState("");
  const [activeTab, setActiveTab] = useState("staff-assignment");
  const [selectedMonth, setSelectedMonth] = useState(dateStore.month || dayjs().month());
  const [selectedYear, setSelectedYear] = useState(dateStore.year || dayjs().year());
  
  const currentUser = authProvider.getIdentity();
  
  // ตรวจสอบสิทธิ์
  useEffect(() => {
    if (!currentUser?.isAdmin) {
      window.location.href = "/";
    }
  }, [currentUser]);

  // ดึงข้อมูลแผนก
  const [{ data: locations, loading: locationsLoading }] = useAxios({
    url: "/api/location",
    method: "GET"
  });

  const monthTH = dayjs().month(selectedMonth).format("MMMM");
  const yearTH = (selectedYear + 543).toString();

  const handleMonthYearChange = (month, year) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  if (!currentUser?.isAdmin) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-red-600">ไม่มีสิทธิ์เข้าถึง</h1>
          <p>หน้านี้สำหรับผู้ดูแลระบบเท่านั้น</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 min-h-screen bg-gray-50">
      <div className="px-4 mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            ระบบจัดตารางเวรอัตโนมัติ
          </h1>
          <p className="text-gray-600">
            ประจำเดือน {monthTH} พ.ศ. {yearTH}
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px space-x-8">
              <button
                onClick={() => setActiveTab("staff-assignment")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "staff-assignment"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                1. จัดพนักงานเข้าแผนก
              </button>
              <button
                onClick={() => setActiveTab("auto-schedule")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "auto-schedule"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                2. จัดตารางเวรอัตโนมัติ
              </button>
            </nav>
          </div>
        </div>

        {/* เลือกเดือน/ปี */}
        <MonthYearSelector
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthYearChange={handleMonthYearChange}
        />

        {/* เลือกแผนก - แสดงเฉพาะใน tab จัดตารางเวร */}
        {activeTab === "auto-schedule" && (
          <div className="p-6 mb-6 bg-white rounded-lg shadow-md">
            <h2 className="mb-4 text-lg font-medium">เลือกแผนกที่ต้องการจัดตาราง</h2>
            <div className="max-w-md">
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- เลือกแผนก --</option>
                {locations?.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* คำแนะนำการใช้งาน */}
        <div className="p-6 mb-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="mb-3 text-lg font-medium text-blue-800">วิธีการใช้งาน</h3>
          <div className="space-y-2 text-sm text-blue-700">
            <div className="flex items-start">
              <span className="w-6 h-6 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
              <p>เลือกแผนกที่ต้องการจัดตารางเวรอัตโนมัติ</p>
            </div>
            <div className="flex items-start">
              <span className="w-6 h-6 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
              <p>ระบบจะพิจารณาการจองเวรของพนักงานและจัดตารางให้เป็นธรรม</p>
            </div>
            <div className="flex items-start">
              <span className="w-6 h-6 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
              <p>ตรวจสอบตัวอย่างตารางและข้อจำกัดที่อาจละเมิด</p>
            </div>
            <div className="flex items-start">
              <span className="w-6 h-6 bg-blue-200 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</span>
              <p>เลือกว่าจะเพิ่มเวรใหม่หรือแทนที่เวรเดิม แล้วบันทึก</p>
            </div>
          </div>
        </div>

        {/* ข้อจำกัดที่ระบบปฏิบัติ */}
        <div className="p-6 mb-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="mb-3 text-lg font-medium text-gray-800">ข้อจำกัดที่ระบบปฏิบัติ</h3>
          <div className="grid gap-4 text-sm text-gray-700 md:grid-cols-2">
            <div>
              <h4 className="mb-2 font-medium">ความปลอดภัยในการทำงาน:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>ไม่เวรดึกตามด้วยเวรเช้าวันถัดไป</li>
                <li>ไม่เวรบ่ายตามด้วยเวรเช้าวันถัดไป</li>
                <li>ไม่ทำงานติดต่อกันเกิน 5 วัน</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-medium">ความเป็นธรรม:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>กระจายจำนวนเวรให้เท่าเทียมกัน</li>
                <li>หมุนเวียนเวรหนัก (บ่าย/ดึก) อย่างเป็นธรรม</li>
                <li>เคารพการจองเวรของพนักงาน</li>
                <li>จำกัดเวรต่อเดือนไม่เกิน 22 เวร</li>
              </ul>
            </div>
          </div>
        </div>

        {/* แสดงเนื้อหาตาม Tab */}
        {activeTab === "staff-assignment" && (
          <StaffAssignmentPanel
            month={selectedMonth}
            year={selectedYear}
            onAssignmentComplete={() => {
              alert("จัดพนักงานเข้าแผนกเรียบร้อยแล้ว สามารถไปจัดตารางเวรได้");
              setActiveTab("auto-schedule");
            }}
          />
        )}

        {activeTab === "auto-schedule" && (
          <>
            {/* ส่วนจัดตารางอัตโนมัติ */}
            {selectedLocation && (
              <AutoSchedulePanel
                month={selectedMonth}
                year={selectedYear}
                locationId={selectedLocation}
                onScheduleGenerated={() => {
                  // รีเฟรชหน้าหรือแสดงข้อความสำเร็จ
                  alert("ตารางเวรได้รับการอัพเดทแล้ว กรุณาตรวจสอบในหน้าตารางเวรหลัก");
                }}
              />
            )}

            {!selectedLocation && (
              <div className="p-12 text-center bg-white rounded-lg shadow-md">
                <div className="mb-4 text-gray-400">
                  <svg className="mx-auto w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-medium text-gray-900">เลือกแผนกเพื่อเริ่มต้น</h3>
                <p className="text-gray-500">
                  กรุณาเลือกแผนกที่ต้องการจัดตารางเวรอัตโนมัติ
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

AutoSchedulePage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};