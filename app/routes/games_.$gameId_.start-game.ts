import { LoaderFunction, redirect } from "@remix-run/node";
import { getGameById, requireHost, startGame } from "~/utils/games.server";
import { getUser } from "~/utils/users.server";

export const loader: LoaderFunction = async ({ request, params }) => {
    const { user } = await getUser(request)
    const { game } = await getGameById(params.gameId || '')
    if (!game) return redirect('/games')

    const { authorized, admin } = await requireHost(request, game.id)
    if (!authorized) return redirect(`/games/${params.gameId}`)

    await startGame(game.id)

    return redirect(`/games/${params.gameId}/edit`)
}