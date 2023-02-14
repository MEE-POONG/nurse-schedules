import { prisma } from "@/utils/prisma";

export default async function handler(req, res) {

  const { method } = req;
  switch (method) {
    case "GET":
      try {
        const data = await prisma.user.findMany({});
        res.status(200).json(data);
      } catch (error) {
        res.status(400).json({ success: false });
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
