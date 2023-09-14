import { AvatarColors, AvatarTypes, GameStatus } from "@prisma/client"
import { Link } from "@remix-run/react"
import { useEffect, useState } from "react"
import { GameWithMods } from "~/utils/types"
import CharacterAvatar from "./character-avatar"
import UserCircle from "./user-circle"

interface props {
    game: GameWithMods
}

export default function GameCard({ game }: props) {
    const [hostInfo, setHostInfo] = useState({ username: "...", avatar: { avatarType: "COLOR", avatarColor: "GREEN", avatarUrl: undefined } })
    useEffect(() => {
        if (game?.mainHostId) {
            fetch(`/fetch/users?id=${game.mainHostId}&returnAvatars=true&returnUsernames=true`)
                .then(res => res.json())
                .then(data => {
                    data?.results?.[0]?.username ?
                        setHostInfo({ username: data.results[0].username, avatar: data.results[0].avatar }) :
                        setHostInfo({ ...hostInfo, username: "Not Available" })
                })
        }

    }, [])

    return <>
        <Link
            to={`/games/${game.id}`}
            className="hidden md:block relative hover:scale-105 transition bg-cover bg-center m-3 w-full min-w-[26rem] max-w-[36rem] h-36 rounded-xl text-slate-950 border-2 border-slate-950"
            style={{ backgroundImage: "url(https://cdn.pixabay.com/photo/2015/12/03/08/50/paper-1074131_1280.jpg)" }}
            key={game.id}
        >
            <div className="w-full h-full backdrop-blur-[2px] p-3" />

            <div className="absolute left-3 top-3 flex flex-col">
                <div className="font-bold text-3xl font-dancing-script">{game.name}</div>
                <div className="font-semibold italic">{game.location}</div>
            </div>

            <div className="absolute bottom-3 left-3 text-lg">
                <div>{game.status} {game.status === "ENLISTING" ? `(${game.participatingCharacterIds.length}/${game.playerCount})` : ""}</div>
            </div>

            <div className="absolute bottom-3 right-3 font-bold">
                {game?.winnerCrowns}👑 {game?.winnerRubies}💎 / {game?.loserStrikes}❌ {game?.loserRubies}💎
            </div>

            {game?.mainHostId && <div className="absolute top-3 right-3 flex flex-row items-center">
                <div className="mr-2">Hosted by <span className="font-semibold">{hostInfo.username}</span></div>
                <UserCircle
                    username={hostInfo.username}
                    avatarType={hostInfo.avatar.avatarType as AvatarTypes}
                    avatarColor={hostInfo.avatar.avatarColor as AvatarColors}
                    avatarUrl={hostInfo.avatar.avatarUrl}
                    size="SMALL"
                />
            </div>}

        </Link>
        <Link
            to={`/games/${game.id}`}
            className="block md:hidden relative hover:scale-105 transition bg-cover bg-center m-3 w-full h-64 rounded-xl text-slate-950 border-2 border-slate-950"
            style={{ backgroundImage: "url(https://cdn.pixabay.com/photo/2015/12/03/08/50/paper-1074131_1280.jpg)" }}
            key={game.id}
        >
            <div className="w-full h-full backdrop-blur-[2px] p-3 flex flex-col">
                <div className="font-bold text-2xl font-dancing-script">{game.name}</div>
                <div className="font-semibold italic border-b-2 border-slate-950 pb-2 mb-2">{game.location}</div>
                <div>{game.status} {game.status === "ENLISTING" ? `(${game.participatingCharacterIds.length}/${game.playerCount})` : ""}</div>

                <div className="font-bold">
                    {game?.winnerCrowns}👑 {game?.winnerRubies}💎 / {game?.loserStrikes}❌ {game?.loserRubies}💎
                </div>

                {game?.mainHostId && <div className="absolute bottom-3 right-3 flex flex-row items-center">
                    <div className="mr-2">Hosted by <span className="font-semibold">{hostInfo.username}</span></div>
                    <UserCircle
                        username={hostInfo.username}
                        avatarType={hostInfo.avatar.avatarType as AvatarTypes}
                        avatarColor={hostInfo.avatar.avatarColor as AvatarColors}
                        avatarUrl={hostInfo.avatar.avatarUrl}
                        size="SMALL"
                    />
                </div>}
            </div>
        </Link>
    </>
}