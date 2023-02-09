import { prisma } from "@/utils/prisma";
import dayjs from "dayjs";

export default async function handler(req, res) {

  const firstDay = dayjs().month(req.query.month).year(req.query.year).startOf("month");
  const lastDay = dayjs().month(req.query.month).year(req.query.year).endOf("month");
  const { method } = req;
  switch (method) {
    case "GET":
      try {
        let data = await prisma.user.findMany({
          include: {
            UserDuty:{
              include: {
                Location: true
              },
              where: {
                AND: {
                  datetime: { gte: firstDay.format() },
                  locationId: {
                    not: null
                  }
                },
              },
            },
            OnCallDuty: {
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
            UserDuty: {
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

        data = data?.map(e => {
          return {
            ...e,
            UserDuty: e.UserDuty[0]
          }
        }).sort((a, b) => new Date(a.UserDuty.datetime) - new Date(b.UserDuty.datetime))
        
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
