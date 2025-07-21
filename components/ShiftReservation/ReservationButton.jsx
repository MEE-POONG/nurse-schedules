import { useState } from "react";
import { BsBookmark, BsBookmarkFill } from "react-icons/bs";
import ShiftReservationModal from "./ShiftReservationModal";
import useAxios from "axios-hooks";
import { authProvider } from "src/authProvider";

const ReservationButton = ({ day, month, year, onReservationUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  
  const currentUser = authProvider.getIdentity();

  // ดึงการจองที่มีอยู่สำหรับวันนี้
  const [{ data: dayReservations }] = useAxios({
    url: `/api/shift-preference?userId=${currentUser?.id}&month=${month}&year=${year}`,
    method: "GET"
  });

  const hasReservation = dayReservations?.some(res => 
    new Date(res.datetime).getDate() === day
  );

  const hasConfirmedReservation = dayReservations?.some(res => 
    new Date(res.datetime).getDate() === day && res.isReserved
  );

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`p-1 rounded-full hover:bg-gray-100 transition-colors ${
          hasConfirmedReservation 
            ? "text-green-600" 
            : hasReservation 
            ? "text-blue-600" 
            : "text-gray-400"
        }`}
        title={
          hasConfirmedReservation 
            ? "มีการจองแน่นอน" 
            : hasReservation 
            ? "มีความชอบ" 
            : "คลิกเพื่อจองเวร"
        }
      >
        {hasReservation ? <BsBookmarkFill size={12} /> : <BsBookmark size={12} />}
      </button>

      <ShiftReservationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        selectedDate={day}
        month={month}
        year={year}
        onReservationUpdate={onReservationUpdate}
      />
    </>
  );
};

export default ReservationButton;