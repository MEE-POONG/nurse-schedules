const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.$connect();

  await prisma.$transaction([
    // prisma.location.createMany({
    //     data: [
    //         {
    //             name: 'ICU',
    //         },
    //     ]
    // }),
    // prisma.position.createMany({
    //     data: [
    //         {
    //             name: 'พยาบาลวิชาชีพ',
    //         },
    //         {
    //             name: 'พนักงานช่วยเหลือคนไข้',
    //         },
    //         {
    //             name: 'พนักงานเปล',
    //         }
    //     ]
    // }),
    // prisma.title.createMany({
    //     data: [
    //         {
    //             name: 'น.ส.',
    //         },
    //         {
    //             name: 'นาง',
    //         },
    //         {
    //             name: 'นาย',
    //         },
    //     ]
    // }),
    // prisma.shif.createMany({
    //     data: [
    //         {
    //             name: 'ช',
    //             isShif: true,
    //             isDayOff: false,
    //         },
    //         {
    //             name: 'บ',
    //             isShif: true,
    //             isDayOff: false,
    //         },
    //         {
    //             name: 'ด',
    //             isShif: true,
    //             isDayOff: false,
    //         },
    //         {
    //             name: 'x',
    //             isShif: false,
    //             isDayOff: true,
    //         },
    //         {
    //             name: 'ลาพัก',
    //             isShif: false,
    //             isDayOff: true,
    //         },
    //         {
    //             name: 'R',
    //             isShif: false,
    //             isDayOff: false,
    //         },
    //         {
    //             name: 'R',
    //             isShif: false,
    //             isDayOff: false,
    //         },
    //         {
    //             name: 'R',
    //             isShif: false,
    //             isDayOff: false,
    //         },
    //         {
    //             name: 'ช',
    //             class: 'circle-dark',
    //             isOT: true,
    //             isShif: false,
    //             isDayOff: false,
    //         },
    //         {
    //             name: 'ช',
    //             class: 'circle-red',
    //             isOT: true,
    //             isShif: false,
    //             isDayOff: false,
    //         },
    //         {
    //             name: 'ช',
    //             class: 'circle-blue',
    //             isOT: true,
    //             isShif: false,
    //             isDayOff: false,
    //         },
    //         {
    //             name: 'บ',
    //             class: 'circle-dark',
    //             isOT: true,
    //             isShif: false,
    //             isDayOff: false,
    //         },
    //         {
    //             name: 'บ',
    //             class: 'circle-red',
    //             isOT: true,
    //             isShif: false,
    //             isDayOff: false,
    //         },
    //         {
    //             name: 'บ',
    //             class: 'circle-blue',
    //             isOT: true,
    //             isShif: false,
    //             isDayOff: false,
    //         },
    //         {
    //             name: 'ด',
    //             class: 'circle-dark',
    //             isOT: true,
    //             isShif: false,
    //             isDayOff: false,
    //         },
    //         {
    //             name: 'ด',
    //             class: 'circle-red',
    //             isOT: true,
    //             isShif: false,
    //             isDayOff: false,
    //         },
    //         {
    //             name: 'ด',
    //             class: 'circle-blue',
    //             isOT: true,
    //             isShif: false,
    //             isDayOff: false,
    //         },
    //     ]
    // })
  ]);

  console.log("seeded transaction successfully");

//   const location = await prisma.location.findMany()
//   const position = await prisma.position.findMany()
//   const title = await prisma.title.findMany()

//   await prisma.user.createMany({
//     data: [
//       {
//         firstname: "ผู้ดูแลระบบ",
//         lastname: "นะครับ",
//         locationId: location.find((item) => item.name === "ICU").id,
//         positionId: position.find(
//           (item) => item.name === "พยาบาลวิชาชีพ"
//         ).id,
//         titleId: title.find((item) => item.name === "นาย").id,
//         username: "admin",
//         password: "admin",
//         isChief: true, // ตัวอย่างหัวหน้า
//         isPregnant: false,
//         isElderly: false,
//       },
//       {
//         firstname: 'รุ่งเพชร',
//         lastname: 'ยิ่งยืน',
//         locationId: location.find((item) => item.name === 'ICU').id,
//         positionId: position.find((item) => item.name === 'พยาบาลวิชาชีพ').id,
//         titleId: title.find((item) => item.name === 'น.ส.').id,
//         isChief: false,
//         isPregnant: true, // ตัวอย่างคนท้อง
//         isElderly: false,
//       },
//       {
//         firstname: 'ภาวิณี',
//         lastname: 'วิทยกิตติกุล',
//         locationId: location.find((item) => item.name === 'ICU').id,
//         positionId: position.find((item) => item.name === 'พยาบาลวิชาชีพ').id,
//         titleId: title.find((item) => item.name === 'นาง').id,
//         isChief: false,
//         isPregnant: false,
//         isElderly: true, // ตัวอย่างผู้สูงอายุ
//       },
//     ],
//   });

  // await prisma.user.createMany({
  //     data: [
  //         {
  //             firstname: 'รุ่งเพชร',
  //             lastname: 'ยิ่งยืน',
  //             locationId: location.find((item) => item.name === 'พาสุข1').id,
  //             positionId: position.find((item) => item.name === 'พนักงานช่วยเหลือคนไข้').id,
  //             titleId: title.find((item) => item.name === 'น.ส.').id,
  //         },
  //         {
  //             firstname: 'ภาวิณี',
  //             lastname: 'วิทยกิตติกุล',
  //             locationId: location.find((item) => item.name === 'พาสุข1').id,
  //             positionId: position.find((item) => item.name === 'พนักงานช่วยเหลือคนไข้').id,
  //             titleId: title.find((item) => item.name === 'นาง').id,
  //         },
  //         {
  //             firstname: 'กชกร',
  //             lastname: 'ญาติกระโทก',
  //             locationId: location.find((item) => item.name === 'พาสุข1').id,
  //             positionId: position.find((item) => item.name === 'พนักงานช่วยเหลือคนไข้').id,
  //             titleId: title.find((item) => item.name === 'น.ส.').id,
  //         },
  //         {
  //             firstname: 'ธนากร',
  //             lastname: 'หัสสะครบุรี',
  //             locationId: location.find((item) => item.name === 'พาสุข1').id,
  //             positionId: position.find((item) => item.name === 'พนักงานช่วยเหลือคนไข้').id,
  //             titleId: title.find((item) => item.name === 'นาย').id,
  //         },
  //         {
  //             firstname: 'ภารดี',
  //             lastname: 'ย้อยผักแว่น',
  //             locationId: location.find((item) => item.name === 'พาสุข2').id,
  //             positionId: position.find((item) => item.name === 'พนักงานช่วยเหลือคนไข้').id,
  //             titleId: title.find((item) => item.name === 'นาง').id,
  //         },
  //         {
  //             firstname: 'กานต์ชนา',
  //             lastname: 'ล้อมกระโทก',
  //             locationId: location.find((item) => item.name === 'พาสุข2').id,
  //             positionId: position.find((item) => item.name === 'พนักงานช่วยเหลือคนไข้').id,
  //             titleId: title.find((item) => item.name === 'น.ส.').id,
  //         },
  //         {
  //             firstname: 'วาสิตา',
  //             lastname: 'ธนารักษ์',
  //             locationId: location.find((item) => item.name === 'พาสุข2').id,
  //             positionId: position.find((item) => item.name === 'พนักงานช่วยเหลือคนไข้').id,
  //             titleId: title.find((item) => item.name === 'น.ส.').id,
  //         },
  //         {
  //             firstname: 'สันติ',
  //             lastname: 'ชุมกระโทก',
  //             locationId: location.find((item) => item.name === 'พาสุข1').id,
  //             positionId: position.find((item) => item.name === 'พนักงานเปล').id,
  //             titleId: title.find((item) => item.name === 'นาย').id,
  //         },
  //         {
  //             firstname: 'คงศักดิ์',
  //             lastname: 'แฝงด่านกลาง',
  //             locationId: location.find((item) => item.name === 'พาสุข2').id,
  //             positionId: position.find((item) => item.name === 'พนักงานเปล').id,
  //             titleId: title.find((item) => item.name === 'นาย').id,
  //         },
  //         {
  //             firstname: 'เจนรวี',
  //             lastname: 'สังสีมา',
  //             locationId: location.find((item) => item.name === 'พาสุข2').id,
  //             positionId: position.find((item) => item.name === 'พยาบาลวิชาชีพ').id,
  //             titleId: title.find((item) => item.name === 'นาง').id,
  //         },
  //         {
  //             firstname: 'ภาสินี',
  //             lastname: 'ชมส่องศรีสกุล',
  //             locationId: location.find((item) => item.name === 'พาสุข2').id,
  //             positionId: position.find((item) => item.name === 'พยาบาลวิชาชีพ').id,
  //             titleId: title.find((item) => item.name === 'นาง').id,
  //         },
  //         {
  //             firstname: 'เกล็ดแก้ว',
  //             lastname: 'ดันกระโทก',
  //             locationId: location.find((item) => item.name === 'พาสุข2').id,
  //             positionId: position.find((item) => item.name === 'พยาบาลวิชาชีพ').id,
  //             titleId: title.find((item) => item.name === 'น.ส.').id,
  //         },
  //         {
  //             firstname: 'พิมพิไล',
  //             lastname: 'พูนสูงเนิน',
  //             locationId: location.find((item) => item.name === 'พาสุข2').id,
  //             positionId: position.find((item) => item.name === 'พยาบาลวิชาชีพ').id,
  //             titleId: title.find((item) => item.name === 'น.ส.').id,
  //         },
  //         {
  //             firstname: 'วรดา',
  //             lastname: 'ทองโสภา',
  //             locationId: location.find((item) => item.name === 'พาสุข2').id,
  //             positionId: position.find((item) => item.name === 'พยาบาลวิชาชีพ').id,
  //             titleId: title.find((item) => item.name === 'น.ส.').id,
  //         },
  //         {
  //             firstname: 'สุธิดา',
  //             lastname: 'ฤทธิ์ชัย',
  //             locationId: location.find((item) => item.name === 'พาสุข2').id,
  //             positionId: position.find((item) => item.name === 'พยาบาลวิชาชีพ').id,
  //             titleId: title.find((item) => item.name === 'น.ส.').id,
  //         },
  //         {
  //             firstname: 'เพ็ญพิชชา',
  //             lastname: 'แดงสูงเนิน',
  //             locationId: location.find((item) => item.name === 'พาสุข2').id,
  //             positionId: position.find((item) => item.name === 'พยาบาลวิชาชีพ').id,
  //             titleId: title.find((item) => item.name === 'น.ส.').id,
  //         },
  //     ]
  // })


//   await prisma.configuration.createMany({
//     data: [
//       {
//         departmentor: "นางมะลิ มอบกระโทก"
//       },
//     ],
//   });
  await prisma.configuration.createMany({
    data: [
      {
        departmentor: "นางรพิรัตน์ คงรักษาเกียรติ"
      },
    ],
  });
  console.log("seeded data");
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
