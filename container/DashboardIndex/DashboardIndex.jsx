import React from "react";
import ModalCreate from "../../components/TableCurrentMonth/ModalCreate";



export default function DashboardIndex() {
  return (
    <>
      <div className="w-100 shadow-xl p-5 m-10 rounded-md bg-gradient-to-r from-cyan-500 to-blue-500">
        <ModalCreate/>
      </div>
    </>
  );
}
