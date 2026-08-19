import SIGNATORIES from "@/utils/signatories";
import { SignatureColumn, SignatureRow } from "./SignatureRow";

// ลายเซ็นท้าย "ใบหลักฐานการจ่ายเงินค่าตอบแทน" (ใบรับเงิน)
// การเงินแจ้งให้เรียงชื่อ ผอ. (ผู้อนุมัติ) ขึ้นก่อน แล้วตามด้วยผู้ควบคุมและผู้จ่ายเงิน
// ใช้ร่วมกันทั้ง 3 ใบ (AF / OT / R) เพื่อให้แก้ชื่อ-ตำแหน่งที่เดียวแล้วตรงกันทุกใบ
export const PaymentSignature = ({ colSpan }) => (
  <SignatureRow
    colSpan={colSpan}
    note="ขอรับรองว่าผู้ที่รับเงินค่าตอบแทนดังกล่าวได้ปฏิบัติงานนอกเวลาจริง"
  >
    <SignatureColumn
      label="(ผู้อนุมัติ)"
      name={SIGNATORIES.director.name}
      lines={[SIGNATORIES.director.position, SIGNATORIES.director.role]}
    />
    <SignatureColumn
      label="(ผู้ควบคุม)"
      name={SIGNATORIES.nursingHead.name}
      lines={[SIGNATORIES.nursingHead.position, SIGNATORIES.nursingHead.role]}
    />
    <SignatureColumn
      label="ผู้จ่ายเงิน"
      name={SIGNATORIES.finance.name}
      lines={[SIGNATORIES.finance.position]}
    />
  </SignatureRow>
);

export default PaymentSignature;
