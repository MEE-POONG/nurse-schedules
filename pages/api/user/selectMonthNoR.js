import { prisma } from "@/utils/prisma";
import dayjs from "dayjs";

export default async function handler(req, res) {
  const firstDay = dayjs()
    .month(req.query.month)
    .year(req.query.year)
    .startOf("month");
  const lastDay = dayjs()
    .month(req.query.month)
    .year(req.query.year)
    .endOf("month");
  const { method } = req;
  switch (method) {
    case "GET":
      try {
        let data = await prisma.user.findMany({
          include: {
            UserDuty: {
              include: {
                Location: true,
              },
              where: {
                AND: {
                  datetime: { gte: firstDay.format() },
                  locationId: {
                    not: null,
                  },
                },
              },
            },
            Duty: {
              include: {
                Shif: true,
                Location: true,
              },
              where: {
                AND: { datetime: { gte: firstDay.format() } },
                datetime: { lte: lastDay.format() },
              },
              orderBy: {
                Location: {
                  name: "asc",
                },
              },
            },
            Position: true,
            Title: true,
          },
          where: {
            isPartTime: false,
            UserDuty: {
              some: {
                AND: {
                  datetime: { gte: firstDay.format() },
                  locationId: {
                    not: null,
                  },
                },
              },
            },
          },
        });
        data = data
          ?.map((e) => {
            return {
              ...e,
              Duty: e.Duty.filter((d) => !["R"].includes(d.Shif.name)),
              UserDuty: e.UserDuty[0],
            };
          })
          .sort((a, b) => ("" + a.UserDuty.id).localeCompare(b.UserDuty.id))
          .sort((a, b) =>
            ("" + a.UserDuty.locationId).localeCompare(b.UserDuty.locationId)
          );

        // if (data.length < 16) {
        //   for (let i = 0; i < 28 - data.length; i++) {
        //     data.push({
        //       id: 0,
        //       normal_compensation: 0,
        //       overtime_compensation: 0,
        //       UserDuty: {
        //         id: 0,
        //         locationId: 0,
        //         datetime: "",
        //         location: {
        //           name: "",
        //         },
        //       },
        //       Duty: [],
        //     });
        //   }
        // }

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
