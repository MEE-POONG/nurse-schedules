import TableIndex from "@/components/TableIndex/TableIndex";
import { Provider } from "react-redux";
import { store } from "store/store";

export default function Home() {
  return (
    <Provider store={store}>
      <TableIndex />
    </Provider>
  );
}
