// คู่มือการใช้งานในแอป — เดิมระบบไม่มีที่อธิบายสัญลักษณ์หรือขั้นตอนเลย
// สัญลักษณ์เวรดึงจาก shiftStyle.js ที่ตารางเวรใช้จริง คู่มือจึงไม่มีทางเพี้ยนจากของจริง
import { useState } from "react";
import Link from "next/link";
import { SHIFT_META, OT_CIRCLE, WORK_SHIFTS } from "@/components/Schedule/shiftStyle";
import { authProvider } from "src/authProvider";
import {
  TbBook2,
  TbCalendarPlus,
  TbWand,
  TbPrinter,
  TbClock,
  TbCircleDot,
  TbChevronDown,
  TbChevronUp,
  TbInfoCircle,
} from "react-icons/tb";

// กะทำงาน + สถานะอื่นที่พบในตาราง (เรียงตามเวลาเริ่มกะ)
const LEAVE_KEYS = ["x", "ลาพัก", "ลากิจ", "ลาป่วย", "อบรม", "R"];

function Section({ id, icon: Icon, title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section id={id} className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex gap-3 justify-between items-center px-4 py-3.5 w-full text-left"
      >
        <span className="flex gap-2.5 items-center text-sm font-semibold text-gray-800 sm:text-base">
          <Icon className="shrink-0 text-teal-700" size={20} />
          {title}
        </span>
        {open ? <TbChevronUp className="text-gray-400" /> : <TbChevronDown className="text-gray-400" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-3 text-sm leading-relaxed text-gray-600">{children}</div>}
    </section>
  );
}

const Step = ({ n, children }) => (
  <li className="flex gap-3">
    <span className="flex shrink-0 justify-center items-center w-6 h-6 text-xs font-semibold text-teal-800 bg-teal-100 rounded-full">
      {n}
    </span>
    <span className="pt-0.5">{children}</span>
  </li>
);

export default function GuidePage() {
  const me = authProvider.getIdentity() || {};

  return (
    <div className="px-4 py-7 mx-auto max-w-3xl space-y-3 sm:px-6">
      <div className="mb-2">
        <h1 className="flex gap-2 items-center text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
          <TbBook2 className="text-teal-700" size={26} />
          คู่มือการใช้งาน
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          กดหัวข้อเพื่อเปิดอ่าน — สัญลักษณ์ทั้งหมดในคู่มือนี้ดึงมาจากที่ระบบใช้จริง
        </p>
      </div>

      <Section id="symbols" icon={TbClock} title="สัญลักษณ์เวรและเวลาทำงาน" defaultOpen>
        <div className="grid gap-2 sm:grid-cols-3">
          {WORK_SHIFTS.map((k) => (
            <div key={k} className="flex gap-2 items-center p-2.5 rounded-lg border border-gray-200">
              <span className={`px-2 py-0.5 rounded font-medium ${SHIFT_META[k].chip}`}>{k}</span>
              <span>
                <span className="font-medium text-gray-800">{SHIFT_META[k].full}</span>
                <span className="block text-xs text-gray-500">{SHIFT_META[k].time}</span>
              </span>
            </div>
          ))}
        </div>

        <p className="pt-1 font-medium text-gray-800">เวรควบ (ทำงานต่อกัน 16 ชั่วโมงในวันเดียว)</p>
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 font-medium text-orange-900 bg-orange-200 rounded">ชบ = เช้า + บ่าย</span>
          <span className="px-2 py-1 font-medium text-teal-900 bg-teal-200 rounded">ดบ = ดึก + บ่าย</span>
        </div>
        <p className="text-xs">
          มีแค่สองแบบนี้เท่านั้น ไม่มี &quot;ชด&quot; เพราะเช้าเลิก 16:30 แล้วดึกเริ่ม 00:30 ของวันถัดไป
          และห้ามขึ้นดึกในวันถัดจากวันที่ขึ้นบ่าย เพราะบ่ายเลิก 00:30 ชนกับดึกที่เริ่ม 00:30 พอดี
        </p>

        <p className="pt-1 font-medium text-gray-800">สถานะอื่นที่เจอในตาราง</p>
        <div className="flex flex-wrap gap-2">
          {LEAVE_KEYS.filter((k) => SHIFT_META[k]).map((k) => (
            <span key={k} className={`px-2 py-0.5 rounded text-xs font-medium ${SHIFT_META[k].chip}`}>
              {k} = {SHIFT_META[k].full}
            </span>
          ))}
        </div>
      </Section>

      <Section id="ot" icon={TbCircleDot} title="เวร OT และความหมายของสีวง">
        <p>
          เวร OT คือเวรที่ขึ้นนอกเวลาราชการ ในตารางจะมีวงสีล้อมรอบตัวอักษร สีของวงบอกประเภทที่หน่วยงานใช้เบิก
        </p>
        <div className="space-y-2">
          {Object.entries(OT_CIRCLE).map(([cls, v]) => (
            <div key={cls} className="flex gap-2.5 items-center">
              <span className={`inline-flex justify-center items-center w-7 h-7 rounded-full border-2 text-xs font-medium ${v.ring}`}>
                ช
              </span>
              <span>
                วง<span className="font-medium text-gray-800">{v.th}</span>
              </span>
            </div>
          ))}
        </div>
        <p className="flex gap-2 items-start p-3 text-xs rounded-lg bg-amber-50 text-amber-800">
          <TbInfoCircle size={16} className="mt-0.5 shrink-0" />
          ระบบจัดเวรอัตโนมัติจะใช้วงดำสำหรับเวรเช้า/ดึก OT และวงแดงสำหรับเวรบ่าย OT ส่วนวงน้ำเงินสงวนไว้ให้กรอกมือ
        </p>
      </Section>

      <Section id="reserve" icon={TbCalendarPlus} title="จองเวรล่วงหน้า (สำหรับทุกคน)">
        <ol className="space-y-2.5">
          <Step n={1}>
            เข้าเมนู <Link href="/reservation" className="font-medium text-teal-700 underline">จองเวร</Link> ระบบจะเปิดที่เดือนหน้าให้อัตโนมัติ
          </Step>
          <Step n={2}>เลือกวันที่ต้องการ แล้วเลือกกะ ช / บ / ด หรือ x (ขอหยุด)</Step>
          <Step n={3}>เลือกระดับความต้องการ แล้วกดบันทึก</Step>
        </ol>
        <div className="p-3 space-y-1.5 text-xs bg-gray-50 rounded-lg">
          <div>
            <span className="px-1.5 py-0.5 font-medium text-green-800 bg-green-100 rounded">จองแน่นอน</span>{" "}
            ระบบจะจัดให้ก่อนใครเลย ใช้กับวันที่ติดธุระแน่นอนแล้วเท่านั้น
          </div>
          <div>
            <span className="px-1.5 py-0.5 font-medium text-teal-800 bg-teal-100 rounded">ต้องการมาก</span>{" "}
            ได้คะแนนเต็ม ระบบจะพยายามจัดให้
          </div>
          <div>
            <span className="px-1.5 py-0.5 font-medium text-gray-700 bg-gray-200 rounded">ปกติ</span> ได้คะแนนราว 60%
          </div>
          <div>
            <span className="px-1.5 py-0.5 font-medium text-red-800 bg-red-100 rounded">ไม่อยากทำ</span>{" "}
            ระบบจะหักคะแนน พยายามเลี่ยงให้
          </div>
        </div>
        <p className="text-xs">
          จองแน่นอนที่ขัดกติกาพักผ่อน (เช่น จองดึกในวันถัดจากวันที่มีเวรบ่ายอยู่แล้ว) ระบบจะไม่จัดให้
          และจะขึ้นคำเตือนให้หัวหน้าเห็นว่าต้องคุยกับผู้จอง
        </p>
      </Section>

      {me.isAdmin && (
        <Section id="auto" icon={TbWand} title="จัดตารางเวรอัตโนมัติ (สำหรับผู้ดูแลระบบ)">
          <ol className="space-y-2.5">
            <Step n={1}>
              กรอกวันลา วันอบรม และเวรที่ตกลงกันไว้ลงตารางก่อน — ระบบจะไม่แตะช่องที่มีของอยู่แล้ว
            </Step>
            <Step n={2}>
              เข้าเมนู <Link href="/auto-schedule" className="font-medium text-teal-700 underline">จัดเวรอัตโนมัติ</Link> เลือกเดือนและแผนก
            </Step>
            <Step n={3}>
              ดูการ์ด <span className="font-medium">ตรวจกำลังคน</span> ก่อนเสมอ ถ้าขึ้นว่ากำลังคนไม่พอ
              ให้แก้ตามที่มันบอก (ลดช่องต่อวัน หรือเพิ่มคน) แล้วค่อยสร้างตาราง
            </Step>
            <Step n={4}>กดสร้างพรีวิว ตรวจตาราง ความสมดุล และข้อควรตรวจ — ยังไม่มีอะไรถูกบันทึก</Step>
            <Step n={5}>
              เลือกวิธีบันทึก แล้วกดบันทึกตารางเวร
            </Step>
          </ol>
          <div className="p-3 space-y-1.5 text-xs bg-gray-50 rounded-lg">
            <div>
              <span className="font-medium text-gray-800">เติมเฉพาะช่องที่ยังว่าง</span> — ปลอดภัยที่สุด ไม่ทับของเดิม แนะนำให้ใช้ตัวนี้
            </div>
            <div>
              <span className="font-medium text-red-700">ล้างเวรเดิมแล้วแทนที่</span> — ลบเวรทำงานและวันหยุดของเดือนนั้นทิ้งก่อน
              (วันลา/อบรม/R ไม่ถูกแตะ) ย้อนกลับไม่ได้
            </div>
          </div>

          <p className="pt-1 font-medium text-gray-800">กติกาที่ระบบไม่ยอมฝ่าฝืนเด็ดขาด</p>
          <ul className="space-y-1 text-xs list-disc list-inside">
            <li>มีเวรบ่ายเมื่อวาน ห้ามขึ้นดึกวันนี้ (นับข้ามเดือนด้วย)</li>
            <li>เวรดึกติดกันไม่เกิน 3 คืน</li>
            <li>เวรควบได้เฉพาะ ชบ และ ดบ และไม่เกินเพดานต่อคนต่อเดือนที่ตั้งไว้</li>
            <li>ทุกคนต้องได้วันหยุดขั้นต่ำตามที่ตั้งไว้ — ระบบกันไว้ให้ตั้งแต่ก่อนเริ่มจัด</li>
            <li>หัวหน้าหอขึ้นเฉพาะเวรเช้าในเวลา จันทร์–ศุกร์ เสาร์–อาทิตย์หยุด</li>
            <li>ช่องที่กรอกไว้แล้วจะไม่ถูกแตะ</li>
          </ul>
          <p className="text-xs">
            ถ้าหาคนลงช่องไหนไม่ได้จริง ๆ ระบบจะผ่อนกติกา &quot;ทำงานติดกันสูงสุด&quot; ให้เป็นทางเลือกสุดท้าย
            และ<span className="font-medium">รายงานทุกครั้งที่ผ่อน</span> ในหัวข้อข้อควรตรวจ — ถ้าเห็นคำเตือนนี้บ่อย แปลว่ากำลังคนไม่พอจริง
          </p>
        </Section>
      )}

      <Section id="print" icon={TbPrinter} title="พิมพ์ตารางและใบหลักฐานการจ่ายเงิน">
        <ol className="space-y-2.5">
          <Step n={1}>
            เข้าเมนู <Link href="/official-schedule" className="font-medium text-teal-700 underline">ตารางทางการ</Link> เลือกเดือนที่ต้องการ
          </Step>
          <Step n={2}>ตรวจชื่อผู้ลงนามท้ายใบให้ถูกต้องก่อนพิมพ์</Step>
          <Step n={3}>กดปุ่มพิมพ์ แล้วเลือกขนาดกระดาษตามที่หน่วยงานใช้</Step>
        </ol>
        <p className="text-xs">
          เมนูและแถบนำทางจะถูกซ่อนอัตโนมัติตอนพิมพ์ กระดาษจึงเหลือเฉพาะฟอร์มราชการ
        </p>
      </Section>

      <Section id="faq" icon={TbInfoCircle} title="คำถามที่พบบ่อย">
        <div className="space-y-3">
          <div>
            <p className="font-medium text-gray-800">จองเวรไว้แล้วทำไมไม่ได้ตามที่จอง?</p>
            <p className="text-xs">
              การจองแบบระบุความต้องการเป็นคะแนนโน้มน้าว ไม่ใช่การการันตี ถ้าวันนั้นมีคนจองกะเดียวกันหลายคน
              หรือขัดกติกาพักผ่อน ระบบจะจัดให้คนที่เหมาะกว่า ถ้าจำเป็นจริงให้เลือก &quot;จองแน่นอน&quot;
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-800">เข้าระบบไม่ได้ ขึ้นว่าเซสชันหมดอายุ</p>
            <p className="text-xs">เข้าสู่ระบบใหม่อีกครั้ง ถ้ายังไม่ได้แปลว่าบัญชีอาจถูกปิดใช้งาน ให้ติดต่อผู้ดูแลระบบ</p>
          </div>
          <div>
            <p className="font-medium text-gray-800">ตารางที่เห็นไม่ตรงกับที่หัวหน้าบอก</p>
            <p className="text-xs">
              ลองรีเฟรชหน้าจอก่อน ตารางอาจถูกแก้หลังจากที่เปิดหน้าไว้ ถ้ายังไม่ตรงให้แจ้งหัวหน้าหอ
            </p>
          </div>
          <div>
            <p className="font-medium text-gray-800">อยากให้เตือนก่อนเข้าเวร</p>
            <p className="text-xs">
              เปิดการแจ้งเตือนจากแถบที่ขึ้นด้านล่างหน้าจอ หรือหน้าโปรไฟล์ ระบบจะเตือนล่วงหน้าก่อนถึงเวลาเข้าเวร
              (ต้องอนุญาตการแจ้งเตือนในเบราว์เซอร์)
            </p>
          </div>
        </div>
      </Section>

      <p className="pt-2 pb-4 text-xs text-center text-gray-400">
        มีอะไรไม่ตรงหรืออยากให้เพิ่มหัวข้อ แจ้งผู้ดูแลระบบได้
      </p>
    </div>
  );
}
