import { prisma } from "@/utils/prisma";
import dayjs from "dayjs";

export default async function handler(req, res) {

  const firstDay = dayjs().month(req.query.month).year(req.query.year).startOf("month");
  const lastDay = dayjs().month(req.query.month).year(req.query.year).endOf("month");
  const { method } = req;
  switch (method) {
    case "GET":
      try {
        const data = await prisma.user.findMany({
          include: {
            Duty: {
              include: {
                Shif: true,
                Location: true
              },
              where: {
                AND: { datetime: { gte: firstDay.format() } },
                datetime: { lte: lastDay.format() },
              },
              orderBy: {
                Location: {
                  name: "asc",
                }
              },
            },
            Position: true,
            Title: true,
          },
          where: {
            Duty: {
              some: {
                AND: {
                  datetime: { gte: firstDay.format() },
                  locationId: {
                    not: null
                  }
                },
              }
            }
          },
        });
        res.status(200).json(data);
      } catch (error) {
        res.status(400).json({ success: false });
      }
      break;
    default:
      res.setHeader("Allow", ["GET"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
