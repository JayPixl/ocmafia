import { ActionFunction, json } from "@remix-run/node";
import { prisma } from "~/utils/prisma.server";
import { getUser } from '~/utils/users.server'
import { requireHost } from "~/utils/games.server";
import { CharacterWithMods } from "~/utils/types";


export const loader: ActionFunction = async ({ request, params }) => {
    const searchParams = new URL(request.url).searchParams
    const type = searchParams.get("type") as string
    const senderUserId = searchParams.get("senderUserId") as string
    const senderCharacterId = searchParams.get("senderCharacterId") as string
    const content = searchParams.get("content") as string


    async function sendMessage(sendType: "PARTICIPANT" | "HOST" | "SPECTATOR", name: string, avatarUrl?: string) {
        console.log(type, senderCharacterId, senderUserId, content, sendType)

        if (type !== sendType) return null

        try {
            await prisma.gameChatMessage.create({
                data: {
                    room: {
                        connect: {
                            id: params.roomId
                        }
                    },
                    content,
                    senderId: sendType === "HOST" ? senderUserId : senderCharacterId,
                    senderType: sendType === "HOST" ? "HOST_USER" : "PARTICIPANT_CHARACTER",
                    senderAvatarUrl: avatarUrl,
                    senderName: name,
                    senderProfileLink: sendType === "HOST" ? `/profile/${name.toLowerCase()}` : `/gm-realm/characters/${senderCharacterId}`,
                }
            })
        } catch (e) {
            console.log("ERROR")
            return null
        }

        return {
            success: true
        }
    }

    try {
        const { authorized } = await requireHost(request, params.gameId || '')
        if (!authorized) {
            try {
                const game = await prisma.game.findUnique({
                    where: {
                        id: params.gameId
                    },
                    select: {
                        id: true,
                        participatingCharacterIds: true,
                        status: true
                    }
                })
                const { user } = await getUser(request)

                if (
                    ["ENLISTING", "ONGOING"].includes(game?.status || "") &&
                    ["PRE_GAME", "POST_GAME"].includes((await prisma.gameChatRoom.findUnique({ where: { id: params.roomId } }))?.type || "") &&
                    user
                ) {
                    return sendMessage("SPECTATOR", user.username, user.avatar.avatarUrl || undefined)
                }

                const characters = await prisma.character.findMany({
                    where: {
                        ownerId: user?.id
                    },
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true
                    }
                })

                if (!game || !user || !characters || characters.length === 0) return null

                const myCharacter = characters.filter(char => game.participatingCharacterIds.includes(char.id))[0]

                if (!myCharacter) return null

                return sendMessage("PARTICIPANT", myCharacter.name, myCharacter?.avatarUrl || undefined)

            } catch (e) {
                return null
            }
        }
        const host = await prisma.user.findUnique({
            where: {
                id: senderUserId
            },
            select: {
                id: true,
                username: true,
                avatar: {
                    select: {
                        avatarUrl: true
                    }
                }
            }
        })

        return sendMessage("HOST", host?.username || "Anonymous", host?.avatar.avatarUrl || undefined)

    } catch (e) {
        return null
    }

}

// export const action: ActionFunction = async ({ request, params }) => {
//     const form = await request.formData()
//     const message = form.get('message') as string
//     const senderId = form.get('senderCharacterId') as string || form.get('senderUserId') as string

//     await prisma.gameChatMessage.create({
//         data: {
//             content: message,
//             senderId,
//             room: {
//                 connect: {
//                     id: params?.roomId || ''
//                 }
//             }
//         }
//     })
//     return null
// }