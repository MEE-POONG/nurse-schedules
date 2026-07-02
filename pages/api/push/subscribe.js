import { prisma } from "@/utils/prisma";

// บันทึก/อัปเดต Web Push subscription ของอุปกรณ์
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { subscription, userId } = req.body || {};
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({ success: false, message: "subscription ไม่ถูกต้อง" });
    }

    const data = {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userId: userId || null,
      userAgent: req.headers["user-agent"]?.slice(0, 300) || null,
    };

    const saved = await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: { p256dh: data.p256dh, auth: data.auth, userId: data.userId, userAgent: data.userAgent },
      create: data,
    });

    return res.status(200).json({ success: true, id: saved.id });
  } catch (error) {
    console.error("push/subscribe error", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
