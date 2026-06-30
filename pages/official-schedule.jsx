import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import "dayjs/locale/th";
import OfficialPrintTables from "@/components/OfficialScheduleTable/OfficialPrintTables";
import MonthYearSelector from "@/components/MonthYearSelector/MonthYearSelector";
import ExportExcelButton from "@/components/ExportExcelButton";
import { authProvider } from "src/authProvider";

dayjs.locale("th");

export default function OfficialSchedule() {
  const { dateStore } = useSelector((state) => ({ ...state }));
  const [selectedMonth, setSelectedMonth] = useState(dateStore.month || dayjs().month());
  const [selectedYear, setSelectedYear] = useState(dateStore.year || dayjs().year());

  useEffect(() => {
    if (authProvider.getIdentity()?.id === undefined) {
      authProvider.logout();
      window.location.href = "/login";
    }
  }, []);

  const handleMonthYearChange = (month, year) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  const monthTH = dayjs().month(selectedMonth).format("MMMM");
  const yearTH = (selectedYear + 543).toString();

  return (
    <div className="px-4 py-6 mx-auto max-w-6xl sm:px-6">
      {/* หัวข้อหน้า */}
      <div className="flex flex-wrap gap-3 justify-between items-center mb-5 no-print">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 sm:text-2xl">ตารางทางการ (ฟอร์มราชการ)</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            ประจำเดือน {monthTH} พ.ศ. {yearTH} · สำหรับพิมพ์ส่งราชการ
          </p>
        </div>
        <ExportExcelButton month={selectedMonth} year={selectedYear} />
      </div>

      {/* เลือกเดือน/ปี */}
      <div className="mb-5 no-print">
        <MonthYearSelector
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthYearChange={handleMonthYearChange}
        />
      </div>

      {/* ตารางฟอร์มราชการเดิม (มีปุ่มออกรายงาน/พิมพ์ในแต่ละตาราง) */}
      <OfficialPrintTables month={selectedMonth} year={selectedYear} />
    </div>
  );
}
