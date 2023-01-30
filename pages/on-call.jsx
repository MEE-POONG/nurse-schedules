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
      <div className="my-5">
        <div className="text-center mt-10">
          <h1>สรุปยอดตารางเวร ON - CALL</h1>
        </div>
      </div>

      <div className="text-center mt-6">
        <DropDownDate />
      </div>
      <TableSelectMonthOnCall daysInMonth={daysInMonth} arrayDayInMonth={arrayDayInMonth} monthEN={monthEN} yearEN={yearEN} monthTH={monthTH} yearTH={yearTH} monthValue={monthValue} yearValue={yearValue} />
    </>
  );
}
