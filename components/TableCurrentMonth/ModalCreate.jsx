import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
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
}) {
  const [showModal, setShowModal] = useState(false);
  const dutyOfDay = Duty?.filter(
    ({ datetime }) => dayjs(datetime).format("DD") == day
  );
  //state ข้อมูลการขึ้นเวร
  const [checkListShift, setCheckListShift] = useState([]);
  //state ข้อมูลกะที่ต้องการลบ
  const [checkDeleteShift, setCheckDeleteShift] = useState([]);
  //state ข้อมูลOTที่ต้องการอัพเดท
  const [checkUpdateShift, setCheckUpdateShift] = useState([]);
  //state ข้อมูลกะที่เลือกเพื่อล็อคกะที่เหลือฃ
  const [selectShiftCheck, setSelectShiftCheck] = useState({});

  // function ล็อกปุ่มเมื่อเลือกเวร  //แก้
  // const onSelectedChange = (shiftName) => {
  //   const name = selectShiftCheck.find((selectName) => selectName.name === shiftName) 
  //   if (name) {
  //     setSelectShiftCheck(
  //       selectShiftCheck.filter((setName) => setName.name !== name )
  //     );
  //   } else {
  //     setSelectShiftCheck(() => ({
  //       checked: name,
  //     }));
  //   }
  // };
  // const { checked } = selectShiftCheck
  // const checkedCount = Object.keys(checked).filter(key => checked[key]).length;
  // const disabled = checkedCount >= 2
  // console.log("disabled=", disabled);
  console.log("selectShift=", selectShiftCheck);

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
      setCheckListShift([
        ...checkListShift,
        { userId, day, ...onSelect, isOT: false },
      ]);
    }
  };

  // ฟังก์ชั่นเลือก OT
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

    // function อัพเดท OT
    const onUpdate = (onUpdate) => {
      const exist = checkUpdateShift.find(
        (updateShift) => updateShift.id === onUpdate.id
      );
  
      if (exist) {
        setCheckUpdateShift(
          checkUpdateShift.filter((updateShift) => updateShift.id !== onUpdate.id)
        );
      } else {
        setCheckUpdateShift([
          ...checkUpdateShift,
          { isOT: false },
        ]);
      }
    };

  // ฟังก์ชั่นเลือกกะที่ต้องการลบ
  const onCheckDelete = (onDelete) => {
    const exist = checkDeleteShift.find(
      (listShift) => listShift.id === onDelete.id
    );

    if (exist) {
      setCheckDeleteShift(
        checkDeleteShift.filter((listShift) => listShift.id !== onDelete.id)
      );
    } else {
      setCheckDeleteShift([...checkDeleteShift, { id: onDelete.id }]);
    }
  };

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
        onClick={() => setShowModal(true)}
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
          onClose={async () => {
            await setCheckListShift([]);
            await setCheckDeleteShift([]);
            await setShowModal(false);
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
                            <label className="p-3 justify-between flex w-full pr-8 bg-white border border-gray-400 rounded-md text-sm focus:border-green-700 focus:ring-green-700">
                              <div>
                                <div className="flex items-center mr-4">
                                  <input
                                    name={"shift" + index}
                                    type="checkbox"
                                    value={shif.id}
                                    className="checkbox-shift w-4 h-4 bg-gray-100 border-gray-300 accent-green-700 cursor-pointer"
                                    defaultChecked={dutyOfDay?.find(
                                      (checkDuty) =>
                                        checkDuty.shifId === shif.id
                                    )}
                                    onClick={(event) => {
                                      // เลือก id duty ของกะที่เลือก
                                      const dutySelect = dutyOfDay?.find(
                                        (checkDuty) =>
                                          checkDuty.shifId === shif.id
                                      );
                                      //เช็คว่ามีค่า shiftId ของกะนั้นอยู่ใน state หรือไม่
                                        if(event.target.checked === true){
                                          onCheck(shif);
                                        }else{
                                          if (dutySelect) {
                                            onCheckDelete(dutySelect);
                                          }else{
                                            onCheck(shif);
                                          }
                                        }
                                    }}
                                    // onChange={() => onSelectedChange(shif.name)} //แก้
                                    // disabled={!checked[index] && disabled} //แก้
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
                                    name={"otShift" + index}
                                    type="checkbox"
                                    className="sr-only peer"
                                    disabled={
                                      dutyOfDay.find(
                                        (listDuty) =>
                                          listDuty.shifId === shif.id
                                      )
                                        ? false
                                        : checkListShift.find(
                                            (listShift) =>
                                              listShift.id === shif.id
                                          )
                                        ? false
                                        : true
                                    }
                                    defaultChecked={dutyOfDay?.find(
                                      (checkDuty) =>
                                        checkDuty.shifId === shif.id &&
                                        checkDuty.isOT === true
                                    )}
                                    onClick={(event) => {
                                      if (event.target.checked === true) {
                                        onSelectOT(shif);
                                      }else{
                                        onUpdate(shif.id);
                                      }
                                    }}
                                  />
                                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-700"></div>
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
                  {console.log("ADD", checkListShift)}
                  {console.log("DELETE", checkDeleteShift)}
                  {console.log("UPDATE", checkUpdateShift)}
                  <div className="mt-4">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-green-100 px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
                      onClick={async () => {
                        const shiftData = checkListShift;

                        shiftData.sort((a, b) => {
                          return a.id - b.id;
                        })

                        await deleteDutyById();
                        if (!shiftData) {
                          alert("กรุณาเลือกกะการทำงาน");
                          return;
                        }

                        await executeDuty({ data: shiftData });
                        await setCheckListShift([]);
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

  async function deleteDutyById() {
    for (const duty of checkDeleteShift) {
      await deleteDuty({ url: `/api/duty/${duty.id}`, method: "delete" });
    }
  }
}
