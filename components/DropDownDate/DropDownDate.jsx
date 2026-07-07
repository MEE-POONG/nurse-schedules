import { useSelector } from "react-redux";
import React from "react";
import { useDispatch } from "react-redux";
import { setMonth, setYear } from "store/dateSlice";
import { TbCalendar } from "react-icons/tb";

const MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

export default function DropDownDate() {
  const dispatch = useDispatch();
  const { dateStore } = useSelector((state) => ({ ...state }));

  const monthEN = dateStore.value.month + 1;
  const yearEN = dateStore.value.year;

  const yearInt = +yearEN;
  const year = 2022;

  const selectCls =
    "px-3.5 py-2 text-sm font-medium text-gray-700 bg-gray-50/80 rounded-xl border border-gray-200 transition-colors cursor-pointer hover:border-teal-400 hover:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white";

  return (
    <div className="inline-flex flex-wrap gap-3 items-center p-3.5 card">
      <span className="flex gap-2 items-center text-sm font-semibold text-gray-700">
        <span className="flex justify-center items-center w-8 h-8 text-teal-700 rounded-lg bg-teal-600/10">
          <TbCalendar size={18} />
        </span>
        เลือกเดือน
      </span>
      <select
        onChange={(event) => {
          dispatch(setMonth(event.target.value));
        }}
        defaultValue={+monthEN - 1}
        className={selectCls}
      >
        {MONTHS.map((name, value) => (
          <option key={value} value={value}>{name}</option>
        ))}
      </select>
      <select
        onChange={(event) => {
          dispatch(setYear(event.target.value));
        }}
        defaultValue={yearInt}
        className={selectCls}
      >
        {Array.from(new Array(5), (v, i) => (
          <option key={i} value={year + i}>
            {year + i + 543}
          </option>
        ))}
      </select>
    </div>
  );
}
