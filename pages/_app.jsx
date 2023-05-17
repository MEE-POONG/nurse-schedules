import "../styles/globals.css";
import Layout from "@/components/Layout/Layout";
import { Provider } from "react-redux";
import { store } from "store/store";
import SignIn from "./login";
import { authProvider } from "src/authProvider";

function MyApp({ Component, pageProps }) {
  return (
    <Provider store={store}>
      <Auth>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </Auth>
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
