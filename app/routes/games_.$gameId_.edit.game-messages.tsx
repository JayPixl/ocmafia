import { EventTypes, User } from "@prisma/client";
import { ActionFunction, LoaderFunction, json, redirect } from "@remix-run/node";
import { useActionData, useFetcher, useLoaderData, useNavigate, useParams } from "@remix-run/react";
import { useEffect, useState } from "react";
import InputField from "~/components/input-field";
import { Modal } from "~/components/modal";
import SelectBox from "~/components/select-box";
import { editGame, getGameById, manageCharacters, manageGameMessages, manageHosts, requireHost } from "~/utils/games.server";
import { GameWithMods } from "~/utils/types";
import { getUser } from "~/utils/users.server";

export const loader: LoaderFunction = async ({ request, params }) => {
    const { user } = await getUser(request)
    const { game } = await getGameById(params.gameId || '')
    if (!game) return redirect('/games')

    const { authorized } = await requireHost(request, game.id)
    if (!authorized) return redirect(`/games/${params.gameId}`)
    return json({ user, game })
}

export const action: ActionFunction = async ({ request, params }) => {
    const form = await request.formData()
    const method = form.get('_action') as 'add' | 'delete' | 'edit'
    const oldMessage = form.get('oldMessage') as string
    const newMessage = form.get('newMessage') as string
    const eventType = form.get('eventType') as EventTypes

    const { newGame, error } = await manageGameMessages(params.gameId || '', method, eventType, newMessage, oldMessage)
    if (error) return json({ error, fields: { newMessage, eventType } })
    return json({ fields: { eventType } })
}

export default function EditGameMessages() {
    const loaderData = useLoaderData()
    const { user, game }: { user?: User, game?: GameWithMods } = loaderData
    const action = useActionData()
    const navigate = useNavigate()

    const params = useParams()

    const [inputs, setInputs] = useState({
        eventType: action?.fields?.eventType || 'KILL' as EventTypes,
        newMessage: action?.fields?.newMessage || ''
    })

    const [listItems, setListItems] = useState<{
        key: string,
        message: string,
        oldMessage: string
    }[]>([])

    useEffect(() => {
        let newList: typeof listItems = []
        game?.gameMessages?.messages?.filter(msg => msg.event === inputs.eventType).map(msg => {
            newList.push({
                key: crypto.randomUUID(),
                message: msg.message,
                oldMessage: msg.message
            })
        })
        setListItems(newList)
    }, [inputs.eventType])

    return <Modal isOpen={true} onClick={() => navigate(`/games/${params.gameId}/edit`)}>
        <div className="p-3">

            <div className="italic text-licorice-800 bg-dogwood rounded-lg border-l-licorice-800 border-l-4 p-2">
                Be sure to indicate the event target with '@@' and the event actor with '@@@'!
            </div>

            {action?.error ? <div className="text-red-500 py-3">
                {action?.error}
            </div> : ''}

            <div className="my-4">
                <SelectBox
                    name="eventType"
                    display="Event Type"
                    onChange={e => setInputs({ ...inputs, eventType: e.target.value })}
                    options={[...(Object.values(EventTypes).map(type => { return { name: type, value: type } }))]}
                    value={inputs.eventType}
                />
            </div>

            <form method="POST" className="flex flex-row items-center w-full justify-between border-y-2 py-3 border-licorice-800">
                <input type="hidden" name="eventType" value={inputs.eventType} />

                <input
                    type="text"
                    name="newMessage"
                    value={inputs.newMessage}
                    onChange={e => setInputs({ ...inputs, newMessage: e.target.value })}
                    maxLength={50}
                    className="w-2/3 px-2 py-1 bg-slate-200 rounded-lg text-lg"
                    placeholder="New Message..."
                />

                <button
                    type="submit"
                    name="_action"
                    value='add'
                    className="text-xl underline hover:no-underline"
                >
                    Add
                </button>
            </form>

            <div className="my-3">
                {listItems.map(item => <form method="POST" key={item.key} className="flex flex-row items-center w-full justify-between my-3">
                    <input type="hidden" name="oldMessage" value={item.oldMessage} />
                    <input type="hidden" name="eventType" value={inputs.eventType} />

                    <input
                        type="text"
                        name="newMessage"
                        onChange={e => {
                            let newList = listItems.map(listItem => listItem.key === item.key ? { key: item.key, message: e.target.value, oldMessage: item.oldMessage } : listItem)
                            setListItems(newList)
                        }}
                        value={listItems.filter(listItem => listItem.key === item.key)[0].message}
                        maxLength={50}
                        className="w-2/3 px-2 py-1 bg-slate-200 rounded-lg text-lg"
                    />

                    {item.message !== item.oldMessage ? <button
                        type="submit"
                        name="_action"
                        value='edit'
                    >
                        Save
                    </button> : ''}

                    <button
                        type="submit"
                        name="_action"
                        value='delete'
                    >
                        Delete
                    </button>
                </form>)}
            </div>
        </div>
    </Modal>
}
