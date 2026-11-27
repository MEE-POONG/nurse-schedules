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


function Auth({ children }) {
  
  if (!authProvider.check().authenticated) {
    return <SignIn />
  }

  return <>{children}</> 
}

export default MyApp;
