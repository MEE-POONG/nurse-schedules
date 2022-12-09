import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import dayjs from "dayjs";
import { monthTH, yearTH, yearEN, monthEN } from "@/utils/day";
import { values } from "lodash";

export default function ModalCreate({
  userId,
  Duty,
  day,
  name,
  Shif,
  getUserList,
  executeDuty,
}) {
  const [showModal, setShowModal] = useState(false);
  const dutyOfDay = Duty?.filter(
    ({ datetime }) => dayjs(datetime).format("DD") == day
  );

  const [checkListShift, setCheckListShift] = useState([]);

  // function เพิ่มข้อมูล
  const onCheck = (onSelect) => {
    const exist = checkListShift.find(
      (listShift) => listShift.id === onSelect.id
    );

    if (exist) {
      setCheckListShift(
        checkListShift.filter((listShift) => listShift.id !== onSelect.id)
      );
    } else {
      setCheckListShift([...checkListShift, { ...onSelect, isOT: false }]);
    }
  };

  const onSelectOT = (onSelect) => {
    const exist = checkListShift.find(
      (listShift) => listShift.id === onSelect.id
    );

    if (exist) {
      setCheckListShift(
        checkListShift.map((listShift) =>
          listShift.id === onSelect.id
            ? { ...exist, isOT: !exist.isOT }
            : listShift
        )
      );
    }
  };

  // console.log(checkListShift);

  return (
    <>
      <td
        className={`border hover:bg-green-300 cursor-pointer text-xs ${
          dutyOfDay.filter(({ isOT }) => isOT)?.length
            ? "bg-amber-300"
            : ["เสาร์", "อาทิตย์"].includes(
                dayjs(`${yearEN}-${monthEN}-${day}`).format("dddd")
              )
            ? "bg-lime-100"
            : ""
        }`}
        onClick={() => setShowModal(true)}
      >
        {dutyOfDay.map(({ Shif, isOT }, index) => {
          if (!isOT) {
            return <span key={index}>{Shif?.name}</span>;
          }
        })}
      </td>

      <Transition appear show={showModal} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setShowModal(false)}
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
                    <InputDefault label="ชื่อ - นามสกุล" value={name} />
                    <InputDefault
                      label="วันที่ปฏิบัติงาน"
                      value={day + " " + monthTH + " " + yearTH}
                    />

                    <div className="flex flex-wrap -mx-3 mb-6 mt-6">
                      <div className="w-full px-3">
                        <label
                          htmlFor="shift"
                          className="block text-lg font-medium text-black"
                        >
                          เลือกกะ
                        </label>
                        {Shif?.map((shif, index) => (
                          <div
                            key={index}
                            className="grid space-y-2 mt-2 rounded-lg shadow"
                          >
                            <label className="p-3 justify-between flex w-full pr-8 bg-white border border-gray-400 rounded-md text-sm focus:border-green-700 focus:ring-green-700">
                              <div>
                                <div className="flex items-center mr-4">
                                  <input
                                    name={"shift" + index}
                                    type="checkbox"
                                    value={shif.id}
                                    className="w-4 h-4 bg-gray-100 border-gray-300 accent-green-700 cursor-pointer"
                                    onClick={() => {
                                      onCheck(shif);
                                    }}
                                  />
                                  <label
                                    htmlFor={"shift" + index}
                                    className="ml-2 text-lg font-medium text-gray-700"
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
                                    name={"otShift" + index}
                                    type="checkbox"
                                    className="sr-only peer"
                                    disabled={
                                      checkListShift.find(
                                        (listShift) => listShift.id === shif.id
                                      ) ? false : true
                                    }
                                    onClick={() => {
                                      onSelectOT(shif);
                                    }}
                                  />
                                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-700"></div>
                                  <span className="ml-3 text-lg font-medium text-gray-900">
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

                  <div className="mt-4">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-green-100 px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
                      onClick={async () => {
                        const shifId =
                          document.getElementById("shift").checked == true;
                        const data = { userId, shifId, day };

                        if (!shifId) {
                          alert("กรุณาเลือกกะการทำงาน");
                          return;
                        }

                        await executeDuty({ data });
                        await getUserList();
                        setShowModal(false);
                      }}
                    >
                      เพิ่มข้อมูล
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

  function InputDefault({ label, value }) {
    return (
      <div className="flex flex-wrap -mx-3 mb-6 mt-6">
        <div className="w-full px-3">
          <label className="block text-lg font-medium text-black">
            {label}
          </label>
          <input
            className="shadow appearance-none border border-green-700 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            type="text"
            value={value}
            disabled
          />
        </div>
      </div>
    );
  }
}
