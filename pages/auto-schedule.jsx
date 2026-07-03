// หน้าจัดตารางเวรอัตโนมัติ (ระบบใหม่ — กติกาสกัดจากข้อมูลการขึ้นเวรจริง ดู AUTO_SCHEDULE.md)
// การจัดพนักงานเข้าแผนกทำที่หน้าตารางเวรหลักผ่านปุ่ม "จัดคนขึ้นเวร" (AddStaffModal → /api/user-duty)
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import Layout from "@/components/Layout/Layout";
import AutoSchedulePanel from "@/components/AutoSchedule/AutoSchedulePanel";
import MonthYearSelector from "@/components/MonthYearSelector/MonthYearSelector";
import useAxios from "axios-hooks";
import { authProvider } from "src/authProvider";
import { TbWand, TbInfoCircle } from "react-icons/tb";

export default function AutoSchedulePage() {
  const { dateStore } = useSelector((state) => ({ ...state }));
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(dateStore.month ?? dayjs().month());
  const [selectedYear, setSelectedYear] = useState(dateStore.year || dayjs().year());

  const currentUser = authProvider.getIdentity();

  // หน้านี้สำหรับแอดมินเท่านั้น
  useEffect(() => {
    if (!currentUser?.isAdmin) {
      window.location.href = "/";
    }
  }, [currentUser]);

  const [{ data: locations }] = useAxios({ url: "/api/location", method: "GET" });

  // เลือกแผนกแรกให้อัตโนมัติเมื่อโหลดเสร็จ (ส่วนใหญ่มีแผนกเดียว)
  useEffect(() => {
    if (!selectedLocation && locations?.length) setSelectedLocation(locations[0].id);
  }, [locations, selectedLocation]);

  const monthTH = dayjs().month(selectedMonth).format("MMMM");
  const yearTH = (selectedYear + 543).toString();

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
    <div className="px-3 py-4 mx-auto space-y-4 max-w-6xl sm:px-4 sm:py-6">
      <div>
        <h1 className="flex gap-2 items-center text-xl font-bold text-gray-900 sm:text-2xl">
          <TbWand className="text-teal-700" size={26} />
          จัดตารางเวรอัตโนมัติ
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          ประจำเดือน {monthTH} พ.ศ. {yearTH} — กติกาสกัดจากข้อมูลการขึ้นเวรจริงของหอผู้ป่วย
        </p>
      </div>

      <MonthYearSelector
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthYearChange={(m, y) => {
          setSelectedMonth(m);
          setSelectedYear(y);
        }}
      />

      {/* เลือกแผนก */}
      <div className="flex flex-wrap gap-3 items-center p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
        <span className="text-sm font-medium text-gray-600">แผนก</span>
        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className="px-3 py-2 text-sm bg-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          {!locations?.length && <option value="">กำลังโหลด…</option>}
          {locations?.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
        <span className="flex gap-1 items-center text-xs text-gray-400">
          <TbInfoCircle size={14} />
          เพิ่ม/ย้ายพนักงานเข้าแผนกได้ที่หน้าตารางเวร ปุ่ม &quot;จัดคนขึ้นเวร&quot;
        </span>
      </div>

      {/* ขั้นตอน + กติกา (ย่อ) */}
      <div className="p-4 text-sm text-gray-600 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="mb-2 font-semibold text-gray-800">ขั้นตอน</h4>
            <ol className="space-y-1 list-decimal list-inside">
              <li>กรอกวันลา/อบรม/เวรที่ตกลงกันไว้ในตารางเวรก่อน — ระบบจะไม่แตะช่องเหล่านั้น</li>
              <li>กดสร้างพรีวิว ตรวจตาราง ความสมดุล และคำเตือน (ยังไม่บันทึกจริง)</li>
              <li>เลือกเติมเฉพาะช่องว่าง หรือล้างเวรเดิมแล้วแทนที่ แล้วกดบันทึก</li>
            </ol>
          </div>
          <div>
            <h4 className="mb-2 font-semibold text-gray-800">กติกาบังคับ (จากแนวปฏิบัติจริง)</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>บ่ายวันก่อน ห้ามต่อดึกวันถัดไป (นับข้ามเดือนด้วย)</li>
              <li>เวรควบเฉพาะ เช้า+บ่าย และ ดึก+บ่าย · ดึกติดกันไม่เกิน 3 คืน</li>
              <li>หัวหน้าหอขึ้นเฉพาะเวรเช้า (เสาร์–อาทิตย์เป็น OT)</li>
              <li>สมดุลเวรรวม/ดึก/OT/งานเสาร์–อาทิตย์ ให้ใกล้เคียงกันทุกคน</li>
            </ul>
          </div>
        </div>
      </div>

      {selectedLocation ? (
        <AutoSchedulePanel month={selectedMonth} year={selectedYear} locationId={selectedLocation} />
      ) : (
        <div className="p-10 text-center text-gray-400 bg-white rounded-xl border border-gray-200 shadow-sm">
          เลือกแผนกเพื่อเริ่มต้น
        </div>
      )}
    </div>
  );
}

AutoSchedulePage.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};
