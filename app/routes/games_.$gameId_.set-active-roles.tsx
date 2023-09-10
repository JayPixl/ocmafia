import { Role } from "@prisma/client";
import { ActionFunction, LoaderArgs, json, redirect } from "@remix-run/node";
import { Link, useActionData, useLoaderData, useParams } from "@remix-run/react";
import { useState, useEffect } from 'react'
import GameEditToolbar from "~/components/game-edit-toolbar";
import Layout from "~/components/layout";
import Toolbar from "~/components/toolbar";
import { RoleAlignmentEmojis } from "~/utils/constants";
import { getGameById, requireHost } from "~/utils/games.server";
import { prisma } from "~/utils/prisma.server";
import { updateActiveRoles } from "~/utils/roles.server";
import { GameWithMods, PhaseWithMods } from "~/utils/types";
import { getUser } from "~/utils/users.server";

export async function loader({ request, params }: LoaderArgs) {

    const { user } = await getUser(request)

    const { authorized } = await requireHost(request, params.gameId || '')
    if (!authorized) return redirect(`/games/${params.gameId}/reports`)

    const { game }: { game?: GameWithMods } = await getGameById(params.gameId || '')
    if (!game) return redirect('/games')

    if (game.status !== 'ENLISTING') return redirect(`/games/${params.gameId}/character-status/edit`)

    const roles = (await prisma.role.findMany({
        select: {
            id: true,
            name: true,
            alignment: true
        }
    })) as Role[]

    return json({ user, game, authorized, roles })
}

export const action: ActionFunction = async ({ request, params }) => {
    const form = await request.formData()

    let roles: string[] = []
    let i: number = 0

    while (true) {
        const value = form.get(`roles[${i}]`) as string
        if (value) {
            roles.push(value)
            i++
        } else {
            break
        }
    }

    const { error } = await updateActiveRoles(params.gameId || '', roles)
    if (error) return json({
        error
    })

    return redirect(`/games/${params.gameId}/edit`)
}

export default function SetActiveRoles() {
    const params = useParams()

    const { game, user, roles } = useLoaderData()
    const actionData = useActionData()

    const [inputs, setInputs] = useState<{
        id: string,
        name: string,
        uniqueId: string
    }[]>()

    useEffect(() => {
        let newArray: {
            id: string,
            uniqueId: string,
            name: string
        }[] = []
        const villager: Role = roles.filter((r: Role) => r.name === 'Villager')[0]
        for (let i: number = 0; i < game?.playerCount; i++) {
            if (game?.activeRoleIds[i]) {
                newArray.push({
                    id: game.activeRoleIds[i],
                    uniqueId: crypto.randomUUID(),
                    name: roles.filter((role: Role) => role.id === game?.activeRoleIds[i])[0].name,
                })
            } else {
                newArray.push({
                    id: villager.id,
                    uniqueId: crypto.randomUUID(),
                    name: villager.name,
                })
            }
        }
        setInputs(newArray)
    }, [])

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
            currentPage="roles"
            gameId={game.id}
        />
        <Toolbar
            currentTab="activeRoles"
            tabs={[
                {
                    display: "Active Roles",
                    id: "activeRoles",
                    url: `/games/${params.gameId}/set-active-roles`,
                    emoji: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M19 5.5a4.5 4.5 0 01-4.791 4.49c-.873-.055-1.808.128-2.368.8l-6.024 7.23a2.724 2.724 0 11-3.837-3.837L9.21 8.16c.672-.56.855-1.495.8-2.368a4.5 4.5 0 015.873-4.575c.324.105.39.51.15.752L13.34 4.66a.455.455 0 00-.11.494 3.01 3.01 0 001.617 1.617c.17.07.363.02.493-.111l2.692-2.692c.241-.241.647-.174.752.15.14.435.216.9.216 1.382zM4 17a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>

                },
                {
                    display: "Assign Roles",
                    id: "assignRoles",
                    url: `/games/${params.gameId}/assign-roles`,
                    emoji: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" />
                    </svg>
                }
            ]}
        />
        <div className="p-5">
            <div className="w-full flex flex-col items-center">

                <form method="POST" className="flex flex-col items-center">

                    <div className="text-3xl font-bold">
                        Edit Active Roles
                    </div>

                    <div className="flex flex-row flex-wrap justify-center">

                        {inputs?.map((item, index) => <div className="flex flex-row justify-between items-center min-w-fit w-full sm:w-1/4 m-3" key={crypto.randomUUID()}>

                            <select
                                name={`roles[${index}]`}
                                value={inputs.filter(i => i.uniqueId === item.uniqueId)[0].id}
                                onChange={e => {
                                    let newArray: {
                                        id: string,
                                        uniqueId: string,
                                        name: string
                                    }[] = []
                                    inputs.map(i => {
                                        if (i.uniqueId === item.uniqueId) newArray.push({
                                            id: e.target.value,
                                            uniqueId: item.uniqueId,
                                            name: roles.filter((role: Role) => role.id === e.target.value)[0].name
                                        })
                                        else newArray.push(i)
                                    })
                                    setInputs(i => newArray)
                                }}
                                className="bg-white font-bold text-lg rounded-lg text-licorice-800 my-2 py-1 hover:opacity-80 w-full"
                            >
                                {roles.map((role: Role) => <option key={crypto.randomUUID()} value={role.id}>
                                    {role.name}
                                </option>)}
                            </select>

                            <div className="p-2">
                                {RoleAlignmentEmojis[roles.filter((role: Role) => role.id === item.id)[0].alignment]}
                            </div>

                        </div>
                        )}

                    </div>

                    <button type="submit" className="text-xl border-[1px] border-neonblue hover:text-neonblue rounded-lg py-1 px-2 my-3 hover:bg-transparent bg-neonblue text-licorice-800 transition md:text-2xl">
                        Submit
                    </button>

                </form>
            </div>
        </div>
    </Layout>
}