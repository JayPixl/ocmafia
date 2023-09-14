import { GameCharacterStatus, PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
    let updates: any[] = [];
    (await prisma.game.findMany()).map(async game => {

        const update = await prisma.game.update({
            where: {
                id: game.id,

            },
            data: {
                hosts: {
                    set: []
                }
            }
        })


        updates.push(update)
    })
    console.log(updates)
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