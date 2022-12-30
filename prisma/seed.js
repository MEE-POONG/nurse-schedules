const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    await prisma.$connect();

    await prisma.$transaction([
        prisma.location.createMany({
            data: [
                {
                    name: 'พาสุข',
                },
                {
                    name: 'พาสุข1',
                },
                {
                    name: 'พาสุข2',
                },
            ]
        }),
        prisma.position.createMany({
            data: [
                {
                    name: 'พยาบาลวิชาชีพ',
                }
            ]
        }),
        prisma.title.createMany({
            data: [
                {
                    name: 'นาง',
                },
                {
                    name: 'น.ส.',
                },
            ]
        }),
        prisma.shif.createMany({
            data: [
                {
                    name: 'ช',
                    isShif: true,
                    isDayOff: false,
                },
                {
                    name: 'บ',
                    isShif: true,
                    isDayOff: false,
                },
                {
                    name: 'ด',
                    isShif: true,
                    isDayOff: false,
                },
                {
                    name: 'x',
                    isShif: false,
                    isDayOff: true,
                },
                {
                    name: 'ลาพัก',
                    isShif: false,
                    isDayOff: true,
                },

            ]
        })
    ])

    console.log('seeded transaction successfully');

    const location = await prisma.location.findMany()
    const position = await prisma.position.findMany()
    const title = await prisma.title.findMany()

    await prisma.user.createMany({
        data: [
            {
                firstname: 'มะลิ',
                lastname: 'มอบกระโทก',
                locationId: location.find((item) => item.name === 'พาสุข').id,
                positionId: position.find((item) => item.name === 'พยาบาลวิชาชีพ').id,
                titleId: title.find((item) => item.name === 'นาง').id,
            },
            {
                firstname: 'อุมาพร',
                lastname: 'ครอบกระโทก',
                locationId: location.find((item) => item.name === 'พาสุข1').id,
                positionId: position.find((item) => item.name === 'พยาบาลวิชาชีพ').id,
                titleId: title.find((item) => item.name === 'นาง').id,
            },
            {
                firstname: 'เกศรา',
                lastname: 'มากสมบูรณ์',
                locationId: location.find((item) => item.name === 'พาสุข1').id,
                positionId: position.find((item) => item.name === 'พยาบาลวิชาชีพ').id,
                titleId: title.find((item) => item.name === 'น.ส.').id,
            },
            {
                firstname: 'อรุณกมล',
                lastname: 'พึ่งเกิดผล',
                locationId: location.find((item) => item.name === 'พาสุข1').id,
                positionId: position.find((item) => item.name === 'พยาบาลวิชาชีพ').id,
                titleId: title.find((item) => item.name === 'นาง').id,
            },
            {
                firstname: 'นิสารัตน์',
                lastname: 'โพธิ์ศรี',
                locationId: location.find((item) => item.name === 'พาสุข1').id,
                positionId: position.find((item) => item.name === 'พยาบาลวิชาชีพ').id,
                titleId: title.find((item) => item.name === 'น.ส.').id,
            },
            {
                firstname: 'สิริลักษณ์',
                lastname: 'ไหลครบุรี',
                locationId: location.find((item) => item.name === 'พาสุข1').id,
                positionId: position.find((item) => item.name === 'พยาบาลวิชาชีพ').id,
                titleId: title.find((item) => item.name === 'น.ส.').id,
            },
            {
                firstname: 'อรุณี',
                lastname: 'จรครบุรี',
                locationId: location.find((item) => item.name === 'พาสุข1').id,
                positionId: position.find((item) => item.name === 'พยาบาลวิชาชีพ').id,
                titleId: title.find((item) => item.name === 'น.ส.').id,
            },
            {
                firstname: 'มิชา',
                lastname: 'ใจเถิน',
                locationId: location.find((item) => item.name === 'พาสุข1').id,
                positionId: position.find((item) => item.name === 'พยาบาลวิชาชีพ').id,
                titleId: title.find((item) => item.name === 'น.ส.').id,
            },
            {
                firstname: 'อุไรวรรณ',
                lastname: 'นอกกระโทก',
                locationId: location.find((item) => item.name === 'พาสุข1').id,
                positionId: position.find((item) => item.name === 'พยาบาลวิชาชีพ').id,
                titleId: title.find((item) => item.name === 'น.ส.').id,
            },
            {
                firstname: 'สายฝน',
                lastname: 'โก้กระโทก',
                locationId: location.find((item) => item.name === 'พาสุข2').id,
                positionId: position.find((item) => item.name === 'พยาบาลวิชาชีพ').id,
                titleId: title.find((item) => item.name === 'น.ส.').id,
            },
            {
                firstname: 'เจนรวี',
                lastname: 'สังสีมา',
                locationId: location.find((item) => item.name === 'พาสุข2').id,
                positionId: position.find((item) => item.name === 'พยาบาลวิชาชีพ').id,
                titleId: title.find((item) => item.name === 'นาง').id,
            },
            {
                firstname: 'ภาสินี',
                lastname: 'ชมส่องศรีสกุล',
                locationId: location.find((item) => item.name === 'พาสุข2').id,
                positionId: position.find((item) => item.name === 'พยาบาลวิชาชีพ').id,
                titleId: title.find((item) => item.name === 'นาง').id,
            },
            {
                firstname: 'เกล็ดแก้ว',
                lastname: 'ดันกระโทก',
                locationId: location.find((item) => item.name === 'พาสุข2').id,
                positionId: position.find((item) => item.name === 'พยาบาลวิชาชีพ').id,
                titleId: title.find((item) => item.name === 'น.ส.').id,
            },
            {
                firstname: 'พิมพิไล',
                lastname: 'พูนสูงเนิน',
                locationId: location.find((item) => item.name === 'พาสุข2').id,
                positionId: position.find((item) => item.name === 'พยาบาลวิชาชีพ').id,
                titleId: title.find((item) => item.name === 'น.ส.').id,
            },
            {
                firstname: 'วรดา',
                lastname: 'ทองโสภา',
                locationId: location.find((item) => item.name === 'พาสุข2').id,
                positionId: position.find((item) => item.name === 'พยาบาลวิชาชีพ').id,
                titleId: title.find((item) => item.name === 'น.ส.').id,
            },
            {
                firstname: 'สุธิดา',
                lastname: 'ฤทธิ์ชัย',
                locationId: location.find((item) => item.name === 'พาสุข2').id,
                positionId: position.find((item) => item.name === 'พยาบาลวิชาชีพ').id,
                titleId: title.find((item) => item.name === 'น.ส.').id,
            },
            {
                firstname: 'เพ็ญพิชชา',
                lastname: 'แดงสูงเนิน',
                locationId: location.find((item) => item.name === 'พาสุข2').id,
                positionId: position.find((item) => item.name === 'พยาบาลวิชาชีพ').id,
                titleId: title.find((item) => item.name === 'น.ส.').id,
            },
        ]
    })

    console.log('seeded data')


}
main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })