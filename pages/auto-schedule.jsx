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
    <div className="py-7 min-h-screen">
      <div className="px-4 mx-auto max-w-6xl sm:px-6">
        <div className="flex flex-wrap gap-x-3 gap-y-1 items-baseline mb-6">
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
            ระบบจัดตารางเวรอัตโนมัติ
          </h1>
          <span className="inline-flex items-center px-3 py-1 text-xs font-semibold text-teal-800 rounded-full bg-teal-600/10 ring-1 ring-teal-600/20">
            {monthTH} พ.ศ. {yearTH}
          </span>
        </div>

        {/* Tabs */}
        <div className="inline-flex p-1 mb-6 bg-white rounded-xl border shadow-sm border-gray-200/80">
          {[
            { key: "staff-assignment", label: "1. จัดพนักงานเข้าแผนก" },
            { key: "auto-schedule", label: "2. จัดตารางเวรอัตโนมัติ" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 text-sm rounded-lg transition-all ${
                activeTab === t.key
                  ? "text-white font-semibold bg-gradient-to-r from-teal-600 to-teal-500 shadow-md shadow-teal-600/30"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* เลือกเดือน/ปี */}
        <div className="mb-5">
        <MonthYearSelector
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthYearChange={handleMonthYearChange}
        />
        </div>

        {/* เลือกแผนก - แสดงเฉพาะใน tab จัดตารางเวร */}
        {activeTab === "auto-schedule" && (
          <div className="p-5 mb-5 card">
            <h2 className="flex gap-2 items-center mb-3 text-sm font-bold text-gray-800">
              <span className="w-1 h-4 rounded-full bg-gradient-to-b from-teal-500 to-emerald-500" />
              เลือกแผนกที่ต้องการจัดตาราง
            </h2>
            <div className="max-w-md">
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="px-3.5 py-2.5 w-full text-sm font-medium text-gray-700 bg-gray-50/80 rounded-xl border border-gray-200 transition-colors cursor-pointer hover:border-teal-400 hover:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white"
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
        <div className="grid grid-cols-1 gap-4 mb-5 lg:grid-cols-2">
          <div className="p-5 card">
            <h3 className="flex gap-2 items-center mb-3 text-sm font-bold text-gray-800">
              <span className="w-1 h-4 rounded-full bg-gradient-to-b from-sky-500 to-blue-500" />
              วิธีการใช้งาน
            </h3>
            <div className="space-y-2.5 text-sm text-gray-600">
              {[
                "เลือกแผนกที่ต้องการจัดตารางเวรอัตโนมัติ",
                "ระบบจะพิจารณาการจองเวรของพนักงานและจัดตารางให้สมดุล",
                "ตรวจสอบตัวอย่างตารางและข้อจำกัดที่อาจละเมิด",
                "เลือกว่าจะเพิ่มเวรใหม่หรือแทนที่เวรเดิม แล้วบันทึก",
              ].map((step, i) => (
                <div key={i} className="flex items-start">
                  <span className="flex justify-center items-center mr-3 w-6 h-6 text-xs font-bold text-sky-700 rounded-full bg-sky-500/10 ring-1 ring-sky-500/20 shrink-0">
                    {i + 1}
                  </span>
                  <p className="leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ข้อจำกัดที่ระบบปฏิบัติ */}
          <div className="p-5 card">
            <h3 className="flex gap-2 items-center mb-3 text-sm font-bold text-gray-800">
              <span className="w-1 h-4 rounded-full bg-gradient-to-b from-teal-500 to-emerald-500" />
              ข้อจำกัดที่ระบบปฏิบัติ
            </h3>
            <div className="grid gap-4 text-sm text-gray-600 sm:grid-cols-2">
              <div>
                <h4 className="mb-2 text-xs font-bold tracking-wide text-gray-500">ความปลอดภัยในการทำงาน</h4>
                <ul className="space-y-1.5">
                  {["ไม่เวรดึกตามด้วยเวรเช้าวันถัดไป", "ไม่เวรบ่ายตามด้วยเวรเช้าวันถัดไป", "ไม่ทำงานติดต่อกันเกิน 5 วัน"].map((r) => (
                    <li key={r} className="flex gap-2 items-start">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="mb-2 text-xs font-bold tracking-wide text-gray-500">ความสมดุลภาระงาน</h4>
                <ul className="space-y-1.5">
                  {["กระจายจำนวนเวรให้เท่าเทียมกัน", "หมุนเวียนเวรหนัก (บ่าย/ดึก) อย่างสมดุล", "เคารพการจองเวรของพนักงาน", "จำกัดเวรต่อเดือนไม่เกิน 22 เวร"].map((r) => (
                    <li key={r} className="flex gap-2 items-start">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
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
              <div className="p-14 text-center card">
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