import { LoaderFunction, json } from "@remix-run/node";
import { prisma } from "~/utils/prisma.server";
import { getUser } from '~/utils/users.server'
import { requireHost } from "~/utils/games.server";

export const loader: LoaderFunction = async ({ request, params }) => {
    const searchParams = new URL(request.url).searchParams
    const lastUpdate = searchParams.get("lastUpdate") as string || undefined
    const take = Number(searchParams.get("take")) || 50

    try {

        if (["MEETING_ROOM", "ROLEPLAY", "PRE_GAME", "POST_GAME"].includes((await prisma.gameChatRoom.findUnique({ where: { id: params.roomId || "" } }))?.type as string)) {
            return json({
                messages: await prisma.gameChatMessage.findMany({
                    where: {
                        roomId: params.roomId,
                        ...(lastUpdate ? {
                            createdAt: {
                                gt: new Date(lastUpdate).toISOString()
                            }
                        } : {})
                    },
                    take
                })
            })
        } else {
            const { authorized } = await requireHost(request, params.gameId || '')
            if (!authorized) {
                try {
                    const game = await prisma.game.findUnique({
                        where: {
                            id: params.gameId
                        },
                        select: {
                            id: true,
                            participatingCharacterIds: true
                        }
                    })
                    const { user } = await getUser(request)

                    const characters = await prisma.character.findMany({
                        where: {
                            ownerId: user?.id
                        },
                        select: {
                            id: true
                        }
                    })

                    if (!game || !user || !characters || characters.length === 0) return null

                    let participating = false

                    characters.map(char => {
                        if (game.participatingCharacterIds.includes(char.id)) participating = true
                    })

                    if (!participating) return null

                    return json({
                        messages: await prisma.gameChatMessage.findMany({
                            where: {
                                roomId: params.roomId,
                                ...(lastUpdate ? {
                                    createdAt: {
                                        gt: new Date(lastUpdate).toISOString()
                                    }
                                } : {})
                            },
                            take
                        })
                    })

                } catch (e) {
                    return null
                }
            }
            return json({
                messages: await prisma.gameChatMessage.findMany({
                    where: {
                        roomId: params.roomId,
                        ...(lastUpdate ? {
                            createdAt: {
                                gt: new Date(lastUpdate).toISOString()
                            }
                        } : {})
                    }
                }),
                take
            })
        }

    } catch (e) {
        return null
    }

}