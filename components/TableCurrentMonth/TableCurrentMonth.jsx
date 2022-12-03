import useAxios from "axios-hooks";
import React, { useState } from "react";
import ModalCreate from "./ModalCreate";

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

export const TableCurrentMonth = () => {

  //ModalCreate
  const [showModal, setShowModal] = useState(false);


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

  if (
    DutyLoading ||
    LocationLoading ||
    ShifLoading ||
    UserLoading ||
    PositionLoading
  )
    return (
      <div class="absolute right-1/2 bottom-1/2  transform translate-x-1/2 translate-y-1/2 ">
        <div class="border-t-transparent border-solid animate-spin  rounded-full border-green-700 border-8 h-64 w-64"></div>
      </div>
    );
  if (DutyError || LocationError || ShifError || UserError || PositionError)
    return <p>Error!</p>;

  return (
    <div className="w-100 bg-white shadow-xl p-5 m-10 rounded-md overflow-x-auto">
      <div className="text-center text-xl">ตารางเวรประจำเดือน {monthTH}</div>
      <table className="border-collapse border w-full text-center shadow-md border-spacing-2">
        <tbody>
          <tr className="border text-white">
            <td className="border bg-green-600" colSpan={1} rowSpan={2}>
              ชื่อสกุล
            </td>
            <td className="border bg-green-600" colSpan={1} rowSpan={2}>
              ตำแหน่ง
            </td>
            <td className="border bg-green-600" colSpan={1} rowSpan={2}>
              งานที่ปฏิบัติ
            </td>
            <td
              className="border bg-orange-600"
              colSpan={daysInCurrentMonth}
              rowSpan={1}
            >
              วันที่ปฏิบัติงาน
            </td>
            <td className="border bg-green-600" colSpan={2} rowSpan={1}>
              สรุป
            </td>
            <td className="border bg-green-600" colSpan={1} rowSpan={2}>
              โอที
            </td>
            <td className="border bg-green-600" colSpan={1} rowSpan={2}>
              วันทำการ
            </td>
            <td className="border bg-green-600" colSpan={1} rowSpan={2}>
              รวมวันทำงาน
            </td>
          </tr>
          <tr className="border">
            {/* จำนวนวันของเดือน */}
            {[...Array(daysInCurrentMonth).keys()].map((index, key) => (
              <td className="border bg-orange-600 text-white" key={key}>
                {index + 1}
              </td>
            ))}
            <td className="border bg-cyan-600 text-white">บ่าย</td>
            <td className="border bg-cyan-600 text-white">ดึก</td>
          </tr>

          {/* จำนวนของชื่อ */}
          {User?.map((person, key) => (
            <tr className="border odd:bg-green-100" key={key}>
              <td className="border">
                {person.firstname} {person.lastname}
              </td>
              <td className="border">{person.Position.name}</td>
              <td className="border">{person.Location.name}</td>

              {/* แสดงรายละเอียดของตาราง กะ */}
              {[...Array(daysInCurrentMonth).keys()].map((i, key) => (
                <td
                  className="border hover:bg-green-300 cursor-pointer"
                  key={key}
                  id={person.Duty.id}
                >
                  {person.Duty?.filter(
                    (userDate) => new Date(userDate.datetime).getDate() == i + 1
                  ).map((userDuty) => (
                    <>
                      <span onClick={() => setShowModal(true)}>
                        {userDuty.Shif.name}
                      </span>
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
      <ModalCreate showModal={showModal} setShowModal={setShowModal} userId={""}/>
    </div>
  );
};
