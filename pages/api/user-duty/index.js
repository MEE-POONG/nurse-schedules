import { prisma } from "@/utils/prisma";
import dayjs from "dayjs";

export default async function handler(req, res) {
  const { method } = req;
  switch (method) {
    case "GET":
      try {
        const data = await prisma.userDuty.findMany({
          include: { Location: true, User: true },
        });

        res.status(200).json(data);
      } catch (error) {

        res.status(400).json({ success: false });
      }
      break;
    case "POST":
      try {
        await prisma.userDuty.create({
          data: {
            userId: req.body.userId,
            locationId: req.body.locationId,
            datetime: dayjs(req.body.day).add(7, "hour").format(),
          },
        });
        res.status(201).json({ success: true });
      } catch (error) {
        res.status(400).json({ success: false, error });
      }
      break;
    case "DELETE":
      try {
        await prisma.userDuty.deleteMany({
          data: req.body.map((deleteData) => ({
            where: {
              id: deleteData.id,
            },
          })),
        });

        res.status(200).json(data);
      } catch (error) {

        res.status(400).json({ success: false });
      }
      break;
    default:
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
