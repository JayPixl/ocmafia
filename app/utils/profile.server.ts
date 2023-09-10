import { prisma } from '~/utils/prisma.server'
import { getUser } from './users.server'
import { Params } from '@remix-run/react'
import { AvatarColors, AvatarTypes, User } from '@prisma/client'
import { removeMessage, sendMessage } from './inbox.server'

export const getProfileData: (request: Request, params: Params) => Promise<{
    user?: User,
    owner: boolean,
    profileData?: any,
    following?: boolean,
}> = async (request: Request, params: Params) => {
    let { user } = await getUser(request)

    const data = (await prisma.user.findFirst({
        where: {
            username: {
                equals: params.userId,
                mode: 'insensitive'
            }
        },
        include: {
            characters: true,
            followedBy: {
                select: {
                    username: true,
                    id: true,
                    slug: true,
                    avatar: true
                }
            },
            following: {
                select: {
                    username: true,
                    id: true,
                    slug: true,
                    avatar: true
                }
            }
        }
    }))

    const following = (await prisma.user.findMany({
        where: {
            id: data?.id,
            followedByIDs: {
                hasSome: user?.id
            }
        }
    }))

    return {
        user,
        owner: data?.username === user?.username,
        profileData: data,
        following: following.length !== 0
    }
}

export const updateUserProfile: (
    request: Request,
    avatar?: {
        avatarType?: AvatarTypes,
        avatarColor?: AvatarColors,
        avatarUrl?: string
    },
    tagline?: string) => Promise<{
        error?: string
    }> = async (request, avatar, tagline) => {
        const { user } = await getUser(request)
        if (!user) return { error: "Could not find user in database" }

        const result = await prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                avatar,
                tagline
            }
        })

        if (!result) return { error: "Could not update user profile" }

        return { error: undefined }
    }

export const followUser: (
    request: Request,
    followedId: string,
    action: 'follow' | 'unfollow'
) => Promise<{
    error?: string
}> = async (request, followedId, action) => {
    const { user } = await getUser(request)
    if (!user) return {
        error: "Could not find user!"
    }
    const query = { ...(action === 'follow' ? { connect: { id: user.id } } : { disconnect: { id: user.id } }) }

    const followedUser = await prisma.user.findFirst({ where: { username: { equals: followedId, mode: 'insensitive' } } })
    if (!followedUser) return {
        error: "Could not find followed user!"
    }

    const data = await prisma.user.update({
        where: {
            id: followedUser.id
        },
        data: {
            followedBy: {
                ...query
            }
        }
    })
    if (!data) return {
        error: "We ran into an issue when trying to follow this player..."
    }

    if (action === 'follow') {
        await sendMessage(process.env.OCM_OFFICIAL_ID || '', followedUser.id, `${user.username} began following you!`, 'NEW_FOLLOWER', `/profile/${user.slug}`)
    } else {
        await removeMessage(followedUser.id, { message: `${user.username} began following you!` })
    }

    return {}
}