import useAxios from "axios-hooks";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import "dayjs/locale/th";

dayjs.locale("th");

// ปุ่มส่งออกตารางเวรเป็นไฟล์ Excel (.xlsx) โดยดึงข้อมูลจากฐานข้อมูลโดยตรง
const ExportExcelButton = ({ month, year }) => {
  const [{ data, loading }] = useAxios({
    url: `/api/user/selectMonth?month=${month}&year=${year}`,
    method: "GET",
  });

  const monthTH = dayjs().month(month).format("MMMM");
  const yearTH = year + 543;

  const handleExport = () => {
    const users = (data || []).filter((u) => u?.firstname);
    if (users.length === 0) {
      alert("ไม่มีข้อมูลเวรในเดือนนี้");
      return;
    }

    const daysInMonth = dayjs().month(month).year(year).daysInMonth();

    // หัวตาราง
    const header = [
      "ลำดับ",
      "ชื่อ - สกุล",
      "ตำแหน่ง",
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
      "รวมเวร",
      "OT",
    ];

    const rows = users.map((u, idx) => {
      // รวมกะของแต่ละวัน (เวรควบ → ต่อกัน, OT → ใส่ * ต่อท้าย)
      const cellByDay = {};
      (u.Duty || []).forEach((d) => {
        const day = dayjs(d.datetime).date();
        const mark = (d.Shif?.name || "") + (d.isOT || d.Shif?.isOT ? "*" : "");
        cellByDay[day] = (cellByDay[day] || "") + mark;
      });

      const work = (u.Duty || []).filter((d) =>
        ["ช", "บ", "ด"].includes(d.Shif?.name)
      ).length;
      const ot = (u.Duty || []).filter((d) => d.isOT || d.Shif?.isOT).length;

      return [
        idx + 1,
        `${u.Title?.name || ""}${u.firstname} ${u.lastname}`,
        u.Position?.name || "",
        ...Array.from({ length: daysInMonth }, (_, i) => cellByDay[i + 1] || ""),
        work,
        ot,
      ];
    });

    const ws = XLSX.utils.aoa_to_sheet([
      [`ตารางเวรประจำเดือน ${monthTH} พ.ศ. ${yearTH}`],
      [],
      header,
      ...rows,
    ]);

    // กว้างคอลัมน์: ลำดับ/ชื่อ/ตำแหน่ง + วันที่แคบ
    ws["!cols"] = [
      { wch: 5 },
      { wch: 22 },
      { wch: 14 },
      ...Array.from({ length: daysInMonth }, () => ({ wch: 4 })),
      { wch: 7 },
      { wch: 5 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${monthTH} ${yearTH}`);
    XLSX.writeFile(wb, `ตารางเวร_${monthTH}_${yearTH}.xlsx`);
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="px-4 py-2 text-white bg-emerald-600 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
    >
      📊 ส่งออก Excel
    </button>
  );
};

export default ExportExcelButton;
