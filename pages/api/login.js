import { prisma } from "@/utils/prisma";

export default async function handler(req, res) {

    const { method } = req;
    switch (method) {
        case "PUT":
            try {
                const data = await prisma.user.update({
                    where: { id: req.body.id },
                    data: {
                        username: req.body.username,
                        password: req.body.password
                    }
                });
                res.status(200).json(data);
            } catch (error) {
                res.status(400).json({ success: false });
            }
            break;
        
        case "POST":
            try {
                const data = await prisma.user.findFirst({
                    where: { username: req.body.username, password: req.body.password }
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
