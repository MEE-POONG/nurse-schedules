import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect, useRef, useState } from "react";
import dayjs from "dayjs";

export default function ModalSelectMonth({
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
          if (!isOT) {
            return <span className={`${Shif?.name === 'ลาพัก' ? ' text-[0.7rem] ' : Shif?.name === 'ลาป่วย' ? ' text-[0.7rem] ' : Shif?.name === 'ลากิจ' ? ' text-[0.7rem] ' : Shif?.name === 'R' ? ' circle-red text-[12px]  w-[12px] h-[12px] inline-block leading-[12px]' : ' text-lg '}`} key={index}>{Shif?.name.replace('อบรม', '')} </span>;
          } else {
            return (
              <span
                className={`${Shif?.class} text-lg ${Shif?.class ? " text-sm w-[16px] h-[16px] inline-block leading-[16px]" : " text-red-500 underline decoration-red-500 decoration-1"}`}
                key={index}
              >
                {Shif?.name}
              </span>
            );
          }
        })}
      </td>
      <Transition appear show={showModal} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => {
            setShowModal(false);
            setDutyOfDay(defaultDutyOfDay);
          }}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25 print:bg-white print:text-black" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-full p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md p-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                  <form className="w-full max-w-lg">
                    <div className="flex">
                      <p className="text-lg font-medium text-black">
                        ชื่อ - นามสกุล :
                      </p>
                      <p className="ml-2 text-lg font-medium text-green-700">
                        {name}
                      </p>
                    </div>
                    <div className="flex">
                      <p className="text-lg font-medium text-black">
                        วันที่ปฏิบัติงาน :
                      </p>
                      <p className="ml-2 text-lg font-medium text-green-700">
                        {day + " " + monthTH + " " + yearTH}
                      </p>
                    </div>
                    <div className="flex flex-wrap mt-6 mb-6 -mx-3">
                      <div className="w-full px-3">
                        <label
                          htmlFor="shift"
                          className="block text-lg font-medium text-black"
                        >
                          เลือกกะ
                        </label>
                        <div className="grid grid-cols-3">
                          {Shif?.map((shif, index) => (
                            <div
                              key={index}
                              className={`space-y-2 mt-2 rounded-lg shadow ${shif.name === 'ลาพัก' ? 'col-span-2 ' : shif.name === 'ลาป่วย' ? 'col-span-2 ': 'col-span-1'}`}
                            >
                              <label
                                className={`${ruleDuty(shif.name) === true ? 'bg-white print:bg-white print:text-black' : 'bg-white'} p-3 justify-between flex w-full pr-8 border-gray-400 rounded-md text-lg focus:border-green-700 focus:ring-green-700`}
                              >
                                <div className="flex items-center mr-4">
                                  <input
                                    id={"shift" + index}
                                    name={"shift" + index}
                                    type="checkbox"
                                    value={shif.name}
                                    className="w-4 h-4 bg-white border-gray-300 cursor-pointer print:bg-white print:text-black accent-green-700 disabled:cursor-auto"
                                    defaultChecked={dutyOfDay?.find(
                                      (checkDuty) => checkDuty.shifId === shif.id
                                    )}
                                    disabled={ruleDuty(shif.name)}
                                    onClick={() => {
                                      console.log('shif', shif);
                                      setDutyOfDay((oldState) => {
                                        let returnState = [...oldState];
                                        if (
                                          document.getElementById("shift" + index)
                                            ?.checked
                                        ) {
                                          returnState = [
                                            ...oldState,
                                            {
                                              shifId: shif.id,
                                              isOT: shif.isOT,
                                              Shif: shif,
                                            },
                                          ];
                                        } else {
                                          returnState = oldState.filter(
                                            (item) => item.shifId !== shif.id
                                          );
                                        }
                                        return returnState;
                                      });
                                    }}
                                  />
                                  <label
                                    htmlFor={"shift" + index}
                                    className={`ml-2 text-lg font-medium text-gray-700 ${shif.class} ${shif.class ? " text-sm w-[20px] h-[20px] block " : ""}`}
                                  >
                                    {shif.name}
                                  </label>
                                </div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </form>
                  <div className="mt-4">
                    <button
                      type="button"
                      className="inline-flex justify-center px-4 py-2 text-lg font-medium text-green-800 bg-white border border-transparent rounded-md print:bg-white print:text-black hover:bg-white hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
                      onClick={async () => {
                        let shiftData = dutyOfDay.map((duty) => {
                          return {
                            userId: userId,
                            day: yearEN + "-" + monthEN + "-" + day,
                            shifId: duty.shifId,
                            code: duty.Shif?.code,
                            isOT: duty.isOT,
                          };
                        });

                        shiftData = _.uniqBy(shiftData, "shifId");

                        shiftData = shiftData.sort((a, b) => {
                          return a.code - b.code;
                        });

                        const CODE_2 = shiftData.map(({ code }) => { return code }).includes(2)
                        const CODE_3 = shiftData.map(({ code }) => { return code }).includes(3)

                        if (CODE_2 && CODE_3) {
                          shiftData = shiftData.sort((a, b) => {
                            const idA = a.code;
                            const idB = b.code;

                            return idB - idA;
                          });
                        }
                        await deleteDutyById(defaultDutyOfDay);

                        if (shiftData.length != 0) {
                          await executeDuty({ data: shiftData });
                        }

                        await getUserList();
                        setShowModal(false);
                      }}
                    >
                      บันทึกข้อมูล
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );

  async function deleteDutyById(defaultDutyOfDay) {
    for (const duty of defaultDutyOfDay) {
      await deleteDuty({ url: `/api/duty/${duty.id}`, method: "delete" });
    }
  }
}
