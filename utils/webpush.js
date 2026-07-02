import webpush from "web-push";

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

let configured = false;

export function getWebPush() {
  if (!publicKey || !privateKey) {
    throw new Error(
      "ยังไม่ได้ตั้งค่า VAPID keys — กรุณากำหนด VAPID_PUBLIC_KEY และ VAPID_PRIVATE_KEY ใน .env"
    );
  }
  if (!configured) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    configured = true;
  }
  return webpush;
}

export function isPushConfigured() {
  return Boolean(publicKey && privateKey);
}

/**
 * ส่งแจ้งเตือนไปยัง subscription ที่ระบุ
 * คืน { ok: true } หรือ { ok: false, statusCode } เมื่อ subscription หมดอายุ (404/410)
 */
export async function sendToSubscription(prisma, sub, payload) {
  const wp = getWebPush();
  const pushSubscription = {
    endpoint: sub.endpoint,
    keys: { p256dh: sub.p256dh, auth: sub.auth },
  };
  try {
    await wp.sendNotification(pushSubscription, JSON.stringify(payload));
    return { ok: true };
  } catch (err) {
    const statusCode = err?.statusCode;
    // 404/410 = subscription หมดอายุ ให้ลบทิ้ง
    if (statusCode === 404 || statusCode === 410) {
      try {
        await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } });
      } catch (_) {
        /* อาจถูกลบไปแล้ว */
      }
    }
    return { ok: false, statusCode, error: err?.message };
  }
}
