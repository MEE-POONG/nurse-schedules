import TableIndex from "@/components/TableIndex/TableIndex";
import MonthYearSelector from "@/components/MonthYearSelector/MonthYearSelector";
import FairnessSummaryCard from "@/components/Fairness/FairnessSummaryCard";
import TodayBoard from "@/components/Home/TodayBoard";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { authProvider } from "src/authProvider";

export default function Home() {
  const { dateStore } = useSelector((state) => ({ ...state }));
  const [selectedMonth, setSelectedMonth] = useState(dateStore.month || dayjs().month());
  const [selectedYear, setSelectedYear] = useState(dateStore.year || dayjs().year());

  useEffect(() => {
    if (authProvider.getIdentity().id === undefined) {
      authProvider.logout();
      window.location.href = "/login";
    }
  })

  const handleMonthYearChange = (month, year) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  const monthTH = dayjs().month(selectedMonth).format("MMMM");
  const yearTH = (selectedYear + 543).toString();

  return (
    <div className="px-4 py-6 mx-auto max-w-6xl sm:px-6">
      {/* หัวข้อหน้า */}
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-gray-800 sm:text-2xl">สรุปยอดตารางเวร</h1>
        <p className="mt-0.5 text-sm text-gray-500">ประจำเดือน {monthTH} พ.ศ. {yearTH}</p>
      </div>

      {/* เลือกเดือน/ปี */}
      <div className="mb-5">
        <MonthYearSelector
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthYearChange={handleMonthYearChange}
        />
      </div>

      {/* เวรของฉัน + เข้าเวรวันนี้ */}
      <div className="mb-5">
        <TodayBoard month={selectedMonth} year={selectedYear} />
      </div>

      {/* การ์ดสรุปความเป็นธรรมแบบย่อ */}
      <div className="mb-5">
        <FairnessSummaryCard month={selectedMonth} year={selectedYear} />
      </div>

      <TableIndex month={selectedMonth} year={selectedYear} />
    </div>
  );
}
