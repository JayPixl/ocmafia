import { Character } from "@prisma/client"
import { prisma } from "./prisma.server"
import { getUser } from "./users.server"

export const getCharacterbyId: (
    id: string
) => Promise<{
    error?: string,
    character?: Character
}> = async (id) => {
    const character = await prisma.character.findFirst({
        where: {
            id
        },
        include: {
            owner: {
                select: {
                    id: true,
                    username: true,
                    avatar: true,
                    slug: true
                }
            }
        }
    })
    if (!character) return {
        error: "Could not find character by that id"
    }

    return {
        character
    }
}

export const createCharacter: (
    data: {
        name: string,
        description: string,
        pronouns: string,
        specialAbility: {
            name: string,
            description: string
        },
        stats: {
            charisma: number,
            skill: number,
            strength: number,
            stealth: number
        }
    },
    request: Request
) => Promise<{
    error?: string,
    character?: Character
}> = async (data, request) => {
    const { user } = await getUser(request)
    if (!user) return {
        error: "Could not find user"
    }

    const character = await prisma.character.create({
        data: {
            ...data,
            status: 'ACTIVE',
            crowns: 0,
            strikes: 0,
            displayName: data.name,
            owner: {
                connect: {
                    id: user.id
                }
            },
            currentGameId: null
        }
    })

    if (!character) return {
        error: "Could not create new character"
    }
    return {
        character
    }
}

export const updateCharacter: (
    data: {
        name: string,
        description: string,
        pronouns: string,
        specialAbility: {
            name: string,
            description: string
        },
        stats: {
            charisma: number,
            skill: number,
            strength: number,
            stealth: number
        },
        avatarUrl?: string,
        featuredImageUrl?: string
    },
    characterId: string,
    request: Request
) => Promise<{
    error?: string,
    character?: Character
}> = async (data, characterId, request) => {
    const { user } = await getUser(request)
    if (!user) return {
        error: "Could not find user"
    }

    const character = await prisma.character.update({
        where: {
            id: characterId
        },
        data
    })

    if (!character) return {
        error: "Could not update character"
    }
    return {
        character
    }
}