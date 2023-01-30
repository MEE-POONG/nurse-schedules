import { prisma } from "@/utils/prisma";
import dayjs from "dayjs";

export default async function handler(req, res) {
  const { method } = req;
  switch (method) {
    case "GET":
      try {
        const data = await prisma.onCallDuty.findMany({
          include: { Shif: true, User: true },
        });
        
        res.status(200).json(data);
      } catch (error) {
        
        res.status(400).json({ success: false });
      }
      break;
    case "POST":
      try {
        await prisma.onCallDuty.createMany({
          data: req.body.map((dutyData) => ({
            shifId: dutyData.shifId,
            userId: dutyData.userId,
            isOT: dutyData.isOT,
            datetime: dayjs(dutyData.day).add(7, "hour").format(),
          })),
        });
        res.status(201).json({ success: true });
      } catch (error) {
        res.status(400).json({ success: false, error });
      }
      break;
    case "DELETE":
      try {
        await prisma.onCallDuty.deleteMany({
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
