import { createCookieSessionStorage, redirect } from "@remix-run/node";
import { prisma } from "./prisma.server";
import bcrypt from 'bcrypt'
import { Clearance, User } from "@prisma/client";
import { clearanceMap } from "./constants";

const saltRounds: number = 10;

const secret = process.env.SESSION_SECRET;
if (!secret) {
    throw new Error("SESSION_SECRET is not set")
}

interface LoginForm {
    username: string,
    password: string,
    action: string,
    redirectTo?: URL | string
}

interface SignupForm extends LoginForm {

}

const storage = createCookieSessionStorage({
    cookie: {
        name: "ocmafia-session",
        secure: process.env.NODE_ENV === 'production',
        secrets: [secret],
        sameSite: 'lax',
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        httpOnly: true,
    }
})

export const login: (form: LoginForm) => Promise<{
    error: any,
    fields?: any,
    status?: number,
    redirect?: any
}> = async (form) => {

    let match = (await prisma.user.findMany({
        where: {
            username: {
                equals: form.username,
                mode: 'insensitive'
            }
        }
    }))[0]

    if (!match || !await bcrypt.compare(form.password, match?.password)) return { fields: { ...form }, error: "Username or password is incorrect", status: 404 }

    return createUserSession(match.id, form.redirectTo as string || '/')
}

export const signup: (form: SignupForm) => Promise<{
    error: any,
    fields?: any,
    fieldErrors?: any,
    redirect?: any,
    status?: number
}> = async (form) => {

    const match = (await prisma.user.findMany({ where: { username: { equals: form.username, mode: 'insensitive' } } }))[0]

    if (match) return { fields: { ...form }, error: true, fieldErrors: { username: "User already exists with that username." } }

    const newUser = await createUser(form)

    if (!newUser) {
        return { error: "Internal server error while trying to create a new user", status: 500 }
    }

    return createUserSession(newUser.id, form.redirectTo as string || '/')
}

export const createUser: (form: SignupForm) => Promise<any> = async (form: SignupForm) => {
    const passwordHash = await bcrypt.hash(form.password, saltRounds)

    return await prisma.user.create({
        data: {
            username: form.username,
            password: passwordHash,
            slug: form.username.toLowerCase(),
            avatar: {
                avatarType: "COLOR",
                avatarColor: "BLUE"
            },
            crowns: 0,
            rubies: 0,
            inbox: {
                create: {

                }
            },
            characterLimit: 1
        }
    })
}

export const createUserSession: (userId: string, redirectTo: string) => Promise<{
    redirect: {
        path: string,
        body: any
    },
    error: any
}> = async (userId: string, redirectTo: string) => {
    const session = await storage.getSession();
    session.set('userId', userId);
    return {
        redirect: {
            path: redirectTo,
            body: {
                headers: {
                    "Set-Cookie": await storage.commitSession(session),
                }
            }
        },
        error: false
    }
}

export const getUserSession: (request: Request) => Promise<any> = async (request: Request) => {
    return await storage.getSession(request.headers.get("Cookie"))
}

export const getUserId: (request: Request) => Promise<{
    error?: string,
    userId?: string
}> = async (request: Request) => {
    const session = await getUserSession(request)
    const userId = session.get('userId')
    if (!userId) return { error: "Could not find user id", userId: undefined }
    return { error: undefined, userId }
}

export const getUser: (request: Request, password?: boolean) => Promise<{
    error?: string,
    status?: number,
    user?: User
}> = async (request, password = false) => {
    const { userId } = await getUserId(request)
    if (!userId) return { error: "Invalid User ID", status: 400 }

    let user = (await prisma.user.findUnique({ where: { id: userId }, include: { inbox: { select: { inboxItems: true } } } }))
    if (!user) throw redirect('/logout')

    if (!password) user = {
        ...user,
        password: 'hidden'
    }

    return { user }
}

export const destroyUserSession: (request: Request, redirectTo?: URLSearchParams) => Promise<{
    path: string,
    body: any
}> = async (request: Request, redirectTo?: URLSearchParams) => {
    const session = await getUserSession(request)
    return {
        path: redirectTo ? `/login?${redirectTo}` : '/login',
        body: {
            headers: {
                "Set-Cookie": await storage.destroySession(session)
            }
        }
    }
}

export const requireUserSession: (request: Request, redirectTo: string) => Promise<{
    userId?: string,
    redirect?: string
}> = async (request: Request, redirectTo: string = new URL(request.url).pathname) => {
    const { error, userId } = await getUserId(request)
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]])

    if (error || !(await prisma.user.findUnique({ where: { id: userId } }))) {
        return { redirect: `/login?${searchParams}`, userId: undefined }
    }

    return { redirect: undefined, userId }
}

export const requireClearance: (request: Request, clearance: Clearance) => Promise<{
    error?: string,
    authorized?: boolean,
    status?: number,
    user?: User
}> = async (request: Request, clearance: Clearance) => {
    const { user } = await getUser(request)
    if (user?.clearance === undefined) return { error: "Could not find security level for this user", authorized: false, status: 404 }

    const res = findInMap(user.clearance, clearanceMap).indexOf(clearance)
    if (res !== -1) return { authorized: true, user }
    else return { error: "User unauthorized", authorized: false, status: 401, user }
}

const findInMap = (key: string, obj: object) => {
    return Object.values(obj)[Object.keys(obj).indexOf(key)]
}

export const authenticateAdmin: (request: Request, password: string) => Promise<{
    authenticated: boolean,
    error?: string,
    status?: number
}> = async (request, password) => {
    const { user } = await getUser(request)
    if (!user) return { authenticated: false, error: "Could not find user in database", status: 404 }
    if (password !== process.env.ADMIN_KEY?.toString()) return { authenticated: false, error: "Unauthorized", status: 401 }

    const result = await prisma.user.update({
        where: {
            id: user.id
        },
        data: {
            clearance: "ADMIN"
        }
    })
    return { authenticated: true }
}