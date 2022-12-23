const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    await prisma.$connect();

    const locations = await prisma.location.createMany({
        data: [
            {
                id: new ObjectId(),
                name: 'พาสุข',
            },
            {
                id: new ObjectId(),
                name: 'พาสุข1',
            },
            {
                id: new ObjectId(),
                name: 'พาสุข2',
            },
        ]
    })
    const positions = await prisma.position.createMany({
        data: [
            {
                name: 'พยาบาลวิชาชีพ',
            }
        ]
    })
    const titles = await prisma.title.createMany({
        data: [
            {
                name: 'นาง',
            },
            {
                name: 'น.ส.',
            },
        ]
    })
    const shifs = await prisma.shif.createMany({
        data: [
            {
                name: 'ช',
                isShift: true,
                isDayOff: false,
            },
            {
                name: 'บ',
                isShift: true,
                isDayOff: false,
            },
            {
                name: 'ด',
                isShift: true,
                isDayOff: false,
            },
            {
                name: 'x',
                isShift: false,
                isDayOff: true,
            },
            {
                name: 'ลาพัก',
                isShift: false,
                isDayOff: true,
            },

        ]
    })
    const users = await prisma.user.createMany({
        data: [
            {
                firstname: 'มะลิ',
                lastname: 'มอบกระโทก',
                locationId: null,
                positionId: null,
                titleId: null
            },
        ]
    })

    console.log({ locations, positions, shifs, titles, users })
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