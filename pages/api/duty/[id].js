import { prisma } from "@/utils/prisma";

export default async function handler(req, res) {
  const { method } = req;
  switch (method) {
    case "DELETE":
      try {
        const data = await prisma.duty.delete({
          where: {
            id: +req.query.id,
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
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
