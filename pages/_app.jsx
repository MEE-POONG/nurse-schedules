import { useEffect, useState } from "react";
import "../styles/globals.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import Layout from "@/components/Layout/Layout";
import { Provider } from "react-redux";
import { store } from "store/store";
import SignIn from "./login";
import { authProvider } from "src/authProvider";
import PwaController from "@/components/PWA/PwaController";

function MyApp({ Component, pageProps }) {
  return (
    <Provider store={store}>
      <Auth>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </Auth>
      <PwaController />
      {/* แจ้งผลการทำงานทุกหน้าในที่เดียว — แทน alert() ของเบราว์เซอร์ */}
      <ToastContainer newestOnTop limit={3} />
    </Provider>
  );
}


// ด่านตรวจสิทธิ์ฝั่งเบราว์เซอร์
// คุกกี้อ่านได้เฉพาะฝั่งเบราว์เซอร์ ถ้าตัดสินใจตั้งแต่ตอน render ครั้งแรก
// ฝั่งเซิร์ฟเวอร์จะเรนเดอร์หน้าล็อกอินเสมอแล้วไม่ตรงกับฝั่งเบราว์เซอร์ (hydration mismatch)
// ผลคือคนที่ล็อกอินแล้วเห็นหน้าล็อกอินแวบหนึ่งทุกครั้งที่โหลดหน้า
// จึงรอให้ mount ก่อนค่อยตัดสิน ระหว่างนั้นแสดงหน้าจอว่างที่ตรงกันทั้งสองฝั่ง
function Auth({ children }) {
  const [state, setState] = useState("checking");

  useEffect(() => {
    setState(authProvider.check().authenticated ? "in" : "out");
  }, []);

  if (state === "checking") {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white" aria-busy="true">
        <span className="w-8 h-8 rounded-full border-2 border-teal-600 animate-spin border-t-transparent" />
        <span className="sr-only">กำลังตรวจสอบการเข้าสู่ระบบ</span>
      </div>
    );
  }

  if (state === "out") return <SignIn />;

  return <>{children}</>;
}

export default MyApp;
