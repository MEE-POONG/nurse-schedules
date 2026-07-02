import LoadingComponent from "@/components/LoadingComponent";
import { useRouter } from "next/router";
import { useState } from "react";
import { TbHeartbeat, TbLogin, TbLock, TbUser } from "react-icons/tb";
import { authProvider } from "src/authProvider";

function SignIn() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (x) => {
    x.preventDefault();
    const username = x.target.username.value;
    const password = x.target.password.value;
    if (!username || !password) {
      alert("กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    setLoading(true);
    const auth = await authProvider.login({ username, password });
    if (auth.success === false) {
      alert(auth.message);
      setLoading(false);
      return;
    }
    x.target.username.value = "";
    x.target.password.value = "";
    router.push(auth.redirectTo);
    setLoading(false);
  };

  const inputCls =
    "w-full py-3 pl-11 pr-4 text-sm font-medium text-gray-800 bg-gray-50/80 rounded-xl border border-gray-200 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 focus:bg-white";

  return (
    <>
      {loading && <LoadingComponent />}
      <div className="flex justify-center items-center px-4 py-10 min-h-screen">
        <div className="overflow-hidden w-full max-w-4xl card lg:grid lg:grid-cols-2" style={{ boxShadow: "var(--card-shadow-lg)" }}>
          {/* ฝั่งฟอร์ม */}
          <div className="px-6 py-10 sm:px-12">
            <div className="flex gap-3 items-center mb-10">
              <div className="flex justify-center items-center w-11 h-11 text-white rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 shadow-lg shadow-teal-600/30 ring-1 ring-white/20">
                <TbHeartbeat size={24} />
              </div>
              <div className="leading-tight">
                <div className="text-[15px] font-bold tracking-tight text-gray-900">ตารางเวรพยาบาล</div>
                <div className="text-[11px] font-medium text-teal-700">โรงพยาบาลครบุรี</div>
              </div>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-gray-900">ลงชื่อเข้าใช้งาน</h1>
            <p className="mt-1 mb-8 text-sm text-gray-500">กรอกชื่อผู้ใช้และรหัสผ่านของคุณ</p>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="relative">
                <TbUser size={18} className="absolute left-4 top-1/2 text-gray-400 -translate-y-1/2" />
                <input id="username" name="username" type="text" placeholder="ชื่อผู้ใช้" autoComplete="username" className={inputCls} />
              </div>
              <div className="relative">
                <TbLock size={18} className="absolute left-4 top-1/2 text-gray-400 -translate-y-1/2" />
                <input id="password" name="password" type="password" placeholder="รหัสผ่าน" autoComplete="current-password" className={inputCls} />
              </div>
              <button type="submit" className="gap-2 py-3 w-full btn-brand">
                <TbLogin size={18} /> เข้าสู่ระบบ
              </button>
            </form>

            <p className="mt-8 text-xs text-center text-gray-400">
              ระบบจัดตารางเวรพยาบาล · หากลืมรหัสผ่านติดต่อผู้ดูแลระบบ
            </p>
          </div>

          {/* ฝั่งภาพประกอบ (จอใหญ่) */}
          <div className="hidden relative lg:flex lg:flex-col lg:justify-between p-10 text-white bg-gradient-to-br from-[var(--brand-dark)] via-[#0a2b28] to-[var(--brand-darker)]">
            <div
              className="absolute inset-0 opacity-60"
              style={{
                background:
                  "radial-gradient(500px 260px at 80% 0%, rgba(20,184,166,0.25), transparent 60%), radial-gradient(400px 240px at 10% 100%, rgba(16,185,129,0.15), transparent 60%)",
              }}
            />
            <div className="relative">
              <div className="inline-flex items-center px-3 py-1 text-[11px] font-semibold text-teal-200 rounded-full bg-white/10 ring-1 ring-white/15">
                โรงพยาบาลครบุรี · นครราชสีมา
              </div>
            </div>
            <div className="relative">
              <div className="mb-4 text-3xl leading-snug font-bold tracking-tight">
                จัดเวรง่าย
                <br />
                เป็นธรรม โปร่งใส
              </div>
              <p className="text-sm leading-relaxed text-teal-100/70">
                ดูตารางเวรของคุณได้ทุกที่ จองเวรล่วงหน้า
                และให้ระบบช่วยจัดตารางอัตโนมัติอย่างสมดุล
              </p>
              <div className="flex gap-2 mt-8">
                {["ตารางเวร", "จองเวร", "On-Call", "ความเป็นธรรม"].map((t) => (
                  <span key={t} className="px-3 py-1 text-[11px] font-medium text-teal-100/90 rounded-full bg-white/[0.08] ring-1 ring-white/10">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps(ctx) {
  if (!authProvider.check(ctx).redirectTo) {
    return {
      redirect: {
        permanent: false,
        destination: authProvider.check(ctx).redirectTo || "/",
      },
    };
  }
  return {
    props: {},
  };
}

export default SignIn;
