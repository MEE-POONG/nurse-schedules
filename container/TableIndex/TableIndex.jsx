import React from "react";
import { TableCurrentMonth } from "../../components/TableCurrentMonth/TableCurrentMonth";
import ModalCreate from "../../components/TableCurrentMonth/ModalCreate";

export default function TableIndex() {


  return (
    <>
      <div className="w-100 bg-white shadow-xl p-5 m-10 rounded-md overflow-x-auto">
        <ModalCreate/>
        <div className="text-center text-xl">ตารางข้อมูล</div>
        <TableCurrentMonth />
      </div>
    </>
  );
}
