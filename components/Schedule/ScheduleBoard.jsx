import { useEffect, useMemo, useState } from "react";
import useAxios from "axios-hooks";
import dayjs from "dayjs";
import "dayjs/locale/th";
import { TbCalendar, TbTable, TbList, TbChevronLeft, TbChevronRight, TbUserPlus } from "react-icons/tb";
import { authProvider } from "src/authProvider";
import LoadingComponent from "../LoadingComponent";
import ScheduleCalendar from "../ScheduleCalendar";
import ShiftEditModal from "./ShiftEditModal";
import AddStaffModal from "./AddStaffModal";
import { SHIFT_META, WORK_SHIFTS, OT_CIRCLE, metaOf, nameOf, dutiesOfDay } from "./shiftStyle";

dayjs.locale("th");

const WEEKDAY_TH = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

// แสดงสัญลักษณ์กะ 1 ช่อง (ชิปสี / วงกลม OT สี / วงกลมแดงทึบ On-Call)
function ShiftMark({ d }) {
  const m = metaOf(d.name);
  // On-Call = วงกลมแดงทึบ
  if (d.isOnCall) {
    return (
      <span className="inline-flex justify-center items-center w-5 h-5 text-[11px] font-semibold text-white bg-red-600 rounded-full">
        {d.name}
      </span>
    );
  }
  // OT = วงกลมสี (ดำ/แดง/น้ำเงิน) ตาม class
  const cls = d.Shif?.class;
  if (cls && OT_CIRCLE[cls]) {
    return (
      <span className={`inline-flex justify-center items-center w-5 h-5 text-[11px] font-semibold bg-white rounded-full border-[1.5px] ${OT_CIRCLE[cls].ring}`}>
        {d.name}
      </span>
    );
  }
  // OT อื่น ๆ ที่ไม่มี class = วงแดง (fallback)
  if (d.isOT) {
    return (
      <span className="inline-flex justify-center items-center w-5 h-5 text-[11px] font-semibold text-red-600 rounded-full border-[1.5px] border-red-600">
        {d.name}
      </span>
    );
  }
  return <span className={`inline-block min-w-[20px] px-1 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap ${m.chip}`}>{m.label}</span>;
}

export default function ScheduleBoard({ month, year }) {
  const me = authProvider.getIdentity() || {};
  const isAdmin = !!me.isAdmin;

  // เริ่ม "day" เหมือนกันทั้ง server/client กัน hydration mismatch แล้วค่อยสลับเป็น matrix บนจอกว้างหลัง mount
  const [view, setView] = useState("day");
  const [editing, setEditing] = useState(null); // {userId, userName, day, duties}
  const [addingStaff, setAddingStaff] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) setView("matrix");
  }, []);

  const ref = dayjs().year(year).month(month).startOf("month");
  const daysInMonth = ref.daysInMonth();
  const monthTH = ref.format("MMMM");
  const yearTH = year + 543;
  const today = dayjs();
  const isCurrentMonth = today.month() === month && today.year() === year;

  const [selectedDay, setSelectedDay] = useState(isCurrentMonth ? today.date() : 1);

  const [{ data: usersRaw, loading }, refetch] = useAxios(
    { url: `/api/user/selectMonth?month=${month}&year=${year}`, method: "GET" },
    { autoCancel: false }
  );
  const [{ data: shifList }] = useAxios({ url: "/api/shif" }, { autoCancel: false });
  const [, executeDuty] = useAxios({ url: "/api/duty", method: "POST" }, { manual: true, autoCancel: false });
  const [, deleteDuty] = useAxios({ url: "/api/duty", method: "DELETE" }, { manual: true, autoCancel: false });

  const users = useMemo(
    () => (Array.isArray(usersRaw) ? usersRaw.filter((u) => u?.firstname) : []),
    [usersRaw]
  );

  // จัดทำดัชนีเวร [userId][day] = duties[] ครั้งเดียว แทนการ filter ซ้ำทุกเซลล์ (40×31 ครั้ง/render)
  const dutyIndex = useMemo(() => {
    const idx = {};
    users.forEach((u) => {
      const byDay = {};
      (u.Duty || []).forEach((d) => {
        const day = dayjs(d.datetime).date();
        (byDay[day] ||= []).push({
          id: d.id,
          shifId: d.shifId ?? d.Shif?.id,
          name: d.Shif?.name,
          isOT: d.isOT || d.Shif?.isOT,
          isOnCall: d.isOnCall,
          Shif: d.Shif,
        });
      });
      Object.values(byDay).forEach((arr) =>
        arr.sort((a, b) => metaOf(a.name).order - metaOf(b.name).order)
      );
      idx[u.id] = byDay;
    });
    return idx;
  }, [users]);
  const getDuties = (user, day) => dutyIndex[user.id]?.[day] || [];

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const isWeekend = (day) => [0, 6].includes(ref.date(day).day());
  const isToday = (day) => isCurrentMonth && today.date() === day;

  // แอดมินแก้ได้ทุกคน / พยาบาลทั่วไปแก้ได้เฉพาะเวรของตัวเอง
  const canEdit = (user) => isAdmin || user.id === me.id;

  const openEdit = (user, day) => {
    if (!canEdit(user)) return;
    setEditing({
      userId: user.id,
      userName: nameOf(user),
      day,
      duties: getDuties(user, day),
    });
  };

  const workCount = (user) =>
    (user.Duty || []).filter((d) => WORK_SHIFTS.includes(d.Shif?.name) && !(d.isOT || d.Shif?.isOT)).length;

  if (loading && !usersRaw) return <LoadingComponent />;

  const views = [
    { key: "day", label: "รายวัน", icon: TbList },
    { key: "matrix", label: "ตาราง", icon: TbTable },
    { key: "calendar", label: "ปฏิทิน", icon: TbCalendar },
  ];

  return (
    <div>
      {/* แถบหัว + สลับมุมมอง */}
      <div className="flex flex-wrap gap-3 justify-between items-center mb-3">
        <div className="text-base font-semibold text-gray-800">
          ตารางเวร · {monthTH} {yearTH}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
        {isAdmin && (
          <button
            onClick={() => setAddingStaff(true)}
            className="flex gap-1.5 items-center px-3 py-1.5 text-sm font-medium text-teal-700 rounded-lg border border-teal-200 hover:bg-teal-50"
          >
            <TbUserPlus size={16} /> จัดคนขึ้นเวร
          </button>
        )}
        <div className="flex p-0.5 bg-gray-100 rounded-lg">
          {views.map((v) => {
            const Icon = v.icon;
            return (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                  view === v.key ? "bg-white shadow text-teal-700 font-medium" : "text-gray-500"
                }`}
              >
                <Icon size={16} /> {v.label}
              </button>
            );
          })}
        </div>
        </div>
      </div>

      {view !== "calendar" && users.length > 0 && (
        <p className="mb-3 text-xs text-gray-400">
          แตะ{view === "matrix" ? "ช่อง" : "ชื่อ"}เพื่อกรอก/แก้ไขกะ
          {isAdmin ? " (ผู้ดูแลแก้ได้ทุกคน)" : "ของตัวเอง"}
        </p>
      )}

      {/* ── ยังไม่มีคนในตารางเดือนนี้ ── */}
      {users.length === 0 && (
        <div className="px-6 py-14 text-center bg-white rounded-xl border border-gray-200">
          <div className="flex justify-center mb-3 text-gray-300">
            <TbUserPlus size={40} />
          </div>
          <div className="font-medium text-gray-700">ยังไม่มีพยาบาลในตารางเดือน{monthTH}</div>
          <div className="mt-1 text-sm text-gray-500">
            {isAdmin ? "กด “จัดคนขึ้นเวร” เพื่อเพิ่มพยาบาลเข้าตารางก่อน แล้วจึงกรอกกะ" : "ผู้ดูแลยังไม่ได้จัดคนขึ้นเวรของเดือนนี้"}
          </div>
          {isAdmin && (
            <button
              onClick={() => setAddingStaff(true)}
              className="inline-flex gap-1.5 items-center px-4 py-2 mt-4 text-sm font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800"
            >
              <TbUserPlus size={16} /> จัดคนขึ้นเวร
            </button>
          )}
        </div>
      )}

      {/* ── มุมมองรายวัน ── */}
      {view === "day" && users.length > 0 && (
        <DayView
          users={users}
          days={days}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          ref0={ref}
          isWeekend={isWeekend}
          isToday={isToday}
          meId={me.id}
          isAdmin={isAdmin}
          openEdit={openEdit}
        />
      )}

      {/* ── มุมมองตาราง matrix ── */}
      {view === "matrix" && users.length > 0 && (
        <div className="overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="text-sm border-separate border-spacing-0">
              <thead>
                <tr className="text-gray-500">
                  <th className="sticky left-0 z-10 bg-gray-50 border-b border-gray-100 px-3 py-2 text-left font-medium min-w-[150px]">
                    พยาบาล
                  </th>
                  {days.map((day) => (
                    <th
                      key={day}
                      className={`px-1.5 py-2 text-center font-medium border-b border-gray-100 min-w-[40px] ${
                        isToday(day) ? "bg-teal-50 text-teal-700" : isWeekend(day) ? "bg-rose-50 text-rose-600" : ""
                      }`}
                    >
                      <div className="text-xs">{day}</div>
                      <div className="text-[9px] text-gray-400">{WEEKDAY_TH[ref.date(day).day()]}</div>
                    </th>
                  ))}
                  <th className="px-2 py-2 text-center font-medium text-teal-700 border-b border-l border-gray-100">รวม</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const mine = user.id === me.id;
                  const editable = canEdit(user);
                  return (
                    <tr key={user.id}>
                      <td
                        className={`sticky left-0 z-10 px-3 py-1.5 text-left border-b border-gray-50 whitespace-nowrap ${
                          mine ? "bg-teal-50 text-teal-800 font-medium" : "bg-white"
                        }`}
                      >
                        <div className="text-[13px] leading-tight">
                          {user.Title?.name}{user.firstname} {user.lastname}{mine ? " (ฉัน)" : ""}
                        </div>
                        <div className="text-[10px] text-gray-400">{user.Position?.name}</div>
                      </td>
                      {days.map((day) => {
                        const duties = getDuties(user, day);
                        return (
                          <td
                            key={day}
                            onClick={() => openEdit(user, day)}
                            className={`px-1 py-1.5 text-center border-b border-gray-50 ${
                              isToday(day) ? "bg-teal-50/40" : isWeekend(day) ? "bg-rose-50/40" : ""
                            } ${editable ? "cursor-pointer hover:bg-teal-100/50" : ""}`}
                          >
                            <div className="flex gap-0.5 justify-center items-center whitespace-nowrap">
                              {duties.length === 0 ? (
                                <span className="text-gray-300">–</span>
                              ) : (
                                duties.map((d, i) => <ShiftMark key={i} d={d} />)
                              )}
                            </div>
                          </td>
                        );
                      })}
                      <td className="px-2 text-center font-semibold text-teal-700 border-b border-l border-gray-50">
                        {workCount(user) || ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Legend />
        </div>
      )}

      {/* ── มุมมองปฏิทิน (เดิม) ── */}
      {view === "calendar" && users.length > 0 && <ScheduleCalendar data={users} month={month} year={year} />}

      {editing && (
        <ShiftEditModal
          open={!!editing}
          onClose={() => setEditing(null)}
          userId={editing.userId}
          userName={editing.userName}
          day={editing.day}
          dateLabel={`${editing.day} ${monthTH} ${yearTH}`}
          monthEN={month + 1}
          yearEN={year}
          currentDuties={editing.duties}
          shifList={shifList || []}
          executeDuty={executeDuty}
          deleteDuty={deleteDuty}
          onSaved={refetch}
        />
      )}

      <AddStaffModal
        open={addingStaff}
        onClose={() => setAddingStaff(false)}
        month={month}
        year={year}
        existingUserIds={users.map((u) => u.id)}
        onAdded={refetch}
      />
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-4 py-3 text-xs text-gray-500 border-t border-gray-100">
      {["ช", "บ", "ด"].map((s) => (
        <span key={s} className="flex gap-1.5 items-center">
          <span className={`px-1.5 py-0.5 rounded ${SHIFT_META[s].chip}`}>{s}</span>
          {SHIFT_META[s].full}
        </span>
      ))}
      <span className="flex gap-1.5 items-center">
        <span className="inline-flex gap-0.5">
          <span className="inline-flex justify-center items-center w-4 h-4 text-[9px] text-gray-600 rounded-full border-[1.5px] border-gray-500">ช</span>
          <span className="inline-flex justify-center items-center w-4 h-4 text-[9px] text-red-500 rounded-full border-[1.5px] border-red-500">ช</span>
          <span className="inline-flex justify-center items-center w-4 h-4 text-[9px] text-sky-500 rounded-full border-[1.5px] border-sky-500">ช</span>
        </span>
        OT (วงสี)
      </span>
      <span className="flex gap-1.5 items-center">
        <span className="inline-flex justify-center items-center w-4 h-4 text-[10px] text-white bg-red-600 rounded-full">ช</span>
        On-Call
      </span>
    </div>
  );
}

// มุมมองรายวัน — แถบเลือกวัน + การ์ดแยกกะ
function DayView({ users, days, selectedDay, setSelectedDay, ref0, isWeekend, isToday, meId, isAdmin, openEdit }) {
  const dateObj = ref0.date(selectedDay);

  // จัดกลุ่มพยาบาลตามกะของวันที่เลือก
  const groups = { ช: [], บ: [], ด: [] };
  users.forEach((u) => {
    dutiesOfDay(u, selectedDay).forEach((d) => {
      if (groups[d.name]) groups[d.name].push({ user: u, ot: d.isOT, onCall: d.isOnCall, cls: d.Shif?.class });
    });
  });

  const go = (delta) => {
    const next = selectedDay + delta;
    if (next >= 1 && next <= days.length) setSelectedDay(next);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* แถบเลือกวัน */}
      <div className="flex gap-1 items-center px-3 py-3 border-b border-gray-100">
        <button onClick={() => go(-1)} className="p-1 text-gray-400 hover:text-teal-700" aria-label="วันก่อนหน้า">
          <TbChevronLeft size={20} />
        </button>
        <div className="flex overflow-x-auto flex-1 gap-1.5 px-1">
          {days.map((day) => {
            const sel = day === selectedDay;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`flex-shrink-0 w-10 py-1.5 rounded-lg text-center transition-colors ${
                  sel
                    ? "bg-teal-700 text-white"
                    : isToday(day)
                    ? "bg-teal-50 text-teal-700"
                    : isWeekend(day)
                    ? "text-rose-500 hover:bg-gray-50"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <div className="text-[10px] opacity-80">{WEEKDAY_TH[ref0.date(day).day()]}</div>
                <div className="text-sm font-medium">{day}</div>
              </button>
            );
          })}
        </div>
        <button onClick={() => go(1)} className="p-1 text-gray-400 hover:text-teal-700" aria-label="วันถัดไป">
          <TbChevronRight size={20} />
        </button>
      </div>

      {/* การ์ดแยกกะ */}
      <div className="p-3 space-y-2.5">
        <div className="text-sm text-gray-500">
          {dateObj.format("dddd D MMMM")} {ref0.year() + 543}
        </div>
        {WORK_SHIFTS.map((s) => {
          const m = SHIFT_META[s];
          const list = groups[s];
          return (
            <div
              key={s}
              className="bg-white rounded-lg border border-gray-100"
              style={{ borderLeft: `3px solid ${m.accent}` }}
            >
              <div className="flex justify-between items-center px-3.5 py-2 border-b border-gray-50">
                <span className="text-sm font-medium" style={{ color: m.accent }}>
                  {m.full} · {m.time}
                </span>
                <span className="text-xs text-gray-400">{list.length} คน</span>
              </div>
              <div className="px-3.5 py-2">
                {list.length === 0 ? (
                  <span className="text-xs text-gray-300">— ยังไม่มีคนเข้าเวร</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {list.map(({ user, ot, onCall, cls }, i) => {
                      const editable = isAdmin || user.id === meId;
                      const otc = OT_CIRCLE[cls];
                      return (
                      <button
                        key={i}
                        onClick={() => openEdit(user, selectedDay)}
                        className={`inline-flex items-center gap-1 px-2 py-1 text-[13px] rounded-md ${
                          user.id === meId ? "bg-teal-100 text-teal-800 font-medium" : "bg-gray-50 text-gray-700"
                        } ${editable ? "hover:ring-1 hover:ring-teal-300" : "cursor-default"}`}
                      >
                        {nameOf(user)}
                        {ot && (
                          <span className={`inline-flex justify-center items-center w-4 h-4 text-[9px] font-semibold bg-white rounded-full border ${otc ? otc.ring : "border-red-500 text-red-500"}`}>
                            {s}
                          </span>
                        )}
                        {onCall && <span className="inline-flex justify-center items-center w-4 h-4 text-[9px] font-semibold text-white bg-red-600 rounded-full">{s}</span>}
                      </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* ปุ่มกรอกเวรของตัวเอง (กรณียังไม่มีเวรวันนี้) */}
        {(() => {
          const meUser = users.find((u) => u.id === meId);
          if (!meUser || dutiesOfDay(meUser, selectedDay).length > 0) return null;
          return (
            <button
              onClick={() => openEdit(meUser, selectedDay)}
              className="flex gap-1.5 justify-center items-center py-2.5 w-full text-sm font-medium text-teal-700 rounded-lg border border-teal-200 border-dashed hover:bg-teal-50"
            >
              + กรอกเวรของฉันวันนี้
            </button>
          );
        })()}
      </div>
    </div>
  );
}
