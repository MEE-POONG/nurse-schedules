import { useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { TbChevronLeft, TbChevronRight } from "react-icons/tb";
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
    <div className="px-4 py-7 mx-auto max-w-3xl sm:px-6">
      <h1 className="mb-1 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">จองเวร</h1>
      <p className="mb-6 text-sm text-gray-500">
        เลือกวันแล้วกดสัญลักษณ์ <span className="font-medium">🔖</span> เพื่อจองกะที่ต้องการ —
        ระบบจัดตารางอัตโนมัติจะพยายามจัดตามที่จองไว้
      </p>

      {/* นำทางเดือน */}
      <div className="flex justify-between items-center p-2.5 mb-4 card">
        <button
          onClick={() => setRefDate(refDate.subtract(1, "month"))}
          className="flex gap-1 items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-xl transition-colors hover:bg-teal-50 hover:text-teal-700"
        >
          <TbChevronLeft size={18} /> ก่อนหน้า
        </button>
        <div className="text-lg font-bold tracking-tight text-gray-900">
          {monthTH} {yearTH}
        </div>
        <button
          onClick={() => setRefDate(refDate.add(1, "month"))}
          className="flex gap-1 items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-xl transition-colors hover:bg-teal-50 hover:text-teal-700"
        >
          ถัดไป <TbChevronRight size={18} />
        </button>
      </div>

      {/* คำอธิบายสัญลักษณ์ */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 px-4 py-2.5 mb-4 text-xs text-gray-600 rounded-xl bg-white/70 ring-1 ring-gray-200/60">
        <span className="flex gap-1.5 items-center"><span className="text-gray-400">🔖</span> ยังไม่จอง</span>
        <span className="flex gap-1.5 items-center"><span className="text-blue-600">🔖</span> ระบุความต้องการ</span>
        <span className="flex gap-1.5 items-center"><span className="text-green-600">🔖</span> จองแน่นอน</span>
      </div>

      {/* ปฏิทิน */}
      <div className="p-4 card">
        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {WEEKDAYS.map((d, i) => (
            <div
              key={d}
              className={`text-center text-[11px] font-bold tracking-wide py-1.5 rounded-lg ${
                i === 0 || i === 6 ? "text-rose-500 bg-rose-50/70" : "text-gray-500 bg-gray-50/80"
              }`}
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="rounded-xl bg-gray-50/40" />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
            <div
              key={day}
              className={`flex flex-col items-center justify-between rounded-xl p-1.5 min-h-[64px] transition-colors ${
                isWeekend(day)
                  ? "bg-rose-50/60 ring-1 ring-rose-100 hover:ring-rose-200"
                  : "bg-white ring-1 ring-gray-200/70 hover:ring-teal-300/70 hover:shadow-sm"
              }`}
            >
              <div className="text-xs font-semibold text-gray-500">{day}</div>
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
  );
}
