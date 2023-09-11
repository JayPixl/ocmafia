import { ActionFunction, LoaderFunction, json, redirect } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigate } from "@remix-run/react";
import { useState, useRef } from "react";
import InputField from "~/components/input-field";
import Layout from "~/components/layout";
import { prisma } from "~/utils/prisma.server";
import { getUserId, login, saltRounds, signup } from "~/utils/users.server";
import { validatePassword, validateUsername } from "~/utils/validators";
import bcrypt from 'bcrypt'

export const loader: LoaderFunction = async ({ request }) => {
    const { userId } = await getUserId(request)
    if (userId) return redirect('/')

    const params = new URL(request.url).searchParams.get("username")

    if (params) {
        try {
            const user = await prisma.user.findFirst({
                where: {
                    username: {
                        equals: params,
                        mode: "insensitive"
                    }
                },
                select: {
                    securityQuestion: true,
                    id: true,
                    username: true
                }
            })
            if (!user) return redirect(`/reset-password`)

            return json({ user })
        } catch (e) {
            return redirect(`/reset-password`)
        }
    }
    return json({})
}

export const action: ActionFunction = async ({ request }) => {
    const form = await request.formData()
    const userId = form.get("userId") as string
    const securityAnswer = form.get("securityAnswer") as string
    const newPassword = form.get("newPassword") as string

    const user = await prisma.user.findUnique({
        where: {
            id: userId
        },
        select: {
            username: true,
            id: true,
            securityAnswer: true
        }
    })

    if (!user) return json({
        error: "Could not find user"
    })

    if (securityAnswer.toLowerCase() !== user.securityAnswer?.toLowerCase()) return json({
        error: "Answer is incorrect!"
    })

    if (validatePassword(newPassword)) return json({
        error: validatePassword(newPassword)
    })

    await prisma.user.update({
        where: {
            id: user.id
        },
        data: {
            password: await bcrypt.hash(newPassword, saltRounds)
        }
    })

    const { error, redirectTo } = await login({ action: "login", password: newPassword, username: user.username, redirectTo: '/' })

    if (error) return json({
        error
    })

    return redirect(redirectTo?.path || '/', redirectTo?.body)
}

export default function ResetPassword() {
    const actionData = useActionData()
    const navigate = useNavigate()
    const formRef = useRef<HTMLFormElement>(null)
    const { user } = useLoaderData()

    const [inputs, setInputs] = useState({
        username: actionData?.fields?.username || user?.username || '',
        securityAnswer: actionData?.fields?.securityAnswer || '',
        newPassword: actionData?.fields?.newPassword || ''
    })

    return (
        <Layout navigation={true}>
            <div className="flex justify-center items-center">
                <div className="bg-licorice-600 md:w-1/2 lg:p-16 m-5 rounded-lg w-72 p-8">
                    <h1 className="text-3xl font-semibold my-1 text-slate-50">Reset Password</h1>
                    <form ref={formRef} onSubmit={e => {
                        e.preventDefault()
                        const queryParams = new URLSearchParams
                        queryParams.set("username", inputs.username)
                        navigate(`/reset-password/?${queryParams}`)
                    }}>
                        <InputField
                            type="text"
                            onChange={e => setInputs({ ...inputs, username: e.target.value })}
                            name="username"
                            value={inputs.username}
                            display="Username"
                            error={actionData?.fieldErrors?.username}
                            disabled={!!user}
                        />
                    </form>
                    {user && <form method="post">
                        <input type="hidden" name="userId" value={user?.id} />
                        <div className="text-red-500">
                            {actionData?.error}
                        </div>
                        {user?.securityQuestion?.length !== 0 ? <>
                            <div className="text-xl font-semibold my-2 text-neonblue">
                                {user?.securityQuestion}
                            </div>
                            <InputField
                                type="text"
                                onChange={e => setInputs({ ...inputs, securityAnswer: e.target.value })}
                                name="securityAnswer"
                                value={inputs.securityAnswer}
                                display="Answer"
                                error={actionData?.fieldErrors?.securityAnswer}
                                maxLength={25}
                            />
                            <InputField
                                type="text"
                                onChange={e => setInputs({ ...inputs, newPassword: e.target.value })}
                                name="newPassword"
                                value={inputs.newPassword}
                                display="New Password"
                                error={actionData?.fieldErrors?.newPassword}
                                maxLength={25}
                            />
                            <button
                                type="submit"
                                className="text-xl border-[1px] border-dogwood rounded-lg py-1 px-2 self-center mt-8 hover:bg-bittersweet hover:border-bittersweet hover:text-white transition md:text-2xl"
                            >
                                Reset Password
                            </button>
                        </> : <div className="my-2 text-bittersweet font-semibold">
                            No security question!
                        </div>}
                    </form>}
                </div>
            </div>
        </Layout>
    )
}