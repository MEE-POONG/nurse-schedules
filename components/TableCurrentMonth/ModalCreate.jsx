import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import ReactDatePicker from "react-datepicker";
import { FaPlus } from "react-icons/fa";
import th from 'date-fns/locale/th';

export default function ModalCreate() {
  const [startDate, setStartDate] = useState(new Date());

  const [isOpen, setIsOpen] = useState(false);

  function closeModal() {
    setIsOpen(false);
  }

  return (
    <>
      <button
        class="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded-lg"
        type="button"
        onClick={() => setIsOpen(true)}
      >
        <FaPlus />
      </button>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
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
                  <Dialog.Title
                    as="h3"
                    className="text-2xl leading-6 text-primary font-extrabold"
                  >
                    เพิ่มข้อมูลตารางเวร
                  </Dialog.Title>
                  <form class="w-full max-w-lg">
                    <div class="flex flex-wrap -mx-3 mb-6 mt-6">
                      <div class="w-full px-3">
                        <label
                          for="name"
                          class="block text-lg font-medium text-primary"
                        >
                          ชื่อ-สกุล
                        </label>
                        <select
                          id="name"
                          name="name"
                          autocomplete="name"
                          class="mt-1 block w-full rounded-md text-primary border border-primary bg-white py-2 px-3 shadow-sm focus:border-secondary focus:outline-none focus:ring-secondary sm:text-sm"
                        >
                          <option>กรุณาเลือกชื่อของท่าน</option>
                          <option>นาย ภัทราวุฒิ เบี้ยกระโทก</option>
                          <option>นาย สมถุย ตุ๋ยป้อม</option>
                        </select>
                      </div>
                    </div>
                    <div class="flex flex-wrap -mx-3 mb-6 mt-6">
                      <div class="w-full px-3">
                        <label
                          for="shift"
                          class="block text-lg font-medium text-primary"
                        >
                          เลือก กะ ทำงาน
                        </label>
                        <select
                          id="shift"
                          name="shift"
                          autocomplete="shift"
                          class="mt-1 block w-full rounded-md text-primary border border-primary bg-white py-2 px-3 shadow-sm focus:border-secondary focus:outline-none focus:ring-secondary sm:text-sm"
                        >
                          <option>กรุณาเลือกกะการทำงาน</option>
                          <option>เช้า</option>
                          <option>บ่าย</option>
                          <option>ดึก</option>
                        </select>
                      </div>
                    </div>
                    <div class="flex flex-wrap -mx-3 mb-6 mt-6">
                      <div class="w-full px-3">
                        <label
                          for="shift"
                          class="block text-lg font-medium text-primary"
                        >
                          เลือก วัน ทำงาน
                        </label>
                        <ReactDatePicker
                          selected={startDate}
                          onChange={(date) => setStartDate(date)}
                          dateFormat="dd/MM/yyyy"
                          minDate={new Date()}
                          locale={th}
                          isClearable={true}
                          placeholderText="คลิก เพื่อเลือกวันที่ปฏิบัติงาน"
                        />
                      </div>
                    </div>
                  </form>

                  <div className="mt-4">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-greenLight px-4 py-2 text-sm font-medium text-primary hover:bg-green focus:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
                      onClick={closeModal}
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
}
