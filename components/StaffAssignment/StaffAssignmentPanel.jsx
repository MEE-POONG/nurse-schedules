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
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600">เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถใช้ฟีเจอร์นี้ได้</p>
      </div>
    );
  }

  // กรองพนักงานที่ยังไม่ได้จัดเข้าแผนก
  const assignedUserIds = existingAssignments?.map(assignment => assignment.id) || [];
  const unassignedStaff = allStaff?.filter(staff => 
    staff.isActive && !assignedUserIds.includes(staff.id)
  ) || [];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">จัดพนักงานเข้าแผนก</h2>
      
      {/* สถิติปัจจุบัน */}
      <div className="mb-6 p-4 bg-gray-50 rounded-md">
        <h3 className="font-medium text-gray-800 mb-2">สถิติปัจจุบัน</h3>
        {existingLoading ? (
          <p>กำลังโหลด...</p>
        ) : (
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">พนักงานที่จัดแล้ว:</span>
              <span className="ml-2 text-green-600">{existingAssignments?.length || 0} คน</span>
            </div>
            <div>
              <span className="font-medium">พนักงานที่ยังไม่จัด:</span>
              <span className="ml-2 text-orange-600">{unassignedStaff.length} คน</span>
            </div>
            <div>
              <span className="font-medium">พนักงานทั้งหมด:</span>
              <span className="ml-2">{allStaff?.filter(s => s.isActive).length || 0} คน</span>
            </div>
          </div>
        )}
      </div>

      {/* แสดงรายละเอียดการจัดแล้ว */}
      {existingAssignments && existingAssignments.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-md">
          <h3 className="font-medium text-blue-800 mb-2">พนักงานที่จัดเข้าแผนกแล้ว</h3>
          <div className="text-sm space-y-1 max-h-40 overflow-y-auto">
            {existingAssignments.map((assignment, index) => (
              <div key={index} className="flex justify-between">
                <span>{assignment.Title?.name} {assignment.firstname} {assignment.lastname}</span>
                <span className="text-blue-600">{assignment.UserDuty?.Location?.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* เลือกโหมดการจัด */}
      <div className="mb-6">
        <h3 className="font-medium mb-3">เลือกวิธีการจัดพนักงาน</h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              value="auto"
              checked={assignmentMode === "auto"}
              onChange={(e) => setAssignmentMode(e.target.value)}
              className="mr-2"
            />
            <span>จัดอัตโนมัติ (ระบบจัดให้ตามตำแหน่งงานและความต้องการของแต่ละแผนก)</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="manual"
              checked={assignmentMode === "manual"}
              onChange={(e) => setAssignmentMode(e.target.value)}
              className="mr-2"
            />
            <span>จัดด้วยตัวเอง</span>
          </label>
        </div>
      </div>

      {/* โหมดอัตโนมัติ */}
      {assignmentMode === "auto" && (
        <div className="mb-6">
          <div className="p-4 bg-green-50 border border-green-200 rounded-md mb-4">
            <h4 className="font-medium text-green-800 mb-2">กฎการจัดอัตโนมัติ:</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• ICU: พยาบาลวิชาชีพ 8-12 คน</li>
              <li>• พาสุข1, พาสุข2: พยาบาลวิชาชีพ + พนักงานช่วยเหลือ 6-10 คน</li>
              <li>• ER: พยาบาลวิชาชีพ 4-8 คน</li>
              <li>• พนักงานที่เคยอยู่แผนกเดิมจะได้ลำดับความสำคัญ</li>
            </ul>
          </div>
          
          <button
            onClick={handleAutoAssign}
            disabled={assignLoading}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {assignLoading ? "กำลังจัดพนักงาน..." : "จัดพนักงานอัตโนมัติ"}
          </button>
        </div>
      )}

      {/* โหมดด้วยตัวเอง */}
      {assignmentMode === "manual" && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium">จัดพนักงานด้วยตัวเอง</h4>
            <button
              onClick={addManualAssignment}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              เพิ่มรายการ
            </button>
          </div>

          {manualAssignments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">ยังไม่มีรายการ กดปุ่ม &quot;เพิ่มรายการ&quot; เพื่อเริ่มต้น</p>
          ) : (
            <div className="space-y-3 mb-4">
              {manualAssignments.map((assignment, index) => (
                <div key={index} className="flex gap-3 items-center p-3 border rounded-md">
                  <select
                    value={assignment.userId}
                    onChange={(e) => updateManualAssignment(index, "userId", e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
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
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
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
                    className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
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
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {assignLoading ? "กำลังบันทึก..." : "บันทึกการจัด"}
            </button>
          )}
        </div>
      )}

      {/* คำเตือนการลบข้อมูลเดิม */}
      {existingAssignments && existingAssignments.length > 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800 text-sm">
            <strong>หมายเหตุ:</strong> การจัดพนักงานใหม่จะลบข้อมูลการจัดแผนกเดิมในเดือนนี้ทั้งหมด
          </p>
        </div>
      )}
    </div>
  );
};

export default StaffAssignmentPanel;