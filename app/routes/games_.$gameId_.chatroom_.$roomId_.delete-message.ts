import { ActionFunction, json } from "@remix-run/node";
import { prisma } from "~/utils/prisma.server";
import { getUser } from '~/utils/users.server'
import { requireHost } from "~/utils/games.server";
import { CharacterWithMods } from "~/utils/types";


export const loader: ActionFunction = async ({ request, params }) => {
    const searchParams = new URL(request.url).searchParams
    const messageId = searchParams.get("messageId") as string

    try {
        const { authorized } = await requireHost(request, params.gameId || '')
        if (authorized) {
            await prisma.gameChatMessage.delete({
                where: {
                    id: messageId
                }
            })
            return {
                success: true
            }
        } else {
            return null
        }

    } catch (e) {
        return null
    }

}