import dayjs from "dayjs";
import { useDispatch } from "react-redux";
import { setMonth, setYear } from "store/dateSlice";
import { TbCalendar } from "react-icons/tb";

const MonthYearSelector = ({ selectedMonth, selectedYear, onMonthYearChange }) => {
  const dispatch = useDispatch();

  const months = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
  ];

  const currentYear = dayjs().year();
  const years = [];
  for (let year = currentYear - 2; year <= currentYear + 2; year++) years.push(year);

  const handleMonthChange = (month) => {
    const newMonth = parseInt(month);
    onMonthYearChange(newMonth, selectedYear);
    dispatch(setMonth(newMonth));
  };

  const handleYearChange = (year) => {
    const newYear = parseInt(year);
    onMonthYearChange(selectedMonth, newYear);
    dispatch(setYear(newYear));
  };

  const selectClass =
    "px-3.5 py-2 text-sm font-medium text-gray-700 bg-gray-50/80 rounded-xl border border-gray-200 transition-colors cursor-pointer hover:border-teal-400 hover:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white";

  return (
    <div className="flex flex-wrap gap-3 items-center p-3.5 card">
      <span className="flex gap-2 items-center text-sm font-semibold text-gray-700">
        <span className="flex justify-center items-center w-8 h-8 text-teal-700 rounded-lg bg-teal-600/10">
          <TbCalendar size={18} />
        </span>
        เลือกเดือน
      </span>
      <select value={selectedMonth} onChange={(e) => handleMonthChange(e.target.value)} className={selectClass}>
        {months.map((name, value) => (
          <option key={value} value={value}>{name}</option>
        ))}
      </select>
      <select value={selectedYear} onChange={(e) => handleYearChange(e.target.value)} className={selectClass}>
        {years.map((year) => (
          <option key={year} value={year}>{year + 543}</option>
        ))}
      </select>
      <span className="text-xs text-gray-400">มีผลกับข้อมูลทุกหน้า</span>
    </div>
  );
};

export default MonthYearSelector;
