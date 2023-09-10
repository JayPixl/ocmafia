import { Alignment, CharGameRolePairing, Game, Role, User } from "@prisma/client";
import { LoaderFunction, json, redirect } from "@remix-run/node";
import { Link, useLoaderData, useParams } from "@remix-run/react";
import { v4 } from "uuid";
import CharacterAvatar from "~/components/character-avatar";
import GameToolbar from "~/components/game-toolbar";
import Layout from "~/components/layout";
import { GameCharacterStatusEmojis, RoleAlignmentEmojis } from "~/utils/constants";
import { formatCase } from "~/utils/formatters";
import { getGameById, requireHost } from "~/utils/games.server";
import { prisma } from "~/utils/prisma.server";
import { getMyCharacterGameProfile } from "~/utils/roles.server";
import { CharacterWithMods, CharacterWithRole, EventWithMods, GameWithMods, PhaseWithMods, UserWithMods } from "~/utils/types";
import { getUser } from "~/utils/users.server";

export const loader: LoaderFunction = async ({ request, params }) => {
    const { user } = await getUser(request)
    const { authorized } = await requireHost(request, params.gameId || '')
    const { game } = await getGameById(params.gameId || '')
    if (!game) return redirect('/games')

    const currentPhase = (game.currentPhaseId ? await prisma.phase.findFirst({
        where: {
            id: game.currentPhaseId
        },
        include: {
            characterStatus: true,
            events: true
        }
    }) : undefined)

    let roles = {
        TOWN: 0,
        MAFIA: 0,
        NEUTRAL: 0,
        HOSTILE: 0
    };

    (((await prisma.gameRoles.findUnique({
        where: {
            gameId: game.id
        },
        select: {
            assignedRoles: {
                select: {
                    roleAlignment: true
                }
            }
        }
    }))?.assignedRoles)?.map(roleAlignment => {
        return roleAlignment.roleAlignment
    }))?.map(alignment => {
        roles = {
            ...roles,
            [alignment]: roles?.[alignment] + 1
        }
    })

    const { character, myRole } = user?.id ? await getMyCharacterGameProfile(user.id, game.id) : { character: undefined, myRole: undefined }

    const completedRoles = (game.status === 'COMPLETED' ? (await prisma.gameRoles.findUnique({ where: { gameId: game.id } }))?.assignedRoles : undefined)

    return json({
        user,
        game,
        authorized,
        currentPhase,
        roles,
        registeredCharacter: character,
        myRole,
        completedRoles
    })
}

export default function Games() {
    const loaderData = useLoaderData()
    const {
        user,
        game,
        authorized,
        currentPhase,
        roles,
        registeredCharacter,
        myRole,
        completedRoles
    }: {
        user?: UserWithMods,
        game?: GameWithMods,
        authorized?: boolean,
        currentPhase?: PhaseWithMods,
        roles?: {
            TOWN: number,
            MAFIA: number,
            NEUTRAL: number,
            HOSTILE: number
        },
        registeredCharacter?: CharacterWithRole,
        myRole?: Role,
        completedRoles?: CharGameRolePairing[]
    } = loaderData

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
                currentPage="home"
                host={authorized}
                gameId={game?.id}
                dashboard={!!registeredCharacter}
                joinable={game?.status === 'ENLISTING' && !registeredCharacter}
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
                    {/* {registeredCharacter ? <Link
                        to={`/games/${game?.id}/dashboard`}
                        className="cursor-pointer text-xl border-[1px] border-bittersweet bg-bittersweet text-licorice-800 rounded-lg py-1 px-2 mb-5 hover:bg-transparent hover:text-bittersweet transition"
                    >
                        Go to Dashboard →
                    </Link> : <Link
                        to={`/games/${game?.id}/join`}
                        className="cursor-pointer text-xl border-[1px] border-bittersweet bg-bittersweet text-licorice-800 rounded-lg py-1 px-2 mb-5 hover:bg-transparent hover:text-bittersweet transition"
                    >
                        Join Game
                    </Link>} */}
                </div>
                <div className={
                    `w-full flex flex-col sm:flex-row 
                    ${(!currentPhase || currentPhase.time === 'NIGHT') ?
                        'bg-dogwood text-licorice-800' :
                        'bg-licorice-900 text-dogwood'
                    }
                    rounded-lg p-5 relative`
                }>

                    <div className="text-3xl absolute top-5 right-5">
                        {(game?.status === 'ENLISTING' || currentPhase?.time === 'NIGHT') ?
                            '🌤️' :
                            '🌙'}
                    </div>

                    <div className="w-full flex-grow-[2]">

                        {game?.status === 'ONGOING' && currentPhase ? <div className="text-3xl font-bold my-3">{currentPhase?.time === "DAY" ? "Night" : "Day"} {currentPhase?.time === "DAY" ? currentPhase.dayNumber : currentPhase?.dayNumber + 1} ~</div> : ''}

                        <div className="text-xl font-bold mb-3">{game?.status === 'ENLISTING' ? 'Recruits:' : game?.status === 'ONGOING' ? 'Current Status:' : 'Results:'}</div>
                        {game?.participatingCharacters?.length !== 0 ? game?.participatingCharacters?.map((char: CharacterWithMods) => <Link to={char.id === registeredCharacter?.id ? `/gm-realm/${params.gameId}/dashboard` : `/gm-realm/characters/${char.id}`} className={`flex flex-row items-center py-3 ${char.id === registeredCharacter?.id ? "hover:shadow-xl hover:opacity-80" : ''}`} key={char.id}>

                            <CharacterAvatar
                                avatarUrl={char.avatarUrl || undefined}
                                size={char.id === registeredCharacter?.id ? 'MEDIUM' : 'SMALL'}
                            />

                            {game.status === 'COMPLETED' ? <div className={`mx-4 flex flex-col text-lg font-semibold overflow-x-clip max-w-[50%]`}>
                                <div>{char.name} {char.id === registeredCharacter?.id ? " - (YOU)" : ''}</div>
                                <div>
                                    {RoleAlignmentEmojis[completedRoles?.filter(role => role.characterId === char.id)[0].roleAlignment || 'TOWN']} {completedRoles?.filter(role => role.characterId === char.id)[0].roleName || 'UNKNOWN'} {RoleAlignmentEmojis[completedRoles?.filter(role => role.characterId === char.id)[0].roleAlignment || 'TOWN']}
                                </div>
                            </div> : <div className={`mx-4 flex flex-col text-lg font-semibold overflow-x-clip max-w-[50%]`}>
                                <div>{char.name} {char.id === registeredCharacter?.id ? " - (YOU)" : ''}</div>
                                {(char.id === registeredCharacter?.id && myRole?.name && myRole?.alignment) ? <div>
                                    {RoleAlignmentEmojis[myRole.alignment]} {myRole.name} {RoleAlignmentEmojis[myRole.alignment]}
                                </div> : ''}
                            </div>}

                            <div className={char.id === registeredCharacter?.id ? 'text-2xl' : ''}>
                                {currentPhase ? GameCharacterStatusEmojis?.[currentPhase?.characterStatus?.status?.filter(status => status.characterId === char.id)[0].status || 'ALIVE'] : GameCharacterStatusEmojis?.['ALIVE']}
                            </div>

                        </Link>) : <div>
                            No Characters Yet!
                        </div>}
                    </div>

                    {((game?.activeRoleIds.length === game?.playerCount) && roles && game?.status !== 'COMPLETED') ? <div className="sm:w-2/3 border-t-2 border-t-licorice-600 sm:border-t-0 pt-5 sm:pt-0 sm:border-l-2 sm:border-l-licorice-600 sm:pl-5 flex-grow-[1]">
                        <div className="text-xl font-bold mb-3">Active Roles:</div>
                        {Object.values(roles).map((number, index) => {
                            if (number !== 0) return <div className="flex flex-row items-center py-3" key={v4()}>

                                <div>
                                    {RoleAlignmentEmojis[Object.keys(roles)[index]]}
                                </div>

                                <div className="mx-4 font-bold text-lg">
                                    {formatCase(Object.keys(roles)[index])} - {number}
                                </div>

                                <div>
                                    {RoleAlignmentEmojis[Object.keys(roles)[index]]}
                                </div>

                            </div>
                        }
                        )}
                    </div> : ''}

                </div>

                {game?.status !== 'ENLISTING' ? <div className="flex flex-col my-5">
                    {currentPhase ? <Link to={`/games/${params.gameId}/reports/${currentPhase.id}`}>
                        <div><h3 className="text-xl font-semibold">{`${currentPhase.time} ${currentPhase.dayNumber} Report 🔎`}</h3></div>
                        {currentPhase.events?.map((event: EventWithMods) => <div className="text-lg ml-2" key={event.id}>
                            <div>{event.message}</div>
                            <div>{event?.clues.map(clue => <div className="text-sm ml-2" key={v4()}>
                                {clue}
                            </div>)}
                            </div>
                        </div>)}
                    </Link> : <>
                        <div><h3 className="text-xl font-semibold">{`No Reports Yet!`}</h3></div>
                    </> || <>
                        <div>No Reports Yet!</div>
                    </>}

                    <div className="text-lg underline hover:no-underline py-2">
                        <Link to={`/games/${params.gameId}/reports/`}>
                            All Reports →
                        </Link>
                    </div>
                </div>
                    : ''}
            </div>
        </Layout>
    )
}