import dayFunction from "@/utils/day";
import React from "react";
import { useSelector } from "react-redux";
import DropDownDate from "../DropDownDate/DropDownDate";
import { TableSelectMonth } from "../TableSelectMonth/TableSelectMonth";

export default function TableIndex() {
  const { dateStore } = useSelector((state) => ({...state}))

  const monthValue = dateStore.value.month
  const yearValue = dateStore.value.year
  const {daysInMonth,arrayDayInMonth,monthEN,yearEN,monthTH,yearTH} = dayFunction(monthValue,yearValue)
  
  return (
    <>
      <div className="text-center mt-6">
        <DropDownDate />
      </div>  
        <TableSelectMonth daysInMonth={daysInMonth} arrayDayInMonth={arrayDayInMonth}  monthEN={monthEN} yearEN={yearEN} monthTH={monthTH} yearTH={yearTH} monthValue={monthValue} yearValue={yearValue}/>
    </>
  );
}
