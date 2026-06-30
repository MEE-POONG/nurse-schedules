import { useEffect, useState, useCallback } from "react";
import { authProvider } from "src/authProvider";
import {
  registerServiceWorker,
  subscribeToPush,
  isPushSupported,
  isStandalone,
  getCurrentSubscription,
} from "@/utils/pushClient";

function isIos() {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export default function PwaController() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(true); // เริ่มเป็น true กัน flash ตอน SSR/โหลด
  const [showInstall, setShowInstall] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [pushState, setPushState] = useState("unknown"); // unknown | unsupported | default | granted | denied
  const [busy, setBusy] = useState(false);

  const getUserId = () => {
    try {
      return authProvider.getIdentity()?.id || null;
    } catch {
      return null;
    }
  };

  // ลงทะเบียน service worker + ตรวจสถานะเริ่มต้น
  useEffect(() => {
    registerServiceWorker();

    const standalone = isStandalone();
    setInstalled(standalone);

    // ดักจังหวะที่ติดตั้งได้ (Android/Chrome desktop)
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!standalone && sessionStorage.getItem("pwa_install_dismissed") !== "1") {
        setShowInstall(true);
      }
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    const onInstalled = () => {
      setInstalled(true);
      setShowInstall(false);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", onInstalled);

    // iOS ไม่มี beforeinstallprompt → แนะนำวิธีเพิ่มลงโฮมเอง
    if (!standalone && isIos() && sessionStorage.getItem("pwa_install_dismissed") !== "1") {
      setShowInstall(true);
    }

    // สถานะสิทธิ์แจ้งเตือน
    if (!isPushSupported()) {
      setPushState("unsupported");
    } else {
      setPushState(Notification.permission);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // ถ้าเคยอนุญาตแล้ว ให้ sync subscription กับ user ปัจจุบันแบบเงียบ ๆ
  useEffect(() => {
    if (pushState !== "granted") return;
    (async () => {
      try {
        const sub = await getCurrentSubscription();
        if (!sub) {
          await subscribeToPush(getUserId());
        }
      } catch (_) {
        /* เงียบไว้ */
      }
    })();
  }, [pushState]);

  const handleInstall = useCallback(async () => {
    if (isIos() && !deferredPrompt) {
      setShowIosHelp(true);
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowInstall(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const dismissInstall = () => {
    setShowInstall(false);
    setShowIosHelp(false);
    try {
      sessionStorage.setItem("pwa_install_dismissed", "1");
    } catch (_) {}
  };

  const handleEnablePush = useCallback(async () => {
    setBusy(true);
    try {
      await subscribeToPush(getUserId());
      setPushState("granted");
    } catch (err) {
      setPushState(Notification?.permission || "denied");
      alert(err.message || "เปิดการแจ้งเตือนไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }, []);

  // แถบเชิญติดตั้ง — โชว์ตลอดถ้ายังไม่ติดตั้ง (และยังไม่ปิดในรอบนี้)
  const showInstallBar = !installed && showInstall;
  // แถบเปิดแจ้งเตือน — โชว์เมื่อติดตั้งแล้วหรือบนเดสก์ท็อป แต่ยังไม่ได้เปิด
  const showPushBar =
    !showInstallBar &&
    pushState === "default" &&
    (installed || !isIos());

  if (!showInstallBar && !showPushBar) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[1000] pointer-events-none lg:bottom-4">
      <div className="mx-auto max-w-md px-3 pb-20 lg:pb-0">
        {showInstallBar && (
          <div className="pointer-events-auto rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 p-4">
            <div className="flex items-start gap-3">
              <img src="/icon-192.png" alt="" className="h-11 w-11 rounded-xl shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#0f3b38]">ติดตั้งแอปตารางเวร</p>
                <p className="text-sm text-gray-600 mt-0.5">
                  ติดตั้งลงหน้าจอโฮม เปิดได้เร็วขึ้นและรับการแจ้งเตือนเวรได้
                </p>

                {showIosHelp && (
                  <p className="text-sm text-gray-700 mt-2 bg-[#e3f1ee] rounded-lg p-2">
                    บน iPhone/iPad: แตะปุ่ม <b>แชร์</b> ⬆️ ด้านล่าง แล้วเลือก{" "}
                    <b>“เพิ่มไปยังหน้าจอโฮม”</b>
                  </p>
                )}

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleInstall}
                    className="px-4 py-1.5 rounded-lg bg-[#0f766e] text-white text-sm font-medium hover:bg-[#0f3b38]"
                  >
                    ติดตั้ง
                  </button>
                  <button
                    onClick={dismissInstall}
                    className="px-4 py-1.5 rounded-lg text-gray-500 text-sm hover:bg-gray-100"
                  >
                    ไว้ทีหลัง
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showPushBar && (
          <div className="pointer-events-auto rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 p-4">
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-xl bg-[#e3f1ee] flex items-center justify-center text-xl shrink-0">
                🔔
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#0f3b38]">เปิดการแจ้งเตือนเวร</p>
                <p className="text-sm text-gray-600 mt-0.5">
                  รับแจ้งเตือนเมื่อมีการอัปเดตตารางเวรหรือเวรของคุณ
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    disabled={busy}
                    onClick={handleEnablePush}
                    className="px-4 py-1.5 rounded-lg bg-[#0f766e] text-white text-sm font-medium hover:bg-[#0f3b38] disabled:opacity-60"
                  >
                    {busy ? "กำลังเปิด..." : "เปิดแจ้งเตือน"}
                  </button>
                  <button
                    onClick={() => setPushState("dismissed")}
                    className="px-4 py-1.5 rounded-lg text-gray-500 text-sm hover:bg-gray-100"
                  >
                    ไม่ตอนนี้
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
