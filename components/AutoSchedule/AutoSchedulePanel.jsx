// แผงจัดตารางเวรอัตโนมัติ (ระบบใหม่ — กติกาสกัดจากข้อมูลการขึ้นเวรจริง)
// ขั้นตอน: ตั้งค่าจำนวนคนต่อกะ → สร้างพรีวิว → ตรวจตาราง/ความสมดุล → บันทึก
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { metaOf } from "@/components/Schedule/shiftStyle";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { notifySuccess, notifyApiError, describeError } from "@/components/ui/notify";
import {
  TbWand,
  TbDeviceFloppy,
  TbAlertTriangle,
  TbLock,
  TbRefresh,
  TbAdjustments,
  TbChevronDown,
  TbChevronUp,
  TbScale,
  TbUsers,
} from "react-icons/tb";

const DOW_TH = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

// ป้ายชนิดช่องใน config coverage
const COVERAGE_FIELDS = [
  { key: "night", label: "ดึก (ในเวลา)" },
  { key: "evening", label: "บ่าย (ในเวลา)" },
  { key: "morningReg", label: "เช้า (ในเวลา)" },
  { key: "morningOT", label: "เช้า OT" },
  { key: "eveningOT", label: "บ่าย OT" },
  { key: "nightOT", label: "ดึก OT" },
];

// สีพื้นทั้งช่องตามสถานะเวรของวันนั้น (ระบายเต็มช่องเพื่อให้กวาดสายตาทั้งเดือนได้)
// เฉดยึดตาม shiftStyle.js ที่ใช้ทั้งระบบ: ดึก=คราม เช้า=เหลือง บ่าย=ฟ้า · เวรควบใช้เฉดเข้มขึ้น
const CELL_STYLE = {
  ด: "bg-indigo-100 text-indigo-900",
  ช: "bg-amber-100 text-amber-900",
  บ: "bg-sky-100 text-sky-900",
  ชบ: "bg-orange-200 text-orange-900",
  ดบ: "bg-teal-200 text-teal-900",
  OFF: "bg-gray-100 text-gray-400",
};
const CELL_LABEL = { ด: "ดึก", ช: "เช้า", บ: "บ่าย", ชบ: "ควบเช้า-บ่าย", ดบ: "ควบดึก-บ่าย" };
const WORK = ["ด", "ช", "บ"];

// รวมทุก cell ของวันเดียวเป็นช่องเดียว: ป้าย สี และข้อมูลประกอบ
function dayCell(cells) {
  const work = cells.filter((c) => WORK.includes(c.shift));
  const fixed = cells.some((c) => c.fixed);
  const reserved = cells.some((c) => c.reserved);
  if (work.length) {
    const key = WORK.filter((n) => work.some((c) => c.shift === n)).join("");
    const names = work.map((c) => `${metaOf(c.shift).full}${c.isOT ? " OT" : ""}`).join(" + ");
    return {
      label: key,
      cls: CELL_STYLE[key] || "bg-fuchsia-100 text-fuchsia-900",
      ot: work.some((c) => c.isOT),
      fixed,
      reserved,
      title: `${names}${fixed ? " (มีอยู่แล้ว)" : reserved ? " (จองแน่นอน)" : " (ระบบเสนอ)"}`,
    };
  }
  // ไม่ใช่เวรทำงาน: วันหยุด (x) หรือ ลา/อบรม/R ที่กรอกไว้
  const other = cells.find((c) => c.shift !== "x") || cells[0];
  if (!other) return { label: "", cls: "", ot: false, fixed: false, reserved: false, title: "" };
  if (other.shift === "x")
    return { label: "O", cls: CELL_STYLE.OFF, ot: false, fixed, reserved, title: `หยุด${fixed ? " (มีอยู่แล้ว)" : ""}` };
  const meta = metaOf(other.shift);
  return { label: meta.label, cls: meta.chip, ot: false, fixed, reserved, title: `${meta.full}${fixed ? " (มีอยู่แล้ว)" : ""}` };
}

export default function AutoSchedulePanel({ month, year, locationId, onScheduleGenerated }) {
  // month prop เป็น 0-11 (ตาม dayjs) → API ใช้ 1-12
  const apiMonth = month + 1;

  const [config, setConfig] = useState(null); // ค่าตั้งต้นจาก GET /api/auto-schedule
  const [showSettings, setShowSettings] = useState(false);
  const [preview, setPreview] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyMode, setApplyMode] = useState("fill");
  const [error, setError] = useState("");
  const [applied, setApplied] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    axios.get("/api/auto-schedule").then((r) => setConfig(r.data.config)).catch(() => {});
  }, []);

  // เปลี่ยนเดือน/แผนก → ล้างพรีวิวเดิม
  useEffect(() => {
    setPreview(null);
    setApplied(null);
    setError("");
  }, [month, year, locationId]);

  const setCoverage = (dayType, key, value) => {
    setConfig((c) => ({
      ...c,
      coverage: { ...c.coverage, [dayType]: { ...c.coverage[dayType], [key]: value } },
    }));
  };
  const setRule = (key, value) => setConfig((c) => ({ ...c, rules: { ...c.rules, [key]: value } }));

  const generate = async () => {
    setGenerating(true);
    setError("");
    setApplied(null);
    try {
      const r = await axios.post("/api/auto-schedule", { year, month: apiMonth, locationId, config });
      setPreview(r.data);
    } catch (e) {
      setPreview(null);
      setError(describeError(e, "สร้างตารางเวรไม่สำเร็จ"));
    } finally {
      setGenerating(false);
    }
  };

  const apply = () => {
    if (!preview) return;
    setConfirmOpen(true);
  };

  const doApply = async () => {
    setApplying(true);
    setError("");
    try {
      const r = await axios.post("/api/auto-schedule/apply", {
        year,
        month: apiMonth,
        locationId,
        mode: applyMode,
        items: preview.assignments,
      });
      setApplied(r.data);
      setConfirmOpen(false);
      notifySuccess(r.data?.message || "บันทึกตารางเวรแล้ว");
      onScheduleGenerated?.(r.data);
    } catch (e) {
      setError(describeError(e, "บันทึกตารางเวรไม่สำเร็จ"));
      notifyApiError(e, "บันทึกตารางเวรไม่สำเร็จ");
    } finally {
      setApplying(false);
    }
  };

  // ---- รวม cell สำหรับ matrix: fixed (ล็อก) + ที่ระบบเสนอ ----
  const cellMap = useMemo(() => {
    if (!preview) return {};
    const map = {};
    const push = (c) => {
      const k = `${c.userId}|${c.day}`;
      map[k] = map[k] || [];
      map[k].push(c);
    };
    preview.fixedCells?.forEach(push);
    preview.assignments?.forEach(push);
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => metaOf(a.shift).order - metaOf(b.shift).order);
    }
    return map;
  }, [preview]);

  const days = preview ? Array.from({ length: preview.daysInMonth }, (_, i) => i + 1) : [];
  const hardViolations = preview?.violations?.filter((v) => !v.soft) || [];
  const softWarnings = preview?.violations?.filter((v) => v.soft) || [];

  if (!config) {
    return <div className="p-8 text-center text-gray-400 bg-white rounded-xl shadow-sm">กำลังโหลดการตั้งค่า…</div>;
  }

  return (
    <div className="space-y-4">
      {/* ---------- การตั้งค่า ---------- */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <button
          onClick={() => setShowSettings((s) => !s)}
          className="flex justify-between items-center px-4 py-3 w-full text-left"
        >
          <span className="flex gap-2 items-center font-medium text-gray-800">
            <TbAdjustments className="text-teal-700" size={20} />
            ตั้งค่ากำลังคนและกติกา
            <span className="text-xs font-normal text-gray-400">(ค่าตั้งต้นสกัดจากเวรจริง 8 เดือนล่าสุด)</span>
          </span>
          {showSettings ? <TbChevronUp className="text-gray-400" /> : <TbChevronDown className="text-gray-400" />}
        </button>

        {showSettings && (
          <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
            <div className="grid gap-4 pt-3 sm:grid-cols-2">
              {["weekday", "weekend"].map((dayType) => (
                <div key={dayType} className="p-3 rounded-lg border border-gray-200">
                  <div className="mb-2 text-sm font-semibold text-gray-700">
                    {dayType === "weekday" ? "จันทร์–ศุกร์" : "เสาร์–อาทิตย์"}{" "}
                    <span className="font-normal text-gray-400">จำนวนคนต่อกะต่อวัน</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {COVERAGE_FIELDS.map((f) => (
                      <label key={f.key} className="flex justify-between items-center text-sm text-gray-600">
                        <span>{f.label}</span>
                        <input
                          type="number"
                          min={0}
                          max={9}
                          value={config.coverage[dayType][f.key]}
                          onChange={(e) => setCoverage(dayType, f.key, e.target.value)}
                          className="px-2 py-1 w-14 text-center rounded border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { key: "maxNightStreak", label: "ดึกติดกันสูงสุด (คืน)" },
                { key: "maxDoublesPerMonth", label: "เวรควบสูงสุด/คน/เดือน" },
                { key: "maxConsecutiveWork", label: "ทำงานติดกันสูงสุด (วัน)" },
                { key: "minOffPerMonth", label: "วันหยุดขั้นต่ำ/คน" },
              ].map((f) => (
                <label key={f.key} className="text-sm text-gray-600">
                  <span className="block mb-1">{f.label}</span>
                  <input
                    type="number"
                    min={0}
                    value={config.rules[f.key]}
                    onChange={(e) => setRule(f.key, parseInt(e.target.value, 10) || 0)}
                    className="px-2 py-1 w-full rounded border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </label>
              ))}
            </div>

            <label className="flex gap-2 items-center text-sm text-gray-600">
              <input
                type="checkbox"
                checked={!!config.writeOffDays}
                onChange={(e) => setConfig((c) => ({ ...c, writeOffDays: e.target.checked }))}
                className="rounded accent-teal-600"
              />
              เติมกะ &quot;หยุด (x)&quot; ให้วันที่ว่างอัตโนมัติ
            </label>

            <label className="flex gap-2 items-start text-sm text-gray-600">
              <input
                type="checkbox"
                checked={config.rules?.guaranteeOffDays !== false}
                onChange={(e) => setRule("guaranteeOffDays", e.target.checked)}
                className="mt-1 rounded accent-teal-600"
              />
              <span>
                รับประกันวันหยุดขั้นต่ำ
                <span className="block text-xs text-gray-400">
                  เปิด = กันวันหยุดไว้ก่อนเสมอ ถ้ากำลังคนไม่พอจะเหลือช่องขาดคนให้เห็น (แนะนำ) ·
                  ปิด = เติมช่องให้ครบก่อน ยอมให้บางคนหยุดน้อยกว่าเป้า
                </span>
              </span>
            </label>

            <label className="flex gap-2 items-start text-sm text-gray-600">
              <input
                type="checkbox"
                checked={config.chief?.weekendOff !== false}
                onChange={(e) => setConfig((c) => ({ ...c, chief: { ...c.chief, weekendOff: e.target.checked } }))}
                className="mt-1 rounded accent-teal-600"
              />
              <span>
                หัวหน้าหอหยุดเสาร์–อาทิตย์
                <span className="block text-xs text-gray-400">เปิด = ขึ้นเฉพาะเวรเช้าในเวลา จันทร์–ศุกร์</span>
              </span>
            </label>
          </div>
        )}
      </div>

      {/* ---------- ปุ่มสร้าง ---------- */}
      <div className="flex flex-wrap gap-3 items-center">
        <button
          onClick={generate}
          disabled={generating}
          className="flex gap-2 items-center px-5 py-2.5 font-medium text-white bg-teal-700 rounded-lg shadow-sm hover:bg-teal-800 disabled:opacity-50"
        >
          {generating ? <TbRefresh className="animate-spin" size={18} /> : <TbWand size={18} />}
          {generating ? "กำลังจัดตาราง…" : preview ? "จัดใหม่อีกครั้ง" : "สร้างตารางเวร (พรีวิว)"}
        </button>
        {preview && (
          <span className="text-sm text-gray-500">
            ระบบเสนอ {preview.assignments.filter((a) => a.shift !== "x").length} เวร · ช่องเดิม {preview.fixedCells.length} ช่องไม่ถูกแตะ
            {preview.historyCount > 0 && <> · ต่อเนื่องจากเวรท้ายเดือนก่อน {preview.historyCount} รายการ</>}
            {preview.preferenceCells?.length > 0 && (
              <> · การจองเวร {preview.preferenceCells.length} รายการ (จองแน่นอน {preview.preferenceCells.filter((c) => c.isReserved).length})</>
            )}
          </span>
        )}
      </div>

      {error && (
        <div className="flex gap-2 items-start p-4 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
          <TbAlertTriangle size={18} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      {/* ---------- ผลลัพธ์ ---------- */}
      {preview && (
        <>
          {/* ตรวจกำลังคน: ตัวเลขที่ตั้งไว้ จัดเป็นตารางที่คนทำได้จริงไหม */}
          {preview.capacity && (
            <div
              className={`p-4 rounded-xl border shadow-sm ${
                preview.capacity.feasible ? "bg-white border-gray-200" : "bg-red-50 border-red-300"
              }`}
            >
              <div className="flex gap-2 items-center mb-2 text-sm font-semibold text-gray-800">
                <TbUsers className={preview.capacity.feasible ? "text-teal-700" : "text-red-600"} size={18} />
                ตรวจกำลังคน
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                    preview.capacity.feasible ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {preview.capacity.feasible ? "กำลังคนพอ" : "กำลังคนไม่พอ"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 sm:grid-cols-4">
                <div>
                  ช่องที่ต้องมีคน <span className="font-semibold text-gray-900">{preview.capacity.demand.total}</span> เวร/เดือน
                </div>
                <div>
                  วงหมุนเวร {preview.capacity.rotCount} คน รับได้{" "}
                  <span className="font-semibold text-gray-900">{preview.capacity.supply.rotation}</span> เวร
                </div>
                <div>
                  ต่อคน ~<span className="font-semibold text-gray-900">{preview.capacity.perPerson.shifts}</span> เวร (ควบ ~
                  {preview.capacity.perPerson.doubles} ครั้ง)
                </div>
                <div>
                  วันหยุดขั้นต่ำ <span className="font-semibold text-gray-900">{preview.capacity.perPerson.offDays}</span> วัน/คน
                </div>
              </div>
              {preview.capacity.recommendations?.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-amber-700">
                  {preview.capacity.recommendations.map((r, i) => (
                    <li key={i}>→ {r}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* ความสมดุล + คำเตือน */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="flex gap-2 items-center mb-2 text-sm font-semibold text-gray-700">
                <TbScale className="text-teal-700" size={18} /> ความสมดุล (ต่าง มาก–น้อย ระหว่างคน)
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  { label: "เวรรวม", v: preview.summary.fairness.totalSpread, ok: 3 },
                  { label: "เวรดึก", v: preview.summary.fairness.nightSpread, ok: 2 },
                  { label: "OT", v: preview.summary.fairness.otSpread, ok: 3 },
                  { label: "งานเสาร์–อาทิตย์", v: preview.summary.fairness.weekendSpread, ok: 2 },
                ].map((f) => (
                  <span
                    key={f.label}
                    className={`px-2.5 py-1 rounded-full font-medium ${
                      f.v <= f.ok ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {f.label} ±{f.v}
                  </span>
                ))}
              </div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="mb-2 text-sm font-semibold text-gray-700">ข้อควรตรวจ</div>
              {hardViolations.length === 0 && softWarnings.length === 0 && (
                <div className="text-sm text-green-700">ไม่พบการละเมิดกติกา</div>
              )}
              <ul className="space-y-1 text-xs">
                {hardViolations.map((v, i) => (
                  <li key={`h${i}`} className="text-red-600">⛔ {v.message}</li>
                ))}
                {softWarnings.map((v, i) => (
                  <li key={`s${i}`} className="text-amber-600">⚠️ {v.message}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* ตารางพรีวิว — ระบายสีทั้งช่องตามกะของวันนั้น อ่านทั้งเดือนรวดเดียวได้ */}
          <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
            <table className="text-xs border-collapse min-w-max">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 px-2 py-2 w-8 text-center text-white bg-teal-700">ที่</th>
                  <th className="sticky left-8 z-10 px-3 py-2 text-left text-white bg-teal-700">เจ้าหน้าที่</th>
                  {days.map((d) => {
                    const dow = new Date(year, month, d).getDay();
                    const we = dow === 0 || dow === 6;
                    return (
                      <th
                        key={d}
                        className={`px-1 py-1.5 text-center text-white min-w-[2.4rem] ${we ? "bg-rose-500" : "bg-teal-600"}`}
                      >
                        <div className="text-[12px] font-medium leading-4">{d}</div>
                        <div className="font-normal leading-3 text-[10px] opacity-90">{DOW_TH[dow]}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {preview.staff.map((p, idx) => (
                  <tr key={p.id}>
                    <td className="sticky left-0 z-10 px-2 py-1 w-8 text-center text-gray-500 bg-white border-b border-gray-100">
                      {idx + 1}
                    </td>
                    <td className="sticky left-8 z-10 px-3 py-1 font-medium text-gray-800 whitespace-nowrap bg-white border-b border-r border-gray-100">
                      {p.name}
                      {p.isChief && (
                        <span className="px-1.5 py-0.5 ml-1.5 text-[10px] font-medium text-teal-800 bg-teal-100 rounded">หัวหน้าหอ</span>
                      )}
                      {p.isTrain && (
                        <span className="px-1.5 py-0.5 ml-1.5 text-[10px] font-medium text-violet-800 bg-violet-100 rounded">อบรม</span>
                      )}
                    </td>
                    {days.map((d) => {
                      const cell = dayCell(cellMap[`${p.id}|${d}`] || []);
                      return (
                        <td
                          key={d}
                          title={cell.title}
                          className={`relative px-1 py-1.5 text-center align-middle border-b border-white text-[11px] font-medium leading-4 ${cell.cls} ${
                            cell.reserved ? "ring-2 ring-inset ring-green-500/80" : ""
                          }`}
                        >
                          {cell.fixed && <TbLock size={8} className="absolute top-0.5 left-0.5 opacity-50" />}
                          {cell.label}
                          {cell.ot && <span className="ml-0.5 align-super text-[9px]">•</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-2 items-center px-1 text-[11px] text-gray-500">
            {Object.entries(CELL_STYLE).map(([k, cls]) => (
              <span key={k} className={`px-2 py-0.5 rounded font-medium ${cls}`}>
                {k === "OFF" ? "O หยุด" : `${k} ${CELL_LABEL[k] || ""}`}
              </span>
            ))}
            <span className="ml-1"><TbLock size={10} className="inline" /> = เวร/ลาเดิม (ไม่ถูกแตะ)</span>
            <span>• = OT</span>
            <span><span className="inline-block w-2.5 h-2.5 rounded ring-2 ring-green-500/80 align-middle" /> = จองแน่นอน</span>
          </div>

          {/* สรุปต่อคน */}
          <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-600 bg-gray-50">
                  {["เจ้าหน้าที่", "เช้า", "บ่าย", "ดึก", "OT", "ควบ", "หยุด", "ทำงาน ส-อา", "รวมเวร", "ติดกันสูงสุด"].map((h) => (
                    <th key={h} className="px-3 py-2 font-medium text-left border-b border-gray-200 first:text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.staff.map((p) => {
                  const st = preview.summary.perUser[p.id];
                  if (!st) return null;
                  return (
                    <tr key={p.id} className="border-b border-gray-100 last:border-0">
                      <td className="px-3 py-1.5 font-medium text-gray-800 whitespace-nowrap">{st.name}</td>
                      <td className="px-3 py-1.5">{st.ช}</td>
                      <td className="px-3 py-1.5">{st.บ}</td>
                      <td className="px-3 py-1.5">{st.ด}</td>
                      <td className="px-3 py-1.5">{st.ot}</td>
                      <td className="px-3 py-1.5">{st.doubles}</td>
                      <td className="px-3 py-1.5">{st.off}</td>
                      <td className="px-3 py-1.5">{st.weekendWork}</td>
                      <td className="px-3 py-1.5 font-semibold">{st.total}</td>
                      <td className={`px-3 py-1.5 ${st.maxStreak > (config.rules?.softMaxConsecutiveWork ?? 7) ? "text-amber-600 font-medium" : ""}`}>
                        {st.maxStreak}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ---------- บันทึก ---------- */}
          <div className="p-4 space-y-3 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="text-sm font-semibold text-gray-700">บันทึกลงตารางเวรจริง</div>
            <div className="flex flex-col gap-2 text-sm text-gray-600">
              <label className="flex gap-2 items-center">
                <input type="radio" name="applyMode" checked={applyMode === "fill"} onChange={() => setApplyMode("fill")} className="accent-teal-600" />
                เติมเฉพาะช่องที่ยังว่าง <span className="text-xs text-gray-400">(ไม่ทับเวรที่กรอกไว้แล้ว — แนะนำ)</span>
              </label>
              <label className="flex gap-2 items-center">
                <input type="radio" name="applyMode" checked={applyMode === "replace"} onChange={() => setApplyMode("replace")} className="accent-teal-600" />
                ล้างเวรเดิมของเดือนนี้แล้วแทนที่ <span className="text-xs text-gray-400">(คงวันลา/อบรม/R ไว้)</span>
              </label>
            </div>
            <button
              onClick={apply}
              disabled={applying}
              className="flex gap-2 items-center px-5 py-2.5 font-medium text-white bg-teal-700 rounded-lg shadow-sm hover:bg-teal-800 disabled:opacity-50"
            >
              {applying ? <TbRefresh className="animate-spin" size={18} /> : <TbDeviceFloppy size={18} />}
              {applying ? "กำลังบันทึก…" : "บันทึกตารางเวร"}
            </button>
            {applied && (
              <div className="p-3 text-sm text-green-800 bg-green-50 rounded-lg border border-green-200">
                ✅ {applied.message}
              </div>
            )}
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        busy={applying}
        danger={applyMode === "replace"}
        title={applyMode === "replace" ? "ล้างเวรเดิมแล้วบันทึกตารางใหม่?" : "เติมเวรลงช่องที่ยังว่าง?"}
        message={`ประจำเดือนที่เลือก · ระบบจะบันทึก ${
          preview?.assignments?.filter((a) => a.shift !== "x").length || 0
        } เวร`}
        details={
          applyMode === "replace"
            ? [
                "ลบเวรทำงานและวันหยุดของเดือนนี้ทั้งหมดก่อน แล้วบันทึกตารางใหม่ทับ",
                "วันลา / ลากิจ / ลาป่วย / อบรม / R ที่กรอกไว้จะไม่ถูกแตะ",
                "การลบย้อนกลับไม่ได้ — ถ้าไม่แน่ใจ ให้เลือกโหมดเติมเฉพาะช่องว่างแทน",
              ]
            : [
                "เติมเฉพาะช่องที่ยังว่าง ไม่ทับเวรที่กรอกไว้แล้ว",
                "ถ้าต้องการแทนที่ของเดิม ให้เลือกโหมดล้างเวรเดิม",
              ]
        }
        confirmLabel={applyMode === "replace" ? "ล้างแล้วบันทึก" : "บันทึก"}
        onConfirm={doApply}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}
