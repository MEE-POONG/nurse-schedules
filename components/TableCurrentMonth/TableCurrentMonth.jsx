import useAxios from "axios-hooks";
import React, { useState } from "react";

const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate();
};

const date = new Date();
const currentYear = date.getFullYear();
const currentMonth = date.getMonth();

// console.log(currentYear, currentMonth);
const daysInCurrentMonth = getDaysInMonth(currentYear, currentMonth + 1);

const currentMonthTH = new Date(0, currentMonth);
const monthTH = currentMonthTH.toLocaleDateString("th-TH", {
  month: "long",
});

const uniquePerson = [];

export const TableCurrentMonth = () => {
  // Axios
  const [{ data: Duty, loading: DutyLoading, error: DutyError }, getDutyData] =
    useAxios({
      url: "/api/duty",
    });
  const [
    { data: Location, loading: LocationLoading, error: LocationError },
    getLocationData,
  ] = useAxios({
    url: "/api/location",
  });
  const [{ data: Shif, loading: ShifLoading, error: ShifError }, getShifData] =
    useAxios({
      url: "/api/shif",
    });
  const [{ data: User, loading: UserLoading, error: UserError }, getUserData] =
    useAxios({
      url: "/api/user",
    });
  const [
    { data: Position, loading: PositionLoading, error: PositionError },
    getPositionData,
  ] = useAxios({
    url: "/api/position",
  });

  // console.log(Duty);

  // Duty?.map((person) => {
  //   if (uniquePerson.indexOf(person) === -1) {
  //     uniquePerson.push(person);
  //   }
  // });
  // console.log(uniquePerson);

  if (
    DutyLoading ||
    LocationLoading ||
    ShifLoading ||
    UserLoading ||
    PositionLoading
  )
    return (
      <div class="absolute right-1/2 bottom-1/2  transform translate-x-1/2 translate-y-1/2 ">
        <div class="border-t-transparent border-solid animate-spin  rounded-full border-primary border-8 h-64 w-64"></div>
      </div>
    );
  if (DutyError || LocationError || ShifError || UserError || PositionError)
    return <p>Error!</p>;

  return (
    <div className="w-100 bg-white shadow-xl p-5 m-10 rounded-md overflow-x-auto">
      <div className="text-center text-xl">ตารางเวรประจำเดือน {monthTH}</div>
      <table className="border-collapse border w-full text-center shadow-md border-spacing-2">
        <tbody>
          <tr className="border">
            <td className="border" colSpan={1} rowSpan={2}>
              ชื่อสกุล
            </td>
            <td className="border" colSpan={1} rowSpan={2}>
              ตำแหน่ง
            </td>
            <td className="border" colSpan={1} rowSpan={2}>
              งานที่ปฏิบัติ
            </td>
            <td className="border" colSpan={daysInCurrentMonth} rowSpan={1}>
              วันที่ปฏิบัติงาน
            </td>
            <td className="border" colSpan={2} rowSpan={1}>
              สรุป
            </td>
            <td className="border" colSpan={1} rowSpan={2}>
              โอที
            </td>
            <td className="border" colSpan={1} rowSpan={2}>
              วันทำการ
            </td>
            <td className="border" colSpan={1} rowSpan={2}>
              รวมวันทำงาน
            </td>
          </tr>
          <tr className="border">
            {/* จำนวนวันของเดือน */}
            {[...Array(daysInCurrentMonth).keys()].map((index, key) => (
              <td className="border" key={key}>
                {index + 1}
              </td>
            ))}
            <td className="border">บ่าย</td>
            <td className="border">ดึก</td>
          </tr>
          {/* จำนวนของชื่อ */}
          {Duty?.map((person, key) => (
            <tr className="border" key={key}>
              <td className="border">
                {person.User.firstname} {person.User.lastname}
              </td>
              <td className="border">{person.User.positionId}</td>
              <td className="border">{person.Location.name}</td>
              {/* แสดงรายละเอียดของตาราง กะ */}
              {[...Array(daysInCurrentMonth).keys()].map((i, key) => (
                <td className="border" key={key}>
                  {uniquePerson
                    ?.filter(
                      (uniquePerson) =>
                        uniquePerson.User === person.User &&
                        new Date(person.datetime).getDate() == i + 1
                    )
                    .map((req) => (
                      <>
                        <span>{req.shifId}</span>
                      </>
                    ))}
                </td>
              ))}
              <td className="border">&nbsp;</td>
              <td className="border">&nbsp;</td>
              <td className="border">&nbsp;</td>
              <td className="border">&nbsp;</td>
              <td className="border">&nbsp;</td>
            </tr>
          ))}
          <tr className="border">
            <td className="border" colSpan={daysInCurrentMonth + 3} rowSpan={1}>
              รวม
            </td>
            <td className="border">&nbsp;</td>
            <td className="border">&nbsp;</td>
            <td className="border">&nbsp;</td>
            <td className="border">&nbsp;</td>
            <td className="border">&nbsp;</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
