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
    <div className="p-4 bg-white rounded-xl border shadow-sm">
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <div className="flex flex-wrap gap-x-8 gap-y-3 items-center">
          <div>
            <div className="text-xs text-gray-500">ความเป็นธรรมการจัดเวร</div>
            <div className={`text-lg font-bold ${balanced ? "text-green-600" : "text-amber-600"}`}>
              {balanced ? "สมดุลดี" : "ควรปรับให้สมดุล"}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">ภาระงานเฉลี่ย/คน</div>
            <div className="text-lg font-semibold text-gray-800">{fmt(avg)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">ภาระมากสุด</div>
            <div className="text-sm font-medium text-red-600">{nameOf(top)} ({fmt(maxScore)})</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">ภาระน้อยสุด</div>
            <div className="text-sm font-medium text-green-600">{nameOf(bottom)} ({fmt(minScore)})</div>
          </div>
        </div>
        <Link
          href="/fairness"
          className="px-4 py-2 text-sm font-semibold text-teal-700 whitespace-nowrap rounded-lg border border-teal-700 hover:bg-teal-50"
        >
          ดูรายละเอียด →
        </Link>
      </div>
    </div>
  );
};

export default FairnessSummaryCard;
