import { useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/th";
import ReservationButton from "@/components/ShiftReservation/ReservationButton";

dayjs.locale("th");

const WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

export default function ReservationPage() {
  // ค่าเริ่มต้น = เดือนหน้า (จองเวรล่วงหน้า)
  const [refDate, setRefDate] = useState(dayjs().add(1, "month").startOf("month"));
  const [refresh, setRefresh] = useState(0);

  const month = refDate.month();
  const year = refDate.year();
  const daysInMonth = refDate.daysInMonth();
  const firstDayOfWeek = refDate.day(); // 0=อาทิตย์
  const monthTH = refDate.format("MMMM");
  const yearTH = year + 543;

  const isWeekend = (day) => {
    const dow = refDate.date(day).day();
    return dow === 0 || dow === 6;
  };

  return (
    <div className="py-8 min-h-screen bg-gray-50">
      <div className="px-4 mx-auto max-w-3xl">
        <h1 className="mb-1 text-2xl font-bold text-gray-900">จองเวร</h1>
        <p className="mb-5 text-sm text-gray-600">
          เลือกวันแล้วกดสัญลักษณ์ <span className="font-medium">🔖</span> เพื่อจองกะที่ต้องการ —
          ระบบจัดตารางอัตโนมัติจะพยายามจัดตามที่จองไว้
        </p>

        {/* นำทางเดือน */}
        <div className="flex justify-between items-center p-3 mb-3 bg-white rounded-xl border shadow-sm">
          <button
            onClick={() => setRefDate(refDate.subtract(1, "month"))}
            className="px-3 py-1 text-gray-600 rounded-lg hover:bg-gray-100"
          >
            ‹ ก่อนหน้า
          </button>
          <div className="text-lg font-semibold text-gray-800">
            {monthTH} {yearTH}
          </div>
          <button
            onClick={() => setRefDate(refDate.add(1, "month"))}
            className="px-3 py-1 text-gray-600 rounded-lg hover:bg-gray-100"
          >
            ถัดไป ›
          </button>
        </div>

        {/* คำอธิบายสัญลักษณ์ */}
        <div className="flex flex-wrap gap-4 px-1 mb-3 text-xs text-gray-600">
          <span className="flex gap-1 items-center"><span className="text-gray-400">🔖</span> ยังไม่จอง</span>
          <span className="flex gap-1 items-center"><span className="text-blue-600">🔖</span> ระบุความต้องการ</span>
          <span className="flex gap-1 items-center"><span className="text-green-600">🔖</span> จองแน่นอน</span>
        </div>

        {/* ปฏิทิน */}
        <div className="p-3 bg-white rounded-xl border shadow-sm">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((d, i) => (
              <div key={d} className={`text-center text-xs font-medium py-1 ${i === 0 || i === 6 ? "text-red-500" : "text-gray-500"}`}>
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
              <div
                key={day}
                className={`flex flex-col items-center justify-between rounded-lg border p-1 min-h-[60px] ${
                  isWeekend(day) ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"
                }`}
              >
                <div className="text-sm font-medium text-gray-700">{day}</div>
                <ReservationButton
                  key={`${day}-${refresh}`}
                  day={day}
                  month={month}
                  year={year}
                  onReservationUpdate={() => setRefresh((r) => r + 1)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
