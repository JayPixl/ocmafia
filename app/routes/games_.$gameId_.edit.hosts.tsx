import { User } from "@prisma/client";
import { ActionFunction, LoaderFunction, json, redirect } from "@remix-run/node";
import { useActionData, useFetcher, useLoaderData, useNavigate, useParams } from "@remix-run/react";
import { useEffect, useState } from "react";
import InputField from "~/components/input-field";
import { Modal } from "~/components/modal";
import { editGame, getGameById, manageHosts, requireHost } from "~/utils/games.server";
import { GameWithMods } from "~/utils/types";
import { getUser } from "~/utils/users.server";

export const loader: LoaderFunction = async ({ request, params }) => {
    const { user } = await getUser(request)
    const { game } = await getGameById(params.gameId || '')
    if (!game) return redirect('/games')

    const { authorized, admin } = await requireHost(request, game.id)
    if (!authorized) return redirect(`/games/${params.gameId}`)
    return json({ user, game, admin })
}

export const action: ActionFunction = async ({ request, params }) => {
    const form = await request.formData()
    const method = form.get('method') as string
    const id = form.get('_action') as string

    const { error, newGame } = await manageHosts({ hostId: id, gameId: params.gameId || '', action: method }, request)
    if (error) return json({ error })
    return null
}

export default function EditGameHosts() {
    const loaderData = useLoaderData()
    const { game }: { game?: GameWithMods } = loaderData
    const action = useActionData()
    const fetcher = useFetcher()

    const navigate = useNavigate()
    const params = useParams()

    const [inputs, setInputs] = useState({
        host: ''
    })

    const [listItems, setListItems] = useState<any[]>([...(game?.hosts || [])])

    const handleChange: (input: string) => void = (input) => {
        setInputs({
            host: input
        })
        const queryParams = new URLSearchParams
        queryParams.set('username', input)
        queryParams.set('returnUsernames', 'true')
        fetcher.load(`/fetch/users?${queryParams}`)
    }

    return <Modal isOpen={true} onClick={() => navigate(`/games/${params.gameId}/edit`)} className="w-2/3 p-8">
        <div className="text-red-500">
            {action?.error}
        </div>
        <InputField
            name='hostInput'
            value={inputs.host}
            onChange={e => handleChange(e.target.value)}
            display={`Enter Host Username`}
            type="text"
        />
        <form method="POST">
            <input
                type="hidden"
                name="method"
                value='add'
            />
            {
                fetcher?.data?.results?.map((player: any) => (
                    (listItems.filter(i => i.id === player.id)).length === 0 && (
                        <div key={player.id} className="flex flex-row my-2">
                            <div className="font-semibold">
                                {player.username}
                            </div>
                            <button
                                type="submit"
                                name="_action"
                                value={player.id}
                                className="text-green-600 underline hover:no-underline ml-3"
                            >
                                Add
                            </button>
                        </div>
                    )
                )
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
                            {item?.username || item?.name}
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
    </Modal>
}
