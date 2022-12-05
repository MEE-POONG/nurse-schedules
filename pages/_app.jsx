import "../styles/globals.css";
import "react-datepicker/dist/react-datepicker.css";
import Layout from "@/components/Layout/Layout";

function MyApp({ Component, pageProps }) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;
