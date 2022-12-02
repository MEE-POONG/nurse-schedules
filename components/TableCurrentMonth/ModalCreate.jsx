import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import ReactDatePicker from "react-datepicker";
import { FaPlus } from "react-icons/fa";
import th from "date-fns/locale/th";
import useAxios from "axios-hooks";

export default function ModalCreate() {
  const [startDate, setStartDate] = useState(new Date());

  const [isOpen, setIsOpen] = useState(false);

  function closeModal() {
    setIsOpen(false);
  }

  const [
    { data: Location, loading: LocationLoading, error: LocationError },
    getLocationData,
  ] = useAxios({
    url: "/api/location",
  });
  const [{ data: Shif, loading: ShifLoading, error: ShifError }, getShifData] =
    useAxios({
      url: "/api/shif",
    });
  const [{ data: User, loading: UserLoading, error: UserError }, getUserData] =
    useAxios({
      url: "/api/user",
    });
  const [
    { data: Position, loading: PositionLoading, error: PositionError },
    getPositionData,
  ] = useAxios({
    url: "/api/position",
  });

  return (
    <>
      <button
        class="bg-green-700 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg"
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
                    className="text-2xl leading-6 text-green-700 font-extrabold"
                  >
                    เพิ่มข้อมูลตารางเวร
                  </Dialog.Title>
                  <form class="w-full max-w-lg">
                    <div class="flex flex-wrap -mx-3 mb-6 mt-6">
                      <div class="w-full px-3">
                        <label
                          for="name"
                          class="block text-lg font-medium text-black"
                        >
                          ชื่อ-สกุล
                        </label>
                        <select
                          id="name"
                          name="name"
                          autocomplete="name"
                          class="shadow appearance-none border border-green-700 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        >
                          <option>กรุณาเลือกชื่อของท่าน</option>
                          {User?.map((user, index) => (
                            <option value={user.id} key={index}>
                              {user.firstname} {user.lastname}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div class="flex flex-wrap -mx-3 mb-6 mt-6">
                      <div class="w-full px-3">
                        <label
                          for="shift"
                          class="block text-lg font-medium text-black"
                        >
                          เลือก สถานที่
                        </label>
                        <select
                          id="shift"
                          name="shift"
                          autocomplete="shift"
                          class="shadow appearance-none border border-green-700 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        >
                          <option>กรุณาเลือกสถานที่</option>
                          {Location?.map((location, index) => (
                            <option value={location.id} key={index}>
                              {location.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div class="flex flex-wrap -mx-3 mb-6 mt-6">
                      <div class="w-full px-3">
                        <label
                          for="shift"
                          class="block text-lg font-medium text-black"
                        >
                          เลือก กะ
                        </label>
                        <select
                          id="shift"
                          name="shift"
                          autocomplete="shift"
                          class="shadow appearance-none border border-green-700 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        >
                          <option>กรุณาเลือกกะการทำงาน</option>
                          {Shif?.map((shif, index) => (
                            <option value={shif.id} key={index}>
                              {shif.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div class="flex flex-wrap -mx-3 mb-6 mt-6">
                      <div class="w-full px-3">
                        <label
                          for="shift"
                          class="block text-lg font-medium text-black"
                        >
                          เลือก วัน
                        </label>
                        <div className="shadow appearance-none border border-green-700 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                          <ReactDatePicker
                            selected={startDate}
                            onChange={(date) => setStartDate(date)}
                            dateFormat="dd/MM/yyyy"
                            minDate={new Date()}
                            locale={th}
                            isClearable={true}
                            placeholderText="คลิก เพื่อเลือกวัน"
                          />
                        </div>
                      </div>
                    </div>
                    <div class="flex flex-wrap -mx-3 mb-6 mt-6">
                      <div class="w-full px-3">
                        <label
                          for="name"
                          class="block text-lg font-medium text-black"
                        >
                          ชื่อ
                        </label>
                        <input
                          class="shadow appearance-none border border-green-700 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          id="username"
                          type="text"
                          placeholder="ชื่อ"
                        />
                      </div>
                    </div>
                    <div class="flex flex-wrap -mx-3 mb-6 mt-6">
                      <div class="w-full px-3">
                        <label
                          for="name"
                          class="block text-lg font-medium text-black"
                        >
                          รายละเอียด
                        </label>
                        <textarea
                          class="shadow appearance-none border border-green-700 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          id="description"
                          type="text"
                          placeholder="รายละเอียด"
                          rows="4"
                        />
                      </div>
                    </div>
                  </form>

                  <div className="mt-4">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-green-100 px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
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
