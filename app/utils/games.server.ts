import { ActionType, Alignment, EventTypes, Game, GameCharacterStatus, Phase, Prisma, Time } from "@prisma/client"
import { prisma } from "./prisma.server"
import { requireClearance } from "./users.server"
import { CharacterWithMods, GameWithMods, PhaseWithMods } from "./types"
import { sendMessage } from "./inbox.server"

export const createGame: (form: {
    gameName: string,
    location: string,
    playerCount: number
}) => Promise<{
    error?: string,
    newGame?: Game
}> = async (form) => {
    const newGame = await prisma.game.create({
        data: {
            name: form.gameName,
            location: form.location,
            playerCount: form.playerCount,
            phases: {
                create: {
                    time: 'DAY',
                    dayNumber: 1,
                    draft: true,
                    events: {
                        create: {
                            draft: true,
                            message: 'Welcome, players! The Game begins now...',
                            type: 'GAME_START'
                        }
                    },
                    characterStatus: {
                        create: {

                        }
                    }
                }
            },
            gameMessages: {
                create: {
                    messages: [
                        { event: 'KILL', message: '@@ has died!' },
                        { event: 'RESURRECTION', message: '@@ has come back to life!' },
                        { event: 'WOUND', message: '@@ has been wounded!' },
                        { event: 'VOTING_EXECUTION', message: '@@ has been executed!' },
                        { event: 'VOTING_SKIP', message: 'The voting phase has been skipped for the day!' },
                        { event: 'QUIET_NIGHT', message: 'Nothing to report tonight...' },
                        { event: 'GAME_START', message: 'Welcome, players! The Game begins now...' },
                        { event: 'GAME_END', message: 'The Game is over!' },
                    ]
                }
            },
            status: 'ENLISTING',
            gameRoles: {
                create: {

                }
            },
            winnerCrowns: 1,
            winnerRubies: 25,
            loserStrikes: 1,
            loserRubies: 10,
            chatRooms: {
                createMany: {
                    data: [
                        {
                            name: "Meeting Room",
                            type: "MEETING_ROOM",
                        },
                        {
                            name: "Pre-Game",
                            type: "PRE_GAME",
                        },
                        {
                            name: "Post-Game",
                            type: "POST_GAME",
                        },
                        {
                            name: "RP 1",
                            type: "ROLEPLAY",
                        },
                        {
                            name: "RP 2",
                            type: "ROLEPLAY",
                        },
                        {
                            name: "RP 3",
                            type: "ROLEPLAY",
                        },
                        {
                            name: "Mafia Chat",
                            type: "PRIVATE",
                        }
                    ]
                }
            }
        },
        include: {
            gameMessages: true
        }
    })

    if (!newGame) return {
        error: "Could not create new game"
    }

    return {
        newGame
    }
}

export const getGameById: (
    id: string
) => Promise<{
    error?: string,
    game?: Game,
    currentPhase?: PhaseWithMods
}> = async (id) => {
    const game = await prisma.game.findFirst({
        where: {
            id
        },
        include: {
            hosts: true,
            phases: {
                include: {
                    events: {
                        select: {
                            target: true,
                            actor: true,
                            phase: true,
                            targetId: true,
                            actorId: true,
                            clues: true,
                            draft: true,
                            id: true,
                            message: true,
                            phaseId: true,
                            type: true
                        }
                    },
                    characterStatus: true
                }
            },
            participatingCharacters: {
                select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                    ownerId: true,
                    owner: {
                        select: {
                            username: true,
                            id: true,
                            characters: true
                        }
                    }
                }
            },
            gameMessages: true,
        }
    })


    let currentPhase: PhaseWithMods | undefined = undefined

    if (game?.currentPhaseId) {
        currentPhase = (await prisma.phase.findFirst({
            where: {
                id: game?.currentPhaseId || ''
            },
            select: {
                dayNumber: true,
                time: true,
                game: true,
                events: true,
                gameId: true,
                id: true,
                draft: true,
                characterStatus: true
            }
        })) as PhaseWithMods
    }

    if (!game) return { error: "Could not find game with that id" }
    return { game, currentPhase }
}

export const getFilteredGames: (
    filters?: Prisma.GameWhereInput
) => Promise<{
    error?: string,
    games?: Game[]
}> = async (filters) => {
    const games = await prisma.game.findMany({
        where: { ...filters },
    })
    if (!games.length) return { error: "Could not find games with those parameters" }
    return { games }
}

export const requireHost: (
    request: Request,
    gameId: string
) => Promise<{
    error?: string,
    authorized: boolean,
    admin?: boolean
}> = async (request, gameId) => {
    const { user, error, authorized } = await requireClearance(request, "ADMIN")
    if (authorized) return { authorized, admin: true }
    if (!user) return { error: "Could not find user", authorized: false }

    const result = await prisma.game.findFirst({
        where: {
            id: gameId,
            hosts: {
                some: {
                    id: user.id
                }
            }
        }
    })

    if (!result) return { error: "You are not a host for this game", authorized: false }
    return { authorized: true }
}

export const editGame: (
    form: {
        name?: string,
        location?: string,
        playerCount?: number,
        winnerCrowns?: number,
        loserStrikes?: number,
        winnerRubies?: number,
        loserRubies?: number
    },
    gameId: string
) => Promise<{
    error?: string,
    newGame?: Game
}> = async (form, gameId) => {
    const { game } = await getGameById(gameId)
    if (!game) return { error: "No game found by that Id" }

    const result = await prisma.game.update({
        where: {
            id: gameId
        },
        data: {
            ...form
        }
    })

    if (!result) return { error: "Bad database request" }
    return { newGame: result }
}

export const manageHosts: (
    form: {
        hostId?: string,
        gameId: string,
        action: string
    },
    request: Request
) => Promise<{
    error?: string,
    newGame?: Game
}> = async ({ hostId, gameId, action }, request) => {
    const game = await prisma.game.findUnique({
        where: {
            id: gameId
        }
    })
    if (!game) return {
        error: "Could not find a valid game"
    }

    let host = await prisma.user.findUnique({
        where: {
            id: hostId
        }
    })

    if (!host) return {
        error: "Could not find host"
    }

    if (action === 'add') {
        if (
            (await prisma.user.findFirst({
                where: {
                    id: host.id,
                    hostingGameId: game.id
                }
            }))
        ) return {
            error: "This host is already added!"
        }

        if (
            (await prisma.user.findFirst({
                where: {
                    id: host.id
                },
                select: {
                    hostingGameId: true
                }
            }))?.hostingGameId
        ) return {
            error: "This host is hosting another game!"
        }
        const result = await prisma.game.update({
            where: {
                id: game.id
            },
            data: {
                hosts: {
                    connect: {
                        id: host.id
                    }
                }
            }
        })
        if (!result) return {
            error: "Something went wrong in adding new Host"
        }
        return {
            newGame: result
        }
    } else if (action === 'delete') {
        const result = await prisma.game.update({
            where: {
                id: game.id
            },
            data: {
                hosts: {
                    disconnect: {
                        id: host.id
                    }
                }
            }
        })
        if (!result) return {
            error: "Something went wrong in removing host"
        }
        return {
            newGame: result
        }
    } else {
        return {
            error: "Invalid action"
        }
    }
}

export const manageCharacters: (
    form: {
        characterId?: string,
        gameId: string,
        action: string
    }
) => Promise<{
    error?: string,
    newGame?: Game
}> = async ({ characterId, gameId, action }) => {
    const game = await prisma.game.findUnique({
        where: {
            id: gameId
        }
    })
    if (!game) return {
        error: "Could not find a valid game"
    }

    let character = await prisma.character.findUnique({
        where: {
            id: characterId
        }
    })

    if (!character) return {
        error: "Could not find character"
    }

    let owner = await prisma.user.findFirst({
        where: {
            characters: {
                some: {
                    id: character.id
                }
            }
        }
    })

    if (!owner) return {
        error: "Could not find owner of this character"
    }

    if (action === 'add') {
        if (character.currentGameId === game.id) return {
            error: "This character is already added!"
        }

        if (character.currentGameId) return {
            error: "This character is already currently in a game!"
        }

        if (game.joinRequestIds.includes(character.id)) {

            const result = await prisma.game.update({
                where: {
                    id: game.id
                },
                data: {
                    participatingCharacters: {
                        connect: {
                            id: character.id
                        }
                    },
                    participatingPlayers: {
                        connect: {
                            id: owner.id
                        }
                    },
                    joinRequestIds: {
                        set: game.joinRequestIds.filter(id => id !== character?.id)
                    }
                }
            })

            const { activeCharacter, error } = await userHasActiveCharacter(character.ownerId)
            if (!error && activeCharacter) return {
                error: "You already have an active character!"
            };


            (await prisma.character.update({
                where: {
                    id: character.id
                },
                data: {
                    currentGameId: game.id
                }
            }));

            (await prisma.phase.findMany({ where: { gameId: game.id } })).map(async (phase) => {
                await prisma.phase.update({
                    where: {
                        id: phase.id
                    },
                    data: {
                        characterStatus: {
                            update: {
                                status: {
                                    push: {
                                        characterId: character!.id,
                                        characterName: character!.name,
                                        status: 'ALIVE'
                                    }
                                }
                            }
                        }
                    }
                })
            }
            );

            (await prisma.user.findMany({ where: { hostingGameId: game.id } })).map(async host => {
                await sendMessage(process.env.OCM_OFFICIAL_ID || '', host.id, `${character?.name} has joined ${game.name}!`, 'PLAYER_JOINED', `/games/${game.id}/`)
            })

            if (!result) return {
                error: "Something went wrong in adding new character"
            }
            return {
                newGame: result
            }

        } else {
            const result = await prisma.game.update({
                where: {
                    id: game.id
                },
                data: {
                    pendingInviteIds: {
                        push: [
                            character.id
                        ]
                    }
                }
            });

            if (!result) return {
                error: "Something went wrong in adding new character"
            }

            await sendMessage(process.env.OCM_OFFICIAL_ID || '', character.ownerId, `You've been invited to join ${game.name}!`, 'GAME_INVITE', `/games/${game.id}`)

            return {
                newGame: result
            }
        }

    } else if (action === 'delete') {
        const result = await prisma.game.update({
            where: {
                id: game.id
            },
            data: {
                participatingCharacters: {
                    disconnect: {
                        id: character.id
                    }
                },
                participatingPlayers: {
                    disconnect: {
                        id: owner.id
                    }
                },
            }
        });

        (await prisma.character.update({
            where: {
                id: character.id
            },
            data: {
                currentGameId: null
            }
        }));

        (await prisma.phase.findMany({ where: { gameId: game.id } })).map(async (phase) => {
            await prisma.phase.update({
                where: {
                    id: phase.id
                },
                data: {
                    characterStatus: {
                        update: {
                            status: {
                                deleteMany: {
                                    where: {
                                        characterId: character!.id
                                    }
                                }
                            }
                        }
                    }
                }
            })
        }
        )

        if (!result) return {
            error: "Something went wrong in removing Character"
        }
        return {
            newGame: result
        }
    } else {
        return {
            error: "Invalid action"
        }
    }
}

export const manageReports: (
    gameId: string,
    action: "update" | "add" | "publishPhase" | 'unpublishPhase' | "delete" | 'addPhase' | 'deletePhase',
    fields: {
        phaseId?: string,
        eventId?: string,
        type?: EventTypes,
        message?: string,
        clues?: string,
        actorId?: string,
        targetId?: string,
        draft?: boolean
    },
) => Promise<{
    error?: string,
    newGame?: GameWithMods
}> = async (gameId, action, fields) => {
    let game = ((await getGameById(gameId)).game as GameWithMods)
    if (!game) return {
        error: "Could not find game"
    }

    if (!fields?.phaseId) return {
        error: "Could not find phase"
    }

    const cluesArray = fields?.clues?.length === 0 ? [] : fields?.clues?.split("$$")

    switch (action) {
        case "add": {
            const event = await prisma.event.create({
                data: {
                    draft: fields.draft!,
                    type: fields?.type || 'KILL',
                    message: fields?.message || '',
                    clues: cluesArray,
                    ...(fields?.targetId ? { target: { connect: { id: fields?.targetId } } } : {}),
                    ...(fields?.actorId ? { actor: { connect: { id: fields?.actorId } } } : {}),
                    phase: {
                        connect: {
                            id: fields?.phaseId
                        }
                    }
                }
            })

            if (!event) return {
                error: "Could not create new event"
            }
            break
        }

        case "update": {
            if (!fields?.eventId) return {
                error: "Could not find event!"
            }
            const event = await prisma.event.update({
                where: {
                    id: fields.eventId
                },
                data: {
                    type: fields?.type || 'KILL',
                    message: fields?.message || '',
                    clues: cluesArray,
                    ...(fields?.targetId ? { target: { connect: { id: fields?.targetId } } } : { target: { disconnect: true } }),
                    ...(fields?.actorId ? { actor: { connect: { id: fields?.actorId } } } : { actor: { disconnect: true } }),
                    draft: fields?.draft ? true : false
                }
            })

            if (!event) return {
                error: "Could not update event"
            }
            break
        }

        case "delete": {
            if (!fields?.eventId) return {
                error: "Could not find event!"
            }
            const event = await prisma.event.delete({
                where: {
                    id: fields.eventId
                }
            })

            if (!event) return {
                error: "Could not delete event"
            }
            break
        }

        case "publishPhase": {
            const events = await prisma.event.findMany({
                where: {
                    phaseId: fields.phaseId
                }
            })

            if (!events) return {
                error: 'No events to publish!'
            }

            const event = await prisma.event.updateMany({
                where: {
                    phaseId: fields.phaseId
                },
                data: {
                    draft: false
                }
            })

            const phase = await prisma.phase.update({
                where: {
                    id: fields.phaseId
                },
                data: {
                    draft: false
                }
            })

            if (!event || !phase) return {
                error: "Could not publish phase"
            }

            const { error } = await updateCurrentPhase(game.id)

            if (error) return {
                error
            }

            const updatedGame = await prisma.game.findUnique({
                where: {
                    id: game.id
                }
            })

            if (!updatedGame) return {
                error: "Problem refreshing game"
            }

            const currentPhase = await prisma.phase.findFirst({
                where: {
                    id: updatedGame.currentPhaseId || ''
                },
                include: {
                    characterStatus: true
                }
            })

            if (!currentPhase) return {
                error: "Could not find current game phase"
            }

            const oldStatus = currentPhase.characterStatus?.status

            if (!oldStatus) return {
                error: "Problem finding old status"
            }

            const newPhase = await prisma.phase.create({
                data: {
                    time: currentPhase.time === 'DAY' ? 'NIGHT' : 'DAY',
                    dayNumber: currentPhase.time === 'DAY' ? currentPhase.dayNumber : (currentPhase.dayNumber || 1) + 1,
                    game: {
                        connect: {
                            id: game.id
                        }
                    },
                    characterStatus: {
                        create: {
                            status: oldStatus
                        }
                    },
                    actions: {
                        create: {

                        }
                    }
                }
            })

            if (!newPhase) return {
                error: 'Could not create new phase'
            }

            if (game.status === 'ENLISTING') {
                await startGame(game.id)
            } else {
                game.participatingCharacterIds.map(async id => await sendMessage(process.env.OCM_OFFICIAL_ID || '64dbab8c66b6b26e41e51a57', (await prisma.user.findFirst({ where: { characters: { some: { id } } } }))?.id || '', `A  new report has been published in ${game.name}!`, "PHASE_PUBLISHED", `/games/${game.id}`))
            }

            break
        }

        case "unpublishPhase": {
            if (game.currentPhaseId !== fields.phaseId) return {
                error: "Cannot unpublish a phase that isn't the most recent phase!"
            }

            const event = await prisma.event.updateMany({
                where: {
                    phaseId: fields.phaseId
                },
                data: {
                    draft: true
                }
            })

            const phase = await prisma.phase.update({
                where: {
                    id: fields.phaseId
                },
                data: {
                    draft: true
                }
            })

            if (!event || !phase) return {
                error: "Could not unpublish phase"
            };

            (await prisma.phase.findMany({ where: { gameId: game.id } })).map(async mappedPhase => {
                if (mappedPhase.dayNumber > phase.dayNumber || (
                    phase.time === 'DAY' &&
                    mappedPhase.time === 'NIGHT' &&
                    mappedPhase.dayNumber === phase.dayNumber
                )) {
                    await prisma.phase.delete({
                        where: {
                            id: mappedPhase.id
                        }
                    })
                }
            })

            const { error } = await updateCurrentPhase(game.id)

            if (error) return {
                error
            }

            break
        }

        case "addPhase": {
            break
        }
    }

    return {
        newGame: (await getGameById(gameId) as GameWithMods)
    }
}

export const manageGameMessages: (
    gameId: string,
    method: 'add' | 'delete' | 'edit',
    eventType: EventTypes,
    newMessage: string,
    oldMessage?: string,
) => Promise<{
    newGame?: GameWithMods,
    error?: string
}> = async (gameId, method, eventType, newMessage, oldMessage) => {
    const game = await prisma.game.findUnique({ where: { id: gameId } })

    if (!game) return {
        error: "Could not find game"
    }

    if (method !== 'delete') {
        const match = await prisma.eventMessages.findFirst({
            where: {
                gameId: gameId,
                messages: {
                    some: {
                        message: newMessage
                    }
                }
            }
        })
        if (match) return {
            error: 'Event by this name already exists! No duplicates.'
        }
    } else {
        if (game?.status !== 'ENLISTING') {
            return {
                error: "Cannot delete messages when game is in progress."
            }
        }
    }


    switch (method) {
        case 'add': {
            console.log("ADDING")
            const newMsg = await prisma.eventMessages.update({
                where: {
                    gameId: gameId
                },
                data: {
                    messages: {
                        push: [{
                            event: eventType,
                            message: newMessage
                        }]
                    }
                }
            })
            if (!newMsg) return {
                error: 'Could not add message...'
            }
            break
        }
        case 'edit': {
            console.log("EDITING")
            const newMsg = await prisma.eventMessages.update({
                where: {
                    gameId: gameId
                },
                data: {
                    messages: {
                        updateMany: {
                            where: {
                                message: oldMessage
                            },
                            data: {
                                message: newMessage
                            }
                        }
                    }
                }
            })
            if (!newMsg) return {
                error: 'Could not edit message...'
            };

            (await prisma.phase.findMany({ where: { gameId } })).map(async phase => {
                await prisma.phase.update({
                    where: {
                        id: phase.id
                    },
                    data: {
                        events: {
                            updateMany: {
                                where: {
                                    message: oldMessage
                                },
                                data: {
                                    message: newMessage
                                }
                            }
                        }
                    }
                })
            })

            break
        }
        case 'delete': {
            console.log("DELETING")
            if (!(await prisma.eventMessages.findMany({
                where: {
                    gameId: gameId,
                    messages: {
                        some: {
                            event: eventType
                        }
                    }
                }
            }))) return {
                error: 'Must be at least one message of each type!'
            }
            const newMsg = await prisma.eventMessages.update({
                where: {
                    gameId: gameId
                },
                data: {
                    messages: {
                        deleteMany: {
                            where: {
                                message: oldMessage
                            }
                        }
                    }
                }
            })
            if (!newMsg) return {
                error: 'Could not delete message...'
            }
            break
        }
    }

    const newGame = await prisma.game.findUnique({
        where: {
            id: gameId
        }
    })
    if (!newGame) return {
        error: "Could not find new game"
    }

    return {
        newGame
    }
}

export const updateCurrentPhase: (
    gameId: string
) => Promise<{
    error?: string,
    success?: boolean
}> = async (gameId) => {
    const game = await prisma.game.findUnique({
        where: {
            id: gameId
        },
        include: {
            phases: {
                select: {
                    draft: true,
                    events: true,
                    id: true
                }
            }
        }
    })

    if (!game) return {
        error: "Could not find Game"
    }

    let currentPhaseId: string | undefined

    game.phases.map(phase => {
        if (
            phase.draft === false
        ) {
            currentPhaseId = phase.id
        }
    })

    const result = await prisma.game.update({
        where: {
            id: gameId
        },
        data: {
            currentPhaseId: currentPhaseId ? currentPhaseId : null
        }
    })
    if (!result) return {
        error: "Could not update game"
    }

    return {
        success: true
    }
}

export const manageCharacterStatus: (
    phaseId: string,
    characterId: string,
    status: GameCharacterStatus
) => Promise<{
    error?: string,
    success?: boolean
}> = async (phaseId, characterId, status) => {

    const character = await prisma.character.findUnique({
        where: {
            id: characterId
        }
    })

    if (!character) return {
        error: "Could not find character"
    }

    const result = await prisma.phaseCharacterGameStatus.update({
        where: {
            phaseId
        },
        data: {
            status: {
                updateMany: {
                    where: {
                        characterId
                    },
                    data: {
                        characterId,
                        characterName: character?.name,
                        status
                    }
                }
            }
        }
    })

    if (!result) return {
        error: "Could not update phase"
    }

    return {
        success: true
    }
}

export const startGame: (
    id: string
) => Promise<{
    error?: string,
    newGame?: GameWithMods
}> = async (id) => {
    const game = await prisma.game.findUnique({
        where: {
            id
        }
    })
    if (!game) return {
        error: "Could not find game"
    }

    const moddedGame: GameWithMods = game as GameWithMods

    const assignedRoles = await prisma.gameRoles.findUnique({
        where: {
            gameId: game.id
        }
    })

    if (
        game.status !== 'ENLISTING' ||
        moddedGame.participatingCharacterIds.length !== moddedGame.playerCount ||
        game.activeRoleIds.length !== moddedGame.playerCount ||
        !assignedRoles ||
        assignedRoles?.assignedRoles.length !== moddedGame.playerCount ||
        JSON.stringify((assignedRoles?.assignedRoles?.map(pairing => pairing.roleId))?.sort()) !== JSON.stringify((moddedGame.activeRoleIds).sort())
    ) return {
        error: "Could not start game"
    }

    const newGame = (await prisma.game.update({
        where: {
            id: game.id
        },
        data: {
            status: 'ONGOING'
        }
    })) as GameWithMods

    return {
        newGame
    }
}

export const toggleGameJoinRequest: (
    characterId: string,
    gameId: string
) => Promise<{
    error?: string,
    newGame?: GameWithMods
}> = async (characterId, gameId) => {
    const game = (
        await prisma.game.findUnique({
            where: {
                id: gameId
            },
            select: {
                joinRequestIds: true,
                pendingInviteIds: true
            }
        })
    )

    if (
        game?.joinRequestIds.includes(characterId)
    ) {

        const newGame = await prisma.game.update({
            where: {
                id: gameId
            },
            data: {
                joinRequestIds: {
                    set: [...game.joinRequestIds.filter(val => val !== characterId)]
                }
            }
        })

        if (!newGame) return {
            error: "Could not update game"
        }

        return {
            newGame
        }

    } else if (game?.pendingInviteIds.includes(characterId)) {

        await prisma.game.update({
            where: {
                id: gameId
            },
            data: {
                joinRequestIds: {
                    push: [
                        characterId
                    ]
                },
                pendingInviteIds: {
                    set: game.pendingInviteIds.filter(id => id !== characterId)
                }
            }
        })

        const { error, newGame } = await manageCharacters({ characterId, gameId, action: 'add' })

        if (!newGame || error) return {
            error
        }

        return {
            newGame
        }

    } else {

        const newGame = await prisma.game.update({
            where: {
                id: gameId
            },
            data: {
                joinRequestIds: {
                    push: [
                        characterId
                    ]
                }
            }
        })

        if (!newGame) return {
            error: "Could not update game"
        }

        return {
            newGame
        }

    }
}

export const userHasActiveCharacter: (
    userId: string
) => Promise<{
    activeCharacter?: CharacterWithMods,
    success?: boolean,
    error?: string
}> = async (userId) => {
    const user = await prisma.user.findUnique({
        where: {
            id: userId
        }
    })
    if (!user) return {
        error: "Could not find user"
    }

    const activeCharacter = (await prisma.character.findMany({
        where: {
            ownerId: userId,
            currentGameId: {
                not: null
            }
        }
    }))[0]

    return {
        activeCharacter,
        success: true
    }
}

export const EndGame: (
    gameId: string,
    winnerIds: string[],
    winningFaction: Alignment
) => Promise<{
    error?: string,
    newGame?: GameWithMods
}> = async (gameId, winnerIds, winningFaction) => {
    const game = await prisma.game.findUnique({
        where: {
            id: gameId
        }
    })

    if (!game) return {
        error: "Could not find game"
    }

    if (game.status !== 'ONGOING') return {
        error: "Game is not ready to complete!"
    }

    await prisma.game.update({
        where: {
            id: game.id
        },
        data: {
            status: 'COMPLETED',
            gameWinnerIds: winnerIds,
            winningFaction,
            hosts: {
                set: []
            }
        }
    })

    await prisma.character.updateMany({
        where: {
            currentGameId: game.id
        },
        data: {
            currentGameId: null
        }
    })

    const gameMessages = await prisma.eventMessages.findFirst({
        where: {
            gameId: game.id
        }
    })

    const currentPhase = game.currentPhaseId ? await prisma.phase.update({
        where: {
            id: game.currentPhaseId
        },
        data: {
            events: {
                create: {
                    draft: false,
                    type: 'GAME_END',
                    message: gameMessages?.messages.filter(message => message.event === 'GAME_END')[0].message || 'The Game is over!',
                }
            },
            draft: false
        }
    }) : undefined

    game.participatingCharacterIds.map(async id => {
        const character = await prisma.character.findUnique({
            where: {
                id
            }
        })

        if (!character) return;

        const userRewards: Prisma.UserUpdateInput = winnerIds.includes(character.id) ? {
            crowns: {
                increment: game.winnerCrowns
            },
            rubies: {
                increment: game.winnerRubies || 0
            }
        } : {
            rubies: {
                increment: game.loserRubies || 0
            }
        }

        const characterRewards: Prisma.CharacterUpdateInput = winnerIds.includes(character.id) ? {
            crowns: {
                increment: game.winnerCrowns
            }
        } : {
            strikes: {
                increment: game.loserStrikes
            }
        }

        await prisma.user.update({
            where: {
                id: character.ownerId
            },
            data: {
                ...userRewards
            }
        })

        await prisma.character.update({
            where: {
                id: character.id
            },
            data: {
                ...characterRewards
            }
        })

        await sendMessage(process.env.OCM_OFFICIAL_ID || '', character.ownerId, `${game.name} is over! See the results!`, 'GAME_COMPLETED', `/games/${game.id}`)
    })

    return {
        newGame: await prisma.game.findUnique({ where: { id: gameId } }) as GameWithMods
    }
}

export const editActions: (
    characterId: string,
    phaseId: string,
    characterActions: {
        actionType: ActionType,
        actionId?: string,
        actionTargetId?: string,
        actionStrategy?: string,
    }[]
) => Promise<{
    error?: string,
    success?: string
}> = async (characterId, phaseId, characterActions) => {
    const character = await prisma.character.findUnique({
        where: {
            id: characterId
        }
    })

    if (!character) return {
        error: "Could not find character"
    }

    const phase = await prisma.phase.findUnique({
        where: {
            id: phaseId
        }
    })

    if (!phase) return {
        error: "Could not find phase"
    }

    const gameRoles = await prisma.gameRoles.findUnique({
        where: {
            gameId: phase.gameId
        }
    })

    if (!gameRoles) return {
        error: "Could not find game roles"
    }

    const actions = await prisma.phaseActions.findUnique({
        where: {
            phaseId
        }
    })

    if (!actions) return {
        error: "Could not find actions model"
    }

    const query: Prisma.PhaseCharacterActionsListUpdateEnvelopeInput = {
        set: [
            ...actions.actions.filter(actionPairing => !(characterActions.map(action => action.actionId).includes(actionPairing.actionId))),
            ...(characterActions.map(action => {
                return {
                    characterId: character.id,
                    characterName: character.name,
                    characterRoleId: gameRoles.assignedRoles.filter(rolePairing => rolePairing.characterId === character.id)[0].roleId,
                    ...action
                }
            }))
        ]
    }

    const result = await prisma.phaseActions.update({
        where: {
            id: actions.id
        },
        data: {
            actions: {
                ...query
            }
        }
    })

    if (!result) return {
        error: "Could not update action..."
    }

    return {
        success: "Action updated successfully!"
    }
}