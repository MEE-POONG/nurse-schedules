import TableIndex from "@/components/TableIndex/TableIndex";
import dayjs from "dayjs";

export default function Home() {
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
