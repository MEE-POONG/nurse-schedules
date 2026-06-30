import { Fragment, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Dialog, Transition } from "@headlessui/react";
import {
  TbHeartbeat,
  TbMenu2,
  TbX,
  TbDots,
  TbUserCircle,
  TbUserPlus,
  TbLogout,
} from "react-icons/tb";
import { authProvider } from "src/authProvider";
import { NAV_ITEMS, BOTTOM_NAV_HREFS } from "./navConfig";

// แถบบน + drawer + แถบเมนูล่าง สำหรับมือถือ (ซ่อนตั้งแต่ lg ขึ้นไป)
export default function MobileNav() {
  const router = useRouter();
  const me = authProvider.getIdentity() || {};
  const [open, setOpen] = useState(false);

  const isActive = (href) =>
    href === "/" ? router.pathname === "/" : router.pathname.startsWith(href);
  const visibleItems = NAV_ITEMS.filter((it) => !it.adminOnly || me.isAdmin);
  const bottomItems = BOTTOM_NAV_HREFS.map((h) => visibleItems.find((it) => it.href === h)).filter(
    Boolean
  );

  const logout = async () => {
    if ((await authProvider.logout()).success) router.push("/login");
  };

  return (
    <>
      {/* แถบบน */}
      <header className="flex sticky top-0 z-30 justify-between items-center px-4 h-14 bg-white border-b border-gray-200 lg:hidden app-chrome">
        <button
          onClick={() => setOpen(true)}
          aria-label="เปิดเมนู"
          className="flex gap-2.5 items-center text-teal-700"
        >
          <TbMenu2 size={24} />
          <span className="leading-tight text-left">
            <span className="block text-sm font-semibold text-teal-800">ตารางเวรพยาบาล</span>
            <span className="block text-[10px] text-gray-500">รพ.ครบุรี</span>
          </span>
        </button>
        <Link
          href="/profile"
          aria-label="โปรไฟล์"
          className="flex justify-center items-center w-8 h-8 text-xs font-semibold text-white bg-teal-700 rounded-full"
        >
          {(me.firstname || "?").charAt(0)}
        </Link>
      </header>

      {/* Drawer */}
      <Transition show={open} as={Fragment}>
        <Dialog onClose={setOpen} className="relative z-40 lg:hidden">
          <Transition.Child
            as={Fragment}
            enter="transition-opacity duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/45" />
          </Transition.Child>

          <Transition.Child
            as={Fragment}
            enter="transition-transform duration-200"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition-transform duration-150"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel className="flex fixed inset-y-0 left-0 flex-col w-72 max-w-[80%] bg-[var(--brand-dark)] text-white">
              <div className="flex justify-between items-center px-4 py-4">
                <div className="flex gap-3 items-center">
                  <div className="flex justify-center items-center w-9 h-9 rounded-lg bg-white/10 text-teal-300">
                    <TbHeartbeat size={20} />
                  </div>
                  <div className="leading-tight">
                    <div className="text-sm font-semibold">ตารางเวรพยาบาล</div>
                    <div className="text-[11px] text-teal-300/80">โรงพยาบาลครบุรี</div>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} aria-label="ปิดเมนู" className="text-white/80">
                  <TbX size={22} />
                </button>
              </div>

              <nav className="flex overflow-y-auto flex-col flex-1 gap-1 px-3">
                {visibleItems.map((it) => {
                  const Icon = it.icon;
                  const active = isActive(it.href);
                  return (
                    <Link
                      key={it.href}
                      href={it.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm ${
                        active
                          ? "bg-teal-300 text-[var(--brand-dark)] font-semibold"
                          : "text-teal-50/90 hover:bg-white/10"
                      }`}
                    >
                      <Icon size={20} className="shrink-0" />
                      {it.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="px-3 py-4 border-t border-white/10">
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="flex gap-3 items-center px-3 py-2.5 text-sm rounded-lg text-teal-50/90 hover:bg-white/10"
                >
                  <TbUserCircle size={20} /> แก้ไขข้อมูล
                </Link>
                {me.isAdmin && (
                  <Link
                    href="/register"
                    onClick={() => setOpen(false)}
                    className="flex gap-3 items-center px-3 py-2.5 text-sm rounded-lg text-teal-50/90 hover:bg-white/10"
                  >
                    <TbUserPlus size={20} /> ลงทะเบียน
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="flex gap-3 items-center px-3 py-2.5 w-full text-sm text-left text-red-200 rounded-lg hover:bg-white/10"
                >
                  <TbLogout size={20} /> ออกจากระบบ
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </Dialog>
      </Transition>

      {/* แถบเมนูล่าง */}
      <nav className="flex fixed inset-x-0 bottom-0 z-30 justify-around items-stretch bg-white border-t border-gray-200 lg:hidden app-chrome">
        {bottomItems.map((it) => {
          const Icon = it.icon;
          const active = isActive(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-[10px] ${
                active ? "text-teal-700 font-semibold" : "text-gray-500"
              }`}
            >
              <Icon size={22} />
              {it.label}
            </Link>
          );
        })}
        <button
          onClick={() => setOpen(true)}
          className="flex flex-col flex-1 justify-center items-center gap-0.5 py-2 text-[10px] text-gray-500"
        >
          <TbDots size={22} />
          เพิ่มเติม
        </button>
      </nav>
    </>
  );
}
