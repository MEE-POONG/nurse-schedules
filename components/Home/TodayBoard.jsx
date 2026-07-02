import useAxios from "axios-hooks";
import dayjs from "dayjs";
import { authProvider } from "src/authProvider";

const SHIFT_INFO = {
  ช: { label: "เช้า", time: "08:30–16:30", chip: "bg-amber-100 text-amber-800", dot: "bg-amber-400" },
  บ: { label: "บ่าย", time: "16:30–00:30", chip: "bg-sky-100 text-sky-800", dot: "bg-sky-400" },
  ด: { label: "ดึก", time: "00:30–08:30", chip: "bg-indigo-100 text-indigo-800", dot: "bg-indigo-400" },
  x: { label: "หยุด", time: "", chip: "bg-gray-100 text-gray-600", dot: "bg-gray-300" },
};

const nameOf = (u) => `${u?.firstname || ""} ${u?.lastname || ""}`.trim();

const TodayBoard = ({ month, year }) => {
  const me = authProvider.getIdentity();

  const [{ data, loading }] = useAxios({
    url: `/api/user/selectMonth?month=${month}&year=${year}`,
    method: "GET",
  });

  if (loading || !data) return null;

  const users = Array.isArray(data) ? data.filter((u) => u?.firstname) : [];
  if (users.length === 0) return null;

  // วันอ้างอิง = วันนี้ ถ้าเดือน/ปีที่เลือกคือเดือนปัจจุบัน
  const now = dayjs();
  const isCurrentMonth = now.month() === month && now.year() === year;
  const refDay = isCurrentMonth ? now.date() : null;

  // เวรของ user ในวันที่กำหนด (เฉพาะกะทำงาน/หยุดหลัก)
  const dutiesOn = (u, day) =>
    (u.Duty || []).filter((d) => dayjs(d.datetime).date() === day);

  // ---- เข้าเวรวันนี้: จัดกลุ่มตามกะ ----
  const groupByShift = (day) => {
    const g = { ช: [], บ: [], ด: [] };
    users.forEach((u) => {
      dutiesOn(u, day).forEach((d) => {
        const n = d.Shif?.name;
        if (g[n]) g[n].push({ user: u, ot: d.isOT || d.Shif?.isOT });
      });
    });
    return g;
  };

  // ---- เวร/สถิติของฉัน ----
  const SHIFT_ORDER = { ด: 1, ช: 2, บ: 3 };
  const myData = me?.id ? users.find((u) => u.id === me.id) : null;
  const myToday = (refDay && myData ? dutiesOn(myData, refDay) : []).sort(
    (a, b) => (SHIFT_ORDER[a.Shif?.name] ?? 99) - (SHIFT_ORDER[b.Shif?.name] ?? 99)
  );

  const monthStat = (u) => {
    const reg = (name) => (u.Duty || []).filter((d) => d.Shif?.name === name && !(d.isOT || d.Shif?.isOT)).length;
    const ot = (u.Duty || []).filter((d) => d.isOT || d.Shif?.isOT).length;
    const off = (u.Duty || []).filter((d) => ["x", "R"].includes(d.Shif?.name)).length;
    return { morning: reg("ช"), afternoon: reg("บ"), night: reg("ด"), ot, off, work: reg("ช") + reg("บ") + reg("ด") };
  };

  const todayGroups = refDay ? groupByShift(refDay) : null;
  const monthLabel = dayjs().month(month).format("MMMM");

  const ShiftChip = ({ name }) => {
    const info = SHIFT_INFO[name] || SHIFT_INFO.x;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${info.chip}`}>
        {info.label}{info.time ? ` · ${info.time}` : ""}
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* การ์ดเวรของฉัน + เพื่อนร่วมกะ */}
      <div className="p-5 lg:col-span-1 card">
        <div className="flex gap-2 items-center mb-3 text-sm font-bold text-gray-800">
          <span className="w-1 h-4 rounded-full bg-gradient-to-b from-teal-500 to-emerald-500" />
          เวรของฉัน{refDay ? " วันนี้" : ` เดือน${monthLabel}`}
        </div>
        {!myData ? (
          <p className="text-sm text-gray-400">ไม่พบข้อมูลเวรของคุณ</p>
        ) : refDay ? (
          myToday.length === 0 ? (
            <p className="text-sm text-gray-400">วันนี้ไม่มีเวร / ยังไม่จัด</p>
          ) : (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {myToday.map((d, i) => <ShiftChip key={i} name={d.Shif?.name} />)}
              </div>
              {/* เพื่อนร่วมกะวันนี้ */}
              {myToday
                .filter((d) => ["ช", "บ", "ด"].includes(d.Shif?.name))
                .map((d, i) => {
                  const mates = users.filter(
                    (u) => u.id !== myData.id && dutiesOn(u, refDay).some((x) => x.Shif?.name === d.Shif?.name)
                  );
                  return (
                    <div key={i} className="text-xs text-gray-600">
                      <span className="font-medium">เพื่อนร่วมกะ{SHIFT_INFO[d.Shif?.name]?.label}:</span>{" "}
                      {mates.length ? mates.map(nameOf).join(", ") : "—"}
                    </div>
                  );
                })}
            </div>
          )
        ) : (
          <p className="text-sm text-gray-400">เลือกเดือนปัจจุบันเพื่อดูเวรวันนี้</p>
        )}

        {/* สรุปเดือนของฉัน */}
        {myData && (
          <div className="grid grid-cols-4 gap-1.5 pt-4 mt-4 text-center border-t border-gray-100">
            {(() => { const s = monthStat(myData); return (
              <>
                <div className="py-2 rounded-xl bg-teal-600/[0.07]"><div className="text-lg font-bold text-teal-800">{s.work}</div><div className="text-[11px] font-medium text-teal-700/70">เวร</div></div>
                <div className="py-2 rounded-xl bg-indigo-500/[0.07]"><div className="text-lg font-bold text-indigo-700">{s.night}</div><div className="text-[11px] font-medium text-indigo-600/70">ดึก</div></div>
                <div className="py-2 rounded-xl bg-orange-500/[0.07]"><div className="text-lg font-bold text-orange-600">{s.ot}</div><div className="text-[11px] font-medium text-orange-600/70">OT</div></div>
                <div className="py-2 rounded-xl bg-gray-500/[0.07]"><div className="text-lg font-bold text-gray-600">{s.off}</div><div className="text-[11px] font-medium text-gray-500">หยุด</div></div>
              </>
            ); })()}
          </div>
        )}
      </div>

      {/* การ์ดเข้าเวรวันนี้ */}
      <div className="p-5 lg:col-span-2 card">
        <div className="flex gap-2 items-center mb-4 text-sm font-bold text-gray-800">
          <span className="w-1 h-4 rounded-full bg-gradient-to-b from-teal-500 to-emerald-500" />
          {refDay ? (
            <>
              เข้าเวรวันนี้
              <span className="px-2 py-0.5 text-[11px] font-semibold text-teal-800 rounded-full bg-teal-600/10">
                {now.format("D MMM")}
              </span>
            </>
          ) : (
            "เลือกเดือนปัจจุบันเพื่อดูผู้เข้าเวรวันนี้"
          )}
        </div>
        {refDay && todayGroups && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {["ด", "ช", "บ"].map((s) => {
              const info = SHIFT_INFO[s];
              const list = todayGroups[s];
              return (
                <div key={s} className="overflow-hidden rounded-xl border border-gray-100 bg-gradient-to-b from-gray-50/90 to-white">
                  <div className="flex justify-between items-center px-3.5 py-2.5 border-b border-gray-100/80">
                    <span className="flex gap-2 items-center text-sm font-semibold text-gray-800">
                      <span className={`w-2.5 h-2.5 rounded-full ring-[3px] ring-opacity-30 ${info.dot}`} style={{ boxShadow: "0 0 0 3px rgba(0,0,0,0.04)" }} />
                      {info.label}
                    </span>
                    <span className="px-2 py-0.5 text-[11px] font-semibold text-gray-500 bg-white rounded-full border border-gray-200">
                      {list.length} คน
                    </span>
                  </div>
                  <div className="px-3.5 py-2.5 space-y-1">
                    {list.length === 0 ? (
                      <div className="text-xs text-gray-400">—</div>
                    ) : (
                      list.map(({ user, ot }, i) => (
                        <div key={i} className={`text-xs leading-relaxed ${user.id === me?.id ? "font-bold text-teal-700" : "text-gray-700"}`}>
                          {nameOf(user)}{ot ? " (OT)" : ""}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TodayBoard;
