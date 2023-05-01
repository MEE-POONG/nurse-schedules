import dayFunction from "@/utils/day";
import React from "react";
import { useSelector } from "react-redux";
import DropDownDate from "../DropDownDate/DropDownDate";
import { TableSelectMonth } from "../TableSelectMonth/TableSelectMonth";
import { TableSelectMonthAF } from "../TableSelectMonth/TableSelectMonthAF";
import { TableSelectMonthOT } from "../TableSelectMonth/TableSelectMonthOT";
import { TableSelectMonthR } from "../TableSelectMonth/TableSelectMonthR";
import { TableSelectMonthRed } from "../TableSelectMonth/TableSelectMonthRed";

export default function TableIndex() {
  const { dateStore } = useSelector((state) => ({ ...state }))

  const monthValue = dateStore.value.month
  const yearValue = dateStore.value.year
  const { daysInMonth, arrayDayInMonth, monthEN, yearEN, monthTH, yearTH } = dayFunction(monthValue, yearValue)

  return (
    <>
      <div className="text-center mt-6">
        <DropDownDate />
      </div>
      <TableSelectMonth daysInMonth={daysInMonth} arrayDayInMonth={arrayDayInMonth} monthEN={monthEN} yearEN={yearEN} monthTH={monthTH} yearTH={yearTH} monthValue={monthValue} yearValue={yearValue} />
      <TableSelectMonthRed daysInMonth={daysInMonth} arrayDayInMonth={arrayDayInMonth} monthEN={monthEN} yearEN={yearEN} monthTH={monthTH} yearTH={yearTH} monthValue={monthValue} yearValue={yearValue} />
      <TableSelectMonthAF daysInMonth={daysInMonth} arrayDayInMonth={arrayDayInMonth} monthEN={monthEN} yearEN={yearEN} monthTH={monthTH} yearTH={yearTH} monthValue={monthValue} yearValue={yearValue} />
      <TableSelectMonthOT daysInMonth={daysInMonth} arrayDayInMonth={arrayDayInMonth} monthEN={monthEN} yearEN={yearEN} monthTH={monthTH} yearTH={yearTH} monthValue={monthValue} yearValue={yearValue} />
      <TableSelectMonthR daysInMonth={daysInMonth} arrayDayInMonth={arrayDayInMonth} monthEN={monthEN} yearEN={yearEN} monthTH={monthTH} yearTH={yearTH} monthValue={monthValue} yearValue={yearValue} />
    </>
  );
}
