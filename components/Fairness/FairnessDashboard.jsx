import useAxios from "axios-hooks";
import dayjs from "dayjs";
import "dayjs/locale/th";
import LoadingComponent from "../LoadingComponent";
import ErrorComponent from "../ErrorComponent";

dayjs.locale("th");

const FairnessDashboard = ({ month, year }) => {
  const [{ data, loading, error }] = useAxios(
    {
      url: `/api/fairness?month=${month}&year=${year}`,
      method: "GET",
    },
    { useCache: false }
  );

  const monthTH = dayjs().month(month).format("MMMM");
  const yearTH = (year + 543).toString();

  if (error) return <ErrorComponent />;
  if (loading) return <LoadingComponent />;

  // normalize: กันค่า undefined/NaN จากข้อมูลเก่าใน cache ให้เป็น 0 เสมอ
  const NUM_KEYS = [
    "morning", "afternoon", "night", "ot", "otMorning", "otAfternoon", "otNight",
    "dayOff", "onCall", "weekendShifts", "workShifts", "totalShifts",
    "dutyDays", "doubleShiftDays", "workloadScore",
  ];
  const staff = (data || []).map((s) => {
    const c = { ...s };
    NUM_KEYS.forEach((k) => {
      if (!Number.isFinite(c[k])) c[k] = 0;
    });
    return c;
  });

  if (staff.length === 0) {
    return (
      <div className="p-14 text-center card">
        <p className="text-gray-500">ไม่มีข้อมูลเวรในเดือน {monthTH} {yearTH}</p>
      </div>
    );
  }

  // ----- คำนวณค่าสรุป (ใช้ "คะแนนภาระงาน" เป็นตัววัดความเป็นธรรมหลัก) -----
  const sum = (key) => staff.reduce((a, s) => a + s[key], 0);
  const avg = (key) => sum(key) / staff.length;
  const maxOf = (key) => Math.max(...staff.map((s) => s[key]));
  const minOf = (key) => Math.min(...staff.map((s) => s[key]));
  const fmt = (n) => (Number.isFinite(n) ? Math.round(n * 10) / 10 : 0).toFixed(1);

  const avgScore = avg("workloadScore");
  const avgTotal = avg("totalShifts");
  const scoreRange = maxOf("workloadScore") - minOf("workloadScore");
  const maxDev = Math.max(...staff.map((s) => Math.abs(s.workloadScore - avgScore)));
  const balanced = maxDev <= 3;

  const topName = (key) => {
    const m = maxOf(key);
    const p = staff.find((s) => s[key] === m);
    return { name: `${p?.firstname || ""} ${p?.lastname || ""}`.trim(), value: m };
  };
  const nightTop = topName("night");
  const doubleTop = topName("doubleShiftDays");

  const maxScore = maxOf("workloadScore") || 1;
  const nameOf = (s) => `${s.title || ""}${s.firstname || ""} ${s.lastname || ""}`.trim();

  // สีของแถวตามคะแนนภาระงาน เทียบค่าเฉลี่ย
  const loadClass = (score) => {
    if (score >= avgScore + 3) return "bg-red-50";
    if (score <= avgScore - 3) return "bg-green-50";
    return "";
  };

  const Card = ({ label, value, sub, accent }) => (
    <div className="p-5 card">
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className={`mt-1 text-2xl font-bold tracking-tight ${accent || "text-gray-900"}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-gray-500">{sub}</div>}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-x-3 gap-y-1 items-baseline">
        <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">สรุปความเป็นธรรมการจัดเวร</h1>
        <span className="inline-flex items-center px-3 py-1 text-xs font-semibold text-teal-800 rounded-full bg-teal-600/10 ring-1 ring-teal-600/20">
          {monthTH} พ.ศ. {yearTH} · {staff.length} คน
        </span>
      </div>

      {/* การ์ดสรุป */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card label="ภาระงานเฉลี่ย/คน" value={fmt(avgScore)} sub={`เวรเฉลี่ย ${fmt(avgTotal)} เวร`} />
        <Card
          label="สถานะความสมดุล"
          value={balanced ? "สมดุลดี" : "ควรปรับ"}
          sub={`ส่วนต่างภาระงานมาก-น้อย ${fmt(scoreRange)}`}
          accent={balanced ? "text-green-600" : "text-amber-600"}
        />
        <Card label="เวรดึกมากสุด" value={nightTop.value} sub={nightTop.name} accent="text-indigo-600" />
        <Card label="เวรควบมากสุด" value={doubleTop.value} sub={doubleTop.name} accent="text-rose-600" />
      </div>

      {/* กราฟแท่งคะแนนภาระงาน */}
      <div className="p-5 card">
        <h2 className="flex gap-2 items-center mb-1 text-base font-bold tracking-tight text-gray-900">
          <span className="w-1 h-4 rounded-full bg-gradient-to-b from-teal-500 to-emerald-500" />
          คะแนนภาระงานต่อคน
        </h2>
        <p className="mb-4 text-xs text-gray-500">
          ถ่วงน้ำหนัก: เช้า ×1.0, บ่าย ×1.2, ดึก ×1.5, ควบเช้า-บ่าย +0.5 · เส้นประ = ค่าเฉลี่ย ({fmt(avgScore)})
        </p>
        <div className="space-y-2">
          {staff.map((s) => {
            const over = s.workloadScore >= avgScore + 3;
            const under = s.workloadScore <= avgScore - 3;
            const barColor = over ? "bg-red-500" : under ? "bg-green-500" : "bg-indigo-500";
            return (
              <div key={s.id} className="flex items-center">
                <div className="w-36 text-sm font-medium text-gray-700 truncate" title={nameOf(s)}>{nameOf(s)}</div>
                <div className="relative flex-1 h-6 rounded-lg bg-gray-100/80">
                  <div
                    className={`h-6 rounded-lg transition-all ${barColor}`}
                    style={{ width: `${(s.workloadScore / maxScore) * 100}%`, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)" }}
                  />
                  <div className="absolute top-0 bottom-0 border-l-2 border-dashed border-gray-400" style={{ left: `${(avgScore / maxScore) * 100}%` }} />
                  <div className="flex absolute inset-0 items-center pl-2.5 text-xs font-semibold text-gray-800">
                    {fmt(s.workloadScore)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ตารางรายละเอียด */}
      <div className="overflow-hidden card">
        <div className="overflow-x-auto thin-scroll">
        <table className="min-w-full text-sm text-center">
          <thead className="text-xs font-semibold text-gray-500 bg-gray-50/80">
            <tr>
              <th className="px-3.5 py-2.5 text-left">ชื่อ - สกุล</th>
              <th className="px-2 py-2.5">เช้า</th>
              <th className="px-2 py-2.5">บ่าย</th>
              <th className="px-2 py-2.5">ดึก</th>
              <th className="px-2 py-2.5 text-orange-600">OT</th>
              <th className="px-2 py-2.5 text-rose-600">ควบ<br/>ช-บ</th>
              <th className="px-2 py-2.5">เวรรวม</th>
              <th className="px-2 py-2.5 font-bold text-indigo-700">ภาระงาน</th>
              <th className="px-2 py-2.5">On-Call</th>
              <th className="px-2 py-2.5">วันหยุด</th>
              <th className="px-2 py-2.5">ส-อา</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id} className={`border-t border-gray-100/80 transition-colors hover:bg-teal-50/40 ${loadClass(s.workloadScore)}`}>
                <td className="px-3.5 py-2 font-medium text-left text-gray-800 whitespace-nowrap">{nameOf(s)}</td>
                <td className="px-2 py-2">{s.morning}</td>
                <td className="px-2 py-2">{s.afternoon}</td>
                <td className="px-2 py-2 font-medium text-indigo-700">{s.night}</td>
                <td className="px-2 py-2 text-orange-600">{s.ot}</td>
                <td className="px-2 py-2 text-rose-600">{s.doubleShiftDays}</td>
                <td className="px-2 py-2">{s.totalShifts}</td>
                <td className="px-2 py-2 font-bold text-indigo-700">{fmt(s.workloadScore)}</td>
                <td className="px-2 py-2">{s.onCall}</td>
                <td className="px-2 py-2 text-gray-500">{s.dayOff}</td>
                <td className="px-2 py-2">{s.weekendShifts}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="font-semibold text-gray-700 border-t-2 border-gray-200 bg-teal-600/[0.05]">
            <tr>
              <td className="px-3 py-2 text-left">เฉลี่ย/คน</td>
              <td className="px-2 py-2">{fmt(avg("morning"))}</td>
              <td className="px-2 py-2">{fmt(avg("afternoon"))}</td>
              <td className="px-2 py-2">{fmt(avg("night"))}</td>
              <td className="px-2 py-2">{fmt(avg("ot"))}</td>
              <td className="px-2 py-2">{fmt(avg("doubleShiftDays"))}</td>
              <td className="px-2 py-2">{fmt(avgTotal)}</td>
              <td className="px-2 py-2 font-bold">{fmt(avgScore)}</td>
              <td className="px-2 py-2">{fmt(avg("onCall"))}</td>
              <td className="px-2 py-2">{fmt(avg("dayOff"))}</td>
              <td className="px-2 py-2">{fmt(avg("weekendShifts"))}</td>
            </tr>
          </tfoot>
        </table>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        คะแนนภาระงาน = (เช้า×1.0) + (บ่าย×1.2) + (ดึก×1.5) + (ควบเช้า-บ่าย×0.5) ·
        แถวสีแดง = ภาระมากกว่าเฉลี่ย ≥3 · แถวสีเขียว = น้อยกว่าเฉลี่ย ≥3 (ควรปรับให้สมดุลในเดือนถัดไป)
      </p>
    </div>
  );
};

export default FairnessDashboard;
