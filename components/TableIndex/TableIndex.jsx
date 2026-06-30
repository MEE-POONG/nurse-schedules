import { useSelector } from "react-redux";
import ScheduleBoard from "../Schedule/ScheduleBoard";

// หน้า Home แสดงตารางเวรใหม่ (รายวัน / ตาราง / ปฏิทิน) — แก้ไขได้สำหรับผู้ดูแล
// ฟอร์มราชการเดิมสำหรับพิมพ์อยู่ที่หน้า /official-schedule
export default function TableIndex({ month, year }) {
  const { dateStore } = useSelector((state) => ({ ...state }));
  const monthValue = month !== undefined ? month : dateStore.value.month;
  const yearValue = year !== undefined ? year : dateStore.value.year;

  return <ScheduleBoard month={monthValue} year={yearValue} />;
}
