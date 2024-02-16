import dayjs from "dayjs";
import "dayjs/locale/th";

//รับค่าวันที่

// const d = new Date();
// let month = d.getMonth();
export default function dayFunction(inputM, inputY) {
  const inputMonth = inputM === '' ? dayjs().month() : +inputM + 1;
  const inputYear = inputY === '' ? dayjs().year() : inputY;
  const daysInMonth = dayjs(`${inputYear}-${inputMonth}-01`).daysInMonth();
  const arrayDayInMonth = Array.from(Array(daysInMonth).keys());
  const monthEN = dayjs(`${inputMonth}`).format("M");
  const yearEN = dayjs(`${inputYear}`).format("YYYY");

  dayjs.locale("th");
  const buddhistEra = require("dayjs/plugin/buddhistEra");
  dayjs.extend(buddhistEra);
  const monthTH = dayjs(`${inputMonth}`).format("MMMM");
  const yearTH = dayjs(`${inputYear}`).format("BBBB");

  return { daysInMonth,arrayDayInMonth,monthEN,yearEN,monthTH,yearTH }
}
