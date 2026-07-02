import { TbAlertTriangle } from "react-icons/tb";

export default function ErrorComponent() {
    return (
        <div className="p-10 text-center card">
            <div className="flex justify-center mb-3">
                <span className="flex justify-center items-center w-12 h-12 text-rose-500 rounded-2xl bg-rose-500/10">
                    <TbAlertTriangle size={26} />
                </span>
            </div>
            <div className="font-semibold text-gray-800">เกิดข้อผิดพลาดในการโหลดข้อมูล</div>
            <div className="mt-1 text-sm text-gray-500">กรุณาลองรีเฟรชหน้า หรือลองใหม่อีกครั้งภายหลัง</div>
        </div>
    );
}
