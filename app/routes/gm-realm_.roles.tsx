import { LoaderFunction, json } from "@remix-run/node";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import { useState } from 'react'
import Layout from "~/components/layout";
import { getUser } from "~/utils/users.server";
import CharacterAvatar from "~/components/character-avatar";
import { prisma } from "~/utils/prisma.server";
import { Role } from "@prisma/client";
import { RoleAlignmentEmojis } from "~/utils/constants";

export const loader: LoaderFunction = async ({ request }) => {
    const { user } = await getUser(request)
    let randomRoles: Role[] = [];
    const roles = await prisma.role.findMany({
        select: {
            id: true,
            name: true,
            alignment: true,
            description: true,
            imageUrl: true
        }
    })

    for (let i: number = 0; i < 3; i++) {
        randomRoles.push(roles[Math.floor(Math.random() * roles.length)] as Role)
    }

    return json({ user, randomRoles })
}

export default function Characters() {
    const { user, randomRoles } = useLoaderData()
    const fetcher = useFetcher()
    const [inputs, setInputs] = useState({
        search: ''
    })

    const handleChange: (input: string) => void = (input) => {
        setInputs({
            ...inputs,
            search: input
        })
        const queryParams = new URLSearchParams
        queryParams.set('name', input)
        fetcher.load(`/fetch/roles?${queryParams}`)
    }

    return (
        <Layout
            user={user}
            navigation={true}
            navArray={[{ name: "Grandmaster's Realm", id: "gm-realm", url: "/gm-realm" }, { name: "Roles", id: "roles", url: "/gm-realm/roles", parent: "gm-realm" }]}
        >
            <div className="p-8 flex flex-col items-center w-full">
                <div className="my-3 w-full text-right font-lg">
                    <Link to={`/gm-realm/roles/all`}>All Roles →</Link>
                </div>
                <div className="text-center text-4xl font-semibold">Roles</div>
                <input
                    className="max-w-[30rem] w-[20rem] px-3 py-2 text-xl text-licorice-800 m-5 rounded-full"
                    type="search"
                    onChange={e => handleChange(e.target.value)}
                    placeholder="Search for Roles..."
                    value={inputs.search}
                />
                {inputs.search.length > 0 ? (fetcher?.data?.results?.length > 0 ? <div className="w-full flex flex-col justify-start items-start bg-licorice-600 rounded-xl">
                    <div className="p-5 text-lg font-semibold">Results:</div>
                    {fetcher?.data?.results?.map((role: Role) => <div className="flex flex-row justify-center items-center w-full p-5" key={role.id}>
                        <Link className={`font-semibold text-xl`} to={`/gm-realm/roles/${role.id}`}>
                            <div className="mx-2">{role.name} {RoleAlignmentEmojis[role.alignment]}</div>
                        </Link>
                    </div>)}
                </div> : (fetcher.state === 'loading' ? <div className="w-full flex flex-col justify-start items-center bg-licorice-600 rounded-xl p-5">
                    <div className="h-8 w-8 border-transparent border-t-licorice-900 border-4 animate-spin rounded-full" />
                </div> : <div className="w-full flex flex-col justify-start items-center bg-licorice-600 rounded-xl">
                    <div className="p-5 text-2xl font-semibold">No Results!</div>
                </div>)) : <div className="w-full flex flex-col justify-start items-center bg-licorice-600 rounded-xl">
                    <div className="p-5 text-2xl font-semibold">Random Roles:</div>
                    {randomRoles.map((role: Role) => <div className="flex flex-row justify-center items-center w-full p-5" key={role.id}>
                        <Link className={`font-semibold text-xl`} to={`/gm-realm/roles/${role.id}`}>
                            <div className="mx-2">{role.name} {RoleAlignmentEmojis[role.alignment]}</div>
                        </Link>
                    </div>)}
                </div>}
            </div>
        </Layout>
    )
}