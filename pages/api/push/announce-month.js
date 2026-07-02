import { prisma } from "@/utils/prisma";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
import { notify } from "@/utils/pushNotify";

dayjs.extend(buddhistEra);

/**
 * แจ้งเตือนทุกคนว่า "เปิดตารางเวรเดือนใหม่แล้ว" (broadcast)
 *
 * POST /api/push/announce-month
 * body: {
 *   month?: number,  // 1-12 (ถ้าไม่ส่ง = เดือนปัจจุบัน)
 *   year?: number,   // ค.ศ. (ถ้าไม่ส่ง = ปีปัจจุบัน)
 *   body?: string    // ข้อความเอง (ถ้าไม่ส่งจะสร้างให้อัตโนมัติ)
 * }
 *
 * ป้องกันด้วย CRON_SECRET เช่นเดียวกับ cron (ถ้าตั้งไว้)
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const required = process.env.CRON_SECRET;
  if (required) {
    const provided = req.headers["x-cron-secret"] || req.body?.secret;
    if (provided !== required) {
      return res.status(401).json({ success: false, message: "unauthorized" });
    }
  }

  try {
    const { month, year, body: customBody } = req.body || {};
    const m = Number(month) || dayjs().month() + 1;
    const y = Number(year) || dayjs().year();
    const monthLabel = dayjs(`${y}-${m}-01`).locale("th").format("MMMM BBBB");

    const result = await notify(prisma, {
      title: "🗓️ เปิดตารางเวรเดือนใหม่แล้ว",
      body: customBody || `ตารางเวรเดือน${monthLabel} พร้อมให้ตรวจสอบแล้ว`,
      url: "/",
      tag: `month-${y}-${m}`,
    });

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error("announce-month error", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
