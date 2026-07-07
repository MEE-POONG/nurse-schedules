import {
  TbLayoutDashboard,
  TbCalendarPlus,
  TbPhoneCall,
  TbScale,
  TbPrinter,
  TbHeartHandshake,
  TbUsers,
  TbWand,
} from "react-icons/tb";

// เมนูหลักของระบบ ใช้ร่วมกันทั้ง sidebar (จอคอม) และ drawer/bottom nav (มือถือ)
// adminOnly = แสดงเฉพาะผู้ดูแลระบบ
export const NAV_ITEMS = [
  { href: "/", label: "สรุปยอดเวร", icon: TbLayoutDashboard },
  { href: "/reservation", label: "จองเวร", icon: TbCalendarPlus },
  { href: "/on-call", label: "On-Call", icon: TbPhoneCall },
  { href: "/fairness", label: "สมดุลภาระงาน", icon: TbScale },
  { href: "/auto-schedule", label: "จัดเวรอัตโนมัติ", icon: TbWand, adminOnly: true },
  { href: "/manage-users", label: "จัดการผู้ใช้", icon: TbUsers, adminOnly: true },
  { href: "/official-schedule", label: "ตารางทางการ", icon: TbPrinter },
  { href: "/payment", label: "ช่องทางสนับสนุน", icon: TbHeartHandshake },
];

// เมนูที่ปักไว้ในแถบล่าง (มือถือ) — 3 ปุ่มแรก + ปุ่ม "เพิ่มเติม" เปิด drawer
export const BOTTOM_NAV_HREFS = ["/", "/reservation", "/on-call"];
