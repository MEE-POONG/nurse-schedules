import { useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { authProvider } from "src/authProvider";

dayjs.locale("th");

const WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

// สี/ลำดับของแต่ละกะ
const SHIFT_STYLE = {
  ด: { label: "ด", chip: "bg-indigo-100 text-indigo-800 border-indigo-200", order: 1 },
  ช: { label: "ช", chip: "bg-amber-100 text-amber-800 border-amber-200", order: 2 },
  บ: { label: "บ", chip: "bg-sky-100 text-sky-800 border-sky-200", order: 3 },
  x: { label: "หยุด", chip: "bg-gray-100 text-gray-500 border-gray-200", order: 9 },
  R: { label: "พัก", chip: "bg-rose-50 text-rose-600 border-rose-200", order: 9 },
};

const nameOf = (u) => `${u?.firstname || ""} ${u?.lastname || ""}`.trim();
const shortName = (u) => u?.firstname || "";

const ScheduleCalendar = ({ data, month, year }) => {
  const [mode, setMode] = useState("me"); // me | team
  const meId = authProvider.getIdentity()?.id;

  const users = Array.isArray(data) ? data.filter((u) => u?.firstname) : [];
  const ref = dayjs().year(year).month(month).startOf("month");
  const daysInMonth = ref.daysInMonth();
  const firstDayOfWeek = ref.day();
  const monthTH = ref.format("MMMM");
  const yearTH = year + 543;
  const today = dayjs();
  const isToday = (day) =>
    today.date() === day && today.month() === month && today.year() === year;

  // กะของแต่ละ user ในแต่ละวัน
  const dutiesOf = (user, day) =>
    (user?.Duty || [])
      .filter((d) => dayjs(d.datetime).date() === day)
      .map((d) => ({ name: d.Shif?.name, ot: d.isOT || d.Shif?.isOT }));

  const me = meId ? users.find((u) => u.id === meId) : null;

  // มุมมองทีม: สรุปจำนวนคนต่อกะในแต่ละวัน
  const teamByDay = (day) => {
    const count = { ด: 0, ช: 0, บ: 0 };
    users.forEach((u) => {
      dutiesOf(u, day).forEach(({ name }) => {
        if (count[name] !== undefined) count[name]++;
      });
    });
    return count;
  };

  const renderDayCell = (day) => {
    const todayCls = isToday(day) ? "ring-2 ring-teal-500" : "";
    const weekendCls = [0, 6].includes(ref.date(day).day()) ? "bg-red-50" : "bg-white";

    if (mode === "me") {
      const duties = me ? dutiesOf(me, day) : [];
      const sorted = duties.sort(
        (a, b) => (SHIFT_STYLE[a.name]?.order || 5) - (SHIFT_STYLE[b.name]?.order || 5)
      );
      return (
        <div className={`flex flex-col rounded-lg border p-1 min-h-[64px] ${weekendCls} ${todayCls}`}>
          <div className="text-xs font-medium text-gray-500">{day}</div>
          <div className="flex flex-col flex-1 gap-0.5 justify-center items-stretch">
            {sorted.length === 0 ? (
              <span className="text-[10px] text-gray-300 text-center">–</span>
            ) : (
              sorted.map((d, i) => {
                const st = SHIFT_STYLE[d.name] || { label: d.name, chip: "bg-gray-100 text-gray-600 border-gray-200" };
                return (
                  <span key={i} className={`text-[11px] text-center rounded border px-1 ${st.chip}`}>
                    {st.label}{d.ot ? "*" : ""}
                  </span>
                );
              })
            )}
          </div>
        </div>
      );
    }

    // team mode
    const c = teamByDay(day);
    return (
      <div className={`flex flex-col rounded-lg border p-1 min-h-[64px] ${weekendCls} ${todayCls}`}>
        <div className="text-xs font-medium text-gray-500">{day}</div>
        <div className="flex flex-col flex-1 gap-0.5 justify-center text-[11px]">
          {["ด", "ช", "บ"].map((s) =>
            c[s] > 0 ? (
              <div key={s} className="flex justify-between px-1">
                <span className="text-gray-500">{SHIFT_STYLE[s].label}</span>
                <span className="font-medium text-gray-700">{c[s]}</span>
              </div>
            ) : null
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 mx-auto max-w-4xl bg-white rounded-xl border shadow-sm">
      <div className="flex flex-wrap gap-3 justify-between items-center mb-4">
        <div className="text-lg font-semibold text-gray-800">
          {monthTH} {yearTH}
        </div>
        {/* สลับมุมมอง ของฉัน / ทั้งทีม */}
        <div className="flex p-0.5 bg-gray-100 rounded-lg">
          <button
            onClick={() => setMode("me")}
            className={`px-3 py-1 text-sm rounded-md ${mode === "me" ? "bg-white shadow text-teal-700 font-medium" : "text-gray-500"}`}
          >
            เวรของฉัน
          </button>
          <button
            onClick={() => setMode("team")}
            className={`px-3 py-1 text-sm rounded-md ${mode === "team" ? "bg-white shadow text-teal-700 font-medium" : "text-gray-500"}`}
          >
            ทั้งทีม
          </button>
        </div>
      </div>

      {mode === "me" && !me && (
        <p className="mb-3 text-sm text-amber-600">ไม่พบข้อมูลเวรของคุณ — แสดงปฏิทินว่าง</p>
      )}

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((d, i) => (
          <div key={d} className={`text-center text-xs font-medium py-1 ${i === 0 || i === 6 ? "text-red-500" : "text-gray-500"}`}>
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
          <div key={day}>{renderDayCell(day)}</div>
        ))}
      </div>

      {/* คำอธิบายสี */}
      <div className="flex flex-wrap gap-3 mt-4 text-xs text-gray-500">
        <span className="flex gap-1 items-center"><span className="px-1 rounded border bg-indigo-100 border-indigo-200">ด</span> ดึก</span>
        <span className="flex gap-1 items-center"><span className="px-1 rounded border bg-amber-100 border-amber-200">ช</span> เช้า</span>
        <span className="flex gap-1 items-center"><span className="px-1 rounded border bg-sky-100 border-sky-200">บ</span> บ่าย</span>
        <span>* = OT</span>
      </div>
    </div>
  );
};

export default ScheduleCalendar;
