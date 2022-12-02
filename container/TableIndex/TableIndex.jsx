import React from "react";
import { TableCurrentMonth } from "../../components/TableCurrentMonth/TableCurrentMonth";
import ModalCreate from "../../components/TableCurrentMonth/ModalCreate";

export default function TableIndex() {
  return (
    <>
      <ModalCreate />
      <TableCurrentMonth />
    </>
  );
}
