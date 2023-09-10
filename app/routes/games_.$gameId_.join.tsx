import { ActionFunction, LoaderFunction, json, redirect } from "@remix-run/node";
import { useLoaderData, useParams } from "@remix-run/react";
import CharacterAvatar from "~/components/character-avatar";
import GameToolbar from "~/components/game-toolbar";
import Layout from "~/components/layout";
import { getGameById, toggleGameJoinRequest } from "~/utils/games.server";
import { prisma } from "~/utils/prisma.server";
import { CharacterWithMods, GameWithMods, UserWithMods } from "~/utils/types";
import { getUser } from "~/utils/users.server";

export const loader: LoaderFunction = async ({ request, params }) => {
    const { user } = await getUser(request)
    if (!user) return redirect(`/games/${params.gameId}`)

    const { game } = await getGameById(params.gameId || '')
    if (!game || game.status !== 'ENLISTING') return redirect(`/games/${params.gameId}`)

    let eligibleCharacters: CharacterWithMods[] = (await prisma.character.findMany({
        where: {
            ownerId: user.id,
            currentGameId: null,
        }
    }))

    if (eligibleCharacters.length === 0) return redirect(`/games/${params.gameId}`)

    return json({ user, game, eligibleCharacters })
}

export const action: ActionFunction = async ({ request, params }) => {
    const form = await request.formData()
    const charId = form.get('_action') as string

    const { error } = await toggleGameJoinRequest(charId, params.gameId || '')
    if (error) return json({
        error
    })

    return null
}

export default function JoinGame() {
    const loaderData = useLoaderData()
    const { user, game, eligibleCharacters }: { user?: UserWithMods, game?: GameWithMods, eligibleCharacters?: CharacterWithMods[] } = loaderData
    const params = useParams()

    return (
        <Layout
            user={user}
            navigation={true}
            navArray={[
                { name: 'Games', url: `/games`, id: 'games' },
                { name: game?.name || '', url: `/games/${params?.gameId}`, id: params?.gameId || '', parent: 'games' }
            ]}
        >
            <GameToolbar
                currentPage="join"
                gameId={game?.id}
                joinable
            />
            <div className="p-8 md:p-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">

                    <div>
                        <div className="flex flex-col lg:flex-row items-baseline">
                            <h2 className="text-3xl font-bold">{game?.name}</h2>
                            <div className="mx-3 hidden lg:block">-</div>
                            <div className="text-xl">({game?.status})</div>
                        </div>

                        <div className="italic text-lg mb-3">{game?.location}</div>
                    </div>

                </div>
                <div className={
                    `w-full flex flex-col bg-dogwood text-licorice-800 rounded-lg p-5 relative justify-center items-center`
                }>

                    <div className="text-3xl font-semibold my-3 text-center">
                        Enlist a Character
                    </div>

                    <form method="POST">

                        {eligibleCharacters?.map((character) => game?.joinRequestIds.includes(character.id) ? <button type="submit" name="_action" value={character.id} key={character.id} className="flex flex-row items-center my-3 text-lg font-semibold group hover:shadow-lg p-3 rounded-xl">
                            <CharacterAvatar
                                avatarUrl={character.avatarUrl || ''}
                                size="MEDIUM"
                            />
                            <div className="font-bold mx-4">{character.name}</div>
                            <div className="underline group-hover:no-underline">
                                Un-Enlist
                            </div>
                        </button> : <button type="submit" name="_action" value={character.id} key={character.id} className="flex flex-row items-center my-3 text-lg font-semibold group hover:shadow-lg p-3 rounded-xl">
                            <CharacterAvatar
                                avatarUrl={character.avatarUrl || ''}
                                size="MEDIUM"
                            />
                            <div className="font-bold mx-4">{character.name}</div>
                            <div className="underline group-hover:no-underline">
                                Enlist {game?.pendingInviteIds.includes(character.id) ? " - Invitation received!" : ''}
                            </div>
                        </button>)}


                    </form>
                </div>
            </div>
        </Layout>
    )
}