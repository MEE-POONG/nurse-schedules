import { prisma } from "@/utils/prisma";
import dayjs from "dayjs";

export default async function handler(req, res) {
  const { method } = req;
  switch (method) {
    case "GET":
      try {
        const data = await prisma.duty.findMany({
          include: { Shif: true, User: true },
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
        await prisma.duty.createMany({
          data: req.body.map((dutyData) => ({
            shifId: dutyData.shifId,
            userId: dutyData.userId,
            isOT: dutyData.isOT,
            datetime: dayjs(
              `${dayjs().year()}-${dayjs().month() + 1}-${dutyData.day}`
            )
              .add(7, "hour")
              .format(),
          })),
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
