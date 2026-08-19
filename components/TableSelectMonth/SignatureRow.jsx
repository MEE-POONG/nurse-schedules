const dots = (count) => ".".repeat(count);

// หนึ่งช่องลายเซ็น — ชื่อและตำแหน่งจัดกึ่งกลาง "เส้นประ" พอดี ไม่ใช่กึ่งกลางทั้งบรรทัด
// (คำว่า ลงชื่อ กับวงเล็บท้ายบรรทัดยาวไม่เท่ากัน ถ้าจัดกลางทั้งบรรทัดชื่อจะเยื้องออกจากเส้น)
// ของเดิมดันทีละบรรทัดด้วย pl-14 / pl-[20rem] ทำให้แต่ละบรรทัดเบี้ยวไม่ตรงกันเอง
export const SignatureColumn = ({ label, dotCount = 70, name, lines = [] }) => {
  const line = dots(dotCount);

  return (
    <div className="flex flex-1 justify-center px-2">
      <div>
        <p className="mt-3 whitespace-nowrap">
          ลงชื่อ{line}{label}
        </p>
        <div className="flex">
          {/* สองช่องนี้ล่องหน มีไว้กันที่ให้ตรงกับความกว้างของคำว่า ลงชื่อ และวงเล็บท้ายบรรทัด */}
          <span className="invisible whitespace-nowrap" aria-hidden="true">
            ลงชื่อ
          </span>
          <div>
            <span
              className="block invisible h-0 overflow-hidden whitespace-nowrap"
              aria-hidden="true"
            >
              {line}
            </span>
            <p className="text-center">( {name} )</p>
            {lines.filter(Boolean).map((text) => (
              <p key={text} className="text-center">
                {text}
              </p>
            ))}
          </div>
          <span className="invisible whitespace-nowrap" aria-hidden="true">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
};

// แถวลายเซ็นท้ายตาราง ใช้ร่วมกันทุกใบ
// onClick มีไว้สำหรับใบที่ใช้การคลิกแถวนี้เปิดส่วนแอดมินที่ซ่อนอยู่ (open >= 5)
export const SignatureRow = ({ colSpan, note, onClick, children }) => (
  <tr className="border" onClick={onClick}>
    <td className="py-5 border border-white" colSpan={colSpan}>
      {note ? <div className="flex flex-row justify-center">{note}</div> : null}
      <div className="hidden justify-between w-full sm:flex">{children}</div>
    </td>
  </tr>
);

export default SignatureRow;
