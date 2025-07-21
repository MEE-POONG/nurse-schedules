import TableIndex from "@/components/TableIndex/TableIndex";
import MonthYearSelector from "@/components/MonthYearSelector/MonthYearSelector";
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
    <>
      <div className="my-5">
        <div className="text-center mt-10">
          <h1>สรุปยอดตารางเวรประจำเดือน {monthTH} พ.ศ. {yearTH}</h1>
        </div>
      </div>

      {/* เลือกเดือน/ปี */}
      <div className="max-w-4xl mx-auto px-4 mb-6">
        <MonthYearSelector
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthYearChange={handleMonthYearChange}
        />
      </div>

      <TableIndex month={selectedMonth} year={selectedYear} />
    </>
  );
}
