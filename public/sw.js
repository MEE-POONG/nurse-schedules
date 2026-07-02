/* Service Worker — ตารางเวร รพ.ครบุรี
 * รับผิดชอบ: Web Push + คลิกแจ้งเตือน + cache เปลือก (offline fallback เบื้องต้น)
 */

const CACHE = "tarangwen-v1";
const PRECACHE = ["/", "/manifest.json", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE).catch(() => {}))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// network-first สำหรับ navigation, ถ้า offline ใช้หน้าจาก cache
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(request).then((r) => r || caches.match("/")))
    );
  }
});

// รับ push และแสดงการแจ้งเตือน
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_) {
    data = { title: "ตารางเวร", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "ตารางเวร รพ.ครบุรี";
  const options = {
    body: data.body || "",
    icon: data.icon || "/icon-192.png",
    badge: data.badge || "/icon-192.png",
    tag: data.tag || "tarangwen",
    data: { url: data.url || "/" },
    vibrate: [80, 40, 80],
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// คลิกการแจ้งเตือน → โฟกัสแท็บเดิมหรือเปิดใหม่
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl).catch(() => {});
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
