import { LoaderFunction, json, redirect } from "@remix-run/node";
import { Link, useLoaderData, useParams } from "@remix-run/react";
import CharacterAvatar from "~/components/character-avatar";
import GameMessage from "~/components/game-message";
import GameToolbar from "~/components/game-toolbar";
import Layout from "~/components/layout";
import { GameCharacterStatusEmojis } from "~/utils/constants";
import { getGameById, requireHost } from "~/utils/games.server";
import { getMyCharacterGameProfile } from "~/utils/roles.server";
import { CharacterWithMods, EventWithMods, GameWithMods, PhaseWithMods } from "~/utils/types";
import { getUser } from "~/utils/users.server";

export const loader: LoaderFunction = async ({ request, params }) => {
    const { user } = await getUser(request)

    const { authorized } = await requireHost(request, params.gameId || '')

    const { game } = await getGameById(params.gameId || '')
    if (!game) return redirect('/games')

    const moddedGame: GameWithMods = game as GameWithMods

    const phase = moddedGame.phases?.filter(phase => phase.id === params.phaseId && phase.draft === false)[0]
    if (!phase) return redirect(`/games/${params.gameId}`)

    const { character, myRole } = user?.id ? await getMyCharacterGameProfile(user.id, game.id) : { character: undefined, myRole: undefined }

    return json({ user, game, authorized, phase, registeredCharacter: character })
}

export default function Report() {
    const { user, game, authorized, phase, registeredCharacter } = useLoaderData()
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
                <div className={`w-full flex flex-col ${phase.time === 'DAY' ?
                    'bg-dogwood text-licorice-800' :
                    'bg-licorice-900 text-dogwood'} rounded-lg p-5`
                }>

                    <div className="py-5">
                        <div><h3 className="text-2xl font-bold">{`${phase.time} ${phase.dayNumber} Report 🔎`}</h3></div>
                        {phase?.events?.filter((event: EventWithMods) => event.draft === false)?.map((event: EventWithMods) => <div className="text-lg" key={event.id}>
                            <div className="ml-2">
                                <div className="text-lg font-semibold">
                                    <GameMessage
                                        actor={event.actor ? { name: event?.actor?.name || '', id: event.actorId || '' } : undefined}
                                        target={event.target ? { name: event?.target?.name || '', id: event.targetId || '' } : undefined}
                                    >
                                        {event.message}
                                    </GameMessage>
                                </div>
                                <div className="ml-2">
                                    {event?.clues.map((clue: string) => <div className="italic" key={clue}>
                                        {clue}
                                    </div>
                                    )}
                                </div>
                            </div>
                        </div>)}
                    </div>

                    <div className="text-xl font-semibold my-1">
                        Status:
                    </div>

                    {game?.participatingCharacters?.length !== 0 ? game?.participatingCharacters?.map((char: CharacterWithMods) => <Link to={`/gm-realm/characters/${char.id}`} className="flex flex-row items-center py-2" key={char.id}>

                        <CharacterAvatar
                            avatarUrl={char.avatarUrl || undefined}
                            size='SMALL'
                        />

                        <div className="mx-4 font-semibold text-lg">
                            {char.name}
                        </div>

                        <div>
                            {GameCharacterStatusEmojis?.[phase?.characterStatus?.status?.filter((status: any) => status.characterId === char.id)[0].status || 'ALIVE']}
                        </div>

                    </Link>) : <div>
                        No Characters Yet!
                    </div>}
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