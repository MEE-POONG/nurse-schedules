/**
 * ตัวช่วยส่ง Web Push ฝั่งเซิร์ฟเวอร์ (รวมไว้ที่เดียว)
 * ใช้ซ้ำจาก API ต่าง ๆ — จัดเวร / on-call / เตือนก่อนเข้าเวร / เปิดตารางเดือนใหม่
 *
 * ทุกฟังก์ชันออกแบบให้ "ไม่ทำให้งานหลักล้ม" — ถ้าส่งแจ้งเตือนพลาดจะกลืน error ไว้
 */
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
import utc from "dayjs/plugin/utc";
import { isPushConfigured, sendToSubscription } from "./webpush";

dayjs.extend(buddhistEra);
dayjs.extend(utc);

/**
 * เวลาเริ่มเวร (ชั่วโมงแบบทศนิยม) แยกตามชื่อกะ
 * อ้างอิงจาก CLAUDE.md — ช 08:30 / บ 16:30 / ด 00:30
 * กะอื่น (อบรม, วันหยุด, O ฯลฯ) ไม่ส่งเตือนก่อนเข้าเวร
 */
export const SHIFT_START_HOUR = {
  ช: 8.5,
  บ: 16.5,
  ด: 0.5,
};

function formatThaiDate(input) {
  return dayjs(input).locale("th").format("D MMM BBBB");
}

/**
 * ส่งแจ้งเตือนหา subscription ของผู้ใช้ที่ระบุ (ไม่ใส่ userIds = broadcast ทุกคน)
 * คืน { sent, failed, total } เสมอ และจะไม่ throw
 */
export async function notify(prisma, { userIds, title, body, url, tag, icon } = {}) {
  if (!title) return { sent: 0, failed: 0, total: 0, skipped: "no-title" };
  if (!isPushConfigured()) return { sent: 0, failed: 0, total: 0, skipped: "no-vapid" };

  try {
    const where =
      Array.isArray(userIds) && userIds.length > 0
        ? { userId: { in: userIds.filter(Boolean) } }
        : {};
    const subs = await prisma.pushSubscription.findMany({ where });
    if (subs.length === 0) return { sent: 0, failed: 0, total: 0 };

    const payload = {
      title,
      body: body || "",
      url: url || "/",
      icon: icon || "/icon-192.png",
      badge: "/icon-192.png",
      tag: tag || "tarangwen",
    };

    const results = await Promise.all(
      subs.map((sub) => sendToSubscription(prisma, sub, payload))
    );
    const sent = results.filter((r) => r.ok).length;
    return { sent, failed: results.length - sent, total: subs.length };
  } catch (err) {
    console.error("notify error", err);
    return { sent: 0, failed: 0, total: 0, error: err?.message };
  }
}

/**
 * แจ้งเตือนเมื่อมีการ "จัดเวร/แก้เวร" — รับ array เดียวกับที่ POST เข้ามา
 * โครงสร้างแต่ละชิ้น: { userId, day: "YYYY-M-D", shifId, isOT }
 * จะรวมเวรของผู้ใช้คนเดียวกันในวันเดียวกันเป็นข้อความเดียว
 *
 * @param {object} opts
 * @param {boolean} opts.isOnCall  true = เวร on-call (ICU)
 */
export async function notifyDutyAssigned(prisma, duties, opts = {}) {
  try {
    if (!Array.isArray(duties) || duties.length === 0) return;
    if (!isPushConfigured()) return;

    const isOnCall = Boolean(opts.isOnCall);

    // โหลดชื่อกะที่เกี่ยวข้อง
    const shifIds = [...new Set(duties.map((d) => d.shifId).filter(Boolean))];
    const shifs = shifIds.length
      ? await prisma.shif.findMany({ where: { id: { in: shifIds } } })
      : [];
    const shifNameById = Object.fromEntries(shifs.map((s) => [s.id, s.name]));

    // กลุ่มตาม userId + วัน
    const groups = new Map(); // key = userId|day
    for (const d of duties) {
      if (!d.userId) continue;
      const key = `${d.userId}|${d.day}`;
      if (!groups.has(key)) {
        groups.set(key, { userId: d.userId, day: d.day, shifNames: [] });
      }
      const name = shifNameById[d.shifId];
      if (name) groups.get(key).shifNames.push(name);
    }

    const label = isOnCall ? "เวร On-call (ICU)" : "เวร";
    const title = isOnCall ? "🚑 ได้รับมอบหมายเวร On-call" : "📅 ได้รับมอบหมายเวร";

    await Promise.all(
      [...groups.values()].map((g) => {
        const shiftText = g.shifNames.length ? g.shifNames.join(", ") : "(ปรับปรุง)";
        const dateText = formatThaiDate(g.day);
        const body = `${label}วันที่ ${dateText} : ${shiftText}`;
        return notify(prisma, {
          userIds: [g.userId],
          title,
          body,
          url: "/",
          tag: `duty-${g.userId}-${g.day}`,
        });
      })
    );
  } catch (err) {
    console.error("notifyDutyAssigned error", err);
  }
}

/**
 * ส่ง "เตือนก่อนเข้าเวร" สำหรับเวรที่จะเริ่มภายใน leadMinutes ข้างหน้า
 * และยังไม่เคยเตือน (reminderSentAt = null) — ใช้เรียกจาก cron
 *
 * @param {number} leadMinutes  เตือนล่วงหน้ากี่นาที (ดีฟอลต์ 60)
 * @returns สรุปผล { scanned, reminded }
 */
export async function sendShiftReminders(prisma, { leadMinutes = 60 } = {}) {
  if (!isPushConfigured()) return { scanned: 0, reminded: 0, skipped: "no-vapid" };

  // ใช้ "เวลาผนัง" ของไทย (UTC+7) แบบ naive เพื่อเทียบกับเวลาเริ่มเวร
  // แปลงเป็นสตริงแล้ว parse ใหม่ใน local-mode ให้โหมดตรงกับ shiftStart (เทียบ isAfter ได้ถูก)
  const nowBkk = dayjs(dayjs().utc().add(7, "hour").format("YYYY-MM-DDTHH:mm:ss"));
  const windowEnd = nowBkk.add(leadMinutes, "minute");

  // จำกัดช่วงวันที่ดึงข้อมูล (เมื่อวาน–พรุ่งนี้) เพื่อไม่โหลดทั้งคอลเลกชัน
  const rangeStart = nowBkk.subtract(1, "day").startOf("day").toDate();
  const rangeEnd = nowBkk.add(2, "day").endOf("day").toDate();

  let scanned = 0;
  let reminded = 0;

  // เตือนทั้งเวรปกติและเวร on-call
  const sources = [
    { model: prisma.duty, isOnCall: false },
    { model: prisma.onCallDuty, isOnCall: true },
  ];

  for (const { model, isOnCall } of sources) {
    const rows = await model.findMany({
      where: {
        reminderSentAt: null,
        datetime: { gte: rangeStart, lte: rangeEnd },
      },
      include: { Shif: true },
    });

    for (const duty of rows) {
      scanned++;
      const shiftName = duty.Shif?.name;
      const startHour = SHIFT_START_HOUR[shiftName];
      if (startHour === undefined) continue; // กะที่ไม่ต้องเตือน

      // วันที่ของเวรตามปฏิทินไทย
      const dutyDate = dayjs(duty.datetime).utc().add(7, "hour").format("YYYY-MM-DD");
      const wholeHour = Math.floor(startHour);
      const minute = Math.round((startHour - wholeHour) * 60);
      const shiftStart = dayjs(`${dutyDate}T00:00`)
        .add(wholeHour, "hour")
        .add(minute, "minute");

      // เริ่มภายในหน้าต่างที่กำหนด และยังไม่เลยเวลาเริ่ม
      if (shiftStart.isAfter(nowBkk) && !shiftStart.isAfter(windowEnd)) {
        const timeText = shiftStart.format("HH:mm");
        const label = isOnCall ? "เวร On-call (ICU)" : `เวร ${shiftName}`;
        const result = await notify(prisma, {
          userIds: [duty.userId],
          title: "⏰ ใกล้ถึงเวลาเข้าเวร",
          body: `${label} เริ่มเวลา ${timeText} น.`,
          url: "/",
          tag: `reminder-${duty.id}`,
        });
        await model.update({
          where: { id: duty.id },
          data: { reminderSentAt: new Date() },
        });
        if (result.sent > 0) reminded++;
      }
    }
  }

  return { scanned, reminded };
}
