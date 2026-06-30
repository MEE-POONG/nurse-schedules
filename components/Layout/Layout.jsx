import React from "react";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <MobileNav />
        {/* pb เผื่อแถบเมนูล่างบนมือถือ ไม่ให้บังเนื้อหา */}
        <main className="flex-1 pb-20 lg:pb-0 app-main">{children}</main>
      </div>
    </div>
  );
}
