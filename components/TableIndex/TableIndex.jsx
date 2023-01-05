import dayFunction from "@/utils/day";
import React from "react";
import { useSelector } from "react-redux";
import DropDownDate from "../DropDownDate/DropDownDate";
import { TableCurrentMonth } from "../TableCurrentMonth/TableCurrentMonth";
import { TableSelectMonth } from "../TableSelectMonth/TableSelectMonth";

export default function TableIndex() {
  const { dateStore } = useSelector((state) => ({...state}))

  //function เช็คค่าวันที่
  const checkDateValue = (month,year) => {
    let monthValue;
    let yearValue;
    if (month == "" || year == "") {
      monthValue = ""
      yearValue = ""
    }else{
      monthValue = month
      yearValue = year
    }
    return {monthValue,yearValue}
  }

  const inputM = dateStore.value.month
  const inputY = dateStore.value.year
  const {monthValue,yearValue} = checkDateValue(inputM,inputY)
  const {daysInMonth,arrayDayInMonth,monthEN,yearEN,monthTH,yearTH} = dayFunction(monthValue,yearValue)
  return (
    <>
      <div className="text-center mt-6">
        <DropDownDate />
      </div>
      {inputM === "" || inputY === "" ? (
        <TableCurrentMonth daysInMonth={daysInMonth} arrayDayInMonth={arrayDayInMonth}  monthEN={monthEN} yearEN={yearEN} monthTH={monthTH} yearTH={yearTH}/>
      ) : (
        <TableSelectMonth daysInMonth={daysInMonth} arrayDayInMonth={arrayDayInMonth}  monthEN={monthEN} yearEN={yearEN} monthTH={monthTH} yearTH={yearTH} inputM={inputM} inputY={inputY}/>
      )}
    </>
  );
}
