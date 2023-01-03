import { TableCurrentMonth } from "@/components/TableCurrentMonth/TableCurrentMonth";
import dayFunction from "@/utils/day";
import React from "react";
import DropDownDate from "../DropDownDate/DropDownDate";
import { TableSelectMonth } from "../TableSelectMonth/TableSelectMonth";
const inputM = 1;
const inputY = 2023;

const {daysInMonth,arrayDayInMonth,monthEN,yearEN,monthTH,yearTH} = dayFunction(inputM,inputY)

export default function TableIndex() {
  return (
    <>
      <div className="text-center mt-6">
        <DropDownDate/>
      </div>
      {inputM === '' || inputY === '' ? (
        <TableCurrentMonth daysInMonth={daysInMonth} arrayDayInMonth={arrayDayInMonth}  monthEN={monthEN} yearEN={yearEN} monthTH={monthTH} yearTH={yearTH}/>
      ) : (
        <TableSelectMonth daysInMonth={daysInMonth} arrayDayInMonth={arrayDayInMonth}  monthEN={monthEN} yearEN={yearEN} monthTH={monthTH} yearTH={yearTH} inputM={inputM} inputY={inputY}/>
      )}
    </>
  );
}
