import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect, useRef, useState } from "react";
import dayjs from "dayjs";

export default function ModalSelectMonthR({
  userId,
  Duty,
  day,
  name,
  Shif,
  getUserList,
  executeDuty,
  deleteDuty,
  userLoading,
  monthEN,
  monthTH,
  yearEN,
  yearTH,
}) {
  const [showModal, setShowModal] = useState(false);
  const [defaultDutyOfDay, setDefaultDutyOfDay] = useState(
    Duty?.filter(({ datetime }) => dayjs(datetime).format("DD") == day)
  );
  const [dutyOfDay, setDutyOfDay] = useState(
    Duty?.filter(({ datetime }) => dayjs(datetime).format("DD") == day)
  );


  useEffect(() => {
    setDutyOfDay(
      Duty?.filter(({ datetime }) => dayjs(datetime).format("DD") == day)
    );
    setDefaultDutyOfDay(
      Duty?.filter(({ datetime }) => dayjs(datetime).format("DD") == day)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoading]);


  //function rule checkbox shift
  const ruleDuty = (name) => {
    return false;
    console.log('42', dutyOfDay);
    if (
      dutyOfDay?.filter(({ Shif }) => ["ช", "บ", "ด"].includes(Shif?.name))
        .length > 0
    ) {
      if (dutyOfDay.filter(({ Shif }) => Shif !== null).length === 2) {
        return !dutyOfDay.map(({ Shif }) => Shif?.name).includes(name);
      }
      return !["ช", "บ", "ด"].includes(name);
    }
    if (
      dutyOfDay?.filter(({ Shif }) => ["x", "ลาพัก"].includes(Shif?.name))
        .length > 0
    ) {
      if (dutyOfDay.filter(({ Shif }) => Shif !== null).length === 1) {
        return !dutyOfDay.map(({ Shif }) => Shif?.name).includes(name);
      }
      return !["x", "ลาพัก"].includes(name);
    }
  };

  //function auto uncheck OT
  const autoUncheck = (shiftElmID, otElmID) => {
    let targetElm = document.getElementById(shiftElmID);
    let checkElm = document.getElementById(otElmID);
    if (targetElm?.checked == false) {
      checkElm.checked = false;
    }
  };

  return (
    <>
      <td
        className={`border border-black print:bg-white print:text-black hover:bg-white cursor-pointer text-lg whitespace-nowrap ${["เสาร์", "อาทิตย์"].includes(
          dayjs(`${yearEN}-${monthEN}-${day}`).format("dddd")
        )
          ? "bg-white print:bg-white print:text-black"
          : ""
          }`}
        onClick={() => setShowModal(true)}
      >
        {dutyOfDay.map(({ Shif, isOT }, index) => {
            return (
              <span
                className={`${Shif?.class} text-md ${Shif?.class ? " text-sm w-[16px] h-[16px] inline-block leading-[16px]" : " text-black decoration-red-500 decoration-1"}`}
                key={index}
              >
                /
              </span>
            );
        })}
      </td>
    </>
  );

}
