import { User } from "@prisma/client";
import { ActionFunction, LoaderFunction, json, redirect } from "@remix-run/node";
import { useActionData, useFetcher, useLoaderData, useNavigate, useParams } from "@remix-run/react";
import { useState } from "react";
import InputField from "~/components/input-field";
import { Modal } from "~/components/modal";
import { getGameById, manageCharacters, requireHost } from "~/utils/games.server";
import { prisma } from "~/utils/prisma.server";
import { CharacterWithMods, GameWithMods } from "~/utils/types";
import { getUser } from "~/utils/users.server";

export const loader: LoaderFunction = async ({ request, params }) => {
    const { user } = await getUser(request)
    const { game } = await getGameById(params.gameId || '')
    if (!game || game.status !== 'ENLISTING') return redirect('/games')

    const { authorized, admin } = await requireHost(request, game.id)
    if (!authorized) return redirect(`/games/${params.gameId}`)

    const joinRequests = await prisma.character.findMany({
        where: {
            id: {
                in: game.joinRequestIds
            }
        },
        select: {
            name: true,
            avatarUrl: true,
            id: true,
            owner: {
                select: {
                    username: true
                }
            }
        }
    })

    const pendingInvites = await prisma.character.findMany({
        where: {
            id: {
                in: game.pendingInviteIds
            }
        },
        select: {
            name: true,
            avatarUrl: true,
            id: true,
            owner: {
                select: {
                    username: true
                }
            }
        }
    })

    return json({ user, game, admin, joinRequests, pendingInvites })
}

export const action: ActionFunction = async ({ request, params }) => {
    const form = await request.formData()
    const method = form.get('method') as string
    const id = form.get('_action') as string || form.get('characterSelect') as string

    const { error, newGame } = await manageCharacters({ characterId: id, gameId: params.gameId || '', action: method })
    if (error) return json({ error })

    return null
}

export default function EditGameCharacters() {
    const loaderData = useLoaderData()
    const { user, game, joinRequests, pendingInvites }: { user?: User, game?: GameWithMods, admin?: boolean, joinRequests?: CharacterWithMods[], pendingInvites?: CharacterWithMods[] } = loaderData
    const action = useActionData()
    const fetcher = useFetcher()

    const navigate = useNavigate()
    const params = useParams()

    const [inputs, setInputs] = useState<any>({
        characterSelect: '',
        characterInput: ''
    })

    const [listItems, setListItems] = useState<any[]>([...(game?.participatingCharacters || [])])

    const handleChange: (input: string) => void = (input) => {
        setInputs({
            ...inputs,
            characterInput: input
        })
        const queryParams = new URLSearchParams
        queryParams.set('username', input)
        queryParams.set('returnUsernames', 'true')
        queryParams.set('returnCharacters', 'true')
        fetcher.load(`/fetch/users?${queryParams}`)
    }

    return <Modal isOpen={true} onClick={() => navigate(`/games/${params.gameId}/edit`)} className="w-2/3 p-8">
        <div className="text-bittersweet">
            {action?.error}
        </div>
        <InputField
            name='characterInput'
            value={inputs.characterInput}
            onChange={e => handleChange(e.target.value)}
            display={`Enter Owner Username`}
            type="text"
        />
        <form method="POST">
            <input
                type="hidden"
                name="method"
                value='add'
            />
            {
                fetcher?.data?.results?.length > 0 && (
                    <div className="flex flex-row my-2">
                        <div className="font-semibold">
                            {fetcher?.data?.results[0]?.username}
                        </div>
                        <select
                            name="characterSelect"
                            onChange={e => setInputs({
                                ...inputs,
                                characterSelect: e.target.value
                            })}
                            value={inputs.characterSelect}
                            className="w-32 rounded-lg bg-slate-200 mx-3"
                        >
                            {fetcher?.data?.results[0]?.characters?.map((character: any) => (
                                <option key={character.id} value={character.id}>{character.name}</option>
                            ))}
                        </select>
                        {inputs.characterSelect}

                        {fetcher?.data?.results[0]?.characters?.length > 0 && (
                            <button
                                type="submit"
                                className="text-green-600 underline hover:no-underline"
                            >
                                Send Invite
                            </button>
                        )}
                    </div>
                )
            }
        </form>
        <form method="POST">
            <input
                type="hidden"
                name="method"
                value='delete'
            />
            {
                listItems.map(item => (
                    <div key={item.name} className="flex flex-row my-2">
                        <div className="font-semibold">
                            {item?.name} ({item?.owner?.username})
                        </div>
                        <button
                            type="submit"
                            name="_action"
                            value={item.id}
                            className="text-bittersweet underline hover:no-underline ml-3"
                        >
                            Remove
                        </button>
                    </div>
                ))
            }
        </form>
        {joinRequests?.length !== 0 ? <form method="POST">
            <div className="my-3 text-xl">
                Pending Join Requests
            </div>
            <input
                type="hidden"
                name="method"
                value='add'
            />
            {joinRequests?.map(char => <div className="flex flex-row">
                <div>{char.name} {char?.owner?.username}</div>
                <input
                    type="hidden"
                    name="characterSelect"
                    value={char.id}
                />
                <button
                    type="submit"
                >
                    Add
                </button>
            </div>)}
        </form> : ''}

        {pendingInvites?.length !== 0 ? <form method="POST">
            <div className="my-3 text-xl">
                Pending Invites
            </div>
            <input
                type="hidden"
                name="method"
                value='add'
            />
            {pendingInvites?.map(char => <div className="flex flex-row">
                <div>{char.name} {char?.owner?.username}</div>
            </div>)}
        </form> : ''}
    </Modal>
}
