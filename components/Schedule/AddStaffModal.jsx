import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useMemo, useState } from "react";
import useAxios from "axios-hooks";
import { nameOf } from "./shiftStyle";

// modal "จัดคนขึ้นเวร" — assign พยาบาลเข้าแผนกสำหรับเดือนที่เลือก (POST /api/user-duty)
// หลังเพิ่ม คนจะโผล่ในตาราง selectMonth แล้วกรอกกะได้
// props: open, onClose, month (0-index), year, existingUserIds [], onAdded()
export default function AddStaffModal({ open, onClose, month, year, existingUserIds = [], onAdded }) {
  const [{ data: allUsers }] = useAxios({ url: "/api/user" }, { autoCancel: false });
  const [{ data: locations }] = useAxios({ url: "/api/location" }, { autoCancel: false });
  const [, assign] = useAxios({ url: "/api/user-duty", method: "POST" }, { manual: true, autoCancel: false });

  const [userId, setUserId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [saving, setSaving] = useState(false);

  const available = useMemo(
    () =>
      (allUsers || [])
        .filter((u) => u.firstname && !existingUserIds.includes(u.id))
        .sort((a, b) => nameOf(a).localeCompare(nameOf(b), "th")),
    [allUsers, existingUserIds]
  );

  const add = async () => {
    if (!userId || !locationId) return;
    setSaving(true);
    try {
      await assign({ data: { userId, locationId, day: `${year}-${month + 1}-15` } });
      await onAdded?.();
      setUserId("");
    } finally {
      setSaving(false);
    }
  };

  const selectClass =
    "w-full px-3 py-2 text-sm bg-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500";

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="overflow-y-auto fixed inset-0">
          <div className="flex justify-center items-center p-4 min-h-full text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="overflow-hidden p-5 w-full max-w-md text-left align-middle bg-white rounded-2xl shadow-xl">
                <div className="mb-1 text-base font-semibold text-gray-800">จัดคนขึ้นเวร</div>
                <div className="mb-4 text-sm text-gray-500">เพิ่มพยาบาลเข้าตารางเดือนนี้ แล้วค่อยกรอกกะ</div>

                <div className="space-y-3">
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">พยาบาล</label>
                    <select value={userId} onChange={(e) => setUserId(e.target.value)} className={selectClass}>
                      <option value="">— เลือกพยาบาล —</option>
                      {available.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.Title?.name} {nameOf(u)} {u.Position?.name ? `(${u.Position.name})` : ""}
                        </option>
                      ))}
                    </select>
                    {available.length === 0 && (
                      <p className="mt-1 text-xs text-gray-400">เพิ่มครบทุกคนแล้ว</p>
                    )}
                  </div>
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">แผนก / งานที่ปฏิบัติ</label>
                    <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className={selectClass}>
                      <option value="">— เลือกแผนก —</option>
                      {locations?.map((l) => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 justify-end mt-5">
                  <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100">
                    เสร็จสิ้น
                  </button>
                  <button
                    onClick={add}
                    disabled={saving || !userId || !locationId}
                    className="px-4 py-2 text-sm font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 disabled:opacity-50"
                  >
                    {saving ? "กำลังเพิ่ม…" : "เพิ่มเข้าตาราง"}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
