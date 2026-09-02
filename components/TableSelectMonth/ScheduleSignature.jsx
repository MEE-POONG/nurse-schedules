import SIGNATORIES from "@/utils/signatories";
import { SignatureColumn, SignatureRow } from "./SignatureRow";

// ลายเซ็นท้ายใบตารางเวร (ใบที่ไม่มีตัวเงิน)
// ลำดับเดิม: ผู้อนุมัติอยู่เวร (ผอ.) → ผู้ควบคุม → หัวหน้าหน่วยงาน
export const ScheduleSignature = ({ colSpan, departmentor, onClick }) => (
  <SignatureRow colSpan={colSpan} onClick={onClick}>
    <SignatureColumn
      label="(ผู้อนุมัติอยู่เวร)"
      name={SIGNATORIES.director.name}
      lines={[SIGNATORIES.director.position, SIGNATORIES.director.role]}
    />
    <SignatureColumn
      label="(ผู้ควบคุม)"
      name={SIGNATORIES.nursingHead.name}
      lines={[SIGNATORIES.nursingHead.position, SIGNATORIES.nursingHead.role]}
    />
    <SignatureColumn
      label="หัวหน้าหน่วยงาน"
      dotCount={54}
      name={departmentor}
    />
  </SignatureRow>
);

export default ScheduleSignature;
