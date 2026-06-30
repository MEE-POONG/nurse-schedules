import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import "dayjs/locale/th";
import Layout from "@/components/Layout/Layout";
import OfficialScheduleTable from "@/components/OfficialScheduleTable/OfficialScheduleTable";
import MonthYearSelector from "@/components/MonthYearSelector/MonthYearSelector";
import ExportExcelButton from "@/components/ExportExcelButton";
import { authProvider } from "src/authProvider";

dayjs.locale("th");

export default function OfficialSchedule() {
  const { dateStore } = useSelector((state) => ({ ...state }));
  const [selectedMonth, setSelectedMonth] = useState(dateStore.month || dayjs().month());
  const [selectedYear, setSelectedYear] = useState(dateStore.year || dayjs().year());

  const currentUser = authProvider.getIdentity();

  useEffect(() => {
    if (authProvider.getIdentity().id === undefined) {
      authProvider.logout();
      window.location.href = "/login";
    }
  }, []);

  const handleMonthYearChange = (month, year) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  const monthTH = dayjs().month(selectedMonth).format("MMMM");
  const yearTH = (selectedYear + 543).toString();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* หัวข้อหน้า */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            ตารางการปฎิบัติงานเวลาราชการ นอกเวลาราชการและวันหยุดราชการ
          </h1>
          <h2 className="text-lg text-gray-600 mb-2">
            เพื่อให้บริการรักษาพยาบาลและสนับสนุนงานบริการอื่นๆ
          </h2>
          <h3 className="text-lg font-medium text-blue-600">
            ประจำเดือน {monthTH} พ.ศ. {yearTH}
          </h3>
        </div>

        {/* เลือกเดือน/ปี */}
        <div className="mb-6">
          <MonthYearSelector
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthYearChange={handleMonthYearChange}
          />
        </div>

        {/* คำแนะนำ */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-800 mb-2">📋 คำแนะนำการใช้งาน</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• ตารางนี้แสดงการปฏิบัติงานแบบทางการตามรูปแบบของหน่วยงานราชการ</li>
            <li>• สามารถเลือกแผนกเพื่อดูข้อมูลเฉพาะแผนกได้</li>
            <li>• วันเสาร์-อาทิตย์จะถูกไฮไลต์เป็นสีเหลือง</li>
            <li>• สัญลักษณ์เวร: ช=เช้า, บ=บ่าย, ด=ดึก, R=พัก, OT=ล่วงเวลา</li>
            <li>• ตารางนี้เหมาะสำหรับการพิมพ์และนำเสนออย่างเป็นทางการ</li>
          </ul>
        </div>

        {/* ปุ่มฟังก์ชันเพิ่มเติม */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            🖨️ พิมพ์ตาราง
          </button>
          
          <ExportExcelButton month={selectedMonth} year={selectedYear} />
        </div>

        {/* ตารางทางการ */}
        <OfficialScheduleTable 
          month={selectedMonth} 
          year={selectedYear} 
        />

        {/* ข้อมูลเพิ่มเติม */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">ข้อมูลเพิ่มเติม:</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>• ตารางนี้จัดทำโดยระบบจัดการตารางเวรพยาบาล</p>
            <p>• ข้อมูลอัพเดทแบบเรียลไทม์จากฐานข้อมูลหลัก</p>
            <p>• สำหรับข้อสงสัยหรือการแก้ไข กรุณาติดต่อผู้ดูแลระบบ</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

