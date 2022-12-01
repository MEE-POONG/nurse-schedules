import React, { useState } from "react";

const getDaysInMonth = (year, month) => {
  return new Date(year, month, 0).getDate();
};

const date = new Date();
const currentYear = date.getFullYear();
const currentMonth = date.getMonth();

// console.log(currentYear, currentMonth);
const daysInCurrentMonth = getDaysInMonth(currentYear, currentMonth + 1);

const uniquePerson = [];
let users = [
  {
    name: "est",
    position: "พยาบาลวิชาชีพ",
    location: "พาสุข 2",
    day: "2022-12-15T12:00:00Z",
    shift: "ด",
  },
  {
    name: "chun",
    position: "พยาบาลวิชาชีพ",
    location: "พาสุข 1",
    day: "2022-12-18T12:00:00Z",
    shift: "ช",
  },
  {
    name: "chun",
    position: "พยาบาลวิชาชีพ",
    location: "พาสุข 1",
    day: "2022-12-27T12:00:00Z",
    shift: "บ",
  },
  {
    name: "chun",
    position: "พยาบาลวิชาชีพ",
    location: "พาสุข 1",
    day: "2022-12-05T12:00:00Z",
    shift: "ด",
  },
  {
    name: "benz",
    position: "พยาบาลวิชาชีพ",
    location: "พาสุข 2",
    day: "2022-12-31T12:00:00Z",
    shift: "ด",
  },
  {
    name: "benz",
    position: "พยาบาลวิชาชีพ",
    location: "พาสุข 2",
    day: "2022-12-29T12:00:00Z",
    shift: "ช",
  },
  {
    name: "benz",
    position: "พยาบาลวิชาชีพ",
    location: "พาสุข 2",
    day: "2022-12-12T12:00:00Z",
    shift: "บ",
  },
  {
    name: "pattawut biakrathok",
    position: "พยาบาลวิชาชีพ",
    location: "พาสุข 1",
    day: "2022-12-18T12:00:00Z",
    shift: "ด",
  },
];
// console.log(work.length);

let duty = [
  {
    name: "",
    position: "",
    location: "",
    day: "",
    shift: "",
  },
];

users.map((person) => {
  if (uniquePerson.indexOf(person) === -1) {
    uniquePerson.push(person);
  }
});
// console.log(uniquePerson);

export const TableCurrentMonth = () => {
  return (
    <div>
      <table className="border-collapse border w-full text-center shadow-md border-spacing-2">
        <tbody>
          <tr className="border">
            <td className="border" colSpan={1} rowSpan={2}>
              ชื่อสกุล
            </td>
            <td className="border" colSpan={1} rowSpan={2}>
              ตำแหน่ง
            </td>
            <td className="border" colSpan={1} rowSpan={2}>
              งานที่ปฏิบัติ
            </td>
            <td className="border" colSpan={daysInCurrentMonth} rowSpan={1}>
              วันที่ปฏิบัติงาน
            </td>
            <td className="border" colSpan={2} rowSpan={1}>
              สรุป
            </td>
            <td className="border" colSpan={1} rowSpan={2}>
              โอที
            </td>
            <td className="border" colSpan={1} rowSpan={2}>
              วันทำการ
            </td>
            <td className="border" colSpan={1} rowSpan={2}>
              รวมวันทำงาน
            </td>
          </tr>
          <tr className="border">
            {/* จำนวนวันของเดือน */}
            {[...Array(daysInCurrentMonth).keys()].map((index, key) => (
              <td className="border" key={key}>
                {index + 1}
              </td>
            ))}
            <td className="border">บ่าย</td>
            <td className="border">ดึก</td>
          </tr>
          {/* จำนวนของชื่อ */}
          {uniquePerson?.map((person, key) => (
            <tr className="border" key={key}>
              <td className="border">{person.name}</td>
              <td className="border">{person.position}</td>
              <td className="border">{person.location}</td>
              {/* แสดงรายละเอียดของตาราง กะ */}
              {[...Array(daysInCurrentMonth).keys()].map((i, key) => (
                <td className="border" key={key}>
                  {uniquePerson
                    ?.filter(
                      (person) =>
                        person.name === person.name &&
                        new Date(person.day).getDate() == i + 1
                    )
                    .map((req) => (
                      <>
                        <span>{req.shift}</span>
                      </>
                    ))}
                </td>
              ))}
              <td className="border">&nbsp;</td>
              <td className="border">&nbsp;</td>
              <td className="border">&nbsp;</td>
              <td className="border">&nbsp;</td>
              <td className="border">&nbsp;</td>
            </tr>
          ))}
          <tr className="border">
            <td className="border" colSpan={daysInCurrentMonth + 3} rowSpan={1}>
              รวม
            </td>
            <td className="border">&nbsp;</td>
            <td className="border">&nbsp;</td>
            <td className="border">&nbsp;</td>
            <td className="border">&nbsp;</td>
            <td className="border">&nbsp;</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
