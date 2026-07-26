import { useState, useEffect } from "react";
import useAxios from "axios-hooks";
import dayjs from "dayjs";
import { authProvider } from "src/authProvider";

const ShiftReservationModal = ({ 
  isOpen, 
  onClose, 
  selectedDate, 
  month, 
  year, 
  onReservationUpdate 
}) => {
  const [selectedShift, setSelectedShift] = useState("");
  const [priority, setPriority] = useState(1);
  const [isReserved, setIsReserved] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const currentUser = authProvider.getIdentity();

  // ดึงข้อมูลกะทำงาน
  const [{ data: shifts, loading: shiftsLoading }] = useAxios({
    url: "/api/shif",
    method: "GET"
  });

  // ดึงการจองที่มีอยู่
  const [{ data: existingReservations, loading: reservationsLoading }, refetchReservations] = useAxios({
    url: `/api/shift-preference?userId=${currentUser?.id}&month=${month}&year=${year}`,
    method: "GET"
  });

  // สร้างการจอง
  const [{ loading: createLoading }, executeCreate] = useAxios(
    { url: "/api/shift-preference", method: "POST" },
    { manual: true }
  );

  // แก้ไขการจอง
  const [{ loading: updateLoading }, executeUpdate] = useAxios(
    { url: "/api/shift-preference", method: "PUT" },
    { manual: true }
  );

  // ลบการจอง
  const [{ loading: deleteLoading }, executeDelete] = useAxios(
    { url: "/api/shift-preference", method: "DELETE" },
    { manual: true }
  );

  const resetForm = () => {
    setSelectedShift("");
    setPriority(1);
    setIsReserved(false);
    setEditingId(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedShift || !selectedDate) return;

    try {
      if (editingId) {
        await executeUpdate({
          data: {
            id: editingId,
            shifId: selectedShift,
            priority: priority,
            isReserved: isReserved
          }
        });
      } else {
        const datetime = dayjs()
          .year(year)
          .month(month)
          .date(selectedDate)
          .hour(8)
          .minute(0)
          .second(0);

        await executeCreate({
          data: {
            userId: currentUser.id,
            shifId: selectedShift,
            locationId: currentUser.UserDuty?.[0]?.locationId,
            datetime: datetime.toISOString(),
            priority: priority,
            isReserved: isReserved
          }
        });
      }

      // รีเฟรชข้อมูล
      await refetchReservations();
      onReservationUpdate && onReservationUpdate();

      resetForm();
      onClose();

    } catch (error) {
      console.error("Error saving reservation:", error);
      if (error.response?.status === 409) {
        alert("มีการจองกะนี้ในวันนี้อยู่แล้ว");
      } else {
        alert("เกิดข้อผิดพลาดในการบันทึกการจอง");
      }
    }
  };

  const handleEdit = (reservation) => {
    setEditingId(reservation.id);
    setSelectedShift(reservation.shifId);
    setPriority(reservation.priority);
    setIsReserved(reservation.isReserved);
  };

  const handleDelete = async (reservation) => {
    if (!confirm(`ลบการจองกะ "${reservation.Shif?.name}" วันที่ ${selectedDate}?`)) return;

    try {
      await executeDelete({ data: { id: reservation.id } });
      if (editingId === reservation.id) resetForm();
      await refetchReservations();
      onReservationUpdate && onReservationUpdate();
    } catch (error) {
      console.error("Error deleting reservation:", error);
      alert("เกิดข้อผิดพลาดในการลบการจอง");
    }
  };

  if (!isOpen) return null;

  // รวมกะทำงาน (ช/บ/ด) และวันหยุด (x) ให้จองได้
  const availableShifts = shifts?.filter(shift =>
    (shift.isShif && ["ช", "บ", "ด"].includes(shift.name)) || shift.name === "x"
  ) || [];

  const currentDateReservations = existingReservations?.filter(res => 
    dayjs(res.datetime).date() === selectedDate
  ) || [];

  const fieldCls =
    "w-full px-3.5 py-2.5 text-sm font-medium text-gray-700 bg-gray-50/80 rounded-xl border border-gray-200 transition-colors cursor-pointer hover:border-teal-400 hover:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white";

  return (
    <div className="overflow-y-auto fixed inset-0 z-50">
      <div className="flex justify-center items-center px-4 pt-4 pb-20 min-h-screen text-center sm:block sm:p-0">
        <div className="fixed inset-0 backdrop-blur-sm transition-opacity bg-[#07211f]/40" onClick={handleClose}></div>

        <div className="inline-block overflow-hidden p-6 my-8 w-full max-w-md text-left align-middle bg-white rounded-2xl transition-all transform" style={{ boxShadow: "var(--card-shadow-lg)" }}>
          <div className="mb-4">
            <h3 className="flex gap-2 items-center text-base font-bold tracking-tight text-gray-900">
              <span className="w-1 h-4 rounded-full bg-gradient-to-b from-teal-500 to-emerald-500" />
              จองเวรวันที่ {selectedDate} {dayjs().month(month).year(year).format("MMMM YYYY")}
            </h3>
          </div>

          {/* แสดงการจองที่มีอยู่ */}
          {currentDateReservations.length > 0 && (
            <div className="p-3.5 mb-4 rounded-xl bg-amber-500/[0.08] ring-1 ring-amber-500/20">
              <h4 className="mb-2 text-xs font-bold text-amber-700">การจองที่มีอยู่:</h4>
              {currentDateReservations.map(res => (
                <div
                  key={res.id}
                  className={`flex justify-between items-center gap-2 text-sm py-1 ${
                    editingId === res.id ? "bg-amber-500/15 -mx-1.5 px-1.5 rounded-lg" : ""
                  }`}
                >
                  <span className="text-gray-700">{res.Shif?.name === "x" ? "หยุด" : res.Shif?.name} - ลำดับ {res.priority}</span>
                  <span className="flex gap-2 items-center">
                    <span className={`text-xs font-semibold ${res.isReserved ? "text-green-600" : "text-gray-500"}`}>
                      {res.isReserved ? "จองแน่นอน" : "ต้องการ"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleEdit(res)}
                      className="px-2 py-0.5 text-xs font-medium text-teal-700 rounded-md transition-colors bg-teal-500/10 hover:bg-teal-500/20"
                    >
                      แก้ไข
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(res)}
                      disabled={deleteLoading}
                      className="px-2 py-0.5 text-xs font-medium text-rose-600 rounded-md transition-colors bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-50"
                    >
                      ลบ
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}

          {editingId && (
            <div className="flex justify-between items-center px-3.5 py-2 mb-3 text-xs text-teal-800 rounded-xl bg-teal-600/10 ring-1 ring-teal-500/20">
              <span>กำลังแก้ไขการจอง — ปรับค่าด้านล่างแล้วกดบันทึก</span>
              <button
                type="button"
                onClick={resetForm}
                className="font-medium text-teal-700 underline hover:text-teal-900"
              >
                ยกเลิกการแก้ไข
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-1.5 text-xs font-semibold text-gray-600">
                เลือกกะงาน
              </label>
              <select
                value={selectedShift}
                onChange={(e) => setSelectedShift(e.target.value)}
                className={fieldCls}
                required
              >
                <option value="">-- เลือกกะงาน --</option>
                {availableShifts.map(shift => (
                  <option key={shift.id} value={shift.id}>
                    {shift.name === "x"
                      ? "หยุด (วันหยุด)"
                      : `${shift.name} (${getShiftTime(shift.name)})`}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block mb-1.5 text-xs font-semibold text-gray-600">
                ความสำคัญ
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value))}
                className={fieldCls}
              >
                <option value={1}>สูงสุด (ต้องการมาก)</option>
                <option value={2}>ปกติ</option>
                <option value={3}>ต่ำ (ไม่อยากทำ)</option>
              </select>
            </div>

            <div className="mb-6">
              <label className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl cursor-pointer transition-all ${
                isReserved ? "ring-2 ring-teal-500/70 bg-teal-600/[0.07]" : "ring-1 ring-gray-200 hover:ring-teal-300/70"
              }`}>
                <input
                  type="checkbox"
                  checked={isReserved}
                  onChange={(e) => setIsReserved(e.target.checked)}
                  className="w-4 h-4 accent-teal-700"
                />
                <span className="text-sm font-medium text-gray-700">
                  จองแน่นอน (จะได้เวรนี้อย่างแน่นอน)
                </span>
              </label>
              {isReserved && (
                <p className="mt-2 text-xs text-amber-600">
                  หมายเหตุ: การจองแน่นอนจะมีผลเหนือความชอบของคนอื่น
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 rounded-xl transition-colors bg-gray-100 hover:bg-gray-200"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={createLoading || updateLoading || !selectedShift}
                className="flex-1 py-2.5 btn-brand disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createLoading || updateLoading
                  ? "กำลังบันทึก..."
                  : editingId
                  ? "บันทึกการแก้ไข"
                  : "บันทึกการจอง"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

function getShiftTime(shiftName) {
  const times = {
    "ช": "08:30-16:30",
    "บ": "16:30-00:30",
    "ด": "00:30-08:30"
  };
  return times[shiftName] || "";
}

export default ShiftReservationModal;