import { ActionFunction, LoaderFunction, json, redirect } from "@remix-run/node";
import { Link, useActionData, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import InputField from "~/components/input-field";
import Layout from "~/components/layout";
import { createGame } from "~/utils/games.server";
import { requireClearance } from "~/utils/users.server";

export const loader: LoaderFunction = async ({ request }) => {
    const { user, authorized } = await requireClearance(request, "ADMIN")
    if (!authorized || !user) return redirect('/authenticate-admin')
    return json({ user })
}

export const action: ActionFunction = async ({ request }) => {
    const form = await request.formData()
    const gameName = form.get("name")
    const location = form.get("location")
    const playerCount = Number(form.get("playerCount"))

    if (typeof gameName !== 'string' || typeof location !== 'string' || typeof playerCount !== 'number') return json({ error: "Invalid form data" }, { status: 500 })

    let errors = {
        name: gameName.length > 20 && 'Name of game cannot be longer than 20 characters',
        location: location.length > 20 && 'Name of location cannot be longer than 20 characters'
    }

    if (Object.values(errors).some(Boolean)) {
        return json({ errors }, { status: 404 })
    }

    const { newGame, error } = await createGame({ gameName, location, playerCount })

    if (error) return json({ error })
    return json({ newGame })
}

export default function CreateGame() {
    const { user } = useLoaderData()
    const action = useActionData()

    const [inputs, setInputs] = useState({
        name: action?.fields?.name || '',
        location: action?.fields?.location || '',
        playerCount: action?.fields?.playerCount || ''
    })
    return <Layout user={user} navigation={true}>
        <div className="p-5 w-full flex flex-col items-center">
            <h1 className="text-2xl p-3">Create Game</h1>
            <div className="p-2 text-lg">
                <Link to={'/admin/create-game'}>Back to Admin Home</Link>
            </div>
            <div className="flex flex-col items-center justify-center p-5 rounded-xl bg-licorice-600 w-2/3">
                <form method="POST">
                    <div className="text-red-600">
                        {action?.error}
                    </div>
                    <InputField name="name" type="text" onChange={e => setInputs({ ...inputs, name: e.target.value })} display="Game Name" error={action?.errors?.name} value={inputs.name} />
                    <InputField name="location" type="text" onChange={e => setInputs({ ...inputs, location: e.target.value })} display="Game Location" error={action?.errors?.location} value={inputs.location} />
                    <InputField name="playerCount" type="number" onChange={e => setInputs({ ...inputs, playerCount: e.target.value })} display="Player Count" error={action?.errors?.playerCount} value={inputs.playerCount} />
                    <button
                        type="submit"
                    >
                        Submit
                    </button>
                </form>
            </div>
        </div>
    </Layout>
}