import { LoaderFunction, redirect } from "@remix-run/node";
import { getGameById, requireHost } from "~/utils/games.server";
import { prisma } from "~/utils/prisma.server";
import { GameWithMods } from "~/utils/types";

export const loader: LoaderFunction = async ({ request, params }) => {
    const { game } = await getGameById(params.gameId || '')
    if (!game) return redirect('/games')

    const { authorized } = await requireHost(request, game.id)
    if (!authorized) return redirect(`/games/${params.gameId}`)

    await prisma.game.update({
        where: {
            id: game.id
        },
        data: {
            status: 'ENLISTING',
            currentPhaseId: null
        }
    });

    (await prisma.phase.findMany({
        where: {
            gameId: game.id
        }
    })).map(async phase => {
        if (phase.dayNumber > 1 || phase.time !== 'DAY') {
            await prisma.phase.delete({
                where: {
                    id: phase.id
                }
            })
        }
    })

    const moddedGame: GameWithMods = game as GameWithMods

    prisma.phase.findFirst({
        where: {
            gameId: game.id
        }
    })
        .then(async phase => {
            phase && (
                await prisma.event.deleteMany({
                    where: {
                        phaseId: phase.id
                    }
                })

                &&

                await prisma.phaseActions.deleteMany({
                    where: {
                        phaseId: phase.id
                    }
                })

                &&

                await prisma.phase.update({
                    where: {
                        id: phase.id
                    },
                    data: {
                        events: {
                            create: {
                                draft: true,
                                message: moddedGame?.gameMessages?.messages.filter(message => message.event === 'GAME_START')[0].message || 'Welcome, players! The Game begins now...',
                                type: 'GAME_START'
                            }
                        },
                        actions: {
                            create: {

                            }
                        }
                    }
                })
            )
        });

    (await prisma.gameRoles.update({
        where: {
            gameId: game.id
        },
        data: {
            assignedRoles: {
                set: []
            }
        }
    }))

    return redirect(`/games/${params.gameId}/edit`)
}