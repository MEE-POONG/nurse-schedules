import { prisma } from "@/utils/prisma";

// ลบ subscription ออก (เมื่อผู้ใช้ปิดการแจ้งเตือน)
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { endpoint } = req.body || {};
    if (!endpoint) {
      return res.status(400).json({ success: false, message: "ต้องระบุ endpoint" });
    }
    await prisma.pushSubscription.deleteMany({ where: { endpoint } });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("push/unsubscribe error", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
