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
var isoWeek = require("dayjs/plugin/isoWeek");
dayjs.extend(isoWeek);
export const TableSelectMonthAF = ({
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
      url: `/api/user/selectMonthAF?month=${monthValue}&year=${yearValue}`,
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
      <div className="w-100 bg-white shadow-xl p-5 my-10 rounded-md overflow-x-auto">
        {userLoading ||
          shifLoading ||
          dutyLoading ||
          dutyDeleteLoading ||
          locationLoading ||
          dutyUserLoading ? (
          <LoadingComponent />
        ) : (
          <></>
        )}
        <div ref={componentRef} className="shift-table text-lg">
          <div className="flex flex-col justify-center items-center">
            <h1 className="text-2xl font-bold mb-4">
              หลักฐานการจ่ายเงินค่าปฏิบัติการนอกเวลาราชการ/ในเวลาราชการและวันหยุดราชการ
            </h1>
            <h1 className="text-2xl font-bold mb-4">
              เพื่อการให้บริการรักษาพยาบาลแก่ประชาชนและสนับสนุนงานบริการอื่นๆ
            </h1>
            <h1 className="text-2xl font-bold mb-4">
              ชื่อส่วนราชการโรงพยาบาลครบุรี จังหวัดนครราชสีมา ประจำเดือน....{dayjs(`${dayjs().year()}-${+monthValue + 1}-${+monthValue + 1}`).format("MMMM")}....พ.ศ. ....{yearTH}....
            </h1>
            <h1 className="text-2xl font-bold mb-4">
              ใบสำคัญที่..................................................... ลงวันที่.....................................................
            </h1>
          </div>
          <table className="border-collapse border text-center border-spacing-2 mx-auto text-lg whitespace-nowrap">
            <tbody>
              <tr className="border text-white">
                <td
                  className="border border-black bg-green-600 min-w-[40px]"
                  colSpan={1}
                  rowSpan={2}
                >
                  ลำดับ
                </td>
                <td
                  className="border border-black bg-green-600 min-w-[200px] sticky -left-5"
                  colSpan={1}
                  rowSpan={2}
                >
                  ชื่อ - สกุล
                </td>
                <td
                  className="border border-black bg-green-600 min-w-[110px]"
                  colSpan={1}
                  rowSpan={2}
                >
                  ตำแหน่ง
                </td>
                <td
                  className="border border-black bg-green-600 min-w-[50px]"
                  colSpan={1}
                  rowSpan={2}
                >
                  อัตราค่า<br />ตอบแทน
                </td>
                <td
                  className="border border-black bg-orange-600 whitespace-nowrap"
                  colSpan={daysInMonth}
                  rowSpan={1}
                >
                  วันที่ปฏิบัติงาน
                </td>
                <td className="border border-black bg-green-600 hidden" colSpan={2} rowSpan={1}>
                  สรุป
                </td>
                <td
                  className="border border-black bg-green-600 min-w-[30px] whitespace-nowrap hidden"
                  colSpan={1}
                  rowSpan={1}
                >
                  โอ { }
                </td>
                <td
                  className="border border-black bg-green-600 min-w-[50px] whitespace-nowrap"
                  colSpan={1}
                  rowSpan={2}
                >
                  รวม
                </td>
                <td
                  className="border border-black bg-green-600 min-w-[50px] whitespace-nowrap"
                  colSpan={1}
                  rowSpan={1}
                >
                  จำนวน
                </td>
                <td
                  className="border border-black bg-green-600 min-w-[50px] whitespace-nowrap"
                  colSpan={1}
                  rowSpan={1}
                >
                  ว/ด/ป
                </td>
                <td
                  className="border border-black bg-green-600 min-w-[50px] whitespace-nowrap"
                  colSpan={1}
                  rowSpan={1}
                >
                  ลงมือชื่อ
                </td>
              </tr>
              <tr className="border">
                {/* จำนวนวันของเดือน */}
                {arrayDayInMonth.map((day, index) => (
                  <td
                    key={index}
                    className={`border border-black text-white  min-w-[40px] ${["เสาร์", "อาทิตย์"].includes(
                      dayjs(`${yearEN}-${+monthValue + 1}-${day + 1}`).format("dddd")
                    )
                      ? "bg-green-600"
                      : "bg-orange-600"
                      } `}
                  >
                    {day + 1}
                  </td>
                ))}
                <td className="border border-black bg-cyan-600 text-white min-w-[30px] hidden">
                  บ
                </td>
                <td className="border border-black bg-cyan-600 text-white min-w-[30px] hidden">
                  ด
                </td>
                <td className="border border-black bg-green-600 text-white min-w-[30px] hidden">
                  ที
                </td>
                <td className="border border-black bg-green-600 text-white min-w-[30px]">
                  เงิน
                </td>
                <td className="border border-black bg-green-600 text-white min-w-[30px]">
                  ที่รับเงิน
                </td>
                <td className="border border-black bg-green-600 text-white min-w-[30px]">
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
                  <tr key={key} className="border odd:bg-green-100">
                    <td className="border border-black">{key + 1}</td>
                    <td
                      className={`whitespace-nowrap border border-black text-left pl-3 sticky -left-5 ${key % 2 == 0
                        ? "bg-white"
                        : "even:bg-green-100"
                        }`}
                    >
                      {person.Title.name} {person.firstname} {person.lastname}
                    </td>
                    <td className="border border-black whitespace-nowrap">{person.Position.name}</td>
                    <td className="border border-black whitespace-nowrap">
                      290
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
                    <td className="border border-black hidden">{afternoonShift}</td>
                    <td className="border border-black hidden">{nightShift}</td>
                    <td className="border border-black hidden">{ot}</td>
                    <td className="border border-black">{workingDay || ''}</td>
                    <td className="border border-black text-right">{(workingDay + ot) * 290 ? ((workingDay + ot) * 290).toLocaleString('TH-th') : ''}</td>
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
                  รวมจ่ายเงินทั้งสิ้น = {THBText(((sumDuty(["ช", "บ", "ด"]) + sumOT()) * 290))}
                </td>
                <td className="border border-black hidden">{sumDuty(["บ"])}</td>
                <td className="border border-black hidden">{sumDuty(["ด"])}</td>
                <td className="border border-black hidden">{sumOT()}</td>
                <td className="border border-black">{sumDuty(["ช", "บ", "ด"])}</td>
                <td className="border border-black">
                  {((sumDuty(["ช", "บ", "ด"]) + sumOT()) * 290).toLocaleString('TH-th')}
                </td>
                <td className="border border-black">&nbsp;</td>
                <td className="border border-black">&nbsp;</td>
              </tr>
            </tbody>
          </table>
          <div className="flex flex-row justify-center">
            ขอรับรองว่าผู้ที่รับเงินค่าตอบแทนดังกล่าวได้ปฏิบัติงานนอกเวลาจริง
          </div>
          <div className="justify-between w-full hidden lg:flex">
            <div>
              <p className="text-center mt-3">ลงมือชื่อ......................................................................หัวหน้าฝ่าย(ผู้ควบคุม)</p>
              <p className="text-center">( นางรำไพ นันทโนภาส )</p>
            </div>
            <div className="basis-6/12">
              <p className="text-center mt-3">ลงมือชื่อ............................................................................................................................................ผู้อนุมัติ(ผู้อำนวยการโรงพยาบาลครบุรี)</p>
              <p className="text-center">( นายแพทย์พัฒนา เบ้าสาทร)</p>
            </div>
            <div>
              <p className="text-center mt-3">ลงมือชื่อ......................................................................ผู้จ่ายเงิน</p>
            </div>
          </div>
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
    console.log(user);
    return _.sumBy(user, function (o) {
      return o.Duty?.filter(({ isOT }) => isOT)?.length;
    });
  }

};
