import { useState, useEffect } from "react";
import useAxios from "axios-hooks";
import dayjs from "dayjs";
import { authProvider } from "src/authProvider";

const StaffAssignmentPanel = ({ month, year, onAssignmentComplete }) => {
  const [assignmentMode, setAssignmentMode] = useState("auto");
  const [manualAssignments, setManualAssignments] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const currentUser = authProvider.getIdentity();

  // ดึงข้อมูลพนักงานทั้งหมด
  const [{ data: allStaff, loading: staffLoading }] = useAxios({
    url: "/api/user",
    method: "GET"
  });

  // ดึงข้อมูลแผนก
  const [{ data: locations, loading: locationsLoading }] = useAxios({
    url: "/api/location",
    method: "GET"
  });

  // ดึงข้อมูล UserDuty ที่มีอยู่
  const [{ data: existingAssignments, loading: existingLoading }, refetchExisting] = useAxios({
    url: `/api/user/selectMonth?month=${month}&year=${year}`,
    method: "GET"
  });

  // จัดพนักงานเข้าแผนก
  const [{ loading: assignLoading }, executeAssign] = useAxios(
    { url: "/api/staff-assignment", method: "POST" },
    { manual: true }
  );

  const handleAutoAssign = async () => {
    try {
      const result = await executeAssign({
        data: {
          mode: "auto",
          month: month,
          year: year
        }
      });

      alert(`จัดพนักงานเข้าแผนกสำเร็จ!\nจัดพนักงานได้: ${result.data.summary.created} คน\nข้อผิดพลาด: ${result.data.summary.errors} รายการ`);
      
      await refetchExisting();
      onAssignmentComplete && onAssignmentComplete();
      
    } catch (error) {
      console.error("Error auto-assigning staff:", error);
      alert("เกิดข้อผิดพลาดในการจัดพนักงานเข้าแผนก");
    }
  };

  const handleManualAssign = async () => {
    if (manualAssignments.length === 0) {
      alert("กรุณาเลือกพนักงานและแผนกก่อน");
      return;
    }

    try {
      const result = await executeAssign({
        data: {
          mode: "manual",
          month: month,
          year: year,
          assignments: manualAssignments
        }
      });

      alert(`จัดพนักงานเข้าแผนกสำเร็จ!\nจัดพนักงานได้: ${result.data.summary.created} คน\nข้อผิดพลาด: ${result.data.summary.errors} รายการ`);
      
      setManualAssignments([]);
      await refetchExisting();
      onAssignmentComplete && onAssignmentComplete();
      
    } catch (error) {
      console.error("Error manually assigning staff:", error);
      alert("เกิดข้อผิดพลาดในการจัดพนักงานเข้าแผนก");
    }
  };

  const addManualAssignment = () => {
    setManualAssignments([...manualAssignments, {
      userId: "",
      locationId: "",
      isTrain: false,
      TrainingName: ""
    }]);
  };

  const updateManualAssignment = (index, field, value) => {
    const updated = [...manualAssignments];
    updated[index][field] = value;
    setManualAssignments(updated);
  };

  const removeManualAssignment = (index) => {
    const updated = manualAssignments.filter((_, i) => i !== index);
    setManualAssignments(updated);
  };

  if (!currentUser?.isAdmin) {
    return (
      <div className="p-4 rounded-xl bg-rose-500/[0.07] ring-1 ring-rose-500/20">
        <p className="text-sm font-medium text-rose-600">เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถใช้ฟีเจอร์นี้ได้</p>
      </div>
    );
  }

  // กรองพนักงานที่ยังไม่ได้จัดเข้าแผนก
  const assignedUserIds = existingAssignments?.map(assignment => assignment.id) || [];
  const unassignedStaff = allStaff?.filter(staff => 
    staff.isActive && !assignedUserIds.includes(staff.id)
  ) || [];

  return (
    <div className="p-6 card">
      <h2 className="flex gap-2 items-center mb-5 text-base font-bold tracking-tight text-gray-900">
        <span className="w-1 h-4 rounded-full bg-gradient-to-b from-teal-500 to-emerald-500" />
        จัดพนักงานเข้าแผนก
      </h2>

      {/* สถิติปัจจุบัน */}
      {existingLoading ? (
        <p className="mb-6 text-sm text-gray-500">กำลังโหลด...</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 mb-6 text-center">
          <div className="py-3 rounded-xl bg-emerald-500/[0.07]">
            <div className="text-xl font-bold text-emerald-600">{existingAssignments?.length || 0}</div>
            <div className="text-[11px] font-medium text-emerald-600/70">จัดแล้ว</div>
          </div>
          <div className="py-3 rounded-xl bg-orange-500/[0.07]">
            <div className="text-xl font-bold text-orange-600">{unassignedStaff.length}</div>
            <div className="text-[11px] font-medium text-orange-600/70">ยังไม่จัด</div>
          </div>
          <div className="py-3 rounded-xl bg-gray-500/[0.07]">
            <div className="text-xl font-bold text-gray-700">{allStaff?.filter(s => s.isActive).length || 0}</div>
            <div className="text-[11px] font-medium text-gray-500">ทั้งหมด</div>
          </div>
        </div>
      )}

      {/* แสดงรายละเอียดการจัดแล้ว */}
      {existingAssignments && existingAssignments.length > 0 && (
        <div className="p-4 mb-6 rounded-xl bg-sky-500/[0.06] ring-1 ring-sky-500/15">
          <h3 className="mb-2 text-xs font-bold text-sky-700">พนักงานที่จัดเข้าแผนกแล้ว</h3>
          <div className="overflow-y-auto space-y-1 max-h-40 text-sm thin-scroll">
            {existingAssignments.map((assignment, index) => (
              <div key={index} className="flex justify-between">
                <span className="text-gray-700">{assignment.Title?.name} {assignment.firstname} {assignment.lastname}</span>
                <span className="font-medium text-sky-700">{assignment.UserDuty?.Location?.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* เลือกโหมดการจัด */}
      <div className="mb-6">
        <h3 className="mb-3 text-xs font-bold tracking-wide text-gray-500">เลือกวิธีการจัดพนักงาน</h3>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[
            { value: "auto", label: "จัดอัตโนมัติ", desc: "ระบบจัดให้ตามตำแหน่งงานและความต้องการของแต่ละแผนก" },
            { value: "manual", label: "จัดด้วยตัวเอง", desc: "เลือกพนักงานและแผนกเองทีละรายการ" },
          ].map((m) => (
            <label
              key={m.value}
              className={`flex items-start gap-2.5 px-3.5 py-3 rounded-xl cursor-pointer transition-all ${
                assignmentMode === m.value
                  ? "ring-2 ring-teal-500/70 bg-teal-600/[0.07] shadow-sm"
                  : "ring-1 ring-gray-200 hover:ring-teal-300/70 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                value={m.value}
                checked={assignmentMode === m.value}
                onChange={(e) => setAssignmentMode(e.target.value)}
                className="mt-0.5 w-4 h-4 accent-teal-700"
              />
              <span>
                <span className="block text-sm font-semibold text-gray-800">{m.label}</span>
                <span className="block mt-0.5 text-xs text-gray-500">{m.desc}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* โหมดอัตโนมัติ */}
      {assignmentMode === "auto" && (
        <div className="mb-6">
          <div className="p-4 mb-4 rounded-xl bg-emerald-500/[0.06] ring-1 ring-emerald-500/15">
            <h4 className="mb-2 text-xs font-bold text-emerald-700">กฎการจัดอัตโนมัติ:</h4>
            <ul className="space-y-1.5 text-sm text-gray-600">
              {[
                "ICU: พยาบาลวิชาชีพ 8-12 คน",
                "พาสุข1, พาสุข2: พยาบาลวิชาชีพ + พนักงานช่วยเหลือ 6-10 คน",
                "ER: พยาบาลวิชาชีพ 4-8 คน",
                "พนักงานที่เคยอยู่แผนกเดิมจะได้ลำดับความสำคัญ",
              ].map((r) => (
                <li key={r} className="flex gap-2 items-start">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={handleAutoAssign}
            disabled={assignLoading}
            className="px-6 py-2.5 btn-brand disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {assignLoading ? "กำลังจัดพนักงาน..." : "จัดพนักงานอัตโนมัติ"}
          </button>
        </div>
      )}

      {/* โหมดด้วยตัวเอง */}
      {assignmentMode === "manual" && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-bold text-gray-800">จัดพนักงานด้วยตัวเอง</h4>
            <button
              onClick={addManualAssignment}
              className="px-4 py-2 text-sm font-semibold text-teal-700 bg-white rounded-xl border border-teal-200/80 shadow-sm transition-colors hover:bg-teal-50 hover:border-teal-300"
            >
              + เพิ่มรายการ
            </button>
          </div>

          {manualAssignments.length === 0 ? (
            <p className="py-6 text-sm text-center text-gray-400 rounded-xl border border-gray-200 border-dashed">
              ยังไม่มีรายการ กดปุ่ม &quot;เพิ่มรายการ&quot; เพื่อเริ่มต้น
            </p>
          ) : (
            <div className="mb-4 space-y-3">
              {manualAssignments.map((assignment, index) => (
                <div key={index} className="flex gap-3 items-center p-3 rounded-xl ring-1 ring-gray-200">
                  <select
                    value={assignment.userId}
                    onChange={(e) => updateManualAssignment(index, "userId", e.target.value)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50/80 rounded-xl border border-gray-200 transition-colors cursor-pointer hover:border-teal-400 hover:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                  >
                    <option value="">-- เลือกพนักงาน --</option>
                    {unassignedStaff.map(staff => (
                      <option key={staff.id} value={staff.id}>
                        {staff.Title?.name} {staff.firstname} {staff.lastname} ({staff.Position?.name})
                      </option>
                    ))}
                  </select>

                  <select
                    value={assignment.locationId}
                    onChange={(e) => updateManualAssignment(index, "locationId", e.target.value)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50/80 rounded-xl border border-gray-200 transition-colors cursor-pointer hover:border-teal-400 hover:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                  >
                    <option value="">-- เลือกแผนก --</option>
                    {locations?.map(location => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => removeManualAssignment(index)}
                    className="px-3 py-2 text-sm font-medium text-rose-600 rounded-xl transition-colors bg-rose-500/10 hover:bg-rose-500/20"
                  >
                    ลบ
                  </button>
                </div>
              ))}
            </div>
          )}

          {manualAssignments.length > 0 && (
            <button
              onClick={handleManualAssign}
              disabled={assignLoading}
              className="px-6 py-2.5 btn-brand disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {assignLoading ? "กำลังบันทึก..." : "บันทึกการจัด"}
            </button>
          )}
        </div>
      )}

      {/* คำเตือนการลบข้อมูลเดิม */}
      {existingAssignments && existingAssignments.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/[0.08] ring-1 ring-amber-500/20">
          <p className="text-sm text-amber-800">
            <strong>หมายเหตุ:</strong> การจัดพนักงานใหม่จะลบข้อมูลการจัดแผนกเดิมในเดือนนี้ทั้งหมด
          </p>
        </div>
      )}
    </div>
  );
};

export default StaffAssignmentPanel;