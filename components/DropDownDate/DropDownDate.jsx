import React, { useState } from "react";

export default function DropDownDate() {
  const [date, setDate] = useState({ month: "", year: "" });

  const year = 2021;
  return (
    <>
    <label htmlFor="">เดือน</label>
      <div class="relative inline-flex mx-2">
        <svg
          class="w-2 h-2 absolute top-0 right-0 m-4 pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 412 232"
        >
          <path
            d="M206 171.144L42.678 7.822c-9.763-9.763-25.592-9.763-35.355 0-9.763 9.764-9.763 25.592 0 35.355l181 181c4.88 4.882 11.279 7.323 17.677 7.323s12.796-2.441 17.678-7.322l181-181c9.763-9.764 9.763-25.592 0-35.355-9.763-9.763-25.592-9.763-35.355 0L206 171.144z"
            fill="#648299"
            fill-rule="nonzero"
          />
        </svg>
        <select
          onChange={(event) => {
            setDate((prev) => ({ ...prev, month: event.target.value }));
          }}
          class="border border-gray-300 shadow-md rounded-full text-gray-600 h-10 pl-5 pr-10 bg-white hover:border-green-500 focus:border-green-500 focus:outline-none appearance-none"
        >
          <option value={""}>-- เลือกเดือน --</option>
          <option value={0}>มกราคม</option>
          <option value={1}>กุมภาพันธ์</option>
          <option value={2}>มีนาคม</option>
          <option value={3}>เมษายน</option>
          <option value={4}>พฤษภาคม</option>
          <option value={5}>มิถุนายน</option>
          <option value={6}>กรกฎาคม</option>
          <option value={7}>สิงหาคม</option>
          <option value={8}>กันยายน</option>
          <option value={9}>ตุลาคม</option>
          <option value={10}>พฤศจิกายน</option>
          <option value={11}>ธันวาคม</option>
        </select>
      </div>
      <label htmlFor="">ปี</label>
      <div class="relative inline-flex mx-2">
        <svg
          class="w-2 h-2 absolute top-0 right-0 m-4 pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 412 232"
        >
          <path
            d="M206 171.144L42.678 7.822c-9.763-9.763-25.592-9.763-35.355 0-9.763 9.764-9.763 25.592 0 35.355l181 181c4.88 4.882 11.279 7.323 17.677 7.323s12.796-2.441 17.678-7.322l181-181c9.763-9.764 9.763-25.592 0-35.355-9.763-9.763-25.592-9.763-35.355 0L206 171.144z"
            fill="#648299"
            fill-rule="nonzero"
          />
        </svg>
        <select
          onChange={(event) => {
            setDate((prev) => ({ ...prev, year: event.target.value }));
          }}
          class="border border-gray-300 shadow-md rounded-full text-gray-600 h-10 pl-5 pr-10 bg-white hover:border-green-500 focus:border-green-500 focus:outline-none appearance-none"
        >
          <option value={''}>-- เลือกปี --</option>
          {Array.from(new Array(5), (v, i) => (
            <option
              key={i}
              value={year + i}
              className={`${
                year + i === new Date().getFullYear()
                  ? "bg-green-500 text-white"
                  : ""
              }`}
            >
              {year + i + 543}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
