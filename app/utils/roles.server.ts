import { ActionType, Alignment, CharGameRolePairing, GameCharacterStatus, Role } from "@prisma/client";
import { prisma } from "./prisma.server";
import { CharacterWithMods, CharacterWithRole, GameWithMods, RoleWithNotes } from "./types";

export const manageRoles: (
    fields: {
        name: string,
        description: string,
        alignment: Alignment,
        imageUrl?: string,
        id?: string,
        nightActions: ActionType[],
        dayActions: ActionType[]
    },
    method: 'add' | 'edit'
) => Promise<{
    error?: string,
    success?: string,
    newRole?: Role
}> = async (fields, method) => {
    switch (method) {
        case 'add': {
            const newRole = await prisma.role.create({
                data: {
                    ...fields
                }
            })

            if (!newRole) return {
                error: 'Could not create new role...'
            }

            return {
                success: "Successfully created!",
                newRole
            }

            break
        }

        case 'edit': {
            const newRole = await prisma.role.update({
                where: {
                    id: fields.id
                },
                data: {
                    name: fields.name,
                    alignment: fields.alignment,
                    imageUrl: fields.imageUrl,
                    description: fields.description,
                    nightActions: fields.nightActions,
                    dayActions: fields.dayActions
                }
            })

            if (!newRole) return {
                error: 'Could not edit role...'
            }

            return {
                success: "Successfully created!",
                newRole
            }

            break
        }
    }
}

export const getRoleById: (
    id: string
) => Promise<{
    role?: Role,
    error?: string
}> = async (id) => {
    const role = (await prisma.role.findUnique({
        where: {
            id
        },
        select: {
            id: true,
            alignment: true,
            description: true,
            name: true,
            imageUrl: true,
        }
    })) as Role
    if (!role) return {
        error: "Could not find role"
    }

    return {
        role
    }
}

export const updateActiveRoles: (
    gameId: string,
    roles: string[]
) => Promise<{
    error?: string,
    newGame?: GameWithMods
}> = async (gameId, roles) => {
    console.log(gameId)
    const game = await prisma.game.findUnique({
        where: {
            id: gameId
        }
    })
    if (!game) return {
        error: "Could not find game"
    }

    await prisma.game.update({
        where: {
            id: gameId
        },
        data: {
            activeRoleIds: roles
        }
    });

    const newGame = (await prisma.game.findUnique({
        where: {
            id: gameId
        }
    })) as GameWithMods

    return {
        newGame
    }
}

export const assignRoles: (
    gameId: string,
    roleIds: string[],
    characterIds: string[]
) => Promise<{
    error?: string,
    success?: boolean
}> = async (gameId, roleIds, characterIds) => {
    const game = await prisma.game.findUnique({
        where: {
            id: gameId
        }
    })
    if (!game) return {
        error: "Could not find game"
    }

    if (
        game.playerCount !== roleIds.length ||
        game.playerCount !== characterIds.length
    ) return {
        error: "Wrong length for player count"
    }

    const pairings: CharGameRolePairing[] = []

    for (let i: number = 0; i < game.playerCount; i++) {
        const character = await prisma.character.findUnique({
            where: {
                id: characterIds[i]
            }
        })
        const role = await prisma.role.findUnique({
            where: {
                id: roleIds[i]
            }
        })

        if (!role || !character) return {
            error: "Problem finding a role or character..."
        }

        pairings.push({
            characterId: character.id,
            characterName: character.name,
            roleAlignment: role.alignment,
            roleId: role.id,
            roleName: role.name,
            notes: ''
        })
    }

    await prisma.gameRoles.update({
        where: {
            gameId: game.id
        },
        data: {
            assignedRoles: {
                set: pairings
            }
        }
    })

    return {
        success: true
    }
}

export const getMyCharacterGameProfile: (
    userId: string,
    gameId: string
) => Promise<{
    error?: string,
    character?: CharacterWithMods,
    myRole?: RoleWithNotes
}> = async (userId, gameId) => {

    const character = await prisma.character.findFirst({
        where: {
            ownerId: userId,
            currentGameId: gameId
        }
    })

    if (!character) return {
        error: "Could not find character"
    }

    const gameRoles = await prisma.gameRoles.findUnique({
        where: {
            gameId: gameId
        }
    })

    if (!gameRoles) return {
        error: "Could not find game roles..."
    }

    const roleId = gameRoles.assignedRoles.filter(pairing => pairing.characterId === character.id)[0]?.roleId

    const myRole = roleId ? (await prisma.role.findUnique({
        where: {
            id: roleId
        }
    })) : undefined

    return {
        character: character as CharacterWithMods,
        myRole: {
            ...myRole,
            notes: gameRoles.assignedRoles.filter(pairing => pairing.characterId === character.id)[0]?.notes
        } as RoleWithNotes
    }
}

export const getActionOptions: (
    gameId: string,
    characterId: string
) => Promise<{
    error?: string,
    actions?: { type: ActionType, id?: string, selected?: string, selectedStrategy?: string, options: { name: string, value: string }[] }[],
    actionPhaseId?: string
}> = async (gameId, characterId) => {
    const user = await prisma.user.findFirst({
        where: {
            characters: {
                some: {
                    id: characterId
                }
            }
        }
    })

    if (!user) return {
        error: "Could not find user"
    }

    const game = await prisma.game.findUnique({
        where: {
            id: gameId
        }
    })

    if (!game || !game.currentPhaseId) return {
        error: "Could not find game or current phase"
    }

    const gameRoles = await prisma.gameRoles.findUnique({
        where: {
            gameId
        }
    })

    if (!gameRoles) return {
        error: "Could not find game roles"
    }

    const lastPhase = await prisma.phase.findFirst({
        where: {
            id: game.currentPhaseId
        }
    })

    if (!lastPhase) return {
        error: "Could not find last phase"
    }

    const currentPhase = await prisma.phase.findFirst({
        where: {
            gameId: game.id,
            dayNumber: lastPhase.time === "DAY" ? lastPhase.dayNumber : (lastPhase.dayNumber++),
            time: lastPhase.time === "DAY" ? "NIGHT" : "DAY"
        }
    })

    if (!currentPhase) return {
        error: "Could not find last phase"
    }

    const status = await prisma.phaseCharacterGameStatus.findUnique({
        where: {
            phaseId: currentPhase.id
        }
    })

    if (!status) return {
        error: "Could not find current game status"
    }

    const character = await prisma.character.findUnique({
        where: {
            id: characterId
        }
    })

    if (!character) return {
        error: "Could not find character"
    }

    const role = await prisma.role.findUnique({
        where: {
            id: gameRoles.assignedRoles.filter(role => role.characterId === character.id)[0].roleId
        }
    })

    if (!role) return {
        error: "Could not find role"
    }

    const myActions = (await prisma.phaseActions.findUnique({
        where: {
            phaseId: currentPhase.id
        }
    }))?.actions.filter(action => action.characterId === character.id).map(action => { return { actionType: action.actionType, actionId: action.actionId, ...(action.actionTargetId ? { actionTargetId: action.actionTargetId } : {}), ...(action.actionStrategy ? { actionStrategy: action.actionStrategy } : {}) } })


    const actions = status.status.filter(status => status.characterId === character.id)[0].status !== "DEAD" ? cycleActionOptions(
        {
            name: character.name,
            id: character.id,
            faction: gameRoles.assignedRoles.filter(role => role.characterId === character.id)[0].roleAlignment,
            status: status.status.filter(status => status.characterId === character.id)[0].status,
        },
        game.participatingCharacterIds.map(charId => {
            return {
                id: charId,
                name: status.status.filter(status => status.characterId === charId)[0].characterName,
                status: status.status.filter(status => status.characterId === charId)[0].status,
                faction: gameRoles.assignedRoles.filter(role => role.characterId === charId)[0].roleAlignment
            }
        }),
        currentPhase.time === 'DAY' ? role.dayActions : role.nightActions,
        myActions
    ) : []

    return actions ? {
        actions,
        actionPhaseId: currentPhase.id
    } : {
        error: "Could not get action options"
    }
}

export const cycleActionOptions: (
    currentChar: { name: string, id: string, faction?: Alignment, status: GameCharacterStatus },
    characters: { name: string, id: string, faction?: Alignment, status: GameCharacterStatus }[],
    actionTypes: ActionType[],
    myActions?: { actionType: ActionType, actionId: string, actionTargetId?: string, actionStrategy?: string }[]
) => { type: ActionType, id?: string, selected?: string, selectedStrategy?: string, options: { name: string, value: string }[] }[] = (currentChar, characters, actionTypes, myActions) => {
    const returnArray: { type: ActionType, id?: string, selected?: string, selectedStrategy?: string, options: { name: string, value: string }[] }[] = []
    for (var i: number = 0; i < actionTypes.length; i++) {
        const selection: {
            selected?: string,
            selectedStrategy?: string
            id?: string
        } = myActions?.filter(action => action.actionType === actionTypes[i]).length !== 0 ? {
            selected: myActions?.filter(action => action.actionType === actionTypes[i])[0].actionTargetId,
            selectedStrategy: myActions?.filter(action => action.actionType === actionTypes[i])[0].actionStrategy,
            id: myActions?.filter(action => action.actionType === actionTypes[i])[0].actionId,
        } : {}

        const thisObj: { type: ActionType, id?: string, selected?: string, selectedStrategy?: string, options: { name: string, value: string }[] } = {
            options: [],
            type: actionTypes[i],
            ...selection
        }

        switch (actionTypes[i]) {
            case "VOTE": {
                thisObj.options.push({ name: "No Action", value: "No Action" }, ...characters.map(char => { return { name: char.name, value: char.id } }))
                break
            }
            case "MAFIA_KILL": {
                thisObj.options.push({ name: "No Action", value: "No Action" }, ...characters.filter(char => char.id !== currentChar.id).map(char => { return { name: char.name, value: char.id } }))
                break
            }
            case "INDEPENDENT_KILL": {
                thisObj.options.push({ name: "No Action", value: "No Action" }, ...characters.filter(char => char.id !== currentChar.id).map(char => { return { name: char.name, value: char.id } }))
                break
            }
            case "INVESTIGATE": {
                thisObj.options.push({ name: "No Action", value: "No Action" }, ...characters.filter(char => char.id !== currentChar.id).map(char => { return { name: char.name, value: char.id } }))
                break
            }
            case "ANGEL_PROTECT": {
                thisObj.options.push({ name: "No Action", value: "No Action" }, ...characters.map(char => { return { name: char.name, value: char.id } }))
                break
            }
        }
        returnArray.push(thisObj)
    }
    return returnArray
}