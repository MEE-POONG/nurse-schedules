import { prisma } from "@/utils/prisma";
import { isPushConfigured, sendToSubscription } from "@/utils/webpush";

/**
 * ส่งแจ้งเตือน Web Push
 * body: {
 *   title, body, url?, icon?, tag?,
 *   userIds?: string[]   // ถ้าไม่ส่งมา = broadcast ทุกคน
 * }
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  if (!isPushConfigured()) {
    return res.status(500).json({
      success: false,
      message: "เซิร์ฟเวอร์ยังไม่ได้ตั้งค่า VAPID keys",
    });
  }

  try {
    const { title, body, url, icon, tag, userIds } = req.body || {};
    if (!title) {
      return res.status(400).json({ success: false, message: "ต้องระบุ title" });
    }

    const where =
      Array.isArray(userIds) && userIds.length > 0 ? { userId: { in: userIds } } : {};
    const subs = await prisma.pushSubscription.findMany({ where });

    if (subs.length === 0) {
      return res.status(200).json({ success: true, sent: 0, failed: 0, total: 0 });
    }

    const payload = {
      title,
      body: body || "",
      url: url || "/",
      icon: icon || "/icon-192.png",
      badge: "/icon-192.png",
      tag: tag || "tarangwen",
    };

    const results = await Promise.all(
      subs.map((sub) => sendToSubscription(prisma, sub, payload))
    );

    const sent = results.filter((r) => r.ok).length;
    const failed = results.length - sent;

    return res.status(200).json({ success: true, sent, failed, total: subs.length });
  } catch (error) {
    console.error("push/send error", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
