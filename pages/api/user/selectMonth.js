import { prisma } from "@/utils/prisma";
import dayjs from "dayjs";

export default async function handler(req, res) {

  const firstDay = dayjs().month(req.body.month).year(req.body.year).startOf("month");
  const lastDay = dayjs().month(req.body.month).year(req.body.year).endOf("month");

  const { method } = req;
  switch (method) {
    case "GET":
      try {
        const data = await prisma.user.findMany({
          include: {
            Duty: {
              include: { Shif: true },
              where: {
                AND: { datetime: { gte: new Date(firstDay) } },
                datetime: { lte: new Date(lastDay) },
              },
            },
            Location: true,
            Position: true,
            Title: true,
          },
        });
        await prisma.$disconnect();
        res.status(200).json(data);
      } catch (error) {
        await prisma.$disconnect();
        res.status(400).json({ success: false });
      }
      break;
    default:
      res.setHeader("Allow", ["GET"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
