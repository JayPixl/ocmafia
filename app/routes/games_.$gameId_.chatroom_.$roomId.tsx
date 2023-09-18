import { GameChatMessage, GameChatRoom } from "@prisma/client";
import { ActionFunction, LoaderFunction, json, redirect } from "@remix-run/node";
import { Link, useFetcher, useLoaderData, useParams } from "@remix-run/react";
import { useState, useRef, useEffect } from "react";
import GameToolbar from "~/components/game-toolbar";
import Layout from "~/components/layout";
import { prisma } from "~/utils/prisma.server";
import { useLiveLoader } from "~/utils/use-live-loader";
import { getUser } from '~/utils/users.server'
import TextareaAutosize from 'react-textarea-autosize'
import { v4 } from "uuid";
import CharacterAvatar from "~/components/character-avatar";
import { getMyCharacterGameProfile } from "~/utils/roles.server";
import { requireHost } from "~/utils/games.server";
import UserCircle from "~/components/user-circle";

export const loader: LoaderFunction = async ({ request, params }) => {

    const { user } = await getUser(request)

    const chatrooms = await prisma.gameChatRoom.findMany({
        where: {
            gameId: params.gameId
        },
        select: {
            id: true,
            type: true,
            name: true,
            allowedPlayerIds: true
        }
    })

    const game = await prisma.game.findUnique({
        where: {
            id: params.gameId
        },
        select: {
            id: true,
            status: true,
        }
    })

    if (!game) return redirect(`/games`)

    const { authorized, admin } = await requireHost(request, params.gameId || '')

    if (authorized) return json({
        type: "HOST",
        user,
        chatrooms,
        authorized
    })

    if (game.status === "ENLISTING") {
        if (chatrooms.filter(room => room.type === "PRE_GAME")[0].id === params.roomId) {
            return json({
                type: "SPECTATOR",
                user,
                chatrooms: chatrooms.filter(room => room.type === "PRE_GAME")
            })
        } else return redirect(`/games/${params.gameId}`)
    }

    if (game.status === "COMPLETED") {
        if (chatrooms.filter(room => room.type === "POST_GAME")[0].id === params.roomId) {
            return json({
                type: "SPECTATOR",
                user,
                chatrooms: chatrooms.filter(room => room.type === "POST_GAME")
            })
        } else return redirect(`/games/${params.gameId}`)
    }

    const { character } = user ? await getMyCharacterGameProfile(user.id, params.gameId || '') : { character: undefined }

    if (!character) {
        const allowedRooms = chatrooms.filter(room => ["MEETING_ROOM", "ROLEPLAY"].includes(room.type))
        if (allowedRooms.filter(room => room.id === params.roomId).length !== 0) {
            return json({
                type: "SPECTATOR",
                user,
                chatrooms: allowedRooms
            })
        } else {
            return redirect(`/games/${params.gameId}`)
        }

    }

    const allowedRooms = [
        ...chatrooms.filter(room => ["MEETING_ROOM", "ROLEPLAY"].includes(room.type)),
        ...chatrooms.filter(room => room.type === "PRIVATE" && room.allowedPlayerIds.includes(character.id))
    ]
    if (allowedRooms.filter(room => room.id === params.roomId).length !== 0) {
        return json({
            type: "PARTICIPANT",
            user,
            character,
            chatrooms: allowedRooms
        })
    } else {
        return redirect(`/games/${params.gameId}`)
    }
}

export default function ChatRoom() {
    const params = useParams()

    const [inputs, setInputs] = useState({ message: '' })
    const [messages, setMessages] = useState<GameChatMessage[]>([])
    const [sending, setSending] = useState<boolean>(false)
    const [chatroomsOpen, setChatroomsOpen] = useState(false)
    const [userInfo, setUserInfo] = useState<any>({})
    //const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

    const formRef = useRef<HTMLFormElement>(null)

    useEffect(() => {
        getMessages()
        window.scrollTo(0, document.documentElement.scrollHeight)
    }, [])

    useEffect(() => {
        getUserInfo()
    }, [messages])

    const getMessages: () => void = () => {
        fetch(`/games/${params.gameId}/chatroom/${params.roomId}/get-messages`)
            .then(res => res.json())
            .then(data => {
                if (data.messages) {
                    setMessages(l => data.messages)
                    window.scrollTo(0, document.documentElement.scrollHeight)
                }
            })
    }

    const getUserInfo: () => void = () => {
        let newUsers: string[] = []
        let newCharacters: string[] = []
        messages.map(
            message => {
                if (
                    !userInfo?.[message.senderId] &&
                    !newUsers.includes(message.senderId) &&
                    !newCharacters.includes(message.senderId)
                ) {
                    ["HOST_USER", "SPECTATOR_USER"].includes(message.senderType) ?
                        newUsers.push(message.senderId) :
                        newCharacters.push(message.senderId)
                }
            }
        )

        newUsers.map(id => {
            fetch(`/fetch/users?id=${id}&returnUsernames=true&returnAvatars=true`)
                .then(res => res.json())
                .then(data => {
                    if (data?.results?.[0]) {
                        console.log(`RESULT: ${data.results[0].username}`)
                        setUserInfo((i: any) => {
                            return {
                                ...i,
                                [id]: {
                                    avatarUrl: data.results[0].avatar?.avatarUrl || undefined,
                                    name: data.results[0].username
                                }
                            }
                        })
                    }
                })
        })

        newCharacters.map(id => {
            fetch(`/fetch/characters?id=${id}&returncharacternames=true`)
                .then(res => res.json())
                .then(data => {
                    if (data?.results?.[0]) {
                        console.log(`RESULT: ${data.results[0].name}`)
                        setUserInfo((i: any) => {
                            return {
                                ...i,
                                [id]: {
                                    avatarUrl: data.results[0]?.avatarUrl || undefined,
                                    name: data.results[0].name
                                }
                            }
                        })
                    }
                })
        })
    }

    const { user, type, character, chatrooms, authorized } = useLiveLoader<typeof loader>(`/sse/chatroom/${params.roomId}`, "update", () => getMessages())


    const submitMessage: (e?: React.FormEvent<HTMLFormElement>) => void = (e) => {
        e && e.preventDefault()

        setMessages(m => [...messages, { content: inputs.message, senderId: user?.id, id: v4(), senderName: character?.name || user?.username, createdAt: new Date() } as GameChatMessage])
        setSending(t => true)

        const queryParams = new URLSearchParams
        queryParams.set('senderUserId', user?.id)
        queryParams.set('senderCharacterId', character?.id)
        queryParams.set('type', type)
        queryParams.set('content', inputs.message.trim())
        fetch(`/games/${params.gameId}/chatroom/${params.roomId}/send-message?${queryParams}`)
            .then(res => res.json())
            .then(data => {
                if (data?.success) {
                    setSending(t => false)
                    setInputs({ ...inputs, message: "" })
                }
            })
    }

    const deleteMessage: (messageId: string) => void = (messageId) => {
        const queryParams = new URLSearchParams
        queryParams.set('messageId', messageId)
        fetch(`/games/${params.gameId}/chatroom/${params.roomId}/delete-message?${queryParams}`)
    }

    return <Layout
        user={user}
        navigation={false}
    >
        <GameToolbar
            currentPage="chat"
            gameId={params.gameId}
            dashboard={!!character}
            host={authorized}
        />

        <div
            className={`fixed right-0 h-14 w-14 flex items-center justify-center rounded-bl-xl bg-zinc-950 text-white cursor-pointer transition ${chatroomsOpen ? "-translate-x-48" : "translate-x-0"}`}
            onClick={e => setChatroomsOpen(c => !chatroomsOpen)}
        >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8">
                <path d="M3.505 2.365A41.369 41.369 0 019 2c1.863 0 3.697.124 5.495.365 1.247.167 2.18 1.108 2.435 2.268a4.45 4.45 0 00-.577-.069 43.141 43.141 0 00-4.706 0C9.229 4.696 7.5 6.727 7.5 8.998v2.24c0 1.413.67 2.735 1.76 3.562l-2.98 2.98A.75.75 0 015 17.25v-3.443c-.501-.048-1-.106-1.495-.172C2.033 13.438 1 12.162 1 10.72V5.28c0-1.441 1.033-2.717 2.505-2.914z" />
                <path d="M14 6c-.762 0-1.52.02-2.271.062C10.157 6.148 9 7.472 9 8.998v2.24c0 1.519 1.147 2.839 2.71 2.935.214.013.428.024.642.034.2.009.385.09.518.224l2.35 2.35a.75.75 0 001.28-.531v-2.07c1.453-.195 2.5-1.463 2.5-2.915V8.998c0-1.526-1.157-2.85-2.729-2.936A41.645 41.645 0 0014 6z" />
            </svg>
        </div>

        <div className={`fixed right-0 w-48 py-3 bg-zinc-950 rounded-bl-xl ${chatroomsOpen ? "translate-x-0" : "translate-x-[100%]"} transition`}>
            {chatrooms.map((room: GameChatRoom) => <a
                href={`/games/${params.gameId}/chatroom/${room.id}`}
                key={room.id}
                className={`py-3 px-4 block hover:scale-105 transition ${room.id === params.roomId ? "font-bold" : ""}`}
            >
                {room.id === params.roomId ? "~" : ""} {room.name}
            </a>)}

        </div>

        <div className="w-full overflow-y-auto">
            {messages.map((message: GameChatMessage) => <div
                key={message.id}
                className="p-3 bg-licorice-700 hover:bg-licorice-800 flex flex-row"
            >
                <Link to={message.senderProfileLink || "#"}>
                    <CharacterAvatar
                        size="MEDIUM"
                        avatarUrl={userInfo?.[message.senderId]?.avatarUrl || message?.senderAvatarUrl || undefined}
                    />
                </Link>
                <div className="flex flex-col pl-3">

                    <div className="text-lg font-semibold flex flex-row items-center">
                        <Link to={message.senderProfileLink || "#"}>
                            <div>{userInfo?.[message.senderId]?.name || message?.senderName || "Anonymous"}</div>
                        </Link>
                        <div className="font-light italic text-sm ml-3">{new Date(message.createdAt).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</div>

                        {type === "HOST" && <div
                            className="text-bittersweet font-bold underline hover:no-underline ml-3 cursor-pointer"
                            onClick={e => deleteMessage(message.id)}
                        >
                            DELETE
                        </div>}
                    </div>

                    <div>
                        {message.content}
                    </div>
                </div>
            </div>)}
        </div>

        <form method="POST" action="send-message" ref={formRef} onSubmit={e => submitMessage(e)} className="w-full flex flex-col justify-center items-center bg-slate-900 shadow-sm p-3 fixed bottom-0">

            <div className="w-full md:w-3/4 bg-slate-800 flex flex-row items-center p-3 rounded-lg text-slate-200">

                {character ? <div className="mr-3">
                    <CharacterAvatar size="MEDIUM" avatarUrl={character?.avatarUrl || ""} />
                </div> : user ? <div className="mr-3">
                    <CharacterAvatar size="MEDIUM" avatarUrl={user?.avatar?.avatarUrl || ""} />
                </div> : ""}

                {sending ? <div
                    className=" w-full flex items-center justify-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 animate-spin">
                        <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
                    </svg>
                </div> : (type === "SPECTATOR" && (chatrooms.filter((room: GameChatRoom) => ["PRE_GAME", "POST_GAME"].includes(room.type))).length === 0) || !user?.id ? <div
                    className="bg-transparent w-full sm:text-lg md:text-xl focus:ring-0 focus-visible:ring-0 outline-none text-slate-500"
                >
                    You cannot send messages here...
                </div> : <TextareaAutosize
                    autoFocus
                    onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            submitMessage()
                        }
                    }}
                    maxLength={1000}
                    name="content"
                    placeholder="Send a message..."
                    value={inputs.message}
                    onChange={e => setInputs({
                        ...inputs,
                        message: e.target.value
                    })}
                    rows={1}
                    className="bg-transparent border-none resize-none w-full sm:text-lg md:text-xl focus:ring-0 focus-visible:ring-0 outline-none"
                />}

                <button type="submit" disabled={type === "SPECTATOR" || sending}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-slate-200">
                        <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
                    </svg>
                </button>
            </div>
        </form>
        <div className="pt-24 w-full bg-licorice-700" />
    </Layout>
}