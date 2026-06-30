import dayFunction from "@/utils/day";
import React, { useState } from "react";
import { useSelector } from "react-redux";

import { TableSelectMonth } from "../TableSelectMonth/TableSelectMonth";
import { TableSelectMonthAF } from "../TableSelectMonth/TableSelectMonthAF";
import { TableSelectMonthOT } from "../TableSelectMonth/TableSelectMonthOT";
import { TableSelectMonthR } from "../TableSelectMonth/TableSelectMonthR";
import { TableSelectMonthRed } from "../TableSelectMonth/TableSelectMonthRed";
import { TableSelectMonthAFC } from "../TableSelectMonth/TableSelectMonthAFC";
import { TableSelectMonthRF } from "../TableSelectMonth/TableSelectMonthRF";

import useAxios from "axios-hooks";

import { authProvider } from "src/authProvider";
import dayjs from "dayjs";
import LoadingComponent from "../LoadingComponent";
import ScheduleCalendar from "../ScheduleCalendar";

export default function TableIndex({ month, year }) {
  const { dateStore } = useSelector((state) => ({ ...state }));

  // ใช้ props ถ้ามี ถ้าไม่มีใช้ค่าจาก Redux store
  const monthValue = month !== undefined ? month : dateStore.value.month;
  const yearValue = year !== undefined ? year : dateStore.value.year;
  const { daysInMonth, arrayDayInMonth, monthEN, yearEN, monthTH, yearTH } =
    dayFunction(monthValue, yearValue);

  const [isMe, setIsMe] = useState(false);
  const handelCheckIsMe = () => setIsMe(true);
  const handelUnCheckIsMe = () => setIsMe(false);

  const [{ data, loading }] = useAxios(
    {
      url: `/api/user/selectMonth?month=${monthValue}&year=${yearValue}`,
      method: "GET",
    },
    {
      autoCancel: false,
    }
  );

  return isMe ? (
    <>
      <div className="flex justify-center items-center pb-10">
        <button
          onClick={handelUnCheckIsMe}
          className="inline-flex items-center px-5 py-2 mt-6 font-bold text-white bg-green-600 rounded-xl shadow hover:bg-green-700"
        >
          <span className="mx-2">📋 แสดงแบบตาราง</span>
        </button>
      </div>

      {loading ? <LoadingComponent /> : <></>}

      <div className="px-2 my-6">
        <ScheduleCalendar data={data} month={monthValue} year={yearValue} />
      </div>
    </>
  ) : (
    <>
      <div className="flex justify-center items-center pb-24">
        <button
          onClick={handelCheckIsMe}
          className="inline-flex items-center px-5 py-2 mt-6 font-bold text-white bg-green-600 rounded-xl shadow hover:bg-green-700"
        >
          <span className="mx-2">📅 แสดงแบบปฏิทิน</span>
        </button>
      </div>


      <TableSelectMonth
        daysInMonth={daysInMonth}
        arrayDayInMonth={arrayDayInMonth}
        monthEN={monthEN}
        yearEN={yearEN}
        monthTH={monthTH}
        yearTH={yearTH}
        monthValue={monthValue}
        yearValue={yearValue}
      />
      <TableSelectMonthRed
        daysInMonth={daysInMonth}
        arrayDayInMonth={arrayDayInMonth}
        monthEN={monthEN}
        yearEN={yearEN}
        monthTH={monthTH}
        yearTH={yearTH}
        monthValue={monthValue}
        yearValue={yearValue}
      />
      <TableSelectMonthAF
        daysInMonth={daysInMonth}
        arrayDayInMonth={arrayDayInMonth}
        monthEN={monthEN}
        yearEN={yearEN}
        monthTH={monthTH}
        yearTH={yearTH}
        monthValue={monthValue}
        yearValue={yearValue}
      />
      <TableSelectMonthAFC
        daysInMonth={daysInMonth}
        arrayDayInMonth={arrayDayInMonth}
        monthEN={monthEN}
        yearEN={yearEN}
        monthTH={monthTH}
        yearTH={yearTH}
        monthValue={monthValue}
        yearValue={yearValue}
      />
      <TableSelectMonthOT
        daysInMonth={daysInMonth}
        arrayDayInMonth={arrayDayInMonth}
        monthEN={monthEN}
        yearEN={yearEN}
        monthTH={monthTH}
        yearTH={yearTH}
        monthValue={monthValue}
        yearValue={yearValue}
      />
      <TableSelectMonthR
        daysInMonth={daysInMonth}
        arrayDayInMonth={arrayDayInMonth}
        monthEN={monthEN}
        yearEN={yearEN}
        monthTH={monthTH}
        yearTH={yearTH}
        monthValue={monthValue}
        yearValue={yearValue}
      />
      <TableSelectMonthRF
        daysInMonth={daysInMonth}
        arrayDayInMonth={arrayDayInMonth}
        monthEN={monthEN}
        yearEN={yearEN}
        monthTH={monthTH}
        yearTH={yearTH}
        monthValue={monthValue}
        yearValue={yearValue}
      />
    </>
  );
}
