import { prisma } from "@/utils/prisma";

// จัดการข้อมูล user รายคน (สำหรับผู้ดูแลระบบ)
// PUT    /api/user/:id  → แก้ไขข้อมูล / รีเซ็ตรหัสผ่าน
// DELETE /api/user/:id  → ปิดการใช้งาน (soft delete → isActive=false)
export default async function handler(req, res) {
  const { method } = req;
  const { id } = req.query;

  switch (method) {
    case "GET":
      try {
        const data = await prisma.user.findUnique({
          where: { id },
          include: { Title: true, Position: true },
        });
        if (!data) {
          return res.status(404).json({ success: false, error: "ไม่พบผู้ใช้" });
        }
        res.status(200).json(data);
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    case "PUT":
      try {
        // อัปเดตเฉพาะ field ที่ส่งมา (รองรับการแก้ไขบางส่วน เช่น รีเซ็ตรหัสผ่านอย่างเดียว)
        const b = req.body || {};
        const data = {};

        if (b.firstname !== undefined) data.firstname = b.firstname;
        if (b.lastname !== undefined) data.lastname = b.lastname;
        if (b.username !== undefined) data.username = b.username;
        if (b.password !== undefined && b.password !== "") data.password = b.password;
        if (b.positionId !== undefined) data.positionId = b.positionId;
        if (b.titleId !== undefined) data.titleId = b.titleId;
        if (b.isAdmin !== undefined) data.isAdmin = b.isAdmin;
        if (b.isActive !== undefined) data.isActive = b.isActive;
        if (b.isPartTime !== undefined) data.isPartTime = b.isPartTime;
        if (b.isChief !== undefined) data.isChief = b.isChief;
        if (b.normal_compensation !== undefined)
          data.normal_compensation = Number(b.normal_compensation);
        if (b.overtime_compensation !== undefined)
          data.overtime_compensation = Number(b.overtime_compensation);

        const updated = await prisma.user.update({ where: { id }, data });
        res.status(200).json({ success: true, user: updated });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    case "DELETE":
      try {
        // ปิดการใช้งานแทนการลบจริง เพื่อรักษาประวัติเวรที่ผูกกับผู้ใช้
        await prisma.user.update({ where: { id }, data: { isActive: false } });
        res.status(200).json({ success: true });
      } catch (error) {
        res.status(400).json({ success: false, error: error.message });
      }
      break;

    default:
      res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
