import LoadingComponent from "@/components/LoadingComponent";
import axios from "axios";
import { useRouter } from "next/router";
import { useState } from "react";
import { TbDeviceFloppy, TbLock, TbUser, TbUserCircle } from "react-icons/tb";
import { authProvider } from "src/authProvider";

function Profile() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const me = authProvider.getIdentity() || {};

  const inputCls =
    "w-full py-2.5 pl-11 pr-4 text-sm font-medium text-gray-800 bg-gray-50/80 rounded-xl border border-gray-200 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white";

  return (
    <>
      {loading && <LoadingComponent />}
      <div className="px-4 py-7 mx-auto max-w-xl sm:px-6">
        <div className="flex flex-wrap gap-x-3 gap-y-1 items-baseline mb-6">
          <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">แก้ไขข้อมูลผู้ใช้</h1>
        </div>

        <div className="p-6 card sm:p-8">
          <div className="flex gap-4 items-center pb-6 mb-6 border-b border-gray-100">
            <div className="flex justify-center items-center w-14 h-14 text-xl font-bold text-white rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 ring-2 ring-white shadow-md shadow-teal-600/30">
              {(me.firstname || "?").charAt(0)}
            </div>
            <div className="leading-tight">
              <div className="text-base font-bold text-gray-900">{me.firstname || "ผู้ใช้"} {me.lastname || ""}</div>
              <div className="flex gap-1.5 items-center mt-0.5 text-xs text-gray-500">
                <TbUserCircle size={14} /> {me.isAdmin ? "ผู้ดูแลระบบ" : "ผู้ใช้งานทั่วไป"}
              </div>
            </div>
          </div>

          <form
            onSubmit={async (x) => {
              x.preventDefault();
              const username = x.target.username.value;
              const password = x.target.password.value;
              if (!username || !password) {
                alert("กรุณากรอกข้อมูลให้ครบ");
                return;
              }
              setLoading(true);
              const auth = await axios({
                method: "PUT",
                url: "/api/login",
                data: {
                  id: authProvider.getIdentity().id,
                  username: username,
                  password: password,
                },
              });
              if (auth.success === false) {
                alert(auth.message);
                return;
              }
              x.target.username.value = "";
              x.target.password.value = "";
              authProvider.logout();
              router.reload();
              setLoading(false);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block mb-1.5 text-xs font-semibold text-gray-600" htmlFor="username">
                ชื่อผู้ใช้งาน
              </label>
              <div className="relative">
                <TbUser size={18} className="absolute left-4 top-1/2 text-gray-400 -translate-y-1/2" />
                <input
                  id="username"
                  name="username"
                  defaultValue={authProvider.getIdentity().username}
                  autoComplete="username"
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-semibold text-gray-600" htmlFor="password">
                รหัสผ่าน
              </label>
              <div className="relative">
                <TbLock size={18} className="absolute left-4 top-1/2 text-gray-400 -translate-y-1/2" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  defaultValue={authProvider.getIdentity().password}
                  autoComplete="new-password"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="pt-2">
              <button className="gap-2 px-5 py-2.5 w-full btn-brand sm:w-auto">
                <TbDeviceFloppy size={18} /> บันทึกการแก้ไข
              </button>
              <p className="mt-3 text-xs text-gray-400">หลังบันทึก ระบบจะให้ลงชื่อเข้าใช้ใหม่อีกครั้ง</p>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default Profile;
