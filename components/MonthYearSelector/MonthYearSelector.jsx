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
    "px-3 py-2 text-sm bg-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500";

  return (
    <div className="flex flex-wrap gap-3 items-center p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
      <span className="flex gap-1.5 items-center text-sm font-medium text-gray-600">
        <TbCalendar size={18} className="text-teal-700" /> เลือกเดือน
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
