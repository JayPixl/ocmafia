import { Prisma } from "@prisma/client"
import { prisma } from "./prisma.server"

export const getFilteredUserData: (
    filters: {
        username?: string,
        id?: string
    },
    select: {
        id?: boolean,
        username?: boolean,
        characters?: boolean
    },
    take?: number,
) => Promise<{
    results?: any[],
    error?: string
}> = async (filters, select, take = 10) => {
    if (!filters.id && !filters.username) return {
        error: "No filters added"
    }
    const where: Prisma.UserWhereInput = filters?.username ? {
        ...filters,
        username: {
            contains: filters.username,
            mode: "insensitive"
        }
    } : {
        ...filters
    }

    const results = await prisma.user.findMany({
        take,
        where,
        select
    })

    if (!results) return {
        error: "Could not retrieve user data"
    }
    return {
        results
    }
}

export const getFilteredCharacterData: (
    filters: {
        name?: string,
        owner?: {
            username?: string
        },
        id?: string
    },
    select: Prisma.CharacterSelect,
    take?: number,
) => Promise<{
    results?: any[],
    error?: string
}> = async (filters, select, take = 10) => {
    if (!filters.id && !filters?.owner?.username && !filters.name) return {
        error: "No filters added"
    }
    let where: Prisma.CharacterWhereInput = { ...filters };
    if (filters?.owner?.username) {
        where = {
            ...filters,
            owner: {
                username: {
                    contains: filters.owner.username,
                    mode: "insensitive"
                }
            }
        }
    }
    if (filters?.name) {
        where = {
            ...filters,
            name: {
                contains: filters.name,
                mode: "insensitive"
            }
        }
    }

    const results = await prisma.character.findMany({
        take,
        where,
        select
    })

    if (!results) return {
        error: "Could not retrieve character data"
    }
    return {
        results
    }
}

export const getFilteredGameData: (
    filters: {
        name?: string,
        id?: string
    },
    select: Prisma.GameSelect,
    take?: number,
) => Promise<{
    results?: any[],
    error?: string
}> = async (filters, select, take = 10) => {
    if (!filters.id && !filters.name) return {
        error: "No filters added"
    }
    let where: Prisma.GameWhereInput = { ...filters };
    if (filters?.name) {
        where = {
            ...filters,
            name: {
                contains: filters.name,
                mode: "insensitive"
            }
        }
    }

    const results = await prisma.game.findMany({
        take,
        where,
        select
    })

    if (!results) return {
        error: "Could not retrieve game data"
    }
    return {
        results
    }
}

export const getFilteredRoleData: (
    filters: {
        name?: string,
        id?: string
    },
    select: Prisma.RoleSelect,
    take?: number,
) => Promise<{
    results?: any[],
    error?: string
}> = async (filters, select, take = 10) => {
    if (!filters.id && !filters.name) return {
        error: "No filters added"
    }
    let where: Prisma.RoleWhereInput = { ...filters };
    if (filters?.name) {
        where = {
            ...filters,
            name: {
                contains: filters.name,
                mode: "insensitive"
            }
        }
    }

    const results = await prisma.role.findMany({
        take,
        where,
        select
    })

    if (!results) return {
        error: "Could not retrieve role data"
    }
    return {
        results
    }
}