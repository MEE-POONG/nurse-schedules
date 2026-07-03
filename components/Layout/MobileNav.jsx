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
      <header className="flex sticky top-0 z-30 justify-between items-center px-4 h-14 border-b shadow-sm backdrop-blur bg-white/90 border-gray-200/80 lg:hidden app-chrome">
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
          className="flex justify-center items-center w-8 h-8 text-xs font-bold text-white rounded-full bg-gradient-to-br from-teal-600 to-emerald-600 shadow-md shadow-teal-600/30"
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
            <Dialog.Panel className="flex fixed inset-y-0 left-0 flex-col w-72 max-w-[80%] text-white bg-gradient-to-b from-[var(--brand-dark)] via-[#0a2b28] to-[var(--brand-darker)]">
              <div className="flex justify-between items-center px-4 py-4">
                <div className="flex gap-3 items-center">
                  <div className="flex justify-center items-center w-10 h-10 text-white rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 shadow-lg shadow-teal-950/60 ring-1 ring-white/20">
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
                      className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm transition-colors ${
                        active
                          ? "bg-gradient-to-r from-teal-300 to-emerald-300 text-[var(--brand-darker)] font-semibold shadow-lg shadow-teal-950/50"
                          : "text-teal-50/75 hover:bg-white/[0.07]"
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
      <nav className="flex fixed inset-x-0 bottom-0 z-30 justify-around items-stretch border-t backdrop-blur bg-white/95 border-gray-200/80 shadow-[0_-4px_16px_rgba(11,49,46,0.06)] lg:hidden app-chrome">
        {bottomItems.map((it) => {
          const Icon = it.icon;
          const active = isActive(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-[10px] transition-colors ${
                active ? "text-teal-700 font-semibold" : "text-gray-500"
              }`}
            >
              {active && <span className="absolute top-0 w-8 h-0.5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500" />}
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
