import { ActionFunction, LoaderFunction, json, redirect } from "@remix-run/node";
import { useLoaderData, useParams } from "@remix-run/react";
import CharacterAvatar from "~/components/character-avatar";
import Layout from "~/components/layout";
import { EndGame, getGameById, requireHost } from "~/utils/games.server";
import { prisma } from "~/utils/prisma.server";
import { CharacterWithMods } from "~/utils/types";
import { getUser } from "~/utils/users.server";
import { useState, useEffect } from 'react'
import { Alignment } from "@prisma/client";
import { v4 } from "uuid";

export const loader: LoaderFunction = async ({ request, params }) => {
    const { user } = await getUser(request)

    const { authorized } = await requireHost(request, params.gameId || '')
    if (!authorized) return redirect(`/games/${params.gameId}`)

    const { game } = await getGameById(params.gameId || '')
    if (!game) return redirect('/games')

    const characters = await prisma.character.findMany({
        where: {
            id: {
                in: game.participatingCharacterIds
            }
        },
        select: {
            id: true,
            avatarUrl: true,
            name: true
        }
    })

    return json({ user, game, characters })
}

export const action: ActionFunction = async ({ request, params }) => {

    const form = await request.formData()

    const winningFaction = form.get('winningFaction') as Alignment

    let i: number = 0
    let characters: string[] = []
    let values: string[] = []

    while (true) {
        const character = form.get(`characters[${i}]`) as string
        const value = form.get(`values[${i}]`) as string

        if (character && value) {
            if (value === 'WINNER') {
                characters.push(character)
                values.push(value)
            }
            i++
        } else {
            break
        }
    }

    const { error } = await EndGame(params.gameId || '', characters, winningFaction)
    if (error) return json({
        error
    })

    return redirect(`/games/${params.gameId}/edit`)
}

export default function CompleteGame() {
    const { user, game, characters } = useLoaderData()
    const params = useParams()

    const [inputs, setInputs] = useState<any>({})

    useEffect(() => {
        let obj: any = {}
        characters.map((char: CharacterWithMods) => {
            obj = {
                ...obj,
                ...{ [char.id]: 'LOSER' }
            }
        })
        setInputs({ ...obj, winningFaction: 'TOWN' })
    }, [])

    return <Layout
        user={user}
        navigation={true}
        navArray={[
            { name: 'Games', url: `/games`, id: 'games' },
            { name: game?.name, url: `/games/${params?.gameId}`, id: params?.gameId || '', parent: 'games' },
            { name: "Reports", url: `/games/${params?.gameId}/reports`, id: 'reports' || '', parent: params?.gameId }
        ]}
    >
        <div className="p-5 flex flex-col justify-center items-center">
            <div className="text-3xl my-3 font-bold">
                End Game
            </div>
            <form method="POST" className="flex flex-col justify-center items-center">
                <div className="mx-3 text-2xl font-bold py-2">Winning Faction</div>
                <select
                    name="winningFaction"
                    value={inputs.winningFaction}
                    onChange={e => setInputs({
                        ...inputs,
                        winningFaction: e.target.value
                    })}
                    className="bg-slate-300 text-licorice-800 text-lg rounded-lg px-2 py-1 mb-3"
                >
                    {Object.values(Alignment).map(alignment => <option key={v4()} value={alignment}>
                        {alignment}
                    </option>)}
                </select>
                {characters.map((char: CharacterWithMods, index: number) => <div key={char.id} className="flex flex-row items-center justify-center p-2">
                    <CharacterAvatar
                        avatarUrl={char.avatarUrl || undefined}
                        size="MEDIUM"
                    />
                    <div className="mx-3 text-lg font-bold">{char.name}</div>
                    <select
                        name={`values[${index}]`}
                        value={inputs?.[char.id]}
                        onChange={e => setInputs({
                            ...inputs,
                            [char.id]: e.target.value
                        })}
                        className="bg-slate-300 text-licorice-800 rounded-lg px-2 py-1"
                    >
                        <option value='LOSER'>❌ Loser ❌</option>
                        <option value='WINNER'>👑 Winner 👑</option>
                    </select>
                    <input type="hidden" name={`characters[${index}]`} value={char.id} />
                </div>)}
                <button
                    type="submit"
                    className="text-xl border-[1px] border-neonblue text-neonblue rounded-lg py-1 px-2 my-3 hover:bg-neonblue hover:text-licorice-800 transition md:text-2xl"
                >
                    Submit
                </button>
            </form>
        </div>
    </Layout>
}