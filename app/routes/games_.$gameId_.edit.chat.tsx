import { ChatRoomType, GameChatRoom, GameRoles, User } from "@prisma/client";
import { ActionFunction, LoaderFunction, json, redirect } from "@remix-run/node";
import { useActionData, useFetcher, useLoaderData, useNavigate, useParams } from "@remix-run/react";
import { useEffect, useState } from "react";
import { Modal } from "~/components/modal";
import { manageGameChatChannels } from "~/utils/chat.server";
import { getGameById, requireHost } from "~/utils/games.server";
import { prisma } from "~/utils/prisma.server";
import { CharacterWithMods, GameWithMods } from "~/utils/types";
import { getUser } from "~/utils/users.server";

export const loader: LoaderFunction = async ({ request, params }) => {
    const { user } = await getUser(request)
    const { game } = await getGameById(params.gameId || '')
    if (!game) return redirect('/games')

    const chatrooms = await prisma.gameChatRoom.findMany({
        where: {
            gameId: game.id
        }
    })

    const characters = await prisma.character.findMany({
        where: {
            id: {
                in: game.participatingCharacterIds
            }
        },
        select: {
            id: true,
            name: true,
            avatarUrl: true
        }
    })

    const { authorized } = await requireHost(request, game.id)
    if (!authorized) return redirect(`/games/${params.gameId}`)

    return json({ user, game, chatrooms, characters })
}

export const action: ActionFunction = async ({ request, params }) => {
    const form = await request.formData()
    const method = form.get('_action') as 'add' | 'delete' | 'edit'
    const newName = form.get('newName') as string
    const roomId = form.get('roomId') as string
    const type = form.get('type') as ChatRoomType
    let participants = form.get('participants') as string
    let allowedPlayerIds: string[] = []

    if (participants !== null) {
        allowedPlayerIds = participants.split('$')
    }

    if (newName.length === 0) return json({
        error: "Name must have a value!"
    })

    const { error } = await manageGameChatChannels(params.gameId || '', method, newName, roomId, type, allowedPlayerIds)
    if (error) return json({ error })
    return null
}

export default function EditGameChat() {
    const loaderData = useLoaderData()
    const { user, game, chatrooms, characters }: { user?: User, game?: GameWithMods, chatrooms?: GameChatRoom[], characters?: CharacterWithMods[] } = loaderData
    const action = useActionData()
    const navigate = useNavigate()

    const params = useParams()

    const [inputs, setInputs] = useState({
        newChatroom: action?.fields?.newChatroom || ''
    })

    const [listItems, setListItems] = useState(chatrooms?.map(room => { return { ...room, oldName: room.name } }) || [])

    const [selectedCharacters, setSelectedCharacters] = useState<{ id: string, checked: boolean }[]>([])

    const [editingChars, setEditingChars] = useState<string>('')

    return <Modal isOpen={true} onClick={() => navigate(`/games/${params.gameId}/edit`)} className="w-full md:w-2/3 p-8">
        {editingChars === '' ? <div>

            <div className="text-2xl font-semibold py-3">
                Edit Game Chat Channels
            </div>

            {action?.error ? <div className="text-red-500 py-3">
                {action?.error}
            </div> : ''}

            <form method="POST" className="flex flex-row items-center w-full justify-between border-y-2 py-3 border-licorice-800">
                <input
                    type="text"
                    name="newName"
                    value={inputs.newChatroom}
                    onChange={e => setInputs({ ...inputs, newChatroom: e.target.value })}
                    maxLength={50}
                    className="w-2/3 px-2 py-1 bg-slate-200 rounded-lg text-lg"
                    placeholder="New Chatroom..."
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
                {listItems.map(item => <form method="POST" key={item.id} className="flex flex-row items-center w-full justify-between my-3">
                    <input type="hidden" name="roomId" value={item.id} />
                    <input type="hidden" name="type" value={item.type} />
                    <input type="hidden" name="participants" value={item.allowedPlayerIds.join('$')} />

                    <div className="flex flex-col w-2/3">
                        <input
                            type="text"
                            name="newName"
                            onChange={e => {
                                let newList = listItems.map(listItem => listItem.id === item.id ? { ...listItem, name: e.target.value, oldName: item.oldName } : listItem)
                                setListItems(newList)
                            }}
                            value={item.name}
                            maxLength={50}
                            className="w-full px-2 py-1 bg-slate-200 rounded-lg text-lg"
                        />

                        <div className="flex flex-col sm:flex-row py-2 items-center">

                            {!(["MEETING_ROOM", "PRE_GAME", "POST_GAME"].includes(item.type)) && <select
                                value={item.type}
                                onChange={e => {
                                    let newList = listItems.map(listItem => listItem.id === item.id ? { ...listItem, type: e.target.value as ChatRoomType } : listItem)
                                    setListItems(newList)
                                }}
                                className="rounded-lg bg-slate-100 p-1"
                            >
                                <option value="ROLEPLAY">Public</option>
                                <option value="PRIVATE">Private</option>
                            </select>
                            }

                            {item.type === "PRIVATE" && <div
                                onClick={() => {
                                    setSelectedCharacters(characters?.map(char => {
                                        return {
                                            id: char.id,
                                            checked: item.allowedPlayerIds.includes(char.id)
                                        }
                                    }) || [])
                                    setEditingChars(item.id)
                                }}
                                className="sm:ml-3 cursor-pointer underline hover:no-underline"
                            >
                                Manage Allowed Characters
                            </div>}

                        </div>
                    </div>

                    {item.name !== item.oldName ||
                        item.type !== chatrooms?.filter(room => room.id === item.id)[0].type ||
                        item.allowedPlayerIds !== chatrooms?.filter(room => room.id === item.id)[0].allowedPlayerIds ? <button
                            type="submit"
                            name="_action"
                            value='edit'
                            className="text-green-600 underline hover:no-underline ml-3"
                        >
                        Save
                    </button> : ''}

                    {item.name !== item.oldName ||
                        item.type !== chatrooms?.filter(room => room.id === item.id)[0].type ||
                        item.allowedPlayerIds !== chatrooms?.filter(room => room.id === item.id)[0].allowedPlayerIds ? <div
                            onClick={() => {
                                let newList = listItems.map(listItem => listItem.id === item.id ? {
                                    ...listItem,
                                    name: item.oldName,
                                    type: chatrooms?.filter(room => room.id === item.id)[0]?.type || "ROLEPLAY",
                                    allowedPlayerIds: chatrooms?.filter(room => room.id === item.id)[0].allowedPlayerIds || []
                                } : listItem)
                                setListItems(newList)
                            }}
                            className="text-neonblue underline hover:no-underline ml-3 cursor-pointer"
                        >
                        Reset
                    </div> : ''}

                    {!(["MEETING_ROOM", "PRE_GAME", "POST_GAME"].includes(item.type)) ? <button
                        type="submit"
                        name="_action"
                        value='delete'
                        className="text-bittersweet underline hover:no-underline ml-3"
                    >
                        Delete
                    </button> : <div
                        className="text-slate-400"
                    >
                        <del>Delete</del>
                    </div>}
                </form>)}
            </div>
        </div> : <div>
            <div className="text-2xl font-semibold py-3 border-b-2 border-licorice-800">
                Editing access for private channel {listItems.filter(listItem => listItem.id === editingChars)[0].name}
            </div>

            {characters?.map(char => <div
                key={char.id}
                onClick={() => setSelectedCharacters(selectedCharacters.map(sel => {
                    return {
                        id: sel.id,
                        checked: sel.id === char.id ? !sel.checked : sel.checked
                    }
                }))}
                className="flex flex-row items-center py-2 cursor-pointer hover:opacity-80"
            >
                <div className="text-lg mr-3">
                    {char.name}
                </div>
                <input type="checkbox" checked={selectedCharacters.filter(sel => sel.id === char.id)[0].checked} readOnly />
            </div>)}

            <button
                onClick={() => {
                    setListItems(listItems.map(listItem => listItem.id === editingChars ? { ...listItem, allowedPlayerIds: selectedCharacters.filter(sel => sel.checked).map(sel => sel.id) } : listItem))
                    setEditingChars('')
                }}
                className="text-neonblue underline hover:no-underline py-3"
            >
                Done
            </button>
        </div>}
    </Modal>
}
