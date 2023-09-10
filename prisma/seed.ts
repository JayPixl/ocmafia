import { GameCharacterStatus, PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
    let updates: any[] = [];
    (await prisma.phase.findMany()).map(async phase => {

        const actions = await prisma.phaseActions.findUnique({
            where: {
                phaseId: phase.id
            }
        })

        const update = await prisma.phase.update({
            where: {
                id: phase.id,

            },
            data: {
                actions: {
                    upsert: {
                        create: {
                            actions: {
                                set: []
                            }
                        },
                        update: {
                            actions: {
                                set: actions ? actions.actions : []
                            }
                        }
                    }
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