import { prisma } from "@/utils/prisma";
import dayjs from "dayjs";

export default async function handler(req, res) {
  const { method } = req;
  
  switch (method) {
    case "GET":
      try {
        const { userId, month, year } = req.query;
        
        let whereClause = {};
        
        if (userId) {
          whereClause.userId = userId;
        }
        
        if (month && year) {
          const firstDay = dayjs().month(month).year(year).startOf("month");
          const lastDay = dayjs().month(month).year(year).endOf("month");
          
          whereClause.datetime = {
            gte: firstDay.toDate(),
            lte: lastDay.toDate()
          };
        }
        
        const preferences = await prisma.shiftPreference.findMany({
          where: whereClause,
          include: {
            User: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                Title: true,
                Position: true
              }
            },
            Shif: true,
            Location: true
          },
          orderBy: [
            { datetime: "asc" },
            { priority: "asc" }
          ]
        });
        
        res.status(200).json(preferences);
      } catch (error) {
        console.error("Error fetching shift preferences:", error);
        res.status(500).json({ error: "Failed to fetch shift preferences" });
      }
      break;
      
    case "POST":
      try {
        const { userId, shifId, locationId, datetime, priority, isReserved } = req.body;
        
        if (!userId || !shifId || !datetime) {
          return res.status(400).json({ error: "Missing required fields" });
        }
        
        // ตรวจสอบว่ามีการจองแล้วหรือไม่
        const existing = await prisma.shiftPreference.findUnique({
          where: {
            userId_shifId_datetime: {
              userId: userId,
              shifId: shifId,
              datetime: new Date(datetime)
            }
          }
        });
        
        if (existing) {
          return res.status(409).json({ error: "Preference already exists for this shift and date" });
        }
        
        const preference = await prisma.shiftPreference.create({
          data: {
            userId: userId,
            shifId: shifId,
            locationId: locationId,
            datetime: new Date(datetime),
            priority: priority || 1,
            isReserved: isReserved || false
          },
          include: {
            User: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                Title: true,
                Position: true
              }
            },
            Shif: true,
            Location: true
          }
        });
        
        res.status(201).json(preference);
      } catch (error) {
        console.error("Error creating shift preference:", error);
        res.status(500).json({ error: "Failed to create shift preference" });
      }
      break;
      
    case "PUT":
      try {
        const { id, priority, isReserved } = req.body;
        
        if (!id) {
          return res.status(400).json({ error: "Missing preference ID" });
        }
        
        const preference = await prisma.shiftPreference.update({
          where: { id: id },
          data: {
            priority: priority,
            isReserved: isReserved
          },
          include: {
            User: {
              select: {
                id: true,
                firstname: true,
                lastname: true,
                Title: true,
                Position: true
              }
            },
            Shif: true,
            Location: true
          }
        });
        
        res.status(200).json(preference);
      } catch (error) {
        console.error("Error updating shift preference:", error);
        res.status(500).json({ error: "Failed to update shift preference" });
      }
      break;
      
    case "DELETE":
      try {
        const { id } = req.body;
        
        if (!id) {
          return res.status(400).json({ error: "Missing preference ID" });
        }
        
        await prisma.shiftPreference.delete({
          where: { id: id }
        });
        
        res.status(200).json({ message: "Preference deleted successfully" });
      } catch (error) {
        console.error("Error deleting shift preference:", error);
        res.status(500).json({ error: "Failed to delete shift preference" });
      }
      break;
      
    default:
      res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}