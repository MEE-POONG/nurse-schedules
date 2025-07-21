import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { useDispatch } from "react-redux";
import { setMonth, setYear } from "store/dateSlice";

const MonthYearSelector = ({ selectedMonth, selectedYear, onMonthYearChange }) => {
  const dispatch = useDispatch();

  const months = [
    { value: 0, name: "มกราคม" },
    { value: 1, name: "กุมภาพันธ์" },
    { value: 2, name: "มีนาคม" },
    { value: 3, name: "เมษายน" },
    { value: 4, name: "พฤษภาคม" },
    { value: 5, name: "มิถุนายน" },
    { value: 6, name: "กรกฎาคม" },
    { value: 7, name: "สิงหาคม" },
    { value: 8, name: "กันยายน" },
    { value: 9, name: "ตุลาคม" },
    { value: 10, name: "พฤศจิกายน" },
    { value: 11, name: "ธันวาคม" }
  ];

  const currentYear = dayjs().year();
  const years = [];
  for (let year = currentYear - 2; year <= currentYear + 2; year++) {
    years.push(year);
  }

  const handleMonthChange = (month) => {
    const newMonth = parseInt(month);
    onMonthYearChange(newMonth, selectedYear);
    
    // อัพเดท Redux store ด้วย
    dispatch(setMonth(newMonth));
  };

  const handleYearChange = (year) => {
    const newYear = parseInt(year);
    onMonthYearChange(selectedMonth, newYear);
    
    // อัพเดท Redux store ด้วย
    dispatch(setYear(newYear));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-lg font-medium mb-4">เลือกเดือนและปีที่ต้องการจัดตาราง</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            เดือน
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {months.map(month => (
              <option key={month.value} value={month.value}>
                {month.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ปี (พ.ศ.)
          </label>
          <select
            value={selectedYear}
            onChange={(e) => handleYearChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {years.map(year => (
              <option key={year} value={year}>
                {year + 543}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <p className="text-sm text-blue-700">
          <strong>เดือนที่เลือก:</strong> {months.find(m => m.value === selectedMonth)?.name} พ.ศ. {selectedYear + 543}
        </p>
        <p className="text-xs text-blue-600 mt-1">
          หมายเหตุ: การเปลี่ยนเดือน/ปีจะส่งผลต่อการแสดงข้อมูลในทุกหน้า
        </p>
      </div>
    </div>
  );
};

export default MonthYearSelector;