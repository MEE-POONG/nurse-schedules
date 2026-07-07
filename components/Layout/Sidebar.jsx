import Link from "next/link";
import { useRouter } from "next/router";
import { TbHeartbeat, TbUserCircle, TbUserPlus, TbLogout } from "react-icons/tb";
import { authProvider } from "src/authProvider";
import { NAV_ITEMS } from "./navConfig";

// แถบเมนูซ้ายถาวร — แสดงเฉพาะจอตั้งแต่ lg ขึ้นไป
export default function Sidebar() {
  const router = useRouter();
  const me = authProvider.getIdentity() || {};
  const isActive = (href) =>
    href === "/" ? router.pathname === "/" : router.pathname.startsWith(href);

  const logout = async () => {
    if ((await authProvider.logout()).success) router.push("/login");
  };

  return (
    <aside className="hidden lg:flex lg:flex-col lg:sticky lg:top-0 lg:h-screen lg:w-64 shrink-0 text-white app-chrome bg-gradient-to-b from-[var(--brand-dark)] via-[#0a2b28] to-[var(--brand-darker)] border-r border-white/[0.06]">
      {/* โลโก้ + ชื่อ รพ. */}
      <div className="flex gap-3 items-center px-5 pt-6 pb-5">
        <div className="flex justify-center items-center w-11 h-11 text-white rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 shadow-lg shadow-teal-950/60 ring-1 ring-white/20">
          <TbHeartbeat size={24} />
        </div>
        <div className="leading-tight">
          <div className="text-[15px] font-bold tracking-tight">ตารางเวรพยาบาล</div>
          <div className="text-[11px] font-medium text-teal-300/80">โรงพยาบาลครบุรี</div>
        </div>
      </div>

      <div className="mx-5 mb-3 h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent" />

      {/* เมนูหลัก */}
      <nav className="flex overflow-y-auto flex-col flex-1 gap-1 px-3 thin-scroll">
        <div className="px-3 pb-1.5 text-[10px] font-semibold tracking-widest text-teal-200/40">
          เมนูหลัก
        </div>
        {NAV_ITEMS.filter((it) => !it.adminOnly || me.isAdmin).map((it) => {
          const Icon = it.icon;
          const active = isActive(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                active
                  ? "bg-gradient-to-r from-teal-300 to-emerald-300 text-[var(--brand-darker)] font-semibold shadow-lg shadow-teal-950/50"
                  : "text-teal-50/75 hover:bg-white/[0.07] hover:text-white hover:translate-x-0.5"
              }`}
            >
              <Icon size={20} className="shrink-0" />
              {it.label}
            </Link>
          );
        })}
      </nav>

      {/* ส่วนผู้ใช้ด้านล่าง */}
      <div className="px-3 py-4 mt-2">
        <div className="p-2 rounded-2xl bg-white/[0.05] ring-1 ring-white/[0.07]">
          <div className="flex gap-3 items-center px-2 py-2 mb-1">
            <div className="flex justify-center items-center w-10 h-10 text-sm font-bold text-white rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 ring-2 ring-white/15 shadow-md shadow-teal-950/50">
              {(me.firstname || "?").charAt(0)}
            </div>
            <div className="leading-tight min-w-0">
              <div className="text-sm font-semibold truncate">{me.firstname || "ผู้ใช้"}</div>
              {me.isAdmin && <div className="text-[11px] text-teal-300/70">ผู้ดูแลระบบ</div>}
            </div>
          </div>
          <Link
            href="/profile"
            className="flex gap-3 items-center px-3 py-2 text-sm rounded-lg transition-colors text-teal-50/75 hover:bg-white/[0.07] hover:text-white"
          >
            <TbUserCircle size={19} /> แก้ไขข้อมูล
          </Link>
          {me.isAdmin && (
            <Link
              href="/register"
              className="flex gap-3 items-center px-3 py-2 text-sm rounded-lg transition-colors text-teal-50/75 hover:bg-white/[0.07] hover:text-white"
            >
              <TbUserPlus size={19} /> ลงทะเบียน
            </Link>
          )}
          <button
            onClick={logout}
            className="flex gap-3 items-center px-3 py-2 w-full text-sm text-left text-red-200/90 rounded-lg transition-colors hover:bg-red-400/10 hover:text-red-200"
          >
            <TbLogout size={19} /> ออกจากระบบ
          </button>
        </div>
      </div>
    </aside>
  );
}
