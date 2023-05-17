import TableIndex from "@/components/TableIndex/TableIndex";
import dayjs from "dayjs";
import { useEffect } from "react";
import { authProvider } from "src/authProvider";

export default function Home() {
  useEffect(() => {
    if (authProvider.getIdentity().id === undefined) {
      authProvider.logout();
      window.location.href = "/login";
    }
  })
  return (
    <>
      <div className="my-5">
        <div className="text-center mt-10">
          <h1>สรุปยอดตารางเวรประจำเดือน</h1>
        </div>
      </div>
      <TableIndex />
    </>
  );
}
