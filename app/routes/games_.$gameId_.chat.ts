import { CharGameRolePairing, Role } from "@prisma/client";
import { LoaderFunction, json, redirect } from "@remix-run/node";

import { getGameById, requireHost } from "~/utils/games.server";
import { prisma } from "~/utils/prisma.server";
import { getUser } from "~/utils/users.server";

export const loader: LoaderFunction = async ({ request, params }) => {
    const game = await prisma.game.findUnique({
        where: {
            id: params.gameId
        }
    })
    if (!game) return redirect(`/games`)

    const meetingRoom = await prisma.gameChatRoom.findFirst({
        where: {
            gameId: params.gameId,
            type: game.status === "ENLISTING" ? "PRE_GAME" : game.status === "COMPLETED" ? "POST_GAME" : "MEETING_ROOM"
        },
        select: {
            id: true
        }
    })

    if (!meetingRoom) return redirect(`/games/${params.gameId}`)

    return redirect(`/games/${params.gameId}/chatroom/${meetingRoom.id}`)
}