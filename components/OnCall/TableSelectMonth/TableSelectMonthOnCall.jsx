import useAxios from "axios-hooks";
import React, { useEffect, useRef } from "react";
import _ from "lodash";
import dayjs from "dayjs";
import { BsPrinterFill } from "react-icons/bs";
import { useReactToPrint } from "react-to-print";
import printStyle from "@/utils/printStyle";
import ModalSelectMonthOnCall from "./ModalSelectMonthOnCall";
import { useSelector } from "react-redux";
import LoadingComponent from "@/components/LoadingComponent";
import ErrorComponent from "@/components/ErrorComponent";
var isoWeek = require("dayjs/plugin/isoWeek");
dayjs.extend(isoWeek);
export const TableSelectMonthOnCall = ({
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
      url: `/api/user/select-month-on-call?month=${monthValue}&year=${yearValue}`,
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
    { url: "/api/on-call", method: "POST" },
    { manual: true }
  );
  const [{ loading: dutyUserLoading, error: dutyUserError }, executeUserDuty] =
    useAxios({ url: "/api/user-duty", method: "POST" }, { manual: true });

  const [{ loading: dutyDeleteLoading, error: dutyDeleteError }, deleteDuty] =
    useAxios({ url: "/api/on-call", method: "DELETE" }, { manual: true });


  const [{ data: configuration, loading: configurationLoading, error: configurationError }] = useAxios({
    url: "/api/configuration",
  });


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
    dutyUserError ||
    configurationError
  )
    return <ErrorComponent />;

  return (
    <>
      <style>{printStyle()}</style>
      <div className="flex justify-center items-center pb-10">
        <button
          onClick={handlePrint}
          className="inline-flex items-center px-4 py-2 mt-6 -mb-10 font-bold text-black bg-white rounded-xl hover:bg-white"
        >
          <BsPrinterFill className="my-auto" />
          <span className="mx-2">ออกรายงาน</span>
        </button>
      </div>
      <div className="overflow-x-auto p-5 my-10 min-h-screen bg-white rounded-md shadow-xl w-100 print:flex print:items-center print:justify-center">
        {userLoading ||
          shifLoading ||
          dutyLoading ||
          dutyDeleteLoading ||
          locationLoading ||
          userListLoading ||
          configurationLoading ||
          dutyUserLoading ? (
          <LoadingComponent />
        ) : (
          <></>
        )}
        <div ref={componentRef} className="text-lg shift-table">
          <table className="mx-auto text-lg text-center whitespace-nowrap border border-collapse border-spacing-2">
            <tbody>
              <tr className="bg-white">
                <td className="border border-white border-b-black" colSpan={daysInMonth + 9}>
                  <div className="text-2xl text-center">
                    ตารางการปฎิบัติงานเวลาราชการ นอกเวลาราชการและวันหยุดราชการเพื่อให้บริการรักษาพยาบาลและสนับสนุนงานบริการอื่นๆ
                  </div>
                  <div className="text-lg text-center">
                    ส่วนราชการ โรงพยาบาลครบุรี จังหวัดนครราชสีมา ประจำเดือน......................... {dayjs(`${dayjs().year()}-${+monthValue + 1}-${+monthValue + 1}`).format("MMMM")}.........................พ.ศ..........{yearTH}..........<br />
                    คำสั่งโรงพยาบาลครบุรี ที่..................../....................ลงวันที่....................เดือน........................................พ.ศ....................
                  </div>
                </td>
              </tr>
              <tr className="text-black border">
                <td
                  className="border border-black bg-white min-w-[50px]"
                  colSpan={1}
                  rowSpan={2}
                >
                  <div className="text-sm">ลำดับ</div>
                </td>
                <td
                  className="border border-black bg-white min-w-[200px] sticky -left-5"
                  colSpan={1}
                  rowSpan={2}
                >
                  <div className="text-sm">ชื่อ - สกุล</div>
                </td>
                <td
                  className="border border-black bg-white min-w-[110px]"
                  colSpan={1}
                  rowSpan={2}
                >
                  <div className="text-sm">ตำแหน่ง</div>
                </td>
                <td
                  className="border border-black bg-white min-w-[50px]"
                  colSpan={1}
                  rowSpan={2}
                >
                  <div className="text-sm">งานที่<br />ปฏิบัติ</div>
                </td>
                <td
                  className="bg-white border border-black"
                  colSpan={daysInMonth}
                  rowSpan={1}
                >
                  <div className="text-sm">วันที่ปฏิบัติงาน</div>
                </td>
                <td className="bg-white border border-black" colSpan={2} rowSpan={1}>
                  <div className="text-sm">สรุป</div>
                </td>
                <td
                  className="border border-black bg-white min-w-[30px]"
                  colSpan={1}
                  rowSpan={1}
                >
                  <div className="text-sm">โอ</div>
                </td>
                <td
                  className="border border-black bg-white min-w-[50px]"
                  colSpan={1}
                  rowSpan={1}
                >
                  <div className="text-sm">วันทำ</div>
                </td>
                <td
                  className="border border-black bg-white min-w-[50px]"
                  colSpan={1}
                  rowSpan={1}
                >
                  <div className="text-sm">รวมวัน</div>
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
                    <div className="text-base">{day + 1}</div>
                  </td>
                ))}
                <td className="border border-black bg-white text-black min-w-[30px]">
                  <div className="text-sm">บ</div>
                </td>
                <td className="border border-black bg-white text-black min-w-[30px]">
                  <div className="text-sm">ด</div>  
                </td>
                <td className="border border-black bg-white text-black min-w-[30px]">
                  <div className="text-sm">ที</div>
                </td>
                <td className="border border-black bg-white text-black min-w-[30px]">
                  <div className="text-sm">การ</div>
                </td>
                <td className="border border-black bg-white text-black min-w-[30px]">
                  <div className="text-sm">ทำงาน</div>
                </td>
              </tr>

              {/* ข้อมูลการขึ้นเวร */}
              {user?.filter(e => e?.Position?.name !== 'พนักงานเปล')?.map((person, key) => {
                const afternoonShift = person?.OnCallDuty?.filter(
                  ({ Shif, isOT }) => Shif?.name == "บ" && !isOT
                )?.length;
                const nightShift = person?.OnCallDuty?.filter(
                  ({ Shif, isOT }) => Shif?.name == "ด" && !isOT
                )?.length;
                const workingDay = person?.OnCallDuty?.filter(
                  ({ Shif, isOT }) =>
                    ["ช", "บ", "ด"].includes(Shif?.name) && !isOT
                )?.length;
                const ot = person?.OnCallDuty?.filter(({ isOT }) => isOT)?.length;
                console.log('isOT', person?.OnCallDuty?.filter(({ isOT }) => isOT));
                return (
                  <tr key={key} className="border odd:bg-white">
                    <td className="border border-black">{key + 1}</td>
                    <td
                      className={`border border-black text-left sticky -left-5 ${key % 2 == 0
                        ? "bg-white"
                        : "even:bg-white"
                        }`}
                    >
                      {person?.Title?.name}
                      {person?.firstname} {person?.lastname}
                    </td>
                    <td className="border border-black">{person?.Position?.name}</td>
                    <td className="border border-black">
                      {
                        person.UserDuty?.Location
                          ?.name
                      }
                    </td>
                    {/* แสดงรายละเอียดของตาราง กะ */}
                    {arrayDayInMonth?.map((day, index) => (
                      <ModalSelectMonthOnCall
                        key={index}
                        userId={person?.id}
                        OnCallDuty={person?.OnCallDuty}
                        day={day + 1}
                        name={person?.firstname + " " + person?.lastname}
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
                    <td className="border border-black">{afternoonShift}</td>
                    <td className="border border-black">{nightShift}</td>
                    <td className="border border-black">{ot}</td>
                    <td className="border border-black">{workingDay}</td>
                    <td className="border border-black">{(workingDay || 0) + (ot || 0)}</td>
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
                <td className="border border-black">{sumDuty(["บ"])}</td>
                <td className="border border-black">{sumDuty(["ด"])}</td>
                <td className="border border-black">{sumOT()}</td>
                <td className="border border-black">{sumDuty(["ช", "บ", "ด"])}</td>
                <td className="border border-black">
                  {sumDuty(["ช", "บ", "ด"]) + sumOT()}
                </td>
              </tr>


              {/* ข้อมูลการขึ้นเวร */}
              {user?.filter(e => e?.Position?.name === 'พนักงานเปล')?.map((person, key) => {
                const afternoonShift = person?.OnCallDuty?.filter(
                  ({ Shif, isOT }) => Shif?.name == "บ" && !isOT
                )?.length;
                const nightShift = person?.OnCallDuty?.filter(
                  ({ Shif, isOT }) => Shif?.name == "ด" && !isOT
                )?.length;
                const workingDay = person?.OnCallDuty?.filter(
                  ({ Shif, isOT }) =>
                    ["ช", "บ", "ด"].includes(Shif?.name) && !isOT
                )?.length;
                const ot = person?.OnCallDuty?.filter(({ isOT }) => isOT)?.length;
                console.log('isOT', person?.OnCallDuty?.filter(({ isOT }) => isOT));
                return (
                  <tr key={key} className="border odd:bg-white">
                    <td className="border border-black">{key + 1}</td>
                    <td
                      className={`border border-black text-left sticky -left-5 ${key % 2 == 0
                        ? "bg-white"
                        : "even:bg-white"
                        }`}
                    >
                      {person.Title.name}
                      {person.firstname} {person.lastname}
                    </td>
                    <td className="border border-black">{person.Position.name}</td>
                    <td className="border border-black">
                      {
                        person.UserDuty?.Location
                          ?.name
                      }
                    </td>
                    {/* แสดงรายละเอียดของตาราง กะ */}
                    {arrayDayInMonth?.map((day, index) => (
                      <ModalSelectMonthOnCall
                        key={index}
                        userId={person.id}
                        OnCallDuty={person.OnCallDuty}
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
                    <td className="border border-black">{afternoonShift}</td>
                    <td className="border border-black">{nightShift}</td>
                    <td className="border border-black">{ot}</td>
                    <td className="border border-black">{workingDay}</td>
                    <td className="border border-black">{workingDay + ot}</td>
                  </tr>
                );
              })}

              {user?.filter(e => e?.Position?.name === 'พนักงานเปล') ? <tr className="border">
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
                <td className="border border-black">{sumDutyPay(["บ"])}</td>
                <td className="border border-black">{sumDutyPay(["ด"])}</td>
                <td className="border border-black">{sumOTPay()}</td>
                <td className="border border-black">{sumDutyPay(["ช", "บ", "ด"])}</td>
                <td className="border border-black">
                  {sumOTPay()}
                </td>
              </tr> : ''}




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
                  className="py-5 border border-white"
                  colSpan={daysInMonth + 9}
                >

                  <div className="hidden justify-between w-full sm:flex">
                    <div>
                      <p className="mt-3 text-center">ลงชื่อ......................................................................(ผู้อนุมัติอยู่เวร)</p>
                      <p className="pl-32 text-left">
                        {/* ( นายเรืองศักดิ์  ใจโพธิ์ ) */}
                        </p>
                      <p className="pl-14 text-left">
                        {/* นายแพทย์ชำนาญการ รักษาการในตำแหน่ง */}
                        </p>
                      <p className="text-leftpl-20">
                        {/* ผู้อำนวยการโรงพยาบาลครบุรี */}
                        </p>
                    </div>
                    <div className="basis-6/12">
                      <p className="mt-3 text-center">ลงชื่อ......................................................................(ผู้ควบคุม)</p>
                      <p className="text-left pl-[20rem]">( นางนงลักษณ์ คนเพียร )</p>
                      <p className="text-left pl-[22rem]"></p>
                      <p className="text-left pl-[19rem]">หัวหน้ากลุ่มงานการพยาบาล</p>
                    </div>
                    <div className="text-center">
                      {/* <p className="mt-3 text-center">ความคิดเห็นผู้อำนวยการ</p> */}
                      <p className="mt-3 text-center">ลงชื่อ......................................................หัวหน้าหน่วยงาน</p>
                      <p className="pl-16 text-left">( {configuration?.departmentor} )</p>
                    </div>
                  </div>

                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="overflow-x-auto p-5 my-10 bg-white rounded-md shadow-xl w-100">
        <div className="justify-center mt-0 mb-2 text-xl font-normal leading-normal text-center text-black h2">
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
            <div className="px-3 mb-6 w-full md:w-2/5 md:mb-0">
              <label
                className="block mb-2 text-xs font-bold tracking-wide text-gray-700 uppercase"
                for="grid-state"
              >
                ชื่อ-นามสกุล
              </label>
              <div className="relative">
                <select
                  id="userId"
                  name="userId"
                  className="block px-4 py-3 pr-8 w-full leading-tight text-gray-700 bg-white rounded border border-gray-200 appearance-none focus:outline-none focus:bg-white focus:border-gray-500"
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
                <div className="flex absolute inset-y-0 right-0 items-center px-2 text-gray-700 pointer-events-none">
                  <svg
                    className="w-4 h-4 fill-current"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="px-3 mb-6 w-full md:w-2/5 md:mb-0">
              <label
                className="block mb-2 text-xs font-bold tracking-wide text-gray-700 uppercase"
                for="grid-state"
              >
                งานที่ปฏิบัติ
              </label>
              <div className="relative">
                <select
                  id="locationId"
                  name="locationId"
                  className="block px-4 py-3 pr-8 w-full leading-tight text-gray-700 bg-white rounded border border-gray-200 appearance-none focus:outline-none focus:bg-white focus:border-gray-500"
                >
                  {location?.map(({ id, name }) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
                <div className="flex absolute inset-y-0 right-0 items-center px-2 text-gray-700 pointer-events-none">
                  <svg
                    className="w-4 h-4 fill-current"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="px-3 mb-6 w-full md:w-1/5 md:mb-0">
              <label
                className="block mb-2 text-xs font-bold tracking-wide text-gray-700 uppercase"
                for="grid-state"
              >
                บันทึก
              </label>
              <div className="relative">
                <button className="px-4 py-2 font-bold text-black bg-blue-500 rounded hover:bg-blue-700">
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
    return _.sumBy(user?.filter(e => e?.Position?.name !== 'พนักงานเปล'), function (o) {
      return o.OnCallDuty?.filter(({ Shif, isOT }) => array.includes(Shif?.name) && !isOT)?.length;
    });
  }

  function sumOT() {
    return _.sumBy(user?.filter(e => e?.Position?.name !== 'พนักงานเปล'), function (o) {
      return o.OnCallDuty?.filter(({ isOT }) => isOT)?.length;
    });
  }


  function sumDutyPay(array) {
    return _.sumBy(user?.filter(e => e?.Position?.name === 'พนักงานเปล'), function (o) {
      return o.OnCallDuty?.filter(({ Shif, isOT }) => array.includes(Shif?.name) && !isOT)?.length;
    });
  }

  function sumOTPay() {
    return _.sumBy(user?.filter(e => e?.Position?.name === 'พนักงานเปล'), function (o) {
      return o.OnCallDuty?.filter(({ isOT }) => isOT)?.length;
    });
  }

};
