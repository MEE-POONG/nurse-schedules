import axios from "axios";

// แปลง VAPID public key (base64url) เป็น Uint8Array สำหรับ applicationServerKey
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

// ลงทะเบียน service worker (เรียกครั้งเดียวตอนเปิดแอป)
export async function registerServiceWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch (err) {
    console.error("ลงทะเบียน service worker ไม่สำเร็จ", err);
    return null;
  }
}

// ขออนุญาต + สมัครรับ push แล้วบันทึกลงเซิร์ฟเวอร์
export async function subscribeToPush(userId) {
  if (!isPushSupported()) {
    throw new Error("เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน");
  }
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    throw new Error("ยังไม่ได้ตั้งค่า NEXT_PUBLIC_VAPID_PUBLIC_KEY");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("ไม่ได้รับอนุญาตให้แจ้งเตือน");
  }

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
  }

  await axios.post("/api/push/subscribe", {
    subscription: subscription.toJSON(),
    userId: userId || null,
  });

  return subscription;
}

// ยกเลิกการรับ push
export async function unsubscribeFromPush() {
  if (!isPushSupported()) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    try {
      await axios.post("/api/push/unsubscribe", { endpoint });
    } catch (_) {
      /* เงียบไว้ */
    }
  }
}

export async function getCurrentSubscription() {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}
