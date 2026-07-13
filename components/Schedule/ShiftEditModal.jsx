import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";
import _ from "lodash";
import { metaOf, OT_CIRCLE } from "./shiftStyle";

// modal แก้ไขกะของพยาบาล 1 คน ในวันเดียว — ใช้ตรรกะบันทึกเดียวกับ ModalSelectMonth เดิม
// props: open, onClose, userId, userName, dateLabel, day, monthEN, yearEN,
//        currentDuties [{id, shifId, isOT, Shif}], shifList, executeDuty, deleteDuty, onSaved
export default function ShiftEditModal({
  open,
  onClose,
  userId,
  userName,
  dateLabel,
  day,
  monthEN,
  yearEN,
  currentDuties = [],
  shifList = [],
  executeDuty,
  deleteDuty,
  onSaved,
}) {
  const [selected, setSelected] = useState([]); // [{shifId, isOT, Shif}]
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setSelected(currentDuties.map((d) => ({ shifId: d.shifId, isOT: d.isOT, Shif: d.Shif })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const toggle = (shif, checked) => {
    setSelected((old) =>
      checked
        ? [...old, { shifId: shif.id, isOT: shif.isOT, Shif: shif }]
        : old.filter((s) => s.shifId !== shif.id)
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      // ลบกะเดิมของวันนี้ทั้งหมดก่อน แล้วค่อยบันทึกชุดใหม่
      for (const duty of currentDuties) {
        if (duty.id) await deleteDuty({ url: `/api/duty/${duty.id}`, method: "delete" });
      }

      let shiftData = selected.map((duty) => ({
        userId,
        day: `${yearEN}-${monthEN}-${day}`,
        shifId: duty.shifId,
        code: duty.Shif?.code,
        isOT: duty.isOT,
      }));
      shiftData = _.uniqBy(shiftData, "shifId").sort((a, b) => a.code - b.code);

      // กรณีมีทั้ง code 2 และ 3 (เวรควบ) ให้สลับลำดับตามรูปแบบเดิม
      const has2 = shiftData.some((s) => s.code === 2);
      const has3 = shiftData.some((s) => s.code === 3);
      if (has2 && has3) shiftData = shiftData.sort((a, b) => b.code - a.code);

      if (shiftData.length) await executeDuty({ data: shiftData });
      await onSaved?.();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
          leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
        >
          <div className="fixed inset-0 backdrop-blur-sm bg-[#07211f]/40" />
        </Transition.Child>

        <div className="overflow-y-auto fixed inset-0">
          <div className="flex justify-center items-center p-4 min-h-full text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="overflow-hidden p-6 w-full max-w-md text-left align-middle bg-white rounded-2xl" style={{ boxShadow: "var(--card-shadow-lg)" }}>
                <div className="flex gap-2 items-center mb-1 text-base font-bold tracking-tight text-gray-900">
                  <span className="w-1 h-4 rounded-full bg-gradient-to-b from-teal-500 to-emerald-500" />
                  {userName}
                </div>
                <div className="mb-4 text-sm text-gray-500">{dateLabel}</div>

                <div className="mb-2 text-xs font-bold tracking-wide text-gray-500">เลือกกะ</div>
                <div className="grid grid-cols-2 gap-2">
                  {shifList.map((shif) => {
                    const checked = selected.some((s) => s.shifId === shif.id);
                    const m = metaOf(shif.name);
                    const ot = OT_CIRCLE[shif.class];
                    return (
                      <label
                        key={shif.id}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                          checked
                            ? "ring-2 ring-teal-500/70 bg-teal-600/[0.07] shadow-sm"
                            : "ring-1 ring-gray-200 hover:ring-teal-300/70 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-teal-700"
                          checked={checked}
                          onChange={(e) => toggle(shif, e.target.checked)}
                        />
                        {ot ? (
                          <>
                            <span className={`inline-flex justify-center items-center w-5 h-5 text-[11px] font-semibold bg-white rounded-full border-[1.5px] ${ot.ring}`}>
                              {shif.name}
                            </span>
                            <span className="text-xs text-gray-500">OT {ot.th}</span>
                          </>
                        ) : (
                          <>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${m.chip}`}>{shif.name}</span>
                            <span className="text-xs text-gray-500">{m.time || ""}</span>
                          </>
                        )}
                      </label>
                    );
                  })}
                </div>

                <div className="flex gap-2 justify-end mt-6">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-600 rounded-xl transition-colors hover:bg-gray-100"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={save}
                    disabled={saving}
                    className="px-5 py-2 btn-brand disabled:opacity-60"
                  >
                    {saving ? "กำลังบันทึก…" : "บันทึก"}
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
