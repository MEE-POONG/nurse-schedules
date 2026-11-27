// กล่องยืนยันในแอป ใช้แทน window.confirm()
// เหตุผล: window.confirm บนมือถือเด้งเป็นกล่องระบบหน้าตาเหมือนแอปค้าง ปุ่ม "OK" อยู่ตำแหน่งที่กดพลาดง่าย
// และบอกไม่ได้ว่าสิ่งที่กำลังจะเกิดขึ้นร้ายแรงแค่ไหน — กล่องนี้แยกสีปุ่มและใส่รายละเอียดผลที่ตามมาได้
import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { TbAlertTriangle, TbHelpCircle } from "react-icons/tb";

export default function ConfirmDialog({
  open,
  title,
  message,
  details = [], // รายการผลที่จะตามมา เช่น "เวร 23 รายการจะถูกลบ"
  confirmLabel = "ยืนยัน",
  cancelLabel = "ยกเลิก",
  danger = false, // true = การกระทำที่ย้อนกลับไม่ได้ (ลบ/ล้าง)
  busy = false,
  onConfirm,
  onClose,
}) {
  return (
    <Transition appear show={!!open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => !busy && onClose?.()}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="overflow-y-auto fixed inset-0">
          <div className="flex justify-center items-end p-4 min-h-full sm:items-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:scale-95 sm:translate-y-0"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:scale-95 sm:translate-y-0"
            >
              <Dialog.Panel className="p-5 w-full max-w-md bg-white rounded-2xl shadow-xl">
                <div className="flex gap-3 items-start">
                  <div
                    className={`flex shrink-0 justify-center items-center w-10 h-10 rounded-full ${
                      danger ? "bg-red-100 text-red-600" : "bg-teal-100 text-teal-700"
                    }`}
                  >
                    {danger ? <TbAlertTriangle size={22} /> : <TbHelpCircle size={22} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Dialog.Title className="text-base font-semibold text-gray-900">{title}</Dialog.Title>
                    {message && <p className="mt-1 text-sm whitespace-pre-line text-gray-600">{message}</p>}
                    {details.length > 0 && (
                      <ul
                        className={`mt-3 space-y-1 rounded-lg p-3 text-sm ${
                          danger ? "bg-red-50 text-red-800" : "bg-gray-50 text-gray-700"
                        }`}
                      >
                        {details.map((d, i) => (
                          <li key={i}>• {d}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* บนมือถือวางปุ่มเรียงลงมา ปุ่มยกเลิกอยู่ล่างสุดให้โดนนิ้วโป้งก่อน */}
                <div className="flex flex-col-reverse gap-2 mt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onClose?.()}
                    className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {cancelLabel}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onConfirm?.()}
                    className={`px-4 py-2.5 text-sm font-medium text-white rounded-lg disabled:opacity-50 ${
                      danger ? "bg-red-600 hover:bg-red-700" : "bg-teal-700 hover:bg-teal-800"
                    }`}
                  >
                    {busy ? "กำลังทำรายการ…" : confirmLabel}
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
