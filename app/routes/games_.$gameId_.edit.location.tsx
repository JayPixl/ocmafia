import { User } from "@prisma/client";
import { ActionFunction, LoaderFunction, json, redirect } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigate, useParams } from "@remix-run/react";
import { useState } from "react";
import InputField from "~/components/input-field";
import { Modal } from "~/components/modal";
import { editGame, getGameById, requireHost } from "~/utils/games.server";
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
    const location = form.get('location') as string

    const { error, newGame } = await editGame({ location }, params?.gameId || '')
    if (error) return json({ error })
    return redirect(`/games/${params.gameId}/edit`)
}

export default function EditGameLocation() {
    const loaderData = useLoaderData()
    const { user, game, admin }: { user?: User, game?: GameWithMods, admin?: boolean } = loaderData
    const action = useActionData()

    const navigate = useNavigate()
    const params = useParams()

    const [form, setForm] = useState({
        location: game?.location || ''
    })

    return <Modal isOpen={true} onClick={() => navigate(`/games/${params.gameId}/edit`)} className="w-2/3 p-8">
        <form method="POST">
            <input
                type="hidden"
                name="attr"
                value='name'
            />
            <InputField
                name='location'
                value={form.location}
                onChange={e => setForm({ location: e.target.value })}
                display={`Edit Game Location`}
                type="text"
            />
            <button
                type="submit"
                className="w-full font-semibold underline hover:no-underline text-neonblue"
            >
                Save Changes
            </button>
        </form>
    </Modal>
}
