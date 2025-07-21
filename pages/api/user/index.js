import { prisma } from "@/utils/prisma";

export default async function handler(req, res) {

  const { method } = req;
  switch (method) {
    case "GET":
      try {
        const { ids } = req.query;

        let whereClause = {
        };

        // ถ้ามี ids ให้กรองตาม ID ที่ระบุ
        if (ids) {
          const idArray = ids.split(',').map(id => id.trim());
          whereClause.id = {
            in: idArray
          };
        }

        const data = await prisma.user.findMany({
          where: whereClause,
          include: {
            Title: true,
            Position: true
          }
        });

        console.log(`Found ${data.length} users`);
        res.status(200).json(data);
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(400).json({ success: false, error: error.message });
      }
      break;
    case "POST":
      try {
        await prisma.user.create({
          data: {
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            positionId: req.body.positionId,
            titleId: req.body.titleId,
            username: req.body.firstname,
            password: req.body.lastname,
          },
        });

        res.status(201).json({ success: true });
      } catch (error) {

        res.status(400).json({ success: false });
      }
      break;
    default:
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
