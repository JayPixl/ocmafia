import { LoaderFunction, json } from "@remix-run/node";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import InputField from "~/components/input-field";
import { useState } from 'react'
import Layout from "~/components/layout";
import { getUser } from "~/utils/users.server";
import CharacterAvatar from "~/components/character-avatar";
import { prisma } from "~/utils/prisma.server";

export const loader: LoaderFunction = async ({ request }) => {
    const { user } = await getUser(request)
    const recentCharacters = await prisma.character.findMany({
        select: {
            id: true,
            name: true,
            avatarUrl: true,
            owner: {
                select: {
                    id: true,
                    username: true,
                    slug: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: 3
    })
    return json({ user, recentCharacters })
}

export default function Characters() {
    const { user, recentCharacters } = useLoaderData<typeof loader>()
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
        queryParams.set('returnownerusernames', 'true')
        queryParams.set('returncharacternames', 'true')
        fetcher.load(`/fetch/characters?${queryParams}`)
    }

    return (
        <Layout
            user={user}
            navigation={true}
            navArray={[{ name: "Grandmaster's Realm", id: "gm-realm", url: "/gm-realm" }, { name: "Characters", id: "characters", url: "/gm-realm/characters", parent: "gm-realm" }]}
        >
            <div className="p-8 flex flex-col items-center w-full">
                <div className="text-center text-4xl font-semibold">Characters</div>
                <input
                    className="max-w-[30rem] w-[20rem] px-3 py-2 text-xl text-licorice-800 m-5 rounded-full"
                    type="search"
                    onChange={e => handleChange(e.target.value)}
                    placeholder="Search for Characters..."
                    value={inputs.search}
                />
                {inputs.search.length > 0 ? (fetcher?.data?.results?.length > 0 ? <div className="w-full flex flex-col justify-start items-start bg-licorice-600 rounded-xl">
                    <div className="p-5 text-lg font-semibold">Results:</div>
                    {fetcher?.data?.results?.map((char: any) => <div className="flex flex-row justify-center items-center w-full p-5" key={char.id}>
                        <Link className="font-semibold text-xl flex flex-row justify-center items-center" to={`/gm-realm/characters/${char.id}`}>
                            <CharacterAvatar avatarUrl={char.avatarUrl || null} size="SMALL" />
                            <div className="mx-2">{char.name}</div>
                        </Link>
                        <Link to={`/profile/${char.owner.slug}`}>(@{char.owner.username})</Link>
                    </div>)}
                </div> : (fetcher.state === 'loading' ? <div className="w-full flex flex-col justify-start items-center bg-licorice-600 rounded-xl p-5">
                    <div className="h-8 w-8 border-transparent border-t-licorice-900 border-4 animate-spin rounded-full" />
                </div> : <div className="w-full flex flex-col justify-start items-center bg-licorice-600 rounded-xl">
                    <div className="p-5 text-2xl font-semibold">No Results!</div>
                </div>)) : <div className="w-full flex flex-col justify-start items-center bg-licorice-600 rounded-xl">
                    <div className="p-5 text-2xl font-semibold">Newest Characters:</div>
                    {recentCharacters.map((char: any) => <div className="flex flex-row justify-center items-center w-full p-5" key={char.id}>
                        <Link className="font-semibold text-xl flex flex-row justify-center items-center" to={`/gm-realm/characters/${char.id}`}>
                            <CharacterAvatar avatarUrl={char.avatarUrl || null} size="SMALL" />
                            <div className="mx-2">{char.name}</div>
                        </Link>
                        <Link to={`/profile/${char.owner.slug}`}>(@{char.owner.username})</Link>
                    </div>)}
                </div>}
            </div>
        </Layout>
    )
}