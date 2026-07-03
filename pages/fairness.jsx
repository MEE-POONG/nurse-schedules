import DropDownDate from "@/components/DropDownDate/DropDownDate";
import FairnessDashboard from "@/components/Fairness/FairnessDashboard";
import { useSelector } from "react-redux";

export default function FairnessPage() {
  const { dateStore } = useSelector((state) => ({ ...state }));
  const month = dateStore.value.month;
  const year = dateStore.value.year;

  return (
    <div className="px-4 py-7 mx-auto max-w-6xl sm:px-6">
      <div className="mb-5">
        <DropDownDate />
      </div>
      <FairnessDashboard month={month} year={year} />
    </div>
  );
}
