import { EventMessage, EventTypes } from "@prisma/client";
import { ActionFunction, LoaderFunction, json, redirect } from "@remix-run/node";
import { Link, useActionData, useLoaderData, useParams } from "@remix-run/react";
import { useEffect, useState, useRef } from "react";
import GameEditToolbar from "~/components/game-edit-toolbar";
import Layout from "~/components/layout";
import { requiredTargetFields } from "~/utils/constants";
import { insertRawGameName } from "~/utils/formatters";
import { getGameById, manageReports, requireHost } from "~/utils/games.server";
import { GameWithMods, PhaseWithMods, UserWithMods } from "~/utils/types";
import { getUser } from "~/utils/users.server";
import { validateLength } from "~/utils/validators";

export const loader: LoaderFunction = async ({ request, params }) => {
    const { user } = await getUser(request)

    const { authorized } = await requireHost(request, params.gameId || '')
    if (!authorized) return redirect(`/games/${params.gameId}/reports`)

    const { game, currentPhase } = await getGameById(params.gameId || '')
    if (!game) return redirect('/games')

    let characters: { name: string, id: string }[] = []
    const moddedGame: GameWithMods = game as GameWithMods
    moddedGame?.participatingCharacters?.map(char => {
        characters.push({
            name: char.name,
            id: char.id
        })
    })

    return json({ user, game, authorized, currentPhase, characters })
}

export const action: ActionFunction = async ({ request, params }) => {
    const form = await request.formData()

    const phaseId = form.get("phaseId") as string

    let message = form.get("message") as string || undefined
    if (message === 'No values!') message = undefined

    const eventType = form.get("eventType") as EventTypes

    const eventId = form.get("eventId") as string

    let targetId = form.get("targetId") as string || undefined
    if (targetId === 'undefined') targetId = undefined

    let actorId = form.get("actorId") as string || undefined
    if (actorId === 'undefined') actorId = undefined

    const clues = form.get("clues") as string

    const draft = form.get('draft') as string ? true : false

    const action = form.get('_action') as "update" | "add" | "publishPhase" | 'unpublishPhase' | "delete" | 'addPhase' | 'deletePhase'

    const fields = {
        phaseId,
        message,
        type: eventType,
        targetId,
        actorId,
        clues,
        eventId,
        draft
    }

    if (action === 'add' || action === 'update') {
        const fieldErrors = {
            clues: validateLength(clues, 100),
            target: (requiredTargetFields?.[eventType]?.includes('target') && !targetId) ? 'Target required' : undefined,
            actor: (requiredTargetFields?.[eventType]?.includes('actor') && !actorId) ? 'Actor required' : undefined,
        }

        if (Object.values(fieldErrors).some(Boolean)) return json({
            fields: {
                ...fields,
                eventId: eventId === '' ? undefined : eventId,
                draft: draft ? 'true' : 'false',
                eventType,
                type: undefined
            },
            fieldErrors,
        })
    }
    const { error } = await manageReports(params.gameId || '', action, fields)
    if (error) return json({ error, fields })
    return json({ fields: { phaseId } })
}

export default function EditReports() {
    const loaderData = useLoaderData()
    const {
        user,
        game,
        currentPhase,
        characters
    }: {
        user?: UserWithMods,
        game?: GameWithMods,
        currentPhase?: PhaseWithMods,
        characters?: { name: string, id: string }[]
    } = loaderData

    const actionData = useActionData()
    const params = useParams()

    const firstLoad = useRef<number>(0)

    const [selectedPhase, setSelectedPhase] = useState<PhaseWithMods>()
    var eventsObj: object = {}

    if (firstLoad.current !== 1) {

        const gamePhases: PhaseWithMods[] = game?.phases as PhaseWithMods[]

        gamePhases.filter(phase => phase.events?.length !== 0)?.map(phase => {
            phase?.events?.map(event => {
                const newItem: object = actionData?.fields?.eventId === event.id ? {
                    [event.id]: {
                        message: actionData.fields.message || 'No values!',
                        eventType: (actionData.fields.eventType || 'KILL') as EventTypes,
                        target: actionData.fields.target || 'undefined',
                        actor: actionData.fields.message || 'undefined',
                        clues: actionData.fields.clues || '',
                        draft: actionData.fields.draft || ''
                    }
                } : {
                    [event.id]: {
                        message: event.message || '',
                        eventType: event.type || 'KILL' as EventTypes,
                        target: event.targetId || 'undefined',
                        actor: event.actorId || 'undefined',
                        clues: event.clues.join('$$') || '',
                        draft: event.draft ? 'true' : 'false'
                    }
                }
                eventsObj = { ...eventsObj, ...newItem }
            })
        })

        if (process.env.NODE_ENV === "production") {
            firstLoad.current = 1
        } else {
            if (firstLoad.current === 0) {
                firstLoad.current = -1
            } else {
                firstLoad.current = 1
            }
        }
    }

    const [inputs, setInputs] = (actionData?.fields?.eventId || !actionData) ? useState<any>({
        phaseId: actionData?.fields?.phaseId || currentPhase?.id || undefined,
        message: '',
        eventType: 'KILL' as EventTypes,
        target: 'undefined',
        actor: 'undefined',
        clues: '',
        draft: 'true',
        ...eventsObj
    }) : useState<any>({
        phaseId: actionData?.fields?.phaseId || currentPhase?.id || undefined,
        message: actionData?.fields?.message || '',
        eventType: actionData?.fields?.eventType || 'KILL' as EventTypes,
        target: actionData?.fields?.targetId || 'undefined',
        actor: actionData?.fields?.actorId || 'undefined',
        clues: actionData?.fields?.clues || '',
        draft: actionData?.fields?.draft === 'false' ? 'false' : 'true',
        ...eventsObj
    })

    useEffect(() => {
        setSelectedPhase(game?.phases?.filter(phase => phase.id === inputs.phaseId)[0])
    }, [inputs.phaseId])

    useEffect(() => {
        setSelectedPhase(game?.phases?.filter(phase => phase.id === actionData?.phaseId)[0] || currentPhase ? currentPhase : game?.phases?.filter(phase => true)[0] || undefined)
        setInputs({
            ...inputs,
            phaseId: game?.phases?.filter(phase => phase.id === actionData?.phaseId)[0]?.id || currentPhase ? currentPhase?.id : game?.phases?.filter(phase => true)[0]?.id || undefined
        })
    }, [])

    const getGameMessages: (
        messages: EventMessage[] | undefined,
        eventType: EventTypes,
        actor?: string,
        target?: string
    ) => {
        name: string,
        value: string
    }[] = (map, eventType, actor, target) => {
        let arr: { value: string, name: string }[] = []
        map?.map(obj => {
            if (obj.event === eventType) {
                arr.push({ value: obj.message, name: insertRawGameName(obj.message, actor, target) })
            }
        })
        if (arr.length === 0) {
            arr.push({ value: 'No values!', name: 'No values!' })
        }
        return arr
    }

    return (
        <Layout
            user={user}
            navigation={true}
            navArray={[
                { name: 'Games', url: `/games`, id: 'games' },
                { name: game?.name || '', url: `/games/${params?.gameId}`, id: params?.gameId || '', parent: 'games' },
                { name: "Edit", url: `/games/${params?.gameId}/edit`, id: 'edit' || '', parent: params?.gameId }
            ]}
        >
            <GameEditToolbar
                currentPage="reports"
                gameId={game?.id}
            />
            <div className="p-5">
                <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center py-5 border-b-licorice-800 border-b-2">
                    <select
                        onChange={e => setInputs({
                            ...inputs,
                            phaseId: e.target.value
                        })}
                        value={inputs.phaseId}
                        className="bg-opacity-[1%] bg-licorice-600 font-bold text-4xl rounded-lg py-1 hover:opacity-80"
                    >
                        {game?.phases?.map(phase => <option key={`${phase.id}`} value={`${phase.id}`}>
                            {`${phase.time} ${phase.dayNumber}`}
                        </option>)}
                    </select>

                    <div className="text-bittersweet">
                        {actionData?.error}
                    </div>

                    <form method="POST" className="mt-3 md:mt-0">
                        <input type="hidden" name="phaseId" value={inputs.phaseId} />

                        <button
                            type="submit"
                            name="_action"
                            value={selectedPhase?.events?.length && selectedPhase?.events?.every(val => val.draft === false) ? 'unpublishPhase' : 'publishPhase'}
                            className="mr-5 text-xl border-[1px] border-dogwood text-dogwood rounded-lg py-1 px-2 hover:bg-bittersweet hover:border-bittersweet hover:text-white transition md:text-2xl"
                        >
                            {selectedPhase?.events?.length && selectedPhase?.events?.every(val => val.draft === false) ? 'Unpublish Phase' : 'Publish Phase'}
                        </button>

                        <Link
                            to={`/games/${params.gameId}/character-status/edit`}
                            className="text-xl border-[1px] border-dogwood text-dogwood rounded-lg py-1 px-2 hover:bg-bittersweet hover:border-bittersweet hover:text-white transition md:text-2xl"
                        >
                            Edit Character Status
                        </Link>
                    </form>
                </div>

                <form method="POST" className="flex flex-col items-start py-5 border-b-2 border-b-licorice-800">
                    <input type="hidden" name="phaseId" value={inputs.phaseId} />

                    <div className="self-center text-3xl font-semibold text-neonblue mb-3">New Event</div>

                    <select
                        name="message"
                        value={inputs.message}
                        onChange={e => setInputs({
                            ...inputs,
                            message: e.target.value
                        })}
                        className="bg-opacity-[1%] bg-licorice-600 font-bold text-2xl overflow-x-auto md:text-3xl italic py-1 hover:opacity-80 mb-2"
                    >
                        {getGameMessages(
                            game?.gameMessages?.messages,
                            inputs.eventType,
                            (inputs.actor !== 'undefined' && inputs.actor) ? characters?.filter(char => char.id === inputs.actor)[0]?.name || '@@@' : undefined,
                            (inputs.target !== 'undefined' && inputs.target) ? characters?.filter(char => char.id === inputs.target)[0]?.name || '@@' : undefined,
                        ).map(message => <option
                            key={message.value}
                            value={message.value}
                        >
                            {message.name}
                        </option>
                        )}
                    </select>

                    <div className="flex flex-row justify-start items-baseline mb-2">
                        <label htmlFor="eventType" className="text-xl mr-5">
                            Type:
                        </label>
                        <select
                            name="eventType"
                            onChange={e => setInputs({
                                ...inputs,
                                eventType: e.target.value
                            })}
                            value={inputs.eventType}
                            className="bg-white font-bold text-lg rounded-lg text-licorice-800 py-1 hover:opacity-80"
                        >
                            {Object.values(EventTypes).filter(type => type !== 'GAME_END').map(type => <option key={type} value={type}>
                                {type}
                            </option>)}
                        </select>
                    </div>


                    {requiredTargetFields?.[inputs.eventType]?.includes('target') && <div className="flex flex-row justify-start items-baseline mb-2">
                        <label htmlFor="targetId" className="text-xl mr-5">
                            Target:
                        </label>
                        <select
                            name="targetId"
                            onChange={e => setInputs({
                                ...inputs,
                                target: e.target.value
                            })}
                            value={inputs.target}
                            className="bg-white font-bold text-lg rounded-lg text-licorice-800 py-1 hover:opacity-80"
                        >
                            <option value={'undefined'}>( None )</option>
                            {game?.participatingCharacters?.map(char => <option key={char.id} value={char.id}>
                                {char.name}
                            </option>)}
                        </select>
                        <div className="text-bittersweet ml-3">{!actionData?.fields?.eventId ? actionData?.fieldErrors?.target : ''}</div>
                    </div>}

                    {requiredTargetFields?.[inputs.eventType]?.includes('actor') && <div className="flex flex-row justify-start items-baseline mb-2">
                        <label htmlFor="actorId" className="text-xl mr-5">
                            Actor:
                        </label>
                        <select
                            name="actorId"
                            onChange={e => setInputs({
                                ...inputs,
                                actor: e.target.value
                            })}
                            value={inputs.actor}
                            className="bg-white font-bold text-lg rounded-lg text-licorice-800 py-1 hover:opacity-80"
                        >
                            <option value={'undefined'}>( None )</option>
                            {game?.participatingCharacters?.map(char => <option key={char.id} value={char.id}>
                                {char.name}
                            </option>)}
                        </select>
                        <div className="text-bittersweet ml-3">{!actionData?.fields?.eventId ? actionData?.fieldErrors?.actor : ''}</div>
                    </div>}

                    <div className="flex flex-col justify-start mb-2">
                        <div className="flex flex-row justify-between items-baseline mb-1 w-full">
                            <div className="text-xl mr-3">Clues:</div>
                            <div className="italic font-light">(Separate clues with '$$')</div>
                        </div>
                        <textarea
                            name="clues"
                            value={inputs.clues}
                            onChange={e => setInputs({
                                ...inputs,
                                clues: e.target.value
                            })}
                            cols={35}
                            rows={3}
                            className="rounded-xl bg-dogwood text-licorice-800 p-2 md:text-lg"
                        />
                    </div>

                    <div
                        className="flex flex-row items-center hover:opacity-80"
                        onClick={e => setInputs({
                            ...inputs,
                            draft: inputs.draft === 'true' ? 'false' : 'true'
                        })}
                    >
                        <label htmlFor="draft" className="text-xl mr-3">Draft?</label>
                        <input
                            type="checkbox"
                            name="draft"
                            checked={inputs.draft === 'true'}
                            className="scale-125"
                            readOnly
                        />
                    </div>

                    <button
                        type="submit"
                        name="_action"
                        value="add"
                        className="self-center text-xl my-3 border-[1px] border-neonblue text-neonblue rounded-lg py-1 px-2 hover:bg-neonblue hover:text-licorice-800 transition md:text-2xl"
                    >
                        Add Event
                    </button>
                </form>

                <div>
                    {selectedPhase?.events?.length ? <div className="w-full text-center text-3xl font-semibold text-neonblue my-3">Edit Events</div> : ''}
                    {selectedPhase?.events?.map(event => <form method="POST" className="flex flex-col items-start py-5 border-b-2 border-b-licorice-800" key={event.id}>
                        <input type="hidden" name="phaseId" value={inputs.phaseId} />
                        <input type="hidden" name="eventId" value={event.id} />

                        <select
                            name="message"
                            value={inputs?.[event.id]?.message}
                            onChange={e => setInputs({
                                ...inputs,
                                [event.id]: {
                                    ...inputs?.[event.id],
                                    message: e.target.value
                                }
                            })}
                            autoFocus={actionData?.fields?.eventId === event.id}
                            className="bg-opacity-[1%] bg-licorice-600 font-bold text-2xl overflow-x-auto md:text-3xl italic py-1 hover:opacity-80 mb-2"
                        >
                            {getGameMessages(
                                game?.gameMessages?.messages,
                                inputs?.[event.id]?.eventType,
                                (inputs?.[event.id]?.actor !== 'undefined' && inputs?.[event.id]?.actor) ? characters?.filter(char => char.id === inputs?.[event.id]?.actor)[0]?.name || '@@@' : undefined,
                                (inputs?.[event.id]?.target !== 'undefined' && inputs?.[event.id]?.target) ? characters?.filter(char => char.id === inputs?.[event.id]?.target)[0]?.name || '@@' : undefined,
                            ).map(message => <option
                                key={message.value}
                                value={message.value}
                            >
                                {message.name}
                            </option>
                            )}
                        </select>

                        <div className="flex flex-row justify-start items-baseline mb-2">
                            <label htmlFor="eventType" className="text-xl mr-5">
                                Type:
                            </label>
                            <select
                                name="eventType"
                                onChange={e => setInputs({
                                    ...inputs,
                                    [event.id]: {
                                        ...inputs?.[event.id],
                                        eventType: e.target.value
                                    }
                                })}
                                value={inputs?.[event.id]?.eventType}
                                className="bg-white font-bold text-lg rounded-lg text-licorice-800 py-1 hover:opacity-80"
                            >
                                {Object.values(EventTypes).filter(type => type !== 'GAME_END').map(type => <option key={type} value={type}>
                                    {type}
                                </option>)}
                            </select>
                        </div>

                        {requiredTargetFields?.[inputs?.[event.id]?.eventType]?.includes('target') && <div className="flex flex-row justify-start items-baseline mb-2">
                            <label htmlFor="targetId" className="text-xl mr-5">
                                Target:
                            </label>

                            <select
                                name="targetId"
                                onChange={e => setInputs({
                                    ...inputs,
                                    [event.id]: {
                                        ...inputs?.[event.id],
                                        target: e.target.value,
                                    }
                                })}
                                className="bg-white font-bold text-lg rounded-lg text-licorice-800 py-1 hover:opacity-80"
                                value={inputs?.[event.id]?.target}
                            >
                                <option value={'undefined'}>( None )</option>
                                {game?.participatingCharacters?.map(char => <option key={char.id} value={char.id}>
                                    {char.name}
                                </option>)}
                            </select>
                            <div className="text-bittersweet ml-3">{actionData?.fields?.eventId === event.id ? actionData?.fieldErrors?.target : ''}</div>
                        </div>}

                        {requiredTargetFields?.[inputs?.[event.id]?.eventType]?.includes('actor') && <div className="flex flex-row justify-start items-baseline mb-2">
                            <label htmlFor="actorId" className="text-xl mr-5">
                                Actor:
                            </label>

                            <select
                                name="actorId"
                                onChange={e => setInputs({
                                    ...inputs,
                                    [event.id]: {
                                        ...inputs?.[event.id],
                                        actor: e.target.value
                                    }
                                })}
                                value={inputs?.[event.id]?.actor}
                                className="bg-white font-bold text-lg rounded-lg text-licorice-800 py-1 hover:opacity-80"
                            >
                                <option value={'undefined'}>( None )</option>
                                {game?.participatingCharacters?.map(char => <option key={char.id} value={char.id}>
                                    {char.name}
                                </option>)}
                            </select>
                            <div className="text-bittersweet ml-3">{actionData?.fields?.eventId === event.id ? actionData?.fieldErrors?.actor : ''}</div>
                        </div>}

                        <div className="flex flex-col justify-start mb-2">
                            <div className="flex flex-row justify-between items-baseline mb-1 w-full">
                                <div className="text-xl mr-3">Clues:</div>
                                <div className="italic font-light">(Separate clues with '$$')</div>
                            </div>
                            <textarea
                                name="clues"
                                value={inputs?.[event.id]?.clues}
                                onChange={e => setInputs({
                                    ...inputs,
                                    [event.id]: {
                                        ...inputs?.[event.id],
                                        clues: e.target.value
                                    }
                                })}
                                cols={35}
                                rows={3}
                                className="rounded-xl bg-dogwood text-licorice-800 p-2 md:text-lg"
                            />
                        </div>

                        <div
                            className="flex flex-row items-center hover:opacity-80"
                            onClick={e => setInputs({
                                ...inputs,
                                [event.id]: {
                                    ...inputs?.[event.id],
                                    draft: inputs?.[event.id]?.draft === 'true' ? 'false' : 'true'
                                }

                            })}
                        >
                            <label htmlFor="draft" className="text-xl mr-3">Draft?</label>
                            <input
                                type="checkbox"
                                name="draft"
                                checked={inputs?.[event.id]?.draft === 'true'}
                                className="scale-125"
                                readOnly
                            />
                        </div>

                        <button
                            type="submit"
                            name="_action"
                            value="update"
                            className="self-center text-xl border-[1px] border-neonblue text-neonblue rounded-lg py-1 px-2 my-3 hover:bg-neonblue hover:text-licorice-800 transition md:text-2xl"
                        >
                            Save Changes
                        </button>
                        <button
                            type="submit"
                            name="_action"
                            value="delete"
                            className="self-center text-xl border-[1px] border-bittersweet text-licorice-800 bg-bittersweet rounded-lg py-1 px-2 my-3 hover:bg-transparent hover:border-bittersweet hover:text-bittersweet transition md:text-2xl"
                        >
                            Delete Event
                        </button>
                    </form>
                    ) || <div>
                            No Events Yet!
                        </div>}
                </div>
            </div>
        </Layout>
    )
}