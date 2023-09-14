import { LoaderFunction, json } from "@remix-run/node";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import InputField from "~/components/input-field";
import { useState } from 'react'
import Layout from "~/components/layout";
import { getUser } from "~/utils/users.server";
import CharacterAvatar from "~/components/character-avatar";
import { prisma } from "~/utils/prisma.server";
import { getGameById, userHasActiveCharacter } from "~/utils/games.server";
import GameCard from "~/components/game-card";
import { PollingWatchKind } from "typescript";
import { GameWithMods } from "~/utils/types";

export const loader: LoaderFunction = async ({ request }) => {
    const { user } = await getUser(request)
    const recentGames = await prisma.game.findMany({
        select: {
            id: true,
            name: true,
            playerCount: true,
            participatingCharacterIds: true,
            status: true,
            mainHostId: true,
            location: true,
            winnerCrowns: true,
            winnerRubies: true,
            loserRubies: true,
            loserStrikes: true
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: 3
    })

    const currentlyHostingGames = user ? await prisma.game.findMany({
        where: {
            id: {
                in: (await prisma.user.findFirst({ where: { id: user?.id }, select: { hostingGameIds: true } }))?.hostingGameIds
            }
        }
    }) : []

    const { activeCharacter, error } = user ? await userHasActiveCharacter(user.id) : { activeCharacter: undefined, error: undefined }
    const { game } = activeCharacter && !error ? await getGameById(activeCharacter.currentGameId!) : { game: undefined }

    return json({ user, recentGames, currentGame: game, currentlyHostingGames })
}

export default function Games() {
    const { user, recentGames, currentGame, currentlyHostingGames } = useLoaderData<typeof loader>()
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
        fetcher.load(`/fetch/games?${queryParams}`)
    }

    return (
        <Layout
            user={user}
            navigation={true}
            navArray={[{ name: "Games", id: "games", url: "/games" }]}
        >
            <div className="p-8 flex flex-col items-center w-full">
                <div className="p-5 w-full lg:w-4/5 flex flex-col justify-start items-start bg-licorice-600 rounded-xl">
                    <div className="flex flex-col items-center justify-center text-4xl lg:text-5xl font-bold w-full py-3 mb-3 border-b-2 border-licorice-950">
                        Games
                    </div>
                    <div className="flex flex-col w-full">
                        <div className="w-full flex flex-col items-center justify-center xl:justify-start">
                            <input
                                className="max-w-[30rem] w-[20rem] px-3 py-2 text-xl text-licorice-800 m-5 rounded-full"
                                type="search"
                                onChange={e => handleChange(e.target.value)}
                                placeholder="Search for Games..."
                                value={inputs.search}
                            />

                            {inputs.search.length !== 0 ? (fetcher?.data?.results?.length !== 0 ? <>
                                <div className="p-5 text-lg font-semibold self-start">Search results:</div>
                                {fetcher?.data?.results?.map((game: any) => <GameCard
                                    game={game}
                                />)}
                            </> : (fetcher.state === 'loading' ? <>
                                <div className="h-8 w-8 border-transparent border-t-licorice-900 border-4 animate-spin rounded-full" />
                            </> : <>
                                <div className="p-5 text-2xl font-semibold">No Results!</div>
                            </>)) : <>
                                {currentGame && <div className="w-full flex flex-col justify-center items-center p-3">
                                    <div className="p-5 text-2xl font-semibold">
                                        Current Game:
                                    </div>
                                    <GameCard
                                        game={currentGame}
                                    />
                                </div>}

                                {currentlyHostingGames.length !== 0 && <div className="w-full flex flex-col justify-center items-center p-3">
                                    <div className="p-5 text-2xl font-semibold">
                                        Currently Hosting:
                                    </div>
                                    {currentlyHostingGames.map((game: GameWithMods) =>
                                        <GameCard
                                            game={game}
                                        />)}
                                </div>}

                                <div className="w-full flex flex-col justify-start items-center bg-licorice-600 rounded-xl">
                                    <div className="p-5 text-2xl font-semibold">Recent Games:</div>
                                    {recentGames.map((game: any) => <GameCard
                                        game={game}
                                    />)}
                                </div>
                            </>}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}