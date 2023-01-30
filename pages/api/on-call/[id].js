import { prisma } from "@/utils/prisma";

export default async function handler(req, res) {
  const { method } = req;
  switch (method) {
    case "PUT":
      try {
        const data = await prisma.onCallDuty.update({
          where: {
            id: req.query.id,
          },
          data: {
            isOT: req.body.isOT,
          },
        });
        
        res.status(200).json(data);
      } catch (error) {
        
        res.status(400).json({ success: false });
      }
      break;
    case "DELETE":
      try {
        const data = await prisma.onCallDuty.delete({
          where: {
            id: req.query.id,
          },
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
