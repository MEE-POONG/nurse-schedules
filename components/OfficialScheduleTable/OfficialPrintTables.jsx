import dayFunction from "@/utils/day";
import { TableSelectMonth } from "../TableSelectMonth/TableSelectMonth";
import { TableSelectMonthAF } from "../TableSelectMonth/TableSelectMonthAF";
import { TableSelectMonthOT } from "../TableSelectMonth/TableSelectMonthOT";
import { TableSelectMonthR } from "../TableSelectMonth/TableSelectMonthR";
import { TableSelectMonthRed } from "../TableSelectMonth/TableSelectMonthRed";
import { TableSelectMonthAFC } from "../TableSelectMonth/TableSelectMonthAFC";
import { TableSelectMonthRF } from "../TableSelectMonth/TableSelectMonthRF";

// ตารางฟอร์มราชการเดิม (เส้นดำ + ลายเซ็น + ปุ่มออกรายงาน) สำหรับพิมพ์ส่งราชการ
// ย้ายมาจากหน้า Home เดิม — เป็นชุดตารางที่ใช้พิมพ์จริง
export default function OfficialPrintTables({ month, year }) {
  const { daysInMonth, arrayDayInMonth, monthEN, yearEN, monthTH, yearTH } = dayFunction(month, year);

  const shared = {
    daysInMonth,
    arrayDayInMonth,
    monthEN,
    yearEN,
    monthTH,
    yearTH,
    monthValue: month,
    yearValue: year,
  };

  return (
    <>
      <TableSelectMonth {...shared} />
      <TableSelectMonthRed {...shared} />
      <TableSelectMonthAF {...shared} />
      <TableSelectMonthAFC {...shared} />
      <TableSelectMonthOT {...shared} />
      <TableSelectMonthR {...shared} />
      <TableSelectMonthRF {...shared} />
    </>
  );
}
