// แจ้งผลการทำงานให้ผู้ใช้ด้วย toast แทน alert() ของเบราว์เซอร์
// alert() บนมือถือเด้งเป็นกล่องระบบที่ดูเหมือนแอปค้าง กดพลาดง่าย และแสดงข้อความดิบจากระบบ
import { toast } from "react-toastify";

const BASE = {
  position: "top-center",
  autoClose: 3500,
  hideProgressBar: true,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "light",
};

export const notifySuccess = (message) => toast.success(message, BASE);
export const notifyInfo = (message) => toast.info(message, BASE);
export const notifyWarn = (message) => toast.warn(message, { ...BASE, autoClose: 5000 });
// ข้อความผิดพลาดให้เวลาอ่านนานกว่า เพราะมักต้องลงมือทำอะไรต่อ
export const notifyError = (message) => toast.error(message, { ...BASE, autoClose: 6000 });

// ข้อความที่ "ไม่ควรโผล่หน้าผู้ใช้" — ดิบเกินไป อ่านแล้วทำอะไรต่อไม่ได้
const isRawTechnical = (text) =>
  !text ||
  /prisma|invalid `|at .*\(|\bundefined\b|\bnull\b|ECONNREFUSED|ENOTFOUND|Unexpected token|TypeError|ReferenceError/i.test(text) ||
  // ข้อความล้วนอังกฤษยาวๆ มักเป็นข้อความของไลบรารี ไม่ใช่ข้อความที่เขียนให้ผู้ใช้อ่าน
  (!/[฀-๿]/.test(text) && text.length > 40);

/**
 * แปลง error จาก axios/fetch เป็นประโยคภาษาไทยที่ผู้ใช้ทำอะไรต่อได้
 * หลักการ: ถ้า API ส่งข้อความไทยที่เขียนไว้ให้ผู้ใช้อ่านอยู่แล้ว ใช้ข้อความนั้น
 *          ถ้าเป็นข้อความดิบของระบบ ให้แทนด้วยประโยคตามสถานะ HTTP
 * @param {unknown} error ตัวแปร error ที่จับได้
 * @param {string} fallback ข้อความตั้งต้นเมื่อเดาอะไรไม่ได้เลย
 */
export function describeError(error, fallback = "ทำรายการไม่สำเร็จ") {
  const res = error?.response;
  const fromApi = res?.data?.message || res?.data?.error;
  if (fromApi && !isRawTechnical(fromApi)) return fromApi;

  if (error?.code === "ECONNABORTED" || /timeout/i.test(error?.message || ""))
    return "ระบบใช้เวลานานเกินไป ลองใหม่อีกครั้ง";
  if (!res) return "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่อีกครั้ง";

  switch (res.status) {
    case 400:
      return `${fallback} — ข้อมูลที่กรอกไม่ครบหรือไม่ถูกต้อง ตรวจสอบอีกครั้ง`;
    case 401:
      return "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่";
    case 403:
      return "บัญชีนี้ไม่มีสิทธิ์ทำรายการนี้ ติดต่อผู้ดูแลระบบ";
    case 404:
      return "ไม่พบข้อมูลที่ต้องการ อาจถูกลบไปแล้ว ลองรีเฟรชหน้าจอ";
    case 409:
      return "มีข้อมูลนี้อยู่แล้ว ไม่สามารถบันทึกซ้ำได้";
    case 413:
      return "ไฟล์ใหญ่เกินไป";
    default:
      if (res.status >= 500) return "ระบบขัดข้องชั่วคราว ลองใหม่อีกครั้ง หากยังไม่ได้กรุณาแจ้งผู้ดูแลระบบ";
      return fallback;
  }
}

// แจ้ง error แบบสำเร็จรูป: แปลงเป็นภาษาคนแล้วค่อยโชว์
export const notifyApiError = (error, fallback) => notifyError(describeError(error, fallback));
