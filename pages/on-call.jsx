import DropDownDate from "@/components/DropDownDate/DropDownDate";
import { TableSelectMonthOnCall } from "@/components/OnCall/TableSelectMonth/TableSelectMonthOnCall";
import dayFunction from "@/utils/day";
import React from "react";
import { useSelector } from "react-redux";

export default function OnCallPage() {
  const { dateStore } = useSelector((state) => ({ ...state }))

  const monthValue = dateStore.value.month
  const yearValue = dateStore.value.year
  const { daysInMonth, arrayDayInMonth, monthEN, yearEN, monthTH, yearTH } = dayFunction(monthValue, yearValue)

  return (
    <>
      <div className="px-4 pt-7 mx-auto max-w-6xl sm:px-6">
        <div className="flex flex-wrap gap-x-3 gap-y-1 items-baseline mb-6">
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">ตารางเวร On-Call</h1>
          <span className="inline-flex items-center px-3 py-1 text-xs font-semibold text-teal-800 rounded-full bg-teal-600/10 ring-1 ring-teal-600/20">
            {monthTH} พ.ศ. {yearTH}
          </span>
        </div>
        <div className="mb-5">
          <DropDownDate />
        </div>
      </div>
      <TableSelectMonthOnCall daysInMonth={daysInMonth} arrayDayInMonth={arrayDayInMonth} monthEN={monthEN} yearEN={yearEN} monthTH={monthTH} yearTH={yearTH} monthValue={monthValue} yearValue={yearValue} />
    </>
  );
}
