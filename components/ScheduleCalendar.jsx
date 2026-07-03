import { useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { authProvider } from "src/authProvider";

dayjs.locale("th");

const WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

// สี/ลำดับของแต่ละกะ
const SHIFT_STYLE = {
  ด: { label: "ด", chip: "bg-indigo-100 text-indigo-800 ring-1 ring-inset ring-indigo-200/70", dot: "bg-indigo-400", order: 1 },
  ช: { label: "ช", chip: "bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200/70", dot: "bg-amber-400", order: 2 },
  บ: { label: "บ", chip: "bg-sky-100 text-sky-800 ring-1 ring-inset ring-sky-200/70", dot: "bg-sky-400", order: 3 },
  x: { label: "หยุด", chip: "bg-gray-100 text-gray-500 ring-1 ring-inset ring-gray-200/70", dot: "bg-gray-300", order: 9 },
  R: { label: "พัก", chip: "bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-200/60", dot: "bg-rose-300", order: 9 },
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

  // เลขวันมุมบนของช่อง — วันนี้เป็นวงกลม teal ทึบ
  const DayNumber = ({ day }) =>
    isToday(day) ? (
      <span className="inline-flex justify-center items-center w-5 h-5 text-[11px] font-bold text-white rounded-full bg-gradient-to-b from-teal-500 to-teal-600 shadow-sm shadow-teal-600/40">
        {day}
      </span>
    ) : (
      <span className="text-xs font-semibold text-gray-400">{day}</span>
    );

  const renderDayCell = (day) => {
    const weekend = [0, 6].includes(ref.date(day).day());
    const cellCls = `flex flex-col rounded-xl p-1.5 min-h-[72px] transition-colors ${
      isToday(day)
        ? "bg-teal-600/[0.06] ring-2 ring-teal-500/70 shadow-sm"
        : weekend
        ? "bg-rose-50/60 ring-1 ring-rose-100 hover:ring-rose-200"
        : "bg-white ring-1 ring-gray-200/70 hover:ring-teal-300/70 hover:shadow-sm"
    }`;

    if (mode === "me") {
      const duties = me ? dutiesOf(me, day) : [];
      const sorted = duties.sort(
        (a, b) => (SHIFT_STYLE[a.name]?.order || 5) - (SHIFT_STYLE[b.name]?.order || 5)
      );
      return (
        <div className={cellCls}>
          <div className="mb-0.5"><DayNumber day={day} /></div>
          <div className="flex flex-col flex-1 gap-0.5 justify-center items-stretch">
            {sorted.length === 0 ? (
              <span className="text-[10px] text-gray-300 text-center">–</span>
            ) : (
              sorted.map((d, i) => {
                const st = SHIFT_STYLE[d.name] || { label: d.name, chip: "bg-gray-100 text-gray-600 ring-1 ring-inset ring-gray-200/70" };
                return (
                  <span key={i} className={`text-[11px] font-semibold text-center rounded-lg px-1 py-0.5 ${st.chip}`}>
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
    const total = c.ด + c.ช + c.บ;
    return (
      <div className={cellCls}>
        <div className="flex justify-between items-start mb-0.5">
          <DayNumber day={day} />
          {total > 0 && (
            <span className="text-[9px] font-semibold text-gray-400">{total} คน</span>
          )}
        </div>
        <div className="flex flex-col flex-1 gap-0.5 justify-center text-[11px]">
          {["ด", "ช", "บ"].map((s) =>
            c[s] > 0 ? (
              <div key={s} className="flex justify-between items-center px-1">
                <span className="flex gap-1 items-center text-gray-500">
                  <span className={`w-1.5 h-1.5 rounded-full ${SHIFT_STYLE[s].dot}`} />
                  {SHIFT_STYLE[s].label}
                </span>
                <span className="font-bold text-gray-700">{c[s]}</span>
              </div>
            ) : null
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-5 mx-auto max-w-4xl card">
      <div className="flex flex-wrap gap-3 justify-between items-center mb-4">
        <div className="flex gap-2 items-center text-lg font-bold tracking-tight text-gray-900">
          <span className="w-1 h-4 rounded-full bg-gradient-to-b from-teal-500 to-emerald-500" />
          {monthTH} {yearTH}
        </div>
        {/* สลับมุมมอง ของฉัน / ทั้งทีม */}
        <div className="flex p-1 bg-white rounded-xl border shadow-sm border-gray-200/80">
          {[
            { key: "me", label: "เวรของฉัน" },
            { key: "team", label: "ทั้งทีม" },
          ].map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                mode === m.key
                  ? "text-white font-semibold bg-gradient-to-r from-teal-600 to-teal-500 shadow-md shadow-teal-600/30"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {mode === "me" && !me && (
        <p className="mb-3 text-sm text-amber-600">ไม่พบข้อมูลเวรของคุณ — แสดงปฏิทินว่าง</p>
      )}

      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            className={`text-center text-[11px] font-bold tracking-wide py-1.5 rounded-lg ${
              i === 0 || i === 6 ? "text-rose-500 bg-rose-50/70" : "text-gray-500 bg-gray-50/80"
            }`}
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="rounded-xl bg-gray-50/40" />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
          <div key={day}>{renderDayCell(day)}</div>
        ))}
      </div>

      {/* คำอธิบายสี */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 items-center px-3 py-2.5 mt-4 text-xs text-gray-500 rounded-xl bg-gray-50/80">
        {["ด", "ช", "บ"].map((s) => (
          <span key={s} className="flex gap-1.5 items-center">
            <span className={`px-1.5 py-0.5 font-semibold rounded-lg ${SHIFT_STYLE[s].chip}`}>{SHIFT_STYLE[s].label}</span>
            {{ ด: "ดึก", ช: "เช้า", บ: "บ่าย" }[s]}
          </span>
        ))}
        <span className="font-medium">* = OT</span>
      </div>
    </div>
  );
};

export default ScheduleCalendar;
