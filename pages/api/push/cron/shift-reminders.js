import { prisma } from "@/utils/prisma";
import { sendShiftReminders } from "@/utils/pushNotify";

/**
 * เตือนก่อนเข้าเวร — ออกแบบให้เรียกจาก cron ภายนอก (เช่น crontab / cron-job.org)
 *
 * วิธีเรียก (ตั้ง cron ทุก ๆ 15–30 นาที):
 *   GET/POST /api/push/cron/shift-reminders?lead=60
 *   header:  x-cron-secret: <CRON_SECRET>
 *
 * - lead  = เตือนล่วงหน้ากี่นาที (ดีฟอลต์ 60)
 * - ถ้าตั้ง env CRON_SECRET ไว้ จะต้องส่ง header/แควรี่ secret ให้ตรงเท่านั้น
 */
export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const required = process.env.CRON_SECRET;
  if (required) {
    const provided = req.headers["x-cron-secret"] || req.query.secret;
    if (provided !== required) {
      return res.status(401).json({ success: false, message: "unauthorized" });
    }
  }

  try {
    const lead = Number(req.query.lead) || 60;
    const result = await sendShiftReminders(prisma, { leadMinutes: lead });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error("shift-reminders error", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
