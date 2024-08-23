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
export const TableSelectMonthOnCall2 = ({
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

  const [
    {
      data: configuration,
      loading: configurationLoading,
      error: configurationError,
    },
  ] = useAxios({
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
      <tr className="border text-black">
        <td
          className="border border-black bg-white min-w-[50px]"
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
          งานที่
          <br />
          ปฏิบัติ
        </td>
        <td
          className="border border-black bg-white"
          colSpan={daysInMonth}
          rowSpan={1}
        >
          วันที่ปฏิบัติงาน
        </td>
        <td className="border border-black bg-white" colSpan={2} rowSpan={1}>
          สรุป
        </td>
        <td
          className="border border-black bg-white min-w-[30px]"
          colSpan={1}
          rowSpan={1}
        >
          โอ {}
        </td>
        <td
          className="border border-black bg-white min-w-[50px]"
          colSpan={1}
          rowSpan={1}
        >
          วันทำ
        </td>
        <td
          className="border border-black bg-white min-w-[50px]"
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
            className={`border border-black text-black  min-w-[40px] ${
              ["เสาร์", "อาทิตย์"].includes(
                dayjs(`${yearEN}-${+monthValue + 1}-${day + 1}`).format("dddd")
              )
                ? "bg-white"
                : "bg-white"
            } `}
          >
            {day + 1}
          </td>
        ))}
        <td className="border border-black bg-white text-black min-w-[30px]">
          บ
        </td>
        <td className="border border-black bg-white text-black min-w-[30px]">
          ด
        </td>
        <td className="border border-black bg-white text-black min-w-[30px]">
          ที
        </td>
        <td className="border border-black bg-white text-black min-w-[30px]">
          การ
        </td>
        <td className="border border-black bg-white text-black min-w-[30px]">
          ทำงาน
        </td>
      </tr>

      {/* ข้อมูลการขึ้นเวร */}
      {user
        ?.filter((e) => e?.Position?.name !== "พนักงานเปล")
        ?.map((person, key) => {
          const afternoonShift = person?.OnCallDuty?.filter(
            ({ Shif, isOT }) => Shif?.name == "บ" && !isOT
          )?.length;
          const nightShift = person?.OnCallDuty?.filter(
            ({ Shif, isOT }) => Shif?.name == "ด" && !isOT
          )?.length;
          const workingDay = person?.OnCallDuty?.filter(
            ({ Shif, isOT }) => ["ช", "บ", "ด"].includes(Shif?.name) && !isOT
          )?.length;
          const ot = person?.OnCallDuty?.filter(({ isOT }) => isOT)?.length;
          console.log(
            "isOT",
            person?.OnCallDuty?.filter(({ isOT }) => isOT)
          );
          return (
            <tr key={key} className="border odd:bg-white">
              <td className="border border-black">{key + 1}</td>
              <td
                className={`border border-black text-left pl-3 sticky -left-5 ${
                  key % 2 == 0 ? "bg-white" : "even:bg-white"
                }`}
              >
                {person?.Title?.name}
                {person?.firstname} {person?.lastname}
              </td>
              <td className="border border-black">{person?.Position?.name}</td>
              <td className="border border-black">
                {person.UserDuty?.Location?.name}
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
              <td className="border border-black">
                {(workingDay || 0) + (ot || 0)}
              </td>
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
      {user
        ?.filter((e) => e?.Position?.name === "พนักงานเปล")
        ?.map((person, key) => {
          const afternoonShift = person?.OnCallDuty?.filter(
            ({ Shif, isOT }) => Shif?.name == "บ" && !isOT
          )?.length;
          const nightShift = person?.OnCallDuty?.filter(
            ({ Shif, isOT }) => Shif?.name == "ด" && !isOT
          )?.length;
          const workingDay = person?.OnCallDuty?.filter(
            ({ Shif, isOT }) => ["ช", "บ", "ด"].includes(Shif?.name) && !isOT
          )?.length;
          const ot = person?.OnCallDuty?.filter(({ isOT }) => isOT)?.length;
          console.log(
            "isOT",
            person?.OnCallDuty?.filter(({ isOT }) => isOT)
          );
          return (
            <tr key={key} className="border odd:bg-white">
              <td className="border border-black">{key + 1}</td>
              <td
                className={`border border-black text-left pl-3 sticky -left-5 ${
                  key % 2 == 0 ? "bg-white" : "even:bg-white"
                }`}
              >
                {person.Title.name}
                {person.firstname} {person.lastname}
              </td>
              <td className="border border-black">{person.Position.name}</td>
              <td className="border border-black">
                {person.UserDuty?.Location?.name}
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

      {/* {user?.filter((e) => e?.Position?.name === "พนักงานเปล") ? (
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
          <td className="border border-black">{sumDutyPay(["บ"])}</td>
          <td className="border border-black">{sumDutyPay(["ด"])}</td>
          <td className="border border-black">{sumOTPay()}</td>
          <td className="border border-black">{sumDutyPay(["ช", "บ", "ด"])}</td>
          <td className="border border-black">{sumOTPay()}</td>
        </tr>
      ) : (
        ""
      )} */}

    </>
  );

  function sumDuty(array) {
    return _.sumBy(
      user?.filter((e) => e?.Position?.name !== "พนักงานเปล"),
      function (o) {
        return o.OnCallDuty?.filter(
          ({ Shif, isOT }) => array.includes(Shif?.name) && !isOT
        )?.length;
      }
    );
  }

  function sumOT() {
    return _.sumBy(
      user?.filter((e) => e?.Position?.name !== "พนักงานเปล"),
      function (o) {
        return o.OnCallDuty?.filter(({ isOT }) => isOT)?.length;
      }
    );
  }

  function sumDutyPay(array) {
    return _.sumBy(
      user?.filter((e) => e?.Position?.name === "พนักงานเปล"),
      function (o) {
        return o.OnCallDuty?.filter(
          ({ Shif, isOT }) => array.includes(Shif?.name) && !isOT
        )?.length;
      }
    );
  }

  function sumOTPay() {
    return _.sumBy(
      user?.filter((e) => e?.Position?.name === "พนักงานเปล"),
      function (o) {
        return o.OnCallDuty?.filter(({ isOT }) => isOT)?.length;
      }
    );
  }
};
