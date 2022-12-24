import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import { monthTH, yearTH, yearEN, monthEN } from "@/utils/day";

export default function ModalCreate({
  userId,
  Duty,
  day,
  name,
  Shif,
  getUserList,
  executeDuty,
  deleteDuty,
  userLoading,
}) {
  const [showModal, setShowModal] = useState(false);
  const [defaultDutyOfDay, setDefaultDutyOfDay] = useState(Duty?.filter(({ datetime }) => dayjs(datetime).format("DD") == day));
  const [dutyOfDay, setDutyOfDay] = useState(Duty?.filter(({ datetime }) => dayjs(datetime).format("DD") == day));

  useEffect(() => {
    setDutyOfDay(
      Duty?.filter(({ datetime }) => dayjs(datetime).format("DD") == day)
    );
    setDefaultDutyOfDay(
      Duty?.filter(({ datetime }) => dayjs(datetime).format("DD") == day)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoading]);
  

  return (
    <>
      <td
        className={`border hover:bg-green-300 cursor-pointer text-xs ${
          ["เสาร์", "อาทิตย์"].includes(
            dayjs(`${yearEN}-${monthEN}-${day}`).format("dddd")
          )
            ? "bg-lime-100"
            : ""
        }`}
        onClick={() => setShowModal(true)          
        }
      >
        {dutyOfDay.map(({ Shif, isOT }, index) => {
          if (!isOT) {
            return <span key={index}>{Shif?.name}</span>;
          } else {
            return (
              <span
                className="text-red-500 underline decoration-red-500 decoration-1"
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
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <form className="w-full max-w-lg">
                    <div className="flex">
                      <p className="text-lg font-medium text-black">
                        ชื่อ - นามสกุล :
                      </p>
                      <p className="text-lg font-medium text-green-700 ml-2">
                        {name}
                      </p>
                    </div>
                    <div className="flex">
                      <p className="text-lg font-medium text-black">
                        วันที่ปฏิบัติงาน :
                      </p>
                      <p className="text-lg font-medium text-green-700 ml-2">
                        {day + " " + monthTH + " " + yearTH}
                      </p>
                    </div>
                    <div className="flex flex-wrap -mx-3 mb-6 mt-6">
                      <div className="w-full px-3">
                        <label
                          htmlFor="shift"
                          className="block text-xl font-medium text-black"
                        >
                          เลือกกะ
                        </label>
                        {Shif?.map((shif, index) => (
                          <div
                            key={index}
                            className="grid space-y-2 mt-2 rounded-lg shadow"
                          >
                            <label className={`bg-white p-3 justify-between flex w-full pr-8 border-gray-400 rounded-md text-sm focus:border-green-700 focus:ring-green-700`}>
                              <div>
                                <div className="flex items-center mr-4">
                                  <input
                                    id={"shift" + index}
                                    name={"shift" + index}
                                    type="checkbox"
                                    value={shif.name}
                                    className="w-4 h-4 bg-gray-100 border-gray-300 accent-green-700 cursor-pointer disabled:cursor-auto"
                                    defaultChecked={dutyOfDay?.find(
                                      (checkDuty) =>
                                        checkDuty.shifId === shif.id
                                    )}
                                    disabled={
                                      dutyOfDay?.slice(0,1).map((firstDuty)=> firstDuty.Shif.name)[0] === "ช" ||
                                      dutyOfDay?.slice(0,1).map((firstDuty)=> firstDuty.Shif.name)[0] === "บ" ||
                                      dutyOfDay?.slice(0,1).map((firstDuty)=> firstDuty.Shif.name)[0] === "ด"
                                        ? dutyOfDay?.length < 2
                                          ? !shif.isShif
                                          : !document.getElementById("shift" + index)?.checked
                                        : false ||
                                        dutyOfDay?.slice(0,1).map((firstDuty)=> firstDuty.Shif.name)[0] === "x" ||
                                        dutyOfDay?.slice(0,1).map((firstDuty)=> firstDuty.Shif.name)[0] === "ลาพัก"
                                        ? (dutyOfDay?.slice(0,1).map((firstDuty)=> firstDuty.Shif.name)[0] !== "x" ||
                                        dutyOfDay?.slice(0,1).map((firstDuty)=> firstDuty.Shif.name)[0] !== "ลาพัก") &&
                                          !document.getElementById("shift" + index)?.checked
                                        : false
                                    }
                                   
                                    onClick={() => {
                                      setDutyOfDay((oldState) => {
                                        let returnState = [...oldState];
                                        if (
                                          document.getElementById(
                                            "shift" + index
                                          )?.checked
                                        ) {
                                          returnState = [
                                            ...oldState,
                                            {
                                              shifId: shif.id,
                                              isOT: false,
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
                                    className="ml-2 text-xl font-medium text-gray-700"
                                  >
                                    {shif.name}
                                  </label>
                                </div>
                              </div>
                              {shif.name === "ช" ||
                              shif.name === "บ" ||
                              shif.name === "ด" ? (
                                <label className="inline-flex relative items-center cursor-pointer">
                                  <input
                                    id={"otShift" + index}
                                    name={"otShift" + index}
                                    type="checkbox"
                                    className="sr-only peer"
                                    disabled={
                                      dutyOfDay.find(
                                        (listDuty) =>
                                          listDuty.shifId === shif.id
                                      )
                                        ? false
                                        : true
                                    }
                                    defaultChecked={dutyOfDay?.find(
                                      (checkDuty) =>
                                        checkDuty.shifId === shif.id &&
                                        checkDuty.isOT === true
                                    )}
                                    onClick={() => {
                                      setDutyOfDay((oldState) => {
                                        return oldState.map((item) => {
                                          if (item.shifId === shif.id) {
                                            return {
                                              ...item,
                                              isOT: document.getElementById(
                                                "otShift" + index
                                              )?.checked,
                                            };
                                          }
                                          return item;
                                        });
                                      });
                                    }}
                                  />
                                  <div
                                    className={`w-11 h-6 peer-focus:outline-none peer-focus:ring-0 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-700
                                    ${
                                      dutyOfDay?.find(
                                        (checkDuty) =>
                                          checkDuty.shifId === shif.id &&
                                          checkDuty.isOT === false
                                      )
                                        ? "bg-gray-200"
                                        : "bg-red-600"
                                    }`}
                                  ></div>
                                  <span className="ml-3 text-xl font-medium text-gray-900">
                                    โอที
                                  </span>
                                </label>
                              ) : (
                                ""
                              )}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </form>
                  {console.log('dutyOfDay',dutyOfDay)}
                  {console.log('defaultDutyOfDay',defaultDutyOfDay)}
                  <div className="mt-4">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-green-100 px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
                      onClick={async () => {
                        let shiftData = dutyOfDay.map((duty) => {
                          return {
                            userId: userId,
                            day: day,
                            shifId: duty.shifId,
                            code: duty.Shif.code,
                            isOT: duty.isOT,
                          };
                        });

                        shiftData = _.uniqBy(shiftData, "shifId");

                        shiftData = shiftData.sort((a, b) => {
                          return a.code - b.code;
                        });
                        if (
                          shiftData
                            .map(({ code }) => {
                              return code;
                            })
                            .includes(2) &&
                          shiftData
                            .map(({ code }) => {
                              return code;
                            })
                            .includes(3)
                        ) {
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
                        await setShowModal(false);
                        await getUserList();
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
