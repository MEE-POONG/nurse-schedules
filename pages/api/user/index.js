import { prisma } from "@/utils/prisma";
import dayjs from "dayjs";

export default async function handler(req, res) {

  const firstDay = dayjs().startOf("month");
  const lastDay = dayjs().endOf("month");

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
    case "POST":
      try {
        await prisma.product.create({
          data: {
            name: req.body.name,
            price: parseInt(req.body.price),
            description: req.body.description,
            image: req.body.image,
            categoryId: req.body.categoryId,
            amount: parseInt(req.body.amount),
            unitId: req.body.unitId,
          },
        });
        await prisma.$disconnect();
        res.status(201).json({ success: true });
      } catch (error) {
        await prisma.$disconnect();
        res.status(400).json({ success: false });
      }
      break;
    default:
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
