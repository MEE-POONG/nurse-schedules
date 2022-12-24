import { TableCurrentMonth } from "@/components/TableCurrentMonth/TableCurrentMonth";
import React, { useState } from "react";
import ReactDatePicker from "react-datepicker";

export default function TableIndex() {
  const [startDate, setStartDate] = useState(new Date());
  return (
    <>
      <ReactDatePicker
        selected={startDate}
        onChange={(date) => setStartDate(date)}
        dateFormat="MM/yyyy"
        showMonthYearPicker
        showFullMonthYearPicker
        showFourColumnMonthYearPicker
      />
      <TableCurrentMonth />
    </>
  );
}
