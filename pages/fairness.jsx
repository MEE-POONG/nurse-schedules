import DropDownDate from "@/components/DropDownDate/DropDownDate";
import FairnessDashboard from "@/components/Fairness/FairnessDashboard";
import { useSelector } from "react-redux";

export default function FairnessPage() {
  const { dateStore } = useSelector((state) => ({ ...state }));
  const month = dateStore.value.month;
  const year = dateStore.value.year;

  return (
    <div className="py-8 min-h-screen bg-gray-50">
      <div className="px-4 mx-auto max-w-6xl">
        <div className="mb-6 text-center">
          <DropDownDate />
        </div>
        <FairnessDashboard month={month} year={year} />
      </div>
    </div>
  );
}
