import dayFunction from "@/utils/day";
import React from "react";
import { useDispatch } from "react-redux";
import { setMonth, setYear } from "store/dateSlice";
export default function DropDownDate() {
  const dispatch = useDispatch()
  const { monthTH,yearTH,yearEN,monthEN } = dayFunction("","")
  const yearInt = +yearEN
  const year = 2022
  
  return (
    <>
    <label htmlFor="">เดือน</label>
      <div className="relative inline-flex mx-2">
        <svg
          className="w-2 h-2 absolute top-0 right-0 m-4 pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 412 232"
        >
          <path
            d="M206 171.144L42.678 7.822c-9.763-9.763-25.592-9.763-35.355 0-9.763 9.764-9.763 25.592 0 35.355l181 181c4.88 4.882 11.279 7.323 17.677 7.323s12.796-2.441 17.678-7.322l181-181c9.763-9.764 9.763-25.592 0-35.355-9.763-9.763-25.592-9.763-35.355 0L206 171.144z"
            fill="#648299"
            fillRule="nonzero"
          />
        </svg>
        <select
          onChange={(event) => {
            dispatch(setMonth(event.target.value));
          }}
          className="border border-gray-300 shadow-md rounded-full text-gray-600 h-10 pl-5 pr-10 bg-white hover:border-green-500 focus:border-green-500 focus:outline-none appearance-none"
        >
          <option className="text-green-600" value={+monthEN - 1}>{monthTH}</option>
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
      <div className="relative inline-flex mx-2">
        <svg
          className="w-2 h-2 absolute top-0 right-0 m-4 pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 412 232"
        >
          <path
            d="M206 171.144L42.678 7.822c-9.763-9.763-25.592-9.763-35.355 0-9.763 9.764-9.763 25.592 0 35.355l181 181c4.88 4.882 11.279 7.323 17.677 7.323s12.796-2.441 17.678-7.322l181-181c9.763-9.764 9.763-25.592 0-35.355-9.763-9.763-25.592-9.763-35.355 0L206 171.144z"
            fill="#648299"
            fillRule="nonzero"
          />
        </svg>
        <select
          onChange={(event) => {
            dispatch(setYear( event.target.value ));
          }}
          className="border border-gray-300 shadow-md rounded-full text-gray-600 h-10 pl-5 pr-10 bg-white hover:border-green-500 focus:border-green-500 focus:outline-none appearance-none"
        >
          <option className="text-green-600" value={yearInt}>{yearTH}</option>
          {Array.from(new Array(5), (v, i) => (
            <option
              key={i}
              value={year + i}
              className={`${
                year + i === new Date().getFullYear()
                  ? "bg-green-600 text-white"
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
