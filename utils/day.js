import dayjs from "dayjs";
import 'dayjs/locale/th';

const inputM = ''
const inputY = ''
const inputMonth = inputM === '' ?new Date().getMonth()+1 : inputM
const inputYear = inputY === '' ?new Date().getFullYear() : inputY

export const daysInMonth = dayjs(`${inputMonth}`).daysInMonth();
export const arrayDayInMonth = Array.from(Array(daysInMonth).keys());
export const monthEN = dayjs(`${inputMonth}`).format('MMMM');
export const yearEN = dayjs(`${inputYear}`).format('YYYY');

dayjs.locale('th');
const buddhistEra = require('dayjs/plugin/buddhistEra')
dayjs.extend(buddhistEra)
export const monthTH = dayjs(`${inputMonth}`).format('MMMM');
export const yearTH = dayjs(`${inputYear}`).format('BBBB');