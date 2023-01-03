import { TableCurrentMonth } from "@/components/TableCurrentMonth/TableCurrentMonth";
import React from "react";
import DropDownDate from "../DropDownDate/DropDownDate";
import { TableSelectMonth } from "../TableSelectMonth/TableSelectMonth";

const inputM = '';
const inputY = '';

export default function TableIndex() {
  return (
    <>
      <div className="text-center mt-6">
        <DropDownDate />
      </div>
      {inputM === '' && inputY === '' ? (
        <TableCurrentMonth />
      ) : (
        <TableSelectMonth />
      )}
    </>
  );
}
