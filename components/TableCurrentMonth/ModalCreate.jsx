import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import dayjs from "dayjs";
import { monthTH, yearTH, yearEN, monthEN } from "@/utils/day";

export default function ModalCreate({ userId, Duty, day, name, Shif, getUserList, executeDuty, deleteDuty }) {
  const [showModal, setShowModal] = useState(false);
  const dutyOfDay = Duty?.filter(({ datetime }) => dayjs(datetime).format('DD') == day)
  return (
    <>

      <td
        className={`border hover:bg-green-300 cursor-pointer text-xs ${dutyOfDay.filter(({ isOT }) => isOT)?.length ? 'bg-amber-300' : ["เสาร์", "อาทิตย์"].includes(dayjs(`${yearEN}-${monthEN}-${day}`).format("dddd")) ? 'bg-lime-100' : ''}`}
        onClick={() => setShowModal(true)}
      >
        {dutyOfDay.map(({ Shif, isOT }, index) => {
          if (!isOT) {
            return (
              <span key={index}>{Shif?.name}</span>
            )
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
                    <InputDefault label="วันที่ปฏิบัติงาน" value={day + " " + monthTH + " " + yearTH} />

                    <div className="flex flex-wrap -mx-3 mb-6 mt-6">
                      <div className="w-full px-3">
                        <label
                          htmlFor="shift"
                          className="block text-lg font-medium text-black"
                        >
                          เลือกกะ
                        </label>
                        <div className="flex flex-wrap">
                          {Shif?.sort((a, b) => a.id - b.id)?.filter((x) => ["ช", "บ", "ด"].includes(x.name))?.map((shif, index) => (
                            <div key={index} className="ml-2 mb-2" value={shif.id} >
                              <button
                                type="button"
                                className="inline-flex justify-center rounded-md border border-transparent bg-green-100 px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
                                onClick={async () => {

                                  await deleteDutyById();

                                  const shifId = shif.id;
                                  const data = { userId, shifId, day };

                                  await executeDuty({ data });
                                  await getUserList();
                                  setShowModal(false);
                                }}
                              >
                                {shif.name}
                              </button>
                            </div>
                          ))}

                          <div className="ml-2 mb-2">
                            <button
                              type="button"
                              className="inline-flex justify-center rounded-md border border-transparent bg-green-100 px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
                              onClick={async () => {

                                await deleteDutyById();

                                const shift = await Shif?.filter((x) => ["ช", "บ"].includes(x.name))
                                for (const shif of shift) {
                                  const shifId = shif.id;
                                  const data = { userId, shifId, day };
                                  await executeDuty({ data });
                                }
                                await getUserList();
                                setShowModal(false);
                              }}
                            >
                              {Shif?.filter((x) => ["ช", "บ"].includes(x.name))?.map((shif) => (
                                shif.name
                              ))}
                            </button>
                          </div>

                          <div className="ml-2 mb-2">
                            <button
                              type="button"
                              className="inline-flex justify-center rounded-md border border-transparent bg-green-100 px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
                              onClick={async () => {

                                await deleteDutyById();

                                const shift = await Shif?.filter((x) => ["ด", "บ"].includes(x.name))?.sort((a, b) => b.id - a.id)
                                for (const shif of shift) {
                                  const shifId = shif.id;
                                  const data = { userId, shifId, day };
                                  await executeDuty({ data });
                                }
                                await getUserList();
                                setShowModal(false);
                              }}
                            >
                              {Shif?.filter((x) => ["ด", "บ"].includes(x.name))?.sort((a, b) => b.id - a.id)?.map((shif) => (
                                shif.name
                              ))}
                            </button>
                          </div>

                          {Shif?.sort((a, b) => a.id - b.id)?.filter((x) => ["x", "ลาพัก"].includes(x.name))?.map((shif, index) => (
                            <div key={index} className="ml-2 mb-2" value={shif.id} >
                              <button
                                type="button"
                                className="inline-flex justify-center rounded-md border border-transparent bg-green-100 px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
                                onClick={async () => {

                                  await deleteDutyById();

                                  const shifId = shif.id;
                                  const data = { userId, shifId, day };

                                  await executeDuty({ data });
                                  await getUserList();
                                  setShowModal(false);
                                }}
                              >
                                {shif.name}
                              </button>
                            </div>
                          ))}
                        </div>

                      </div>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );

  async function deleteDutyById() {
    for (const duty of dutyOfDay) {
      await deleteDuty({ url: `/api/duty/${duty.id}`, method: 'delete' });
    }
  }

  function InputDefault({ label, value }) {
    return <div className="flex flex-wrap -mx-3 mb-6 mt-6">
      <div className="w-full px-3">
        <label
          className="block text-lg font-medium text-black"
        >
          {label}
        </label>
        <input
          className="shadow appearance-none border border-green-700 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          type="text"
          value={value}
          disabled
        />
      </div>
    </div>;
  }
}
