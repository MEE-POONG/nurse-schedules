import "../styles/globals.css";
import "react-datepicker/dist/react-datepicker.css";
import Layout from "@/components/Layout/Layout";

import dayjs from "dayjs";
import 'dayjs/locale/th';
const buddhistEra = require('dayjs/plugin/buddhistEra')
dayjs.extend(buddhistEra)
dayjs.locale('th');

function MyApp({ Component, pageProps }) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;
