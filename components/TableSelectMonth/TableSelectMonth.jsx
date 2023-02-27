import useAxios from "axios-hooks";
import React, { useEffect, useRef } from "react";
import LoadingComponent from "../LoadingComponent";
import ErrorComponent from "../ErrorComponent";
import _ from "lodash";
import dayjs from "dayjs";
import ModalSelectMonth from "./ModalSelectMonth";
import { useSelector } from "react-redux";
import { BsPrinterFill } from "react-icons/bs";
import { useReactToPrint } from "react-to-print";
import printStyle from "@/utils/printStyle";
var isoWeek = require("dayjs/plugin/isoWeek");
dayjs.extend(isoWeek);
export const TableSelectMonth = ({
  daysInMonth,
  arrayDayInMonth,
  monthEN,
  yearEN,
  monthTH,
  yearTH,
  monthValue,
  yearValue,
}) => {
  const { dateStore } = useSelector((state) => ({ ...state }));

  const [{ data: user, loading: userLoading, error: userError }, getUserList] =
    useAxios({
      url: `/api/user/selectMonth?month=${monthValue}&year=${yearValue}`,
      method: "GET",
    });

  const [
    { data: userList, loading: userListLoading, error: userListError },
    getUserDropdown,
  ] = useAxios({
    url: `/api/user?month=${monthValue}&year=${yearValue}`,
    method: "GET",
  });

  const [{ data: shif, loading: shifLoading, error: shifError }] = useAxios({
    url: "/api/shif",
  });

  const [{ data: location, loading: locationLoading, error: locationError }] =
    useAxios({
      url: "/api/location",
    });

  const [{ loading: dutyLoading, error: dutyError }, executeDuty] = useAxios(
    { url: "/api/duty", method: "POST" },
    { manual: true }
  );
  const [{ loading: dutyUserLoading, error: dutyUserError }, executeUserDuty] =
    useAxios({ url: "/api/user-duty", method: "POST" }, { manual: true });

  const [{ loading: dutyDeleteLoading, error: dutyDeleteError }, deleteDuty] =
    useAxios({ url: "/api/duty", method: "DELETE" }, { manual: true });

  useEffect(() => {
    if (userLoading === false) {
      const getUsers = async () => {
        await getUserList();
      };
      getUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateStore]);

  //React to print
  const componentRef = useRef();
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `รายงานตารางเวรประจำเดือน ${monthTH} ${yearTH}`,
  });

  if (
    userError ||
    shifError ||
    dutyError ||
    dutyDeleteError ||
    locationError ||
    userListError ||
    dutyUserError
  )
    return <ErrorComponent />;

  return (
    <>
      <style>{printStyle()}</style>
      <div className="flex justify-center items-center pb-10">
        <button
          onClick={handlePrint}
          className="bg-green-600 hover:bg-green-800 text-white font-bold mt-6 -mb-10 py-2 px-4 rounded-xl inline-flex items-center"
        >
          <BsPrinterFill className="my-auto" />
          <span className="mx-2">ออกรายงาน</span>
        </button>
      </div>
      <div className="w-100 bg-white shadow-xl p-5 m-10 rounded-md overflow-x-auto">
        {userLoading ||
          shifLoading ||
          dutyLoading ||
          dutyDeleteLoading ||
          locationLoading ||
          userListLoading ||
          dutyUserLoading ? (
          <LoadingComponent />
        ) : (
          <></>
        )}
        <div ref={componentRef} className="shift-table">
          <div className="justify-between w-11/12 hidden lg:flex">
            <div>
              <p className="text-center">เสนอผู้อำนวยการโรงพยาบาลครบุรี เพื่อโปรดพิจารณา</p>
              <p className="text-center mt-3">...........................................</p>
              <p className="text-center">( นางรำไพ นันทโนภาส )</p>
              <p className="text-base text-center">หัวหน้ากลุ่มงานการพยาบาล</p>
            </div>
            <div>
              <p className="text-xl">กลุ่มงานการพยาบาล โรงพยาบาลครบุรี</p>
            </div>
            <div>
              <p className="text-center">ความคิดเห็นผู้อำนวยการ</p>
              <p className="text-center mt-3">...........................................</p>
              <p className="text-center">( นายพัฒนา เบ้าสาทร)</p>
              <p className="text-base text-center">ผู้อำนวยการโรงพยาบาลครบุรี</p>
            </div>
          </div>
          <table className="border-collapse border text-center border-spacing-2 mx-auto text-base">
            <tbody>
              <tr className="bg-white">
                <td className="border border-white" colSpan={daysInMonth + 9}>
                  <div className="text-center text-lg">
                    ตารางเวรประจำเดือน.........................{dayjs(`${dayjs().year()}-${+monthValue + 1}-${+monthValue + 1}`).format("MMMM")}
                    .........................พ.ศ...............{yearTH}
                    ................
                  </div>
                </td>
              </tr>
              <tr className="border text-white">
                <td
                  className="border bg-green-600 min-w-[40px]"
                  colSpan={1}
                  rowSpan={2}
                >
                  ลำดับ
                </td>
                <td
                  className="border bg-green-600 min-w-[200px] sticky -left-5"
                  colSpan={1}
                  rowSpan={2}
                >
                  ชื่อ - สกุล
                </td>
                <td
                  className="border bg-green-600 min-w-[110px]"
                  colSpan={1}
                  rowSpan={2}
                >
                  ตำแหน่ง
                </td>
                <td
                  className="border bg-green-600 min-w-[50px]"
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
                  className="border bg-green-600 min-w-[30px]"
                  colSpan={1}
                  rowSpan={1}
                >
                  โอ { }
                </td>
                <td
                  className="border bg-green-600 min-w-[50px]"
                  colSpan={1}
                  rowSpan={1}
                >
                  วันทำ
                </td>
                <td
                  className="border bg-green-600 min-w-[50px]"
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
                    className={`border text-white min-w-[50px] ${["เสาร์", "อาทิตย์"].includes(
                      dayjs(`${yearEN}-${+monthValue + 1}-${day + 1}`).format("dddd")
                    )
                        ? "bg-green-600"
                        : "bg-orange-600"
                      } `}
                  >
                    {day + 1}
                  </td>
                ))}
                <td className="border bg-cyan-600 text-white min-w-[30px]">
                  บ
                </td>
                <td className="border bg-cyan-600 text-white min-w-[30px]">
                  ด
                </td>
                <td className="border bg-green-600 text-white min-w-[30px]">
                  ที
                </td>
                <td className="border bg-green-600 text-white min-w-[30px]">
                  การ
                </td>
                <td className="border bg-green-600 text-white min-w-[30px]">
                  ทำงาน
                </td>
              </tr>

              {/* ข้อมูลการขึ้นเวร */}
              {user?.map((person, key) => {
                const afternoonShift = person?.Duty?.filter(
                  ({ Shif, isOT }) => Shif?.name == "บ" && !isOT
                )?.length;
                const nightShift = person?.Duty?.filter(
                  ({ Shif, isOT }) => Shif?.name == "ด" && !isOT
                )?.length;
                const workingDay = person?.Duty?.filter(
                  ({ Shif, isOT }) =>
                    ["ช", "บ", "ด"].includes(Shif?.name) && !isOT
                )?.length;
                const ot = person?.Duty?.filter(({ isOT }) => isOT)?.length;

                return (
                  <tr key={key} className="border odd:bg-green-100">
                    <td className="border">{key + 1}</td>
                    <td
                      className={`border text-left pl-3 sticky -left-5 ${key % 2 == 0
                          ? "bg-white border-r-2"
                          : "even:bg-green-100"
                        }`}
                    >
                      {person.Title.name} {person.firstname} {person.lastname}
                    </td>
                    <td className="border">{person.Position.name}</td>
                    <td className="border">
                      {
                        person.UserDuty?.Location
                          ?.name
                      }
                    </td>
                    {/* แสดงรายละเอียดของตาราง กะ */}
                    {arrayDayInMonth?.map((day, index) => (
                      <ModalSelectMonth
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
                        monthEN={+monthValue + 1}
                        monthTH={monthTH}
                        yearEN={yearEN}
                        yearTH={yearTH}
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
                <td className="border">{sumOT()}</td>
                <td className="border">{sumDuty(["ช", "บ", "ด"])}</td>
                <td className="border">
                  {sumDuty(["ช", "บ", "ด"]) + sumOT()}
                </td>
              </tr>

              <tr className="border">
                <td
                  className="border border-white py-5"
                  colSpan={daysInMonth + 9}
                >
                  &nbsp;
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
      </div>
      <div className="w-100 bg-white shadow-xl p-5 m-10 rounded-md overflow-x-auto">
        <div className="justify-center text-center h2 text-xl font-normal leading-normal mt-0 mb-2 text-black">
          จัดคนขึ้นเวร
        </div>
        <form
          className="w-full"
          onSubmit={async (x) => {
            x.preventDefault();
            const userId = x.target.userId.value;
            const locationId = x.target.locationId.value;
            await executeUserDuty({
              data: {
                userId: userId,
                locationId: locationId,
              },
            });
            await getUserList();
            await getUserDropdown();
          }}
        >
          <div className="flex flex-wrap -mx-3 mb-6">
            <div className="w-full md:w-2/5 px-3 mb-6 md:mb-0">
              <label
                className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                for="grid-state"
              >
                ชื่อ-นามสกุล
              </label>
              <div className="relative">
                <select
                  id="userId"
                  name="userId"
                  className="block appearance-none w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                >
                  {console.log(userList)}
                  {userList
                    ?.filter(
                      (x) =>
                        !user
                          ?.map((x) => {
                            return x.id;
                          })
                          .includes(x.id)
                    )
                    ?.map((person, index) => (
                      <option key={index} value={person.id}>
                        {person.firstname + " " + person.lastname}
                      </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="w-full md:w-2/5 px-3 mb-6 md:mb-0">
              <label
                className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                for="grid-state"
              >
                งานที่ปฏิบัติ
              </label>
              <div className="relative">
                <select
                  id="locationId"
                  name="locationId"
                  className="block appearance-none w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                >
                  {location?.map(({ id, name }) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="w-full md:w-1/5 px-3 mb-6 md:mb-0">
              <label
                className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                for="grid-state"
              >
                บันทึก
              </label>
              <div className="relative">
                <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                  บันทึก
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );

  function sumDuty(array) {
    return _.sumBy(user, function (o) {
      return o.Duty?.filter(({ Shif, isOT }) => array.includes(Shif?.name) && !isOT)?.length;
    });
  }

  function sumOT() {
    console.log(user);
    return _.sumBy(user, function (o) {
      return o.Duty?.filter(({ isOT }) => isOT)?.length;
    });
  }

};
