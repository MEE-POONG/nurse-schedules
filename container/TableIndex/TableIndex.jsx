import React from "react";
import { FaPlus } from "react-icons/fa";
import { TableCurrentMonth } from "../../components/TableCurrentMonth/TableCurrentMonth";

export default function TableIndex() {
  return (
    <div className="w-100 bg-white shadow-xl p-5 m-10 rounded-md overflow-x-auto">
      <button class="bg-primary hover:bg-secondary text-white font-bold py-2 px-4 rounded-lg">
        <FaPlus/>
      </button>
      <div className="text-center text-xl">ตารางข้อมูล</div>
      <TableCurrentMonth />
    </div>
  );
}
