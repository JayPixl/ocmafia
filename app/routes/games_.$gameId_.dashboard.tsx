import { ActionType } from "@prisma/client";
import { ActionFunction, LoaderFunction, json, redirect } from "@remix-run/node";
import { Link, useActionData, useLoaderData, useParams } from "@remix-run/react";
import { useState } from "react";
import { v4 } from "uuid";
import CharacterAvatar from "~/components/character-avatar";
import GameToolbar from "~/components/game-toolbar";
import Layout from "~/components/layout";
import { GameCharacterStatusEmojis, RoleAlignmentEmojis } from "~/utils/constants";
import { editActions, getGameById, requireHost } from "~/utils/games.server";
import { prisma } from "~/utils/prisma.server";
import { getActionOptions, getMyCharacterGameProfile } from "~/utils/roles.server";
import { CharacterWithRole, GameWithMods, PhaseWithMods, RoleWithNotes, UserWithMods } from "~/utils/types";
import { getUser } from "~/utils/users.server";

export const loader: LoaderFunction = async ({ request, params }) => {
    const { user } = await getUser(request)
    if (!user) return redirect(`/games/${params.gameId}`)
    const { game } = await getGameById(params.gameId || '')
    if (!game) return redirect('/games')

    const { authorized } = await requireHost(request, game.id)

    const currentPhase = (game.currentPhaseId ? await prisma.phase.findFirst({
        where: {
            id: game.currentPhaseId
        },
        include: {
            characterStatus: true,
            events: true
        }
    }) : undefined)

    const { character, myRole } = user?.id ? await getMyCharacterGameProfile(user.id, game.id) : { character: undefined, myRole: undefined }

    if (!character) return redirect(`/games/${params.gameId}`)

    const { actions, actionPhaseId } = await getActionOptions(game.id, character.id)

    return json({ user, game, currentPhase, character, myRole, actions, actionPhaseId, authorized })
}

export const action: ActionFunction = async ({ request, params }) => {
    const form = await request.formData()
    const method = form.get('method') as 'notes' | 'actions'


    switch (method) {

        case "actions": {
            const characterId = form.get('characterId') as string
            const phaseId = form.get('phaseId') as string

            let i: number = 0
            let actions: { actionType: ActionType, actionId?: string, actionTargetId: string, actionStrategy?: string }[] = []

            while (true) {
                const actionType = form.get(`actionType[${i}]`) as ActionType
                const actionTargetId = form.get(`action[${i}]`) as string
                const actionStrategy = form.get(`actionStrategy[${i}]`) as string
                const actionId = form.get(`actionId[${i}]`) as string
                if (actionType) {
                    actions.push({
                        actionType,
                        actionTargetId,
                        actionStrategy,
                        actionId: actionId ? actionId : undefined
                    })
                    i++
                } else {
                    break
                }
            }

            const { error } = await editActions(characterId, phaseId, actions)


            return null
        }

        case "notes": {

            const notes = form.get('notes') as string
            const characterId = form.get('_action') as string

            if (!characterId) return json({
                error: "Could not find character Id..."
            })

            if (notes.length > 1000) return json({
                error: "Notes cannot be longer than 1000 characters long"
            })

            const result = await prisma.gameRoles.update({
                where: {
                    gameId: params.gameId!
                },
                data: {
                    assignedRoles: {
                        updateMany: {
                            where: {
                                characterId
                            },
                            data: {
                                notes
                            }
                        }
                    }
                }
            })

            return null

        }
    }
}

export default function Dashboard() {
    const loaderData = useLoaderData()
    const {
        user,
        game,
        currentPhase,
        character,
        myRole,
        actions,
        actionPhaseId,
        authorized
    }: {
        user?: UserWithMods,
        game?: GameWithMods,
        currentPhase?: PhaseWithMods,
        character?: CharacterWithRole,
        myRole?: RoleWithNotes,
        actions?: { type: ActionType, id?: string, selected?: string, selectedStrategy?: string, options: { name: string, value: string }[] }[],
        actionPhaseId?: string,
        authorized?: boolean
    } = loaderData
    const params = useParams()
    const action = useActionData()

    const [inputs, setInputs] = useState({ notes: myRole?.notes || '' })
    const [actionsInput, setActionsInput] = useState(actions)

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
                currentPage="dashboard"
                host={authorized}
                gameId={game?.id}
                dashboard
            />
            <div className="p-8 md:p-12">

                <div className="flex justify-center w-full">

                    <div className={
                        `w-3/4 flex flex-col justify-center items-center
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

                        <Link to={`/gm-realm/characters/${character?.id}`} className="flex flex-col items-center justify-center">
                            <CharacterAvatar
                                avatarUrl={character?.avatarUrl || undefined}
                                size='XLARGE'
                            />

                            <div className="text-xl md:text-3xl font-bold">
                                {character?.name} {GameCharacterStatusEmojis[currentPhase?.characterStatus?.status.filter(status => status.characterId === character?.id)[0]?.status!]}
                            </div>
                        </Link>

                        <div className="flex flex-row items-stretch justify-evenly font-semibold text-xl my-2 bg-dogwood text-licorice-900 rounded-md w-full">
                            <div>STR: {character?.stats.strength}</div>
                            <div>STL: {character?.stats.stealth}</div>
                            <div>SKL: {character?.stats.skill}</div>
                            <div>CHR: {character?.stats.charisma}</div>
                        </div>

                        <div className="flex flex-col items-start justify-start w-full p-3 sm:max-w-2/3">
                            <div className="md:text-2xl font-semibold">
                                {character?.specialAbility.name}
                            </div>
                            <div className="italic">
                                {character?.specialAbility.description}
                            </div>
                        </div>

                        <div className="my-5 border-b-2 border-b-licorice-600 w-full" />

                        <form method="POST" className="flex flex-col justify-center items-center">

                            <input type="hidden" name="method" value="actions" />
                            <input type="hidden" name="characterId" value={character?.id} />
                            <input type="hidden" name="phaseId" value={actionPhaseId} />

                            {game?.status === 'ONGOING' && currentPhase ? <div className="text-3xl font-bold my-3">{currentPhase?.time === "DAY" ? "Night" : "Day"} {currentPhase?.time === "DAY" ? currentPhase.dayNumber : currentPhase?.dayNumber + 1} Actions</div> : ''}

                            <div className="flex flex-row justify-center items-center">

                                {actionsInput?.map((action, index) => <div key={v4()} className="flex flex-col justify-center mx-5">

                                    <input type="hidden" name={`actionType[${index}]`} value={action.type} />
                                    <input type="hidden" name={`actionStrategy[${index}]`} value={action.selectedStrategy} />
                                    <input type="hidden" name={`actionId[${index}]`} value={action?.id} />

                                    <div className="text-xl my-3 text-center">{action.type}</div>

                                    <select
                                        name={`action[${index}]`}
                                        value={actionsInput[index]?.selected || "No Action"}
                                        onChange={e => setActionsInput(actionsInput.map(input => input.type === action.type ? { ...input, selected: e.target.value } : input))}
                                        className="my-2 rounded-lg bg-slate-100 text-lg text-licorice-800"
                                    >
                                        {action.options.map(option => <option key={option.value} value={option.value}>
                                            {option.name}
                                        </option>)}
                                    </select>

                                    {["MAFIA_KILL", "INDEPENDENT_KILL"]?.includes(action.type) ? <select
                                        value={actionsInput[index]?.selectedStrategy || "STRENGTH"}
                                        onChange={e => setActionsInput(actionsInput.map(input => input.type === action.type ? { ...input, selectedStrategy: e.target.value } : input))}
                                        className="my-2 rounded-lg bg-slate-100 text-lg text-licorice-800"
                                    >
                                        {["STRENGTH", "STEALTH", "SKILL", "CHARISMA"]?.map(stat => <option key={v4()} value={stat}>
                                            {stat.substring(0, 3)}
                                        </option>)}
                                    </select> : ""}

                                </div>)}

                                {actionsInput?.length === 0 ? <div className="text-xl my-3 text-center">
                                    No Actions!
                                </div> : ""}

                            </div>

                            {actionsInput?.length && actionsInput.length !== 0 && <button
                                type="submit"
                                className="text-neonblue px-1 border rounded-xl border-neonblue hover:text-white hover:bg-neonblue font-bold text-xl my-2"
                            >
                                Save
                            </button>}

                        </form>

                        <div className="flex flex-col self-start items-start w-full">

                            <div className="py-2">
                                <span className="font-bold text-lg">Role: </span>{myRole?.name ? <Link to={`/gm-realm/roles/${myRole.id}`}>
                                    {myRole.name}
                                </Link> : <span>
                                    Not yet assigned!
                                </span>}
                            </div>

                            {myRole?.alignment ? <div className="py-2">
                                <span className="font-bold text-lg">
                                    Alignment:&nbsp;
                                </span>
                                <span>
                                    {myRole.alignment} {RoleAlignmentEmojis[myRole.alignment]}
                                </span>
                            </div> : ''}

                            {myRole && game?.status === 'ONGOING' ? <div className="py-2 self-center w-full">
                                <span className="font-bold text-lg">Notes: </span>

                                <form method="POST" className="flex flex-col justify-center items-center">
                                    <input type="hidden" name="method" value="notes" />
                                    <textarea
                                        name="notes"
                                        value={inputs.notes}
                                        onChange={e => setInputs({ ...inputs, notes: e.target.value })}
                                        className="block lg:hidden rounded-xl p-3 text-licorice-800 bg-slate-100"
                                        rows={10}
                                        cols={25}
                                    />
                                    <textarea
                                        name="notes"
                                        value={inputs.notes}
                                        onChange={e => setInputs({ ...inputs, notes: e.target.value })}
                                        className="hidden lg:block rounded-xl p-3 text-licorice-800 bg-slate-100"
                                        rows={10}
                                        cols={50}
                                    />
                                    <div>
                                        {action?.error}
                                    </div>
                                    <button
                                        type="submit"
                                        name="_action"
                                        value={character?.id}
                                        className="cursor-pointer text-xl border-[1px] border-neonblue hover:bg-neonblue hover:text-licorice-900 rounded-lg py-1 px-2 my-3 bg-transparent text-neonblue transition"
                                    >
                                        Save
                                    </button>
                                </form>
                            </div> : ''}

                        </div>



                    </div>

                </div>

            </div>
        </Layout>
    )
}