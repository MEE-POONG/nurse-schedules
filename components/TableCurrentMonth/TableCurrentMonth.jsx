import useAxios from "axios-hooks";
import React from "react";
import ModalCreate from "./ModalCreate";
import { arrayDayInMonth, daysInMonth, monthTH, yearTH } from "@/utils/day";
import LoadingComponent from "../LoadingComponent";
import ErrorComponent from "../ErrorComponent";

export const TableCurrentMonth = () => {

  const [{ data: User, loading: UserLoading, error: UserError }] = useAxios({ url: "/api/user" });
  const [{ data: Shif, loading: ShifLoading, error: ShifError }] = useAxios({ url: "/api/shif" });

  if (UserError || ShifError) return <ErrorComponent />;
  if (UserLoading || ShifLoading) return <LoadingComponent />

  return (
    <div className="w-100 bg-white shadow-xl p-5 m-10 rounded-md overflow-x-auto">
      <div className="text-center text-xl">ตารางเวรประจำเดือน.........................{monthTH}.........................พ.ศ...............{yearTH}................</div>
      <table className="border-collapse border w-full text-center shadow-md border-spacing-2">
        <tbody>
          <tr className="border text-white">
            <td className="border bg-green-600 min-w-[50px]" colSpan={1} rowSpan={2}>
              ลำดับ
            </td>
            <td className="border bg-green-600 min-w-[200px]" colSpan={1} rowSpan={2}>
              ชื่อ - สกุล
            </td>
            <td className="border bg-green-600 min-w-[150px]" colSpan={1} rowSpan={2}>
              ตำแหน่ง
            </td>
            <td className="border bg-green-600 min-w-[100px]" colSpan={1} rowSpan={2}>
              งานที่ปฏิบัติ
            </td>
            <td
              className="border bg-orange-600"
              colSpan={daysInMonth}
              rowSpan={1}
            >
              วันที่ปฏิบัติงาน
            </td>
            <td className="border bg-green-600" colSpan={2} rowSpan={1}>
              สรุป
            </td>
            <td className="border bg-green-600 min-w-[50px]" colSpan={1} rowSpan={1}>
              โอ
            </td>
            <td className="border bg-green-600 min-w-[50px]" colSpan={1} rowSpan={1}>
              วันทำ
            </td>
            <td className="border bg-green-600 min-w-[60px]" colSpan={1} rowSpan={1}>
              รวมวัน
            </td>
          </tr>
          <tr className="border">
            {/* จำนวนวันของเดือน */}
            {arrayDayInMonth.map((day, index) => (
              <td className="border bg-orange-600 text-white min-w-[35px]" key={index}>
                {day + 1}
              </td>
            ))}
            <td className="border bg-cyan-600 text-white min-w-[35px]">บ</td>
            <td className="border bg-cyan-600 text-white min-w-[35px]">ด</td>
            <td className="border bg-green-600 text-white min-w-[35px]">ที</td>
            <td className="border bg-green-600 text-white min-w-[35px]">การ</td>
            <td className="border bg-green-600 text-white min-w-[35px]">ทำงาน</td>
          </tr>

          {/* ข้อมูลการขึ้นเวร */}
          {User?.map((person, key) => (
            <tr className="border odd:bg-green-100" key={key}>
              <td className="border">
                {key + 1}
              </td>
              <td className="border text-left pl-3">
                {person.Title.name}{person.firstname} {person.lastname}
              </td>
              <td className="border">{person.Position.name}</td>
              <td className="border">{person.Location.name}</td>

              {/* แสดงรายละเอียดของตาราง กะ */}
              {arrayDayInMonth.map((day, index) => (
                <ModalCreate key={index} userId={person.id} Duty={person.Duty} day={day + 1} name={person.firstname + ' ' + person.lastname} Shif={Shif} />
              ))}
              <td className="border">&nbsp;</td>
              <td className="border">&nbsp;</td>
              <td className="border">&nbsp;</td>
              <td className="border">&nbsp;</td>
              <td className="border">&nbsp;</td>
            </tr>
          ))}

          <tr className="border">
            <td className="border">&nbsp;</td>
            <td className="border">&nbsp;</td>
            <td className="border">&nbsp;</td>
            <td className="border">&nbsp;</td>
            <td className="border" colSpan={daysInMonth - 3}>&nbsp;</td>
            <td className="border" colSpan={3} rowSpan={1}>
              รวม
            </td>
            <td className="border">&nbsp;</td>
            <td className="border">&nbsp;</td>
            <td className="border">&nbsp;</td>
            <td className="border">&nbsp;</td>
            <td className="border">&nbsp;</td>
          </tr>
          <tr className="border">
            <td className="border" colSpan={daysInMonth + 9}>
              ................................................................................................................................หัวหน้าตึก
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
