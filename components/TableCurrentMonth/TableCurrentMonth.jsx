import useAxios from "axios-hooks";
import React from "react";
import ModalCreate from "./ModalCreate";
import {
  arrayDayInMonth,
  daysInMonth,
  monthEN,
  monthTH,
  yearEN,
  yearTH,
} from "@/utils/day";
import LoadingComponent from "../LoadingComponent";
import ErrorComponent from "../ErrorComponent";
import _ from "lodash";
import dayjs from "dayjs";
var isoWeek = require("dayjs/plugin/isoWeek");

dayjs.extend(isoWeek);
export const TableCurrentMonth = () => {
  const [{ data: user, loading: userLoading, error: userError }, getUserList] =
    useAxios({ url: "/api/user" });
  const [{ data: shif, loading: shifLoading, error: shifError }] = useAxios({
    url: "/api/shif",
  });
  const [{ loading: dutyLoading, error: dutyError }, executeDuty] = useAxios(
    { url: "/api/duty", method: "POST" },
    { manual: true }
  );
  const [{ loading: dutyDeleteLoading, error: dutyDeleteError }, deleteDuty] =
    useAxios({ url: "/api/duty", method: "DELETE" }, { manual: true });

  if (userError || shifError || dutyError || dutyDeleteError)
    return <ErrorComponent />;

  return (
    <div className="w-100 bg-white shadow-xl p-5 m-10 rounded-md overflow-x-auto">
      {userLoading || shifLoading || dutyLoading || dutyDeleteLoading ? (
        <LoadingComponent />
      ) : (
        <></>
      )}
      <table className="border-collapse border w-full text-center shadow-md border-spacing-2">
        <tbody>
          <tr className="bg-white">
            <td className="border border-white" colSpan={daysInMonth + 9}>
              <div className="text-center text-xl">
                ตารางเวรประจำเดือน.........................{monthTH}
                .........................พ.ศ...............{yearTH}
                ................
              </div>
            </td>
          </tr>
          <tr className="border text-white">
            <td
              className="border bg-green-600 min-w-[50px]"
              colSpan={1}
              rowSpan={2}
            >
              ลำดับ
            </td>
            <td
              className="border bg-green-600 min-w-[200px]"
              colSpan={1}
              rowSpan={2}
            >
              ชื่อ - สกุล
            </td>
            <td
              className="border bg-green-600 min-w-[150px]"
              colSpan={1}
              rowSpan={2}
            >
              ตำแหน่ง
            </td>
            <td
              className="border bg-green-600 min-w-[100px]"
              colSpan={1}
              rowSpan={2}
            >
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
            <td
              className="border bg-green-600 min-w-[50px]"
              colSpan={1}
              rowSpan={1}
            >
              โอ {}
            </td>
            <td
              className="border bg-green-600 min-w-[50px]"
              colSpan={1}
              rowSpan={1}
            >
              วันทำ
            </td>
            <td
              className="border bg-green-600 min-w-[60px]"
              colSpan={1}
              rowSpan={1}
            >
              รวมวัน
            </td>
          </tr>
          <tr className="border">
            {/* จำนวนวันของเดือน */}
            {arrayDayInMonth.map((day, index) => (
              <td
                key={index}
                className={`border text-white min-w-[35px] ${
                  ["เสาร์", "อาทิตย์"].includes(
                    dayjs(`${yearEN}-${monthEN}-${day + 1}`).format("dddd")
                  )
                    ? "bg-green-600"
                    : "bg-orange-600"
                } `}
              >
                {day + 1}
              </td>
            ))}
            <td className="border bg-cyan-600 text-white min-w-[35px]">บ</td>
            <td className="border bg-cyan-600 text-white min-w-[35px]">ด</td>
            <td className="border bg-green-600 text-white min-w-[35px]">ที</td>
            <td className="border bg-green-600 text-white min-w-[35px]">การ</td>
            <td className="border bg-green-600 text-white min-w-[35px]">
              ทำงาน
            </td>
          </tr>

          {/* ข้อมูลการขึ้นเวร */}
          {user?.map((person, key) => {
            const afternoonShift = person?.Duty?.filter(
              ({ Shif }) => Shif?.name == "บ"
            )?.length;
            const nightShift = person?.Duty?.filter(
              ({ Shif }) => Shif?.name == "ด"
            )?.length;
            // console.log(person.Duty);
            const workingDay = person?.Duty?.filter(({ Shif }) =>
              ["ช","บ","ด"].includes(Shif?.name) //แก้
            )?.length;
            const ot = person?.Duty?.filter(({ isOT }) => isOT)?.length;
            return (
              <tr key={key} className="border odd:bg-green-100">
                <td className="border">{key + 1}</td>
                <td className="border text-left pl-3">
                  {person.Title.name}
                  {person.firstname} {person.lastname}
                </td>
                <td className="border">{person.Position.name}</td>
                <td className="border">{person.Location.name}</td>
                {/* แสดงรายละเอียดของตาราง กะ */}
                {arrayDayInMonth.map((day, index) => (
                  <ModalCreate
                    key={index}
                    userId={person.id}
                    Duty={person.Duty}
                    day={day + 1}
                    name={person.firstname + " " + person.lastname}
                    Shif={shif}
                    getUserList={getUserList}
                    executeDuty={executeDuty}
                    deleteDuty={deleteDuty}
                    userLoading={userLoading}
                  />
                ))}
                <td className="border">{afternoonShift}</td>
                <td className="border">{nightShift}</td>
                <td className="border">{ot}</td>
                <td className="border">{workingDay}</td>
                <td className="border">{workingDay + ot}</td>
              </tr>
            );
          })}

          <tr className="border">
            <td className="border">&nbsp;</td>
            <td className="border">&nbsp;</td>
            <td className="border">&nbsp;</td>
            <td className="border">&nbsp;</td>
            <td className="border" colSpan={daysInMonth - 3}>
              &nbsp;
            </td>
            <td className="border" colSpan={3} rowSpan={1}>
              รวม
            </td>
            <td className="border">{sumDuty(["บ"])}</td>
            <td className="border">{sumDuty(["ด"])}</td>
            <td className="border">{sumDuty(["โอที"])}</td>
            <td className="border">{sumDuty(["ช", "บ", "ด"])}</td>
            <td className="border">
              {sumDuty(["ช", "บ", "ด"]) + sumDuty(["โอที"])}
            </td>
          </tr>
          <tr className="border">
            <td className="border border-white" colSpan={daysInMonth + 9}>
              ................................................................................................................................หัวหน้าตึก
            </td>
          </tr>
          <tr className="border">
            <td className="border border-white" colSpan={daysInMonth + 9}>
              (นางมะลิ มอบกระโทก)
            </td>
          </tr>
          <tr className="border">
            <td className="border border-white" colSpan={daysInMonth + 9}>
              พยาบาลวิชาชีพชำนาญการ
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  function sumDuty(array) {
    return _.sumBy(user, function (o) {
      return o.Duty?.filter(({ Shif }) => array.includes(Shif?.name))?.length;
    });
  }
};
