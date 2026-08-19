import SIGNATORIES from "@/utils/signatories";

const DOTS = ".".repeat(70);

// ลายเซ็นท้าย "ใบหลักฐานการจ่ายเงินค่าตอบแทน" (ใบรับเงิน)
// การเงินแจ้งให้เรียงชื่อ ผอ. (ผู้อนุมัติ) ขึ้นก่อน แล้วตามด้วยผู้ควบคุมและผู้จ่ายเงิน
// ใช้ร่วมกันทั้ง 3 ใบ (AF / OT / R) เพื่อให้แก้ชื่อ-ตำแหน่งที่เดียวแล้วตรงกันทุกใบ
const SIGNATURE_BLOCKS = [
  { label: "(ผู้อนุมัติ)", signer: SIGNATORIES.director },
  { label: "(ผู้ควบคุม)", signer: SIGNATORIES.nursingHead },
  { label: "ผู้จ่ายเงิน", signer: SIGNATORIES.finance },
];

export const PaymentSignature = ({ colSpan }) => (
  <tr className="border">
    <td className="py-5 border border-white" colSpan={colSpan}>
      <div className="flex flex-row justify-center">
        ขอรับรองว่าผู้ที่รับเงินค่าตอบแทนดังกล่าวได้ปฏิบัติงานนอกเวลาจริง
      </div>
      <div className="hidden justify-between w-full sm:flex">
        {SIGNATURE_BLOCKS.map(({ label, signer }) => (
          <div key={label} className="flex-1 px-2">
            <p className="mt-3 text-center whitespace-nowrap">
              ลงชื่อ{DOTS}{label}
            </p>
            <p className="text-center">( {signer.name} )</p>
            <p className="text-center">{signer.position}</p>
            {signer.role ? <p className="text-center">{signer.role}</p> : null}
          </div>
        ))}
      </div>
    </td>
  </tr>
);

export default PaymentSignature;
