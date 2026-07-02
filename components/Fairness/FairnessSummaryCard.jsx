import useAxios from "axios-hooks";
import Link from "next/link";

// การ์ดสรุปความเป็นธรรมแบบย่อ สำหรับวางบนหน้า Home
const FairnessSummaryCard = ({ month, year }) => {
  const [{ data, loading }] = useAxios(
    { url: `/api/fairness?month=${month}&year=${year}`, method: "GET" },
    { useCache: false }
  );

  const staff = (data || []).filter((s) => Number.isFinite(s?.workloadScore));
  // ไม่แสดงการ์ดถ้ายังไม่มีเวรในเดือนนั้น
  const hasData = staff.length > 0 && staff.some((s) => s.workloadScore > 0);

  if (loading || !hasData) return null;

  const scores = staff.map((s) => s.workloadScore);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  const maxDev = Math.max(...scores.map((s) => Math.abs(s - avg)));
  const balanced = maxDev <= 3;
  const fmt = (n) => (Math.round(n * 10) / 10).toFixed(1);

  const top = staff.find((s) => s.workloadScore === maxScore);
  const bottom = staff.find((s) => s.workloadScore === minScore);
  const nameOf = (s) => `${s?.firstname || ""} ${s?.lastname || ""}`.trim();

  return (
    <div className="p-5 card">
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div className="flex flex-wrap gap-x-10 gap-y-3 items-center">
          <div className="flex gap-3 items-center">
            <span
              className={`flex justify-center items-center w-10 h-10 text-lg rounded-xl ${
                balanced ? "bg-green-500/10 text-green-600" : "bg-amber-500/10 text-amber-600"
              }`}
            >
              {balanced ? "✓" : "!"}
            </span>
            <div>
              <div className="text-xs font-medium text-gray-500">ความเป็นธรรมการจัดเวร</div>
              <div className={`text-lg font-bold tracking-tight ${balanced ? "text-green-600" : "text-amber-600"}`}>
                {balanced ? "สมดุลดี" : "ควรปรับให้สมดุล"}
              </div>
            </div>
          </div>
          <div className="hidden w-px h-10 sm:block bg-gray-200/80" />
          <div>
            <div className="text-xs font-medium text-gray-500">ภาระงานเฉลี่ย/คน</div>
            <div className="text-lg font-bold tracking-tight text-gray-900">{fmt(avg)}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500">ภาระมากสุด</div>
            <div className="text-sm font-semibold text-rose-600">
              {nameOf(top)}
              <span className="ml-1.5 px-1.5 py-0.5 text-[11px] font-bold rounded-md bg-rose-500/10">{fmt(maxScore)}</span>
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500">ภาระน้อยสุด</div>
            <div className="text-sm font-semibold text-emerald-600">
              {nameOf(bottom)}
              <span className="ml-1.5 px-1.5 py-0.5 text-[11px] font-bold rounded-md bg-emerald-500/10">{fmt(minScore)}</span>
            </div>
          </div>
        </div>
        <Link href="/fairness" className="px-4 py-2.5 whitespace-nowrap btn-brand">
          ดูรายละเอียด →
        </Link>
      </div>
    </div>
  );
};

export default FairnessSummaryCard;
