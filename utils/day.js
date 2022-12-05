import dayjs from "dayjs";
import 'dayjs/locale/th';

export const daysInMonth = dayjs().daysInMonth();
export const arrayDayInMonth = Array.from(Array(daysInMonth).keys());
export const monthEN = dayjs().format('MMMM');
export const yearEN = dayjs().format('YYYY');

dayjs.locale('th');
const buddhistEra = require('dayjs/plugin/buddhistEra')
dayjs.extend(buddhistEra)
export const monthTH = dayjs().format('MMMM');
export const yearTH = dayjs().format('BBBB');