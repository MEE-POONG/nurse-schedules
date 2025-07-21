import { prisma } from "@/utils/prisma";

export default async function handler(req, res) {
    const { method } = req
    switch (method) {
        case 'GET':
            try {
                const data = await prisma.location.findMany();
                res.status(200).json(data)
            } catch (error) {
                console.error('GET /api/location error:', error);
                res.status(400).json({ success: false, error: error.message })
            }
            break
        case 'POST':
            try {
                await prisma.location.create({
                    data: {
                        name: req.body.name,
                    }
                })
                
                res.status(201).json({ success: true })
            } catch (error) {
                console.error('POST /api/location error:', error);
                res.status(400).json({ success: false, error: error.message })
            }
            break
        default:
            res.setHeader('Allow', ['GET', 'POST'])
            res.status(405).end(`Method ${method} Not Allowed`)
    }
}