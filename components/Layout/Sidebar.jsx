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
    <aside className="hidden lg:flex lg:flex-col lg:sticky lg:top-0 lg:h-screen lg:w-64 shrink-0 bg-[var(--brand-dark)] text-white app-chrome">
      {/* โลโก้ + ชื่อ รพ. */}
      <div className="flex gap-3 items-center px-4 py-5">
        <div className="flex justify-center items-center w-10 h-10 rounded-lg bg-white/10 text-teal-300">
          <TbHeartbeat size={22} />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">ตารางเวรพยาบาล</div>
          <div className="text-[11px] text-teal-300/80">โรงพยาบาลครบุรี</div>
        </div>
      </div>

      {/* เมนูหลัก */}
      <nav className="flex overflow-y-auto flex-col flex-1 gap-1 px-3">
        {NAV_ITEMS.filter((it) => !it.adminOnly || me.isAdmin).map((it) => {
          const Icon = it.icon;
          const active = isActive(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
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

      {/* ส่วนผู้ใช้ด้านล่าง */}
      <div className="px-3 py-4 mt-2 border-t border-white/10">
        <div className="flex gap-3 items-center px-2 mb-3">
          <div className="flex justify-center items-center w-9 h-9 text-sm font-semibold text-white bg-teal-600 rounded-full">
            {(me.firstname || "?").charAt(0)}
          </div>
          <div className="leading-tight min-w-0">
            <div className="text-sm font-medium truncate">{me.firstname || "ผู้ใช้"}</div>
            {me.isAdmin && <div className="text-[11px] text-teal-300/80">ผู้ดูแลระบบ</div>}
          </div>
        </div>
        <Link
          href="/profile"
          className="flex gap-3 items-center px-3 py-2 text-sm rounded-lg text-teal-50/90 hover:bg-white/10"
        >
          <TbUserCircle size={20} /> แก้ไขข้อมูล
        </Link>
        {me.isAdmin && (
          <Link
            href="/register"
            className="flex gap-3 items-center px-3 py-2 text-sm rounded-lg text-teal-50/90 hover:bg-white/10"
          >
            <TbUserPlus size={20} /> ลงทะเบียน
          </Link>
        )}
        <button
          onClick={logout}
          className="flex gap-3 items-center px-3 py-2 w-full text-sm text-left text-red-200 rounded-lg hover:bg-white/10"
        >
          <TbLogout size={20} /> ออกจากระบบ
        </button>
      </div>
    </aside>
  );
}
