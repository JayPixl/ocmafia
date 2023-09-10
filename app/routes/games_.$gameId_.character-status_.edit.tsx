import { Alignment, CharGameStatusPairing, GameCharacterStatus, PhaseActions, User } from "@prisma/client";
import { ActionFunction, LoaderArgs, json, redirect } from "@remix-run/node";
import { Link, useActionData, useLoaderData, useParams } from "@remix-run/react";
import { useState, useEffect } from 'react'
import { v4 } from "uuid";
import CharacterAvatar from "~/components/character-avatar";
import GameEditToolbar from "~/components/game-edit-toolbar";
import Layout from "~/components/layout";
import { GameCharacterStatusEmojis } from "~/utils/constants";
import { getGameById, manageCharacterStatus, requireHost, updateCurrentPhase } from "~/utils/games.server";
import { prisma } from "~/utils/prisma.server";
import { CharacterWithMods, GameWithMods, PhaseWithMods } from "~/utils/types";
import { getUser } from "~/utils/users.server";

export async function loader({ request, params }: LoaderArgs) {

    const { user } = await getUser(request)

    const { authorized } = await requireHost(request, params.gameId || '')
    if (!authorized) return redirect(`/games/${params.gameId}/reports`)

    const { game, currentPhase }: { game?: GameWithMods, currentPhase?: PhaseWithMods } = await getGameById(params.gameId || '')
    if (!game) return redirect('/games')

    let characters: {
        id: string,
        avatarUrl?: string,
        name: string
    }[] = []

    game?.participatingCharacters?.map(char => {
        characters.push({
            id: char.id,
            avatarUrl: char.avatarUrl || undefined,
            name: char.name
        })
    })

    const gameRoles = await prisma.gameRoles.findUnique({
        where: {
            gameId: game.id
        }
    })

    const gameActions = await prisma.phaseActions.findMany({
        where: {
            phaseId: {
                in: game?.phases?.map(phase => phase.id)
            }
        }
    })

    return json({ user, game, authorized, currentPhase, characters, gameRoles, gameActions })
}

export const action: ActionFunction = async ({ request }) => {
    const form = await request.formData()
    const phaseId = form.get('phaseId') as string || undefined
    const characterId = form.get('characterId') as string || undefined
    const status = form.get('status') as GameCharacterStatus

    if (!phaseId || !characterId || !status) return json({
        error: "Error processing request..."
    })

    const { error } = await manageCharacterStatus(phaseId, characterId, status)
    if (error) return json({
        error, fields: { phaseId }
    })

    return json({
        fields: { phaseId }
    })
}

export default function EditStatus() {
    const params = useParams()

    const { game, user, currentPhase, characters, gameRoles, gameActions } = useLoaderData()
    const actionData = useActionData()

    const [inputs, setInputs] = useState({
        phaseId: actionData?.fields?.phaseId || currentPhase?.id || game?.phases[0]?.id
    })

    let statusInputs: object = {}

    currentPhase?.characterStatus?.status?.map((char: CharGameStatusPairing) => {
        statusInputs = { ...statusInputs, [char.characterId]: char.status }
    })

    const [charStatusInputs, setCharStatusInputs] = useState<any>({ ...statusInputs })

    const [selectedPhase, setSelectedPhase] = useState<PhaseWithMods | undefined>(game?.phases?.filter((phase: PhaseWithMods) => phase.id === inputs.phaseId)[0])

    useEffect(() => {
        setSelectedPhase(game?.phases?.filter((phase: PhaseWithMods) => phase.id === inputs.phaseId)[0])
    }, [inputs.phaseId])

    useEffect(() => {
        statusInputs = []
        selectedPhase?.characterStatus?.status?.map((char: CharGameStatusPairing) => {
            statusInputs = { ...statusInputs, [char.characterId]: char.status }
        })
        setCharStatusInputs({ ...statusInputs })
    }, [selectedPhase])

    return <Layout
        user={user}
        navigation={true}
        navArray={[
            { name: 'Games', url: `/games`, id: 'games' },
            { name: game?.name || '', url: `/games/${params?.gameId}`, id: params?.gameId || '', parent: 'games' },
            { name: "Edit", url: `/games/${params?.gameId}/edit`, id: 'edit' || '', parent: params?.gameId }
        ]}
    >
        <GameEditToolbar
            currentPage="status"
            gameId={game?.id}
        />
        <div className="p-5">
            <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center py-5">
                <select
                    onChange={e => setInputs({
                        ...inputs,
                        phaseId: e.target.value
                    })}
                    value={inputs.phaseId}
                    className="bg-opacity-[1%] bg-licorice-600 font-bold text-4xl rounded-lg py-1 hover:opacity-80"
                >
                    {game?.phases?.map((phase: PhaseWithMods) => <option key={`${phase.id}`} value={`${phase.id}`}>
                        {`${phase.time} ${phase.dayNumber}`}
                    </option>)}
                </select>
            </div>

            <div className="w-full flex flex-col bg-dogwood text-licorice-800 rounded-lg p-5">

                {selectedPhase?.characterStatus?.status?.length !== 0 ? selectedPhase?.characterStatus?.status?.map((status, index) => <form method="POST" className={`${index !== 0 ? 'border-t-2 border-licorice-800' : ''} flex flex-row items-center py-3 w-full justify-between`} key={status.characterId}>

                    <input
                        type="hidden"
                        name="phaseId"
                        value={selectedPhase.id}
                    />

                    <input
                        type="hidden"
                        name="characterId"
                        value={status.characterId}
                    />

                    <Link to={`/gm-realm/characters/${status.characterId}`} className="flex flex-row items-center">

                        <CharacterAvatar
                            avatarUrl={characters.filter((char: any) => char.id === status.characterId)[0].avatarUrl || undefined}
                            size='SMALL'
                        />

                        <div className="mx-4 font-bold text-xl flex flex-col">
                            <div>{status.characterName} ({gameRoles.assignedRoles.filter((role: any) => role.characterId === status.characterId)[0]?.roleName || "Role not set!"})</div>
                            {gameActions?.filter((actions: PhaseActions) => actions.phaseId === inputs.phaseId)[0]?.actions?.filter((action: any) => action.characterId === status.characterId)?.map((phaseAction: any) => <div key={v4()} className="flex flex-col">
                                <div>Action Type: <span className="font-normal">{phaseAction.actionType}</span></div>
                                <div>Target: <span className="font-normal">{characters.filter((char: CharacterWithMods) => char.id === phaseAction?.actionTargetId)[0]?.name || phaseAction.actionTargetId}</span></div>
                                <div>Strategy: <span className="font-normal">{phaseAction?.actionStrategy || "N/A"}</span></div>
                            </div>)}
                        </div>

                    </Link>

                    <select
                        name="status"
                        value={charStatusInputs?.[status.characterId]}
                        onChange={e => setCharStatusInputs({
                            ...charStatusInputs,
                            [status.characterId]: e.target.value
                        })}
                        className={
                            `bg-opacity-[1%] bg-licorice-600 font-bold text-xl rounded-lg py-1 hover:opacity-80`
                        }
                    >
                        {Object.values(GameCharacterStatus).map(status => <option value={status} key={status}>
                            {status} - {GameCharacterStatusEmojis[status]}
                        </option>)}
                    </select>

                    <button
                        type="submit"
                        className="text-xl underline hover:no-underline font-semibold hover:opacity-80"
                    >
                        Save
                    </button>

                </form>) : <div>

                    No Characters Yet!

                </div>}

            </div>

        </div>
    </Layout>
}