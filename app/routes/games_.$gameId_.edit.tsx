import { GameRoles, User } from "@prisma/client";
import { LoaderFunction, json, redirect } from "@remix-run/node";
import { Link, useLoaderData, useNavigate, useParams } from "@remix-run/react";
import { useEffect, useState } from 'react'
import CharacterAvatar from "~/components/character-avatar";
import EditButton from "~/components/edit-button";
import GameEditToolbar from "~/components/game-edit-toolbar";
import Layout from "~/components/layout";
import { Modal } from "~/components/modal";
import { getGameById, requireHost } from "~/utils/games.server";
import { prisma } from "~/utils/prisma.server";
import { CharacterWithMods, GameWithMods } from "~/utils/types";
import { getUser } from "~/utils/users.server";

export const loader: LoaderFunction = async ({ request, params }) => {
    const { user } = await getUser(request)
    const { game } = await getGameById(params.gameId || '')
    if (!game) return redirect('/games')

    const { authorized, admin } = await requireHost(request, game.id)
    if (!authorized) return redirect(`/games/${params.gameId}`)

    const assignedRoles = await prisma.gameRoles.findUnique({
        where: {
            gameId: game.id
        }
    })

    const invitedCharacters = await prisma.character.findMany({
        where: {
            id: {
                in: game.pendingInviteIds
            }
        },
        select: {
            id: true,
            name: true,
            avatarUrl: true
        }
    })

    const requestedCharacters = await prisma.character.findMany({
        where: {
            id: {
                in: game.joinRequestIds
            }
        },
        select: {
            id: true,
            name: true,
            avatarUrl: true
        }
    })

    return json({ user, game, admin, assignedRoles, invitedCharacters, requestedCharacters })
}

export default function EditGame() {
    const loaderData = useLoaderData()
    const {
        user,
        game,
        admin,
        assignedRoles,
        invitedCharacters,
        requestedCharacters
    }: {
        user?: User,
        game?: GameWithMods,
        admin?: boolean,
        assignedRoles?: GameRoles,
        invitedCharacters?: CharacterWithMods[],
        requestedCharacters?: CharacterWithMods[]
    } = loaderData
    const params = useParams()
    const [confirmation, setConfirmation] = useState<any>(null)

    const confirm: (redirect: string, warning?: string) => void = (redirect, warning = 'Are you sure?') => {
        setConfirmation({
            redirect,
            warning
        })
    }

    const [timeDifference, setTimeDifference] = useState(0);
    const lastPhaseUpdate = game?.phases?.filter(phase => phase.id === game.currentPhaseId)[0]?.updatedAt

    useEffect(() => {
        if (lastPhaseUpdate) {
            const timer = setInterval(() => {

                const timestampDate = new Date(lastPhaseUpdate);
                const currentDate = new Date();
                const timeDifference = currentDate.getTime() - timestampDate.getTime();
                setTimeDifference(timeDifference);
            }, 1000)

            return () => clearInterval(timer)
        }
    }, [])

    return (
        <Layout
            user={user}
            navigation={true}
            navArray={[
                { name: 'Games', url: `/games`, id: 'games' },
                { name: game?.name || '', url: `/games/${params?.gameId}`, id: params?.gameId || '', parent: 'games' },
                { name: "Edit", url: `/games/${params?.gameId}/edit`, id: 'edit' || '', parent: params?.gameId }
            ]}
        >
            <GameEditToolbar
                currentPage="home"
                gameId={game?.id}
            />
            <div className="w-full flex flex-col">
                <div className="text-3xl font-semibold self-center my-5">
                    {game?.name} Host Zone
                </div>

                {admin && <div className="self-center italic font-light text-bittersweet mb-5">
                    Editing as Admin
                </div>}

                <div className="flex flex-col lg:flex-row justify-between w-full">

                    <div className="flex flex-col justify-center items-center bg-slate-200 text-licorice-800 w-full lg:min-w-[22rem] lg:w-[22rem] p-5">
                        <div className="py-3 font-bold text-2xl border-b-2 border-b-licorice-800 w-full flex flex-row items-center">
                            {game?.name} <EditButton link={`/games/${params.gameId}/edit/name`} />
                        </div>
                        <div className="py-2 text-lg w-full">
                            <div className="font-semibold text-xl">Status:</div>
                            <div className="ml-5 text-cinnabar">{game?.status}</div>
                        </div>
                        <div className="py-2 text-lg w-full">
                            <div className="font-semibold text-xl">Location:</div>
                            <div className="ml-5 flex flex-row items-center">{game?.location} <EditButton link={`/games/${params.gameId}/edit/location`} /></div>
                        </div>
                        <div className="py-2 text-lg w-full">
                            <div className="font-semibold text-xl">Active Players:</div>
                            <div className="ml-5 flex flex-row items-center">{game?.participatingCharacterIds.length} / {game?.playerCount} {game?.status === 'ENLISTING' && <EditButton link={`/games/${params.gameId}/edit/player-count`} />}</div>
                        </div>
                        <div className="py-2 text-lg w-full">
                            <div className="font-semibold text-xl">Game Rewards:</div>
                            <div className="ml-5 font-bold flex flex-row items-center">{game?.winnerCrowns}👑 {game?.winnerRubies}💎 / {game?.loserStrikes}❌ {game?.loserRubies}💎 <EditButton link={`/games/${params.gameId}/edit/awards`} /></div>
                        </div>
                        <div className="py-2 text-lg w-full">
                            <div className="font-semibold text-xl flex flex-row items-center">Hosts: <EditButton link={`/games/${params.gameId}/edit/hosts`} /></div>
                            <div className="ml-5 flex flex-col">{game?.hosts?.map(host => <Link to={`/profile/${host.slug}`} key={host.id}>
                                @{host.username}
                            </Link>)}
                                {game?.hosts?.length === 0 && <div className="text-bittersweet">None</div>}
                            </div>
                        </div>
                        {game?.status === "ENLISTING" && <div className="py-2 text-lg w-full">
                            <Link to={`/games/${params.gameId}/edit/game-messages`} className="font-semibold text-xl underline hover:no-underline cursor-pointer flex flex-row items-center">
                                Edit Custom Game Messages <EditButton />
                            </Link>
                        </div>}
                        <div className="py-2 text-lg w-full">
                            <Link to={`/games/${params.gameId}/edit/chat`} className="font-semibold text-xl underline hover:no-underline cursor-pointer flex flex-row items-center">
                                Edit Game Chat Channels <EditButton />
                            </Link>
                        </div>
                    </div>

                    <div className="flex flex-col justify-center items-center w-full py-5">

                        <div className="rounded-xl py-5 px-8 m-5 bg-zinc-700 text-zinc-200 w-3/4">
                            <div className="py-3 font-bold text-2xl w-full flex flex-row justify-center items-center">
                                {game?.status === 'ENLISTING' ? <>
                                    Recruits <EditButton link={`/games/${params.gameId}/edit/characters`} />
                                </> : "Players"}
                            </div>
                            {game?.participatingCharacters?.length !== 0 ? game?.participatingCharacters?.map(char => <Link to={`/gm-realm/characters/${char.id}`} key={char.id} className="flex flex-row items-center py-2">
                                <CharacterAvatar
                                    avatarUrl={char?.avatarUrl || undefined}
                                    size={"SMALL"}
                                />
                                <div className={`mx-4 text-lg font-semibold`}>
                                    <div>{char.name}</div>
                                </div>
                            </Link>) : ""}

                            {game?.status === 'ENLISTING' ? <>
                                <div className="py-3 font-bold text-2xl w-full flex flex-row justify-center items-center">
                                    Join Requests <EditButton link={`/games/${params.gameId}/edit/characters`} />
                                </div>
                                {requestedCharacters?.length !== 0 ? requestedCharacters?.map(char => <Link to={`/gm-realm/characters/${char.id}`} key={char.id} className="flex flex-row items-center py-2">
                                    <CharacterAvatar
                                        avatarUrl={char?.avatarUrl || undefined}
                                        size={"SMALL"}
                                    />
                                    <div className={`mx-4 text-lg font-semibold`}>
                                        <div>{char.name}</div>
                                    </div>
                                </Link>) : "No Join Requests!"}
                            </> : ""}

                            {game?.status === 'ENLISTING' ? <>
                                <div className="py-3 font-bold text-2xl w-full flex flex-row justify-center items-center">
                                    Pending Invites <EditButton link={`/games/${params.gameId}/edit/characters`} />
                                </div>
                                {invitedCharacters?.length !== 0 ? invitedCharacters?.map(char => <Link to={`/gm-realm/characters/${char.id}`} key={char.id} className="flex flex-row items-center py-2">
                                    <CharacterAvatar
                                        avatarUrl={char?.avatarUrl || undefined}
                                        size={"SMALL"}
                                    />
                                    <div className={`mx-4 text-lg font-semibold`}>
                                        <div>{char.name}</div>
                                    </div>
                                </Link>) : "No Pending Invites!"}
                            </> : ""}
                        </div>

                        {game?.status === "ENLISTING" ? <div className="rounded-xl p-5 m-5 bg-tropicalindigo text-white w-3/4">
                            {game.participatingCharacterIds.length < game.playerCount ? <div className="flex flex-row justify-center items-center py-2">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-3">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                                </svg>
                                You need {game.playerCount - game.participatingCharacterIds.length} more players to start the game!
                            </div> : ""}
                            {game.activeRoleIds.length === 0 ? <div className="flex flex-row justify-center items-center py-2">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-3">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                                </svg>
                                Be sure to set the active roles!
                            </div> : !(game?.activeRoleIds?.length === game.playerCount &&
                                assignedRoles &&
                                assignedRoles.assignedRoles.length === game.playerCount) ? <div className="flex flex-row justify-center items-center py-2">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-3">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                                </svg>
                                Time to assign roles!
                            </div> : ""}
                            {game?.activeRoleIds?.length === game.playerCount && assignedRoles &&
                                assignedRoles.assignedRoles.length === game.playerCount && !(
                                    JSON.stringify((assignedRoles.assignedRoles.map(pairing => pairing.roleId)).sort()) === JSON.stringify(game.activeRoleIds.sort())
                                ) ? <div className="flex flex-row justify-center items-center py-2">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-3">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                                </svg>
                                Active roles do not match assigned roles!
                            </div> : ""}
                            {game?.participatingCharacters?.length === game.playerCount &&
                                game?.activeRoleIds?.length === game.playerCount &&
                                assignedRoles &&
                                assignedRoles.assignedRoles.length === game.playerCount &&
                                JSON.stringify((assignedRoles.assignedRoles.map(pairing => pairing.roleId)).sort()) === JSON.stringify(game.activeRoleIds.sort()) ? <div className="flex flex-row justify-center items-center py-2">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-3">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                                </svg>
                                You are ready to start the game!
                                Double check the game info, set some custom game messages,
                                and when you're ready to get started,
                                publish the Day 1 phase with a greeting message to kick things off! Good luck!
                            </div> : ""}
                        </div> : game?.status === 'ONGOING' ? <div className="rounded-xl p-5 m-5 bg-tropicalindigo text-white w-3/4">
                            <div className="flex flex-row justify-center items-center py-2">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 mr-3">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                                </svg>
                                Time since last report: {`
                                ${Math.floor(timeDifference / (1000 * 60 * 60))}h 
                                ${Math.floor(timeDifference / (1000 * 60)) % 60}m 
                                ${Math.floor(timeDifference / 1000) % 60}s
                                `}
                            </div>
                        </div> : ""}


                        <div className="flex flex-row justify-center items-center py-3">

                            <div className="mr-5">
                                <div>
                                    {game?.status === 'ENLISTING' ? (
                                        game?.participatingCharacters?.length === game.playerCount &&
                                            game?.activeRoleIds?.length === game.playerCount &&
                                            assignedRoles &&
                                            assignedRoles.assignedRoles.length === game.playerCount &&
                                            JSON.stringify((assignedRoles.assignedRoles.map(pairing => pairing.roleId)).sort()) === JSON.stringify(game.activeRoleIds.sort()) ? <Link
                                                to={`/games/${game.id}/reports/edit`}
                                                className="cursor-pointer text-xl border-[1px] border-lime-500 text-lime-500 rounded-lg py-1 px-2 hover:bg-lime-500 hover:text-licorice-800 transition md:text-2xl"
                                            >
                                            Start Game
                                        </Link> : <div
                                            className="cursor-not-allowed text-xl border-[1px] border-slate-500 text-slate-500 rounded-lg py-1 px-2 hover:bg-slate-500 hover:text-licorice-800 transition md:text-2xl"
                                        >
                                            <del>Start Game</del>
                                        </div>) : game?.status === 'ONGOING' ? <div
                                            onClick={() => confirm(`/games/${params.gameId}/end-game`, 'Are you sure you want to complete the game?')}
                                            className="cursor-pointer text-xl border-[1px] border-lime-500 text-lime-500 rounded-lg py-1 px-2 hover:bg-lime-500 hover:text-licorice-800 transition md:text-2xl"
                                        >
                                            Complete Game
                                        </div> : <div className="text-xl ml-2">
                                        Game Complete!
                                    </div>}
                                </div>
                            </div>

                            {(game?.status === "ENLISTING" || game?.status === "ONGOING") && <div>
                                <div
                                    onClick={() => confirm(`/games/${params.gameId}/reset-game`, 'Are you really sure you want to reset the game? This action is irreversible.')}
                                    className="cursor-pointer text-xl border-[1px] border-bittersweet bg-bittersweet text-licorice-800 rounded-lg py-1 px-2 my-3 hover:bg-transparent hover:text-bittersweet transition md:text-2xl"
                                >
                                    Reset Game
                                </div>
                            </div>}
                        </div>

                    </div>
                </div>
            </div>

            {!confirmation ? '' : <Modal isOpen={true} onClick={() => setConfirmation(null)}>
                <div className="flex flex-col ">
                    <div className="text-bittersweet text-center text-xl p-5">
                        {confirmation.warning}
                    </div>

                    <div className="flex flex-row self-end">
                        <Link
                            to={confirmation.redirect}
                            onClick={() => setConfirmation(null)}
                            className="cursor-pointer text-xl border-[1px] border-neonblue text-white bg-neonblue rounded-lg py-1 px-2 my-3 mr-5 hover:bg-transparent hover:text-neonblue transition md:text-2xl"
                        >
                            Confirm
                        </Link>
                        <div
                            className="cursor-pointer text-xl border-[1px] border-white text-white rounded-lg py-1 px-2 my-3 hover:bg-white hover:text-licorice-800 transition md:text-2xl"
                            onClick={() => setConfirmation(null)}
                        >
                            Cancel
                        </div>
                    </div>

                </div>
            </Modal>}
        </Layout>
    )
}