import dayFunction from "@/utils/day";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import DropDownDate from "../DropDownDate/DropDownDate";
import { TableSelectMonth } from "../TableSelectMonth/TableSelectMonth";
import { TableSelectMonthAF } from "../TableSelectMonth/TableSelectMonthAF";
import { TableSelectMonthOT } from "../TableSelectMonth/TableSelectMonthOT";
import { TableSelectMonthR } from "../TableSelectMonth/TableSelectMonthR";
import { TableSelectMonthRed } from "../TableSelectMonth/TableSelectMonthRed";
import { TableSelectMonthAFC } from "../TableSelectMonth/TableSelectMonthAFC";
import { TableSelectMonthRF } from "../TableSelectMonth/TableSelectMonthRF";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid"; // a plugin!
import useAxios from "axios-hooks";

import { authProvider } from "src/authProvider";
import dayjs from "dayjs";
import LoadingComponent from "../LoadingComponent";

export default function TableIndex() {
  const { dateStore } = useSelector((state) => ({ ...state }));

  const monthValue = dateStore.value.month;
  const yearValue = dateStore.value.year;
  const { daysInMonth, arrayDayInMonth, monthEN, yearEN, monthTH, yearTH } =
    dayFunction(monthValue, yearValue);

  const [isMe, setIsMe] = useState(true);
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
          className="bg-white hover:bg-white text-black font-bold mt-6 -mb-10 py-2 px-4 rounded-xl inline-flex items-center"
        >
          <span className="mx-2">แสดงแบบตาราง</span>
        </button>
      </div>

      {loading ? <LoadingComponent /> : <></>}

      <div className="w-100 bg-[#d5a5a5] shadow-xl p-5 my-10 rounded-md overflow-x-auto">
        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          titleFormat={{
            year: "numeric",
            month: "long",
            day: "numeric",
          }}
          headerToolbar={{
            start: "title",
            center: "",
            end: "",
          }}
          events={data
            ?.find((e) => e.id === authProvider.getIdentity().id)
            ?.Duty?.map((e) => {
              return {
                date: dayjs(e.datetime).format("YYYY-MM-DD"),
                title: " - " + e.Shif?.name + " - ",
                textColor:
                  e.Shif?.name === "R"
                    ? "#CC0000"
                    : e.Shif?.name === "x"
                    ? "#CC0000"
                    : e.Shif?.name === "R"
                    ? "#CC0000"
                    : e.Shif?.class === "circle-dark"
                    ? "#0F0F0F"
                    : e.Shif?.class === "circle-red"
                    ? "#CC0000"
                    : e.Shif?.class === "circle-blue"
                    ? "#0000ff"
                    : "#000000",
                borderColor:
                  e.Shif?.name === "R"
                    ? "#CC0000"
                    : e.Shif?.class === "circle-dark"
                    ? "#0F0F0F"
                    : e.Shif?.class === "circle-red"
                    ? "#CC0000"
                    : e.Shif?.class === "circle-blue"
                    ? "#0000ff"
                    : "#FFFFFF",
                backgroundColor: "#FFFFFF",
              };
            })}
        />
      </div>
    </>
  ) : (
    <>
      <div className="flex justify-center items-center pb-24">
        <button
          onClick={handelCheckIsMe}
          className="bg-white hover:bg-white text-black font-bold mt-6 -mb-10 py-2 px-4 rounded-xl inline-flex items-center"
        >
          <span className="mx-2">แสดงแบบปฎิทิน</span>
        </button>
      </div>

      <div className="text-center mt-6">
        <DropDownDate />
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
