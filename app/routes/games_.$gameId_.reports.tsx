import { Game, Phase, User } from "@prisma/client";
import { LoaderFunction, json, redirect } from "@remix-run/node";
import { Link, useLoaderData, useParams } from "@remix-run/react";
import GameMessage from "~/components/game-message";
import GameToolbar from "~/components/game-toolbar";
import Layout from "~/components/layout";
import { getGameById, requireHost } from "~/utils/games.server";
import { getMyCharacterGameProfile } from "~/utils/roles.server";
import { PhaseWithMods } from "~/utils/types";
import { getUser } from "~/utils/users.server";

export const loader: LoaderFunction = async ({ request, params }) => {
    const { user } = await getUser(request)
    const { authorized } = await requireHost(request, params.gameId || '')
    const { game } = await getGameById(params.gameId || '')
    if (!game) return redirect('/games')

    const { character, myRole } = user?.id ? await getMyCharacterGameProfile(user.id, game.id) : { character: undefined, myRole: undefined }

    return json({ user, game, authorized, registeredCharacter: character })
}

export default function Reports() {
    const { user, game, authorized, registeredCharacter } = useLoaderData()
    const params = useParams()
    return (
        <Layout
            user={user}
            navigation={true}
            navArray={[
                { name: 'Games', url: `/games`, id: 'games' },
                { name: game?.name, url: `/games/${params?.gameId}`, id: params?.gameId || '', parent: 'games' },
                { name: "Reports", url: `/games/${params?.gameId}/reports`, id: 'reports' || '', parent: params?.gameId }
            ]}
        >
            <GameToolbar
                currentPage="reports"
                host={authorized}
                gameId={game?.id}
                dashboard={!!registeredCharacter}
                joinable={game?.status === 'ENLISTING' && !registeredCharacter}
            />
            <div className="p-8 flex flex-col">
                <div><h2 className="text-3xl font-bold py-5">All Reports</h2></div>

                <div className="w-full flex flex-col bg-dogwood text-licorice-800 rounded-lg p-5">
                    {game?.phases?.map((phase: PhaseWithMods) => (phase?.events?.filter(events => events.draft === false)?.length !== 0) ? <Link to={`/games/${params.gameId}/reports/${phase.id}`} key={phase.id} className="group py-2">
                        <div><h3 className="text-xl font-semibold underline group-hover:no-underline">{`${phase.time} ${phase.dayNumber} Report 🔎`}</h3></div>
                        {phase?.events?.filter(event => event.draft === false)?.map(event => <div className="text-lg" key={event.id}>
                            <div className="ml-2">
                                <GameMessage
                                    actor={event.actor ? { name: event?.actor?.name || '', id: event.actorId || '' } : undefined}
                                    target={event.target ? { name: event?.target?.name || '', id: event.targetId || '' } : undefined}
                                >
                                    {event.message}
                                </GameMessage>
                                <div className="ml-2">
                                    {event?.clues.map(clue => <div className="text-sm italic" key={clue}>
                                        {clue}
                                    </div>
                                    )}
                                </div>
                            </div>
                        </div>)}
                    </Link> : ''
                    )}
                    {game?.phases?.filter((phase: PhaseWithMods) => phase.events?.filter(event => event.draft === false).length !== 0).length !== 0 ? '' : <div className='text-xl font-semibold'>No Reports Yet!</div>}

                </div>

                {authorized && (
                    <div className="mt-8 underline">
                        <Link to={`/games/${params.gameId}/reports/edit`}>
                            Edit Reports
                        </Link>
                    </div>
                )}
            </div>
        </Layout>
    )
}