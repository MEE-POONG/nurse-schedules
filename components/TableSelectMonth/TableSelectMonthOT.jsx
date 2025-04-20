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
import THBText from 'thai-baht-text'
import ModalSelectMonthOT from "./ModalSelectMonthOT";
var isoWeek = require("dayjs/plugin/isoWeek");
dayjs.extend(isoWeek);
export const TableSelectMonthOT = ({
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
      url: `/api/user/selectMonthOT?month=${monthValue}&year=${yearValue}`,
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
    dutyUserError
  )
    return <ErrorComponent />;

  return (
    <>
      <style>{printStyle()}</style>
      <div className="flex items-center justify-center pb-10">
        <button
          onClick={handlePrint}
          className="inline-flex items-center px-4 py-2 mt-6 -mb-10 font-bold text-black bg-white hover:bg-white rounded-xl"
        >
          <BsPrinterFill className="my-auto" />
          <span className="mx-2">ออกรายงาน</span>
        </button>
      </div>
      <div className="min-h-screen p-5 my-10 overflow-x-auto bg-white rounded-md shadow-xl w-100 print:flex print:items-center print:justify-center">
        {/* {userLoading ||
          shifLoading ||
          dutyLoading ||
          dutyDeleteLoading ||
          locationLoading ||
          dutyUserLoading ? (
          <LoadingComponent />
        ) : (
          <></>
        )} */}
        <div ref={componentRef} className="text-lg shift-table">

          <table className="mx-auto text-lg text-center border border-collapse border-black border-spacing-2 whitespace-nowrap">
            <tbody>

              <tr className="bg-white">
                <td className="border border-white border-b-black" colSpan={daysInMonth + 9}>
                  <div className="flex flex-col items-center justify-center">
                    <h1 className="text-md">
                      หลักฐานการจ่ายเงินค่าปฏิบัติการนอกเวลาราชการ/ในเวลาราชการและวันหยุดราชการ
                    </h1>
                    <h1 className="text-md">
                      เพื่อการให้บริการรักษาพยาบาลแก่ประชาชนและสนับสนุนงานบริการอื่นๆ
                    </h1>
                    <h1 className="text-md">
                      ชื่อส่วนราชการโรงพยาบาลครบุรี จังหวัดนครราชสีมา ประจำเดือน....{dayjs(`${dayjs().year()}-${+monthValue + 1}-${+monthValue + 1}`).format("MMMM")}....พ.ศ. ....{yearTH}....
                    </h1>
                    <h1 className="text-md">
                      ใบสำคัญที่..................................................... ลงวันที่.....................................................
                    </h1>
                  </div>
                </td>
              </tr>

              <tr className="text-black border border-black">
                <td
                  className="border border-black bg-white min-w-[40px]"
                  colSpan={1}
                  rowSpan={2}
                >
                  <div className="text-sm">ลำดับ</div>
                </td>
                <td
                  className="border border-black bg-white min-w-[200px] sticky"
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
                  <div className="text-sm">อัตราค่า<br />ตอบแทน</div>
                </td>
                <td
                  className="bg-white border border-black whitespace-nowrap"
                  colSpan={daysInMonth}
                  rowSpan={1}
                >
                  <div className="text-sm">วันที่ปฏิบัติงาน</div>
                </td>
                <td className="hidden bg-white border border-black" colSpan={2} rowSpan={1}>
                  <div className="text-sm">สรุป</div>
                </td>
                <td
                  className="border border-black bg-white min-w-[30px] whitespace-nowrap hidden"
                  colSpan={1}
                  rowSpan={1}
                >
                  <div className="text-sm">โอ { }</div>
                </td>
                <td
                  className="border border-black bg-white min-w-[50px] whitespace-nowrap"
                  colSpan={1}
                  rowSpan={2}
                >
                  <div className="text-sm">รวม</div>
                </td>
                <td
                  className="border border-black bg-white min-w-[50px] whitespace-nowrap"
                  colSpan={1}
                  rowSpan={1}
                >
                  <div className="text-sm">จำนวน</div>
                </td>
                <td
                  className="border border-black bg-white min-w-[50px] whitespace-nowrap"
                  colSpan={1}
                  rowSpan={1}
                >
                  <div className="text-sm">ว/ด/ป</div>
                </td>
                <td
                  className="border border-black bg-white min-w-[50px] whitespace-nowrap"
                  colSpan={1}
                  rowSpan={1}
                >
                  <div className="text-sm">ลงชื่อ</div>
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
                <td className="border border-black bg-white text-black min-w-[30px] hidden">
                  บ
                </td>
                <td className="border border-black bg-white text-black min-w-[30px] hidden">
                  ด
                </td>
                <td className="border border-black bg-white text-black min-w-[30px] hidden">
                  ที
                </td>
                <td className="border border-black bg-white text-black min-w-[30px]">
                  เงิน
                </td>
                <td className="border border-black bg-white text-black min-w-[30px]">
                  ที่รับเงิน
                </td>
                <td className="border border-black bg-white text-black min-w-[30px]">
                  ผู้รับเงิน
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
                  <tr key={key} className="bg-white border">
                    <td className="border border-black">{!person?.firstname ? <p>&nbsp;</p> : key + 1}</td>
                    <td
                      className={`border border-black text-left sticky -left-5 ${key % 2 == 0
                        ? "bg-white"
                        : "bg-white"
                        }`}
                    >
                      {person?.Title?.name} {person?.firstname} {person?.lastname}
                    </td>
                    <td className="border border-black whitespace-nowrap">{person?.Position?.name}</td>
                    <td className="border border-black whitespace-nowrap">
                      {person?.overtime_compensation || null}
                    </td>
                    {/* แสดงรายละเอียดของตาราง กะ */}
                    {arrayDayInMonth?.map((day, index) => (
                      <ModalSelectMonthOT
                        key={index}
                        userId={person?.id}
                        Duty={person?.Duty}
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
                    <td className="hidden border border-black">{!person?.firstname ? <p>&nbsp;</p> : afternoonShift}</td>
                    <td className="hidden border border-black">{!person?.firstname ? <p>&nbsp;</p> : nightShift}</td>
                    <td className="hidden border border-black">{!person?.firstname ? <p>&nbsp;</p> : ot}</td>
                    <td className="border border-black">{!person?.firstname ? <p>&nbsp;</p> : ot || ''}</td>
                    <td className="text-right border border-black">{!person?.firstname ? <p>&nbsp;</p> : ((workingDay + ot) * person.overtime_compensation).toLocaleString('TH-th')}</td>
                    <td className="border border-black"></td>
                    <td className="border border-black"></td>
                  </tr>
                );
              })}

              <tr className="border">
                <td className="border border-black">&nbsp;</td>
                <td className="border border-black">&nbsp;</td>
                <td className="border border-black">&nbsp;</td>
                <td className="border border-black">&nbsp;</td>
                <td className="border border-black" colSpan={daysInMonth}>
                  รวมจ่ายเงินทั้งสิ้น = {THBText(((sumDutyPay(["ช", "บ", "ด"]) + sumOTPay())))}
                </td>
                <td className="hidden border border-black">{sumDuty(["บ"])}</td>
                <td className="hidden border border-black">{sumDuty(["ด"])}</td>
                <td className="hidden border border-black">{sumOT()}</td>
                <td className="border border-black">{sumOT()}</td>
                <td className="border border-black">
                  {((sumDutyPay(["ช", "บ", "ด"]) + sumOTPay())).toLocaleString('TH-th')}
                </td>
                <td className="border border-black">&nbsp;</td>
                <td className="border border-black">&nbsp;</td>
              </tr>

              {/* ข้อมูลการขึ้นเวร */}
              {/* {user?.filter(e => e.Position.name === 'พนักงานเปล')?.map((person, key) => {
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
                  <tr key={key} className="bg-white border">
                    <td className="border border-black">{key + 1}</td>
                    <td
                      className={`whitespace-nowrap border border-black text-left pl-3 ${key % 2 !== 0
                        ? "bg-white"
                        : "bg-white"
                        }`}
                    >
                      {person.Title.name} {person.firstname} {person.lastname}
                    </td>
                    <td className="border border-black whitespace-nowrap">{person.Position.name}</td>
                    <td className="border border-black whitespace-nowrap">
                      360
                    </td>

                    {arrayDayInMonth?.map((day, index) => (
                      <ModalSelectMonthOT
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
                    <td className="hidden border border-black">{afternoonShift}</td>
                    <td className="hidden border border-black">{nightShift}</td>
                    <td className="hidden border border-black">{ot}</td>
                    <td className="border border-black">{ot || ''}</td>
                    <td className="text-right border border-black">{((workingDay + ot) * 360).toLocaleString('TH-th')}</td>
                    <td className="border border-black"></td>
                    <td className="border border-black"></td>
                  </tr>
                );
              })} */}


              {/* {user?.filter(e => e.Position.name == 'พนักงานเปล')?.length ? <tr className="border">
                <td className="border border-black">&nbsp;</td>
                <td className="border border-black">&nbsp;</td>
                <td className="border border-black">&nbsp;</td>
                <td className="border border-black">&nbsp;</td>
                <td className="border border-black" colSpan={daysInMonth}>
                  รวมจ่ายเงินทั้งสิ้น = {THBText(((sumDutyPay(["ช", "บ", "ด"]) + sumOTPay()) * 360)) || 'ศูนย์บาทถ้วน'}
                </td>
                <td className="hidden border border-black">{sumDutyPay(["บ"])}</td>
                <td className="hidden border border-black">{sumDutyPay(["ด"])}</td>
                <td className="hidden border border-black">{sumOTPay()}</td>
                <td className="border border-black">{sumOTPay()}</td>
                <td className="text-right border border-black">
                  {((sumDutyPay(["ช", "บ", "ด"]) + sumOTPay()) * 360).toLocaleString('TH-th')}
                </td>
                <td className="border border-black">&nbsp;</td>
                <td className="border border-black">&nbsp;</td>
              </tr> : ''} */}


              <tr className="border" onClick={() => setOpen(e => e += 1)}>
                <td
                  className="py-5 border border-white"
                  colSpan={daysInMonth + 9}
                >

                  <div className="flex flex-row justify-center">
                    ขอรับรองว่าผู้ที่รับเงินค่าตอบแทนดังกล่าวได้ปฏิบัติงานนอกเวลาจริง
                  </div>
                  <div className="justify-between hidden w-full sm:flex">
                    <div>
                      <p className="mt-3 text-center">ลงชื่อ......................................................................(ผู้ควบคุม)</p>
                      <p className="pl-24 text-left">( นางนงลักษณ์ คนเพียร )</p>
                      <p className="pl-16 text-left"></p>
                      <p className="pl-20 text-left">หัวหน้ากลุ่มงานการพยาบาล</p>
                    </div>
                    <div className="basis-6/12">
                      <p className="mt-3 text-center">ลงชื่อ......................................................................(ผู้อนุมัติ)</p>
                      <p className="text-left pl-96">( นายเรืองศักดิ์  ใจโพธิ์ )</p>
                      <p className="text-left pl-80">นายแพทย์ชำนาญการ รักษาการในตำแหน่ง</p>
                      <p className="text-left pl-[23rem]">ผู้อำนวยการโรงพยาบาลครบุรี</p>
                    </div>
                    <div>
                      <p className="mt-3 text-center">ลงชื่อ......................................................................ผู้จ่ายเงิน</p>
                      <p className="pl-24 text-left">( นางเยาวมาลย์ สุวรรณทา )</p>
                      <p className="pl-16 text-left"></p>
                      <p className="pl-10 text-left">เจ้าพนักงานการเงินและบัญชีชำนาญงาน</p>
                    </div>
                  </div>

                </td>
              </tr>

            </tbody>
          </table>
        </div>
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
    return _.sumBy(user, function (o) {
      return o.Duty?.filter(({ Shif, isOT }) => array.includes(Shif?.name) && !isOT)?.length * o.overtime_compensation;
    });
  }

  function sumOTPay() {
    return _.sumBy(user, function (o) {
      return o.Duty?.filter(({ isOT }) => isOT)?.length * o.overtime_compensation;
    });
  }
};
