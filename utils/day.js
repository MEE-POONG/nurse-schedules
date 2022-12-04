import dayjs from "dayjs";

export const daysInMonth = dayjs().daysInMonth();
export const arrayDayInMonth = Array.from(Array(daysInMonth).keys());
export const monthTH = dayjs().format('MMMM');
export const yearTH = dayjs().format('BBBB');