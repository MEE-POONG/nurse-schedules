import useAxios from "axios-hooks";
import React, { useEffect, useRef, useState } from "react";
import LoadingComponent from "../LoadingComponent";
import ErrorComponent from "../ErrorComponent";
import _ from "lodash";
import dayjs from "dayjs";
import ModalSelectMonth from "./ModalSelectMonth";
import { useSelector } from "react-redux";
import { BsPrinterFill } from "react-icons/bs";
import { useReactToPrint } from "react-to-print";
import printStyle from "@/utils/printStyle";
import ModalSelectMonthRed from "./ModalSelectMonthRed";
import ModalSelectMonthR from "./ModalSelectMonthR";
var isoWeek = require("dayjs/plugin/isoWeek");
dayjs.extend(isoWeek);
export const TableSelectMonthRF = ({
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
  const [open, setOpen] = useState(0);

  const [{ data: user, loading: userLoading, error: userError }, getUserList] =
    useAxios({
      url: `/api/user/selectMonthR?month=${monthValue}&year=${yearValue}`,
      method: "GET",
    }, {
      autoCancel: false
    });

  const [
    { data: userList, loading: userListLoading, error: userListError },
    getUserDropdown,
  ] = useAxios({
    url: `/api/user?month=${monthValue}&year=${yearValue}`,
    method: "GET",
  }, {
    autoCancel: false
  });

  const [{ data: shif, loading: shifLoading, error: shifError }] = useAxios({
    url: "/api/shif",
  }, {
    autoCancel: false
  });

  const [{ data: location, loading: locationLoading, error: locationError }] =
    useAxios({
      url: "/api/location",
    }, {
      autoCancel: false
    });

  const [{ loading: dutyLoading, error: dutyError }, executeDuty] = useAxios(
    { url: "/api/duty", method: "POST" },
    { manual: true, autoCancel: false }
  );
  const [{ loading: dutyUserLoading, error: dutyUserError }, executeUserDuty] =
    useAxios({ url: "/api/user-duty", method: "POST" }, { manual: true, autoCancel: false });

  const [{ loading: dutyDeleteLoading, error: dutyDeleteError }, deleteDuty] =
    useAxios({ url: "/api/duty", method: "DELETE" }, { manual: true, autoCancel: false });

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
          className="bg-white hover:bg-white text-black font-bold mt-6 -mb-10 py-2 px-4 rounded-xl inline-flex items-center"
        >
          <BsPrinterFill className="my-auto" />
          <span className="mx-2">ออกรายงาน</span>
        </button>
      </div>
      <div className="w-100 bg-white shadow-xl p-5 my-10 rounded-md overflow-x-auto">
        {/* {userLoading ||
          shifLoading ||
          dutyLoading ||
          dutyDeleteLoading ||
          locationLoading ||
          userListLoading ||
          dutyUserLoading ? (
          <LoadingComponent />
        ) : (
          <></>
        )} */}
        <div ref={componentRef} className="shift-table text-lg">
          <div className="justify-between w-11/12 hidden lg:flex">
            {/*<div>
              <p className="text-center">เสนอนายแพทย์ชำนาญการ รักษาการในตำแหน่งผู้อำนวยการโรงพยาบาลครบุรี เพื่อโปรดพิจารณา</p>
              <p className="text-center mt-3">...........................................</p>
              <p className="text-center">( นางรำไพ นันทโนภาส )</p>
              <p className="text-lg text-center">หัวหน้ากลุ่มงานการพยาบาล</p>
            </div>*/}
            {/* <div>
              <p className="text-xl">กลุ่มงานการพยาบาล โรงพยาบาลครบุรี</p>
            </div> */}
            {/* <div>
              <p className="text-center">ความคิดเห็นผู้อำนวยการ</p>
              <p className="text-center mt-3">...........................................</p>
              <p className="text-center">( นายเรืองศักดิ์  ใจโพธิ์)</p>
              <p className="text-lg text-center">นายแพทย์ชำนาญการ รักษาการในตำแหน่งผู้อำนวยการโรงพยาบาลครบุรี</p>
            </div> */}
          </div>
          <table className="border-collapse border text-center border-spacing-2 mx-auto text-lg whitespace-nowrap">
            <tbody>
              <tr className="bg-white">
                <td className="border border-white border-b-black" colSpan={daysInMonth + 9}>
                  <div className="text-center text-2xl">
                    ตารางการปฎิบัติงานเวลาราชการ นอกเวลาราชการและวันหยุดราชการเพื่อให้บริการรักษาพยาบาลและสนับสนุนงานบริการอื่นๆ
                  </div>
                  <div className="text-center text-lg">
                    ส่วนราชการ โรงพยาบาลครบุรี จังหวัดนครราชสีมา ประจำเดือน......................... {dayjs(`${dayjs().year()}-${+monthValue + 1}-${+monthValue + 1}`).format("MMMM")}.........................พ.ศ..........{yearTH}..........<br />
                    คำสั่งโรงพยาบาลครบุรี ที่..................../....................ลงวันที่....................เดือน........................................พ.ศ....................
                  </div>
                </td>
              </tr>
              <tr className="border border-black text-black">
                <td
                  className="border border-black bg-white min-w-[40px]"
                  colSpan={1}
                  rowSpan={2}
                >
                  ลำดับ
                </td>
                <td
                  className="border border-black bg-white min-w-[200px] sticky -left-5"
                  colSpan={1}
                  rowSpan={2}
                >
                  ชื่อ - สกุล
                </td>
                <td
                  className="border border-black bg-white min-w-[110px]"
                  colSpan={1}
                  rowSpan={2}
                >
                  ตำแหน่ง
                </td>
                <td
                  className="border border-black bg-white min-w-[50px]"
                  colSpan={1}
                  rowSpan={2}
                >
                  งานที่<br />ปฏิบัติ
                </td>
                <td
                  className="border border-black bg-white whitespace-nowrap"
                  colSpan={daysInMonth}
                  rowSpan={1}
                >
                  วันที่ปฏิบัติงาน
                </td>
                {/* <td className="border border-black bg-white" colSpan={2} rowSpan={1}>
                  สรุป
                </td> */}
                {/* <td
                  className="border border-black bg-white min-w-[30px] whitespace-nowrap"
                  colSpan={1}
                  rowSpan={1}
                >
                  โอ { }
                </td> */}
                {/* <td
                  className="border border-black bg-white min-w-[50px] whitespace-nowrap"
                  colSpan={1}
                  rowSpan={1}
                >
                  วันทำ
                </td> */}
                <td
                  className="border border-black bg-white min-w-[50px] whitespace-nowrap"
                  colSpan={1}
                  rowSpan={2}
                >
                  รวมวัน
                </td>

                <td className="border border-black bg-white" colSpan={2} rowSpan={2}>
                  หมายเหตุ
                </td>
              </tr>
              <tr className="border">
                {/* จำนวนวันของเดือน */}
                {arrayDayInMonth.map((day, index) => (
                  <td
                    key={index}
                    className={`border border-black text-black  min-w-[40px] ${["เสาร์", "อาทิตย์"].includes(
                      dayjs(`${yearEN}-${+monthValue + 1}-${day + 1}`).format("dddd")
                    )
                      ? "bg-white"
                      : "bg-white"
                      } `}
                  >
                    {day + 1}
                  </td>
                ))}
                {/* <td className="border border-black bg-white text-black min-w-[30px]">
                  บ
                </td> */}
                {/* <td className="border border-black bg-white text-black min-w-[30px]">
                  ด
                </td> */}
                {/* <td className="border border-black bg-white text-black min-w-[30px]">
                  ที
                </td> */}
                {/* <td className="border border-black bg-white text-black min-w-[30px]">
                  การ
                </td> */}
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
                    ["R"].includes(Shif?.name) && !isOT
                )?.length;
                const ot = person?.Duty?.filter(({ isOT }) => isOT)?.length;

                return (
                  <tr key={key} className="border bg-white">
                    <td className="border border-black">{key + 1}</td>
                    <td
                      className={`whitespace-nowrap border border-black text-left pl-3 ${key % 2 == 0
                        ? "bg-white"
                        : "bg-white"
                        }`}
                    >
                      {person.Title.name} {person.firstname} {person.lastname}
                    </td>
                    <td className="border border-black whitespace-nowrap">{person.Position.name}</td>
                    <td className="border border-black whitespace-nowrap">
                      {
                        person.UserDuty?.Location
                          ?.name
                      }
                    </td>
                    {/* แสดงรายละเอียดของตาราง กะ */}
                    {arrayDayInMonth?.map((day, index) => (
                      <ModalSelectMonthR
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
                    {/* <td className="border border-black">{afternoonShift}</td> */}
                    {/* <td className="border border-black">{nightShift}</td> */}
                    {/* <td className="border border-black">{ot}</td> */}
                    {/* <td className="border border-black">{workingDay}</td> */}
                    <td className="border border-black">{workingDay + ot}</td>
                    <td className="border border-black"></td>
                  </tr>
                );
              })}

              <tr className="border">
                <td className="border border-black">&nbsp;</td>
                <td className="border border-black">&nbsp;</td>
                <td className="border border-black">&nbsp;</td>
                <td className="border border-black">&nbsp;</td>
                <td className="border border-black" colSpan={daysInMonth - 3}>
                  &nbsp;
                </td>
                <td className="border border-black" colSpan={3} rowSpan={1}>
                  รวม
                </td>
                {/* <td className="border border-black">{sumDuty(["บ"])}</td> */}
                {/* <td className="border border-black">{sumDuty(["ด"])}</td> */}
                {/* <td className="border border-black">{sumOT()}</td> */}
                {/* <td className="border border-black">{sumDuty(["R"])}</td> */}
                <td className="border border-black">
                  {sumDuty(["R"]) + sumOT()}
                </td>
                <td className="border border-black">

                </td>
              </tr>

              <tr className="border" onClick={() => setOpen(e => e += 1)}>
                <td
                  className="border border-black"
                  colSpan={daysInMonth + 9}
                >
                  หมายเหตุ &nbsp;&nbsp;&nbsp;&nbsp; เวรเช้า (ช) = 08.30 - 16.30 น. &nbsp;&nbsp;&nbsp;&nbsp; เวรบ่าย (บ) = 16.30 - 00.30 น. &nbsp;&nbsp;&nbsp;&nbsp; เวรดึก (ด) = 00.30 - 08.30 น. &nbsp;&nbsp;&nbsp;&nbsp; O = เวรโอที
                </td>
              </tr>

              <tr className="border" onClick={() => setOpen(e => e += 1)}>
                <td
                  className="border border-white py-5"
                  colSpan={daysInMonth + 9}
                >

                  <div className="justify-between w-full hidden sm:flex">
                    <div>
                      <p className="text-center mt-3">ลงมือชื่อ......................................................................(ผู้อนุมัติอยู่เวร)</p>
                      <p className="text-left pl-32">( นายเรืองศักดิ์  ใจโพธิ์ )</p>
                      <p className="text-left pl-14">นายแพทย์ชำนาญการ รักษาการในตำแหน่ง</p>
                      <p className="text-leftpl-20  ">ผู้อำนวยการโรงพยาบาลครบุรี</p>
                    </div>
                    <div className="basis-6/12">
                      <p className="text-center mt-3">ลงมือชื่อ......................................................................(ผู้ควบคุม)</p>
                      <p className="text-left pl-96">( นางรำไพ นันทโนภาส )</p>
                      <p className="text-left pl-[22rem]">พยาบาลวิชาชีพชำนาญการพิเศษ</p>
                      <p className="text-left pl-[23rem]">หัวหน้ากลุ่มงานการพยาบาล</p>
                    </div>
                    <div className="text-center">
                      {/* <p className="text-center mt-3">ความคิดเห็นผู้อำนวยการ</p> */}
                      <p className="text-center mt-3">ลงชื่อ......................................................หัวหน้าหน่วยงาน</p>
                      <p className="text-left pl-16">( นางมะลิ มอบกระโทก )</p>
                    </div>
                  </div>

                </td>
              </tr>

            </tbody>
          </table>


        </div>
      </div>
      <div className={"w-100 bg-white shadow-xl p-5 my-10 rounded-md overflow-x-auto " + (open >= 5 ? '' : 'hidden')}>
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
                day: yearEN + "-" + (+monthValue + 1) + "-" + 15,
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
                  className="block appearance-none w-full bg-white border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                >

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
                  className="block appearance-none w-full bg-white border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
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
                <button className="bg-blue-500 hover:bg-blue-700 text-black font-bold py-2 px-4 rounded">
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
    return _.sumBy(user, function (o) {
      return o.Duty?.filter(({ isOT }) => isOT)?.length;
    });
  }


  function sumDutyPay(array) {
    return _.sumBy(user?.filter(e => e.Position.name === 'พนักงานเปล'), function (o) {
      return o.Duty?.filter(({ Shif, isOT }) => array.includes(Shif?.name) && !isOT)?.length;
    });
  }

  function sumOTPay() {
    return _.sumBy(user?.filter(e => e.Position.name === 'พนักงานเปล'), function (o) {
      return o.Duty?.filter(({ isOT }) => isOT)?.length;
    });
  }

};
