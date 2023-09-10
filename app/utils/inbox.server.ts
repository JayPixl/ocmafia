import { InboxItem, MessageTypes, Prisma } from "@prisma/client"
import { prisma } from "./prisma.server"
import { ExtendedInboxItem } from "./types"

export const sendMessage: (
    senderId: string,
    recipientId: string,
    message: string,
    type: MessageTypes,
    link?: string
) => Promise<{
    error?: string,
    success?: string
}> = async (senderId, recipientId, message, type, link) => {
    const result = await prisma.inbox.update({
        where: {
            userId: recipientId
        },
        data: {
            inboxItems: {
                push: {
                    message,
                    type,
                    link,
                    senderId,
                    read: false
                }
            }
        }
    })

    if (!result) return {
        error: "Could not send message!"
    }

    return {
        success: "Successfully sent message!"
    }
}

export const removeMessage: (
    targetId: string,
    query: Prisma.InboxItemWhereInput
) => Promise<{
    error?: string,
    success?: string
}> = async (targetId, query) => {
    const result = await prisma.inbox.update({
        where: {
            userId: targetId
        },
        data: {
            inboxItems: {
                deleteMany: {
                    where: query
                }
            }
        }
    })

    if (!result) return {
        error: "Could not delete message(s)"
    }

    return {
        success: "Successful query!"
    }
}

export const getMessages: (
    userId: string
) => Promise<{
    error?: string,
    messages?: ExtendedInboxItem[]
}> = async (userId) => {
    const inbox = await prisma.inbox.findUnique({
        where: {
            userId
        }
    })
    if (!inbox) return {
        error: "Could not find messages"
    }

    const senders = await prisma.user.findMany({
        where: {
            id: {
                in: inbox.inboxItems.map(item => item.senderId).filter(item => item !== null && item !== '') as string[]
            }
        }
    })

    const messages = (inbox.inboxItems.map(item => {
        return {
            ...item,
            avatar: senders.filter(user => user.id === item.senderId)[0].avatar || undefined,
            senderUsername: senders.filter(user => user.id === item.senderId)[0].username || ''
        }
    })) as ExtendedInboxItem[]

    return {
        messages
    }
}

export const manageInbox: (
    userId: string,
    messageUniqueId: string,
    action: 'read' | 'unread' | 'delete'
) => Promise<{
    error?: string,
    success?: string
}> = async (userId, messageUniqueId, action) => {
    const inbox = await prisma.inbox.findUnique({
        where: {
            userId
        }
    })

    let query: InboxItem[]

    switch (action) {
        case 'read': {
            query = inbox?.inboxItems.map(item => item.uniqueId === messageUniqueId ? {
                ...item,
                read: true
            } : item) || []
            break
        }
        case 'unread': {
            query = inbox?.inboxItems.map(item => item.uniqueId === messageUniqueId ? {
                ...item,
                read: false
            } : item) || []
            break
        }
        case 'delete': {
            query = inbox?.inboxItems.filter(item => item.uniqueId !== messageUniqueId) || []
            break
        }
    }

    console.log(query)

    const result = await prisma.inbox.update({
        where: {
            userId
        },
        data: {
            inboxItems: {
                set: query
            }
        }
    })

    if (!result) return {
        error: "Could not update inbox"
    }

    return {
        success: "Successfully updated inbox!"
    }
}