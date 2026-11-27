// ตัวบอกสถานะ "กำลังโหลด" ของทั้งระบบ
//
// เดิมใช้ Dialog ของ headlessui ทำตัวหมุนโหลด ซึ่งผิดความหมาย: Dialog คือกล่องโต้ตอบ
// มันจึงดักโฟกัสไว้ข้างใน ประกาศตัวเองกับโปรแกรมอ่านหน้าจอว่าเป็น dialog (ทั้งที่ไม่มีอะไรให้ทำ)
// และข้างในไม่มีองค์ประกอบที่โฟกัสได้เลย headlessui จึงเตือนทุกครั้งที่โหลดหน้า
//   "There are no focusable elements inside the <FocusTrap />"
// อีกทั้ง onClose ถูกเขียนให้เปิดกลับทันที กด Esc แล้วไม่มีอะไรเกิดขึ้น
//
// เปลี่ยนเป็นแผ่นซ้อนธรรมดาที่บอกสถานะด้วย role="status" ตามความหมายที่ถูกต้อง
// หน้าตาเหมือนเดิมทุกประการ และ API ไม่เปลี่ยน (ไม่รับ prop) จุดเรียกใช้ทั้ง 16 จุดจึงไม่ต้องแก้
export default function LoadingComponent({ label = "กำลังโหลด..." }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex fixed inset-0 z-50 justify-center items-center p-4 backdrop-blur-sm bg-[#07211f]/30"
    >
      <div className="flex flex-col gap-4 items-center px-10 py-8 card" style={{ boxShadow: "var(--card-shadow-lg)" }}>
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-teal-100" />
          <div className="absolute inset-0 rounded-full border-4 border-teal-600 animate-spin border-t-transparent" />
        </div>
        <div className="text-sm font-semibold text-gray-600">{label}</div>
      </div>
    </div>
  );
}
