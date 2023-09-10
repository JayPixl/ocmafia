import { ChatRoomType, EventTypes } from "@prisma/client"
import { GameWithMods } from "./types"
import { prisma } from "./prisma.server"

export const manageGameChatChannels: (
    gameId: string,
    method: 'add' | 'delete' | 'edit',
    name: string,
    roomId?: string,
    type?: ChatRoomType,
    allowedPlayerIds?: string[]

) => Promise<{
    newGame?: GameWithMods,
    error?: string
}> = async (gameId, method, name, roomId, type, allowedPlayerIds) => {
    const game = await prisma.game.findUnique({ where: { id: gameId } })

    if (!game) return {
        error: "Could not find game"
    }

    switch (method) {
        case 'add': {
            // console.log("ADDING")
            const newRoom = await prisma.game.update({
                where: {
                    id: gameId
                },
                data: {
                    chatRooms: {
                        create: {
                            name,
                            type: "ROLEPLAY"
                        }
                    }
                }
            })
            if (!newRoom) return {
                error: 'Could not add chatroom'
            }
            break
        }
        case 'edit': {
            // console.log("EDITING")
            if (!type || !allowedPlayerIds) return {
                error: "Type or allowed players is not defined!"
            }

            const newRoom = await prisma.gameChatRoom.update({
                where: {
                    id: roomId
                },
                data: {
                    name,
                    type,
                    allowedPlayerIds: type === 'PRIVATE' ? allowedPlayerIds : []
                }
            })
            if (!newRoom) return {
                error: 'Could not edit chatroom'
            }

            break
        }
        case 'delete': {
            // console.log("DELETING")
            const newRoom = await prisma.gameChatRoom.delete({
                where: {
                    id: roomId
                }
            })
            if (!newRoom) return {
                error: 'Could not delete chatroom'
            }
            break
        }
    }

    const newGame = await prisma.game.findUnique({
        where: {
            id: gameId
        }
    })
    if (!newGame) return {
        error: "Could not find new game"
    }

    return {
        newGame
    }
}