import { ActionFunction, LoaderFunction, json, redirect } from "@remix-run/node";
import { useActionData } from "@remix-run/react";
import { useState } from "react";
import InputField from "~/components/input-field";
import Layout from "~/components/layout";
import { getUserId, login, signup } from "~/utils/users.server";
import { validatePassword, validateUsername } from "~/utils/validators";

export const loader: LoaderFunction = async ({ request }) => {
    const { userId } = await getUserId(request)
    if (userId) return redirect('/')
    return null
}

export const action: ActionFunction = async ({ request }) => {
    const form = await request.formData()
    const username = form.get("username")
    const password = form.get("password")
    const confirmPassword = form.get("confirmPassword")
    const action = form.get("_action")

    if (
        typeof username !== 'string' ||
        typeof password !== 'string' ||
        (action === 'signup' && typeof confirmPassword !== 'string') ||
        typeof action !== 'string'
    ) {
        return json({ error: "Invalid data format" }, { status: 404 })
    }

    if (action === 'signup' && password !== confirmPassword) {
        return json({
            error: "Confirmation password does not match the password!",
            fields: { username, password, confirmPassword },
            action
        }, {
            status: 404
        })
    }

    const searchParams = new URL(request.url).searchParams.get('redirectTo') || '/'

    switch (action) {
        case 'login': {
            const result = await login({ username, password, action, redirectTo: searchParams })
            if (result.error) return json({ action, error: result.error, fields: result?.fields || null }, { status: result?.status || 400 })
            else return redirect(result?.redirect?.path || '/', result?.redirect?.body || {})
        }
        case 'signup': {
            var fieldErrors = {
                username: validateUsername(username as string),
                password: validatePassword(password as string)
            }

            if (Object.values(fieldErrors).some(Boolean)) {
                return json({ fields: { username, password }, fieldErrors })
            }

            const result = await signup({ username, password, action, redirectTo: searchParams })
            if (result.error) return json({ action, error: result.error, fields: result?.fields || null, fieldErrors: result?.fieldErrors || null }, { status: result?.status || 400 })
            else return redirect(result?.redirect?.path || '/', result?.redirect?.body || {})
        }
        default: {
            return json({ error: "Invalid form action" }, { status: 400 })
        }
    }
}

export default function Login() {
    const actionData = useActionData()

    const [inputs, setInputs] = useState({
        username: actionData?.fields?.username || '',
        password: actionData?.fields?.password || '',
        confirmPassword: actionData?.fields?.confirmPassword || ''
    })

    const [formError] = useState(actionData?.error || '')

    const [login, setLogin] = useState(actionData?.action || 'login')

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        setInputs(inputs => ({
            ...inputs,
            [field]: e.target.value
        }))
    }

    return (
        <Layout navigation={true}>
            <div className="flex justify-center items-center">
                <div className="bg-licorice-600 md:w-1/2 lg:p-16 m-5 rounded-lg w-72 p-8">
                    <h1 className="text-3xl font-semibold my-1 text-slate-50">Enter the OC Mafia Universe!</h1>
                    <form method="post" className="flex flex-col">
                        <div className="text-red-500">
                            {formError}
                        </div>
                        <InputField
                            type="text"
                            onChange={e => handleChange(e, 'username')}
                            name="username"
                            value={inputs.username}
                            display="Username"
                            error={actionData?.fieldErrors?.username}
                        />
                        <InputField
                            type="password"
                            onChange={e => handleChange(e, 'password')}
                            name="password"
                            value={inputs.password}
                            display="Password"
                            error={actionData?.fieldErrors?.password}
                        />
                        {login !== 'login' && <InputField
                            type="password"
                            onChange={e => handleChange(e, 'confirmPassword')}
                            name="confirmPassword"
                            value={inputs.confirmPassword}
                            display="Confirm Password"
                            error={actionData?.fieldErrors?.confirmPassword}
                        />}
                        <div
                            onClick={() => setLogin(login == 'login' ? 'signup' : 'login')}
                            className="text-base text-tropicalindigo text-left cursor-pointer"
                        >
                            {login === 'login' ? 'Not yet a user? Create a new account here!' : 'Already a user? Log in with your existing account!'}
                        </div>
                        <button
                            type="submit"
                            name="_action"
                            value={login}
                            className="text-xl border-[1px] border-dogwood rounded-lg py-1 px-2 self-center mt-8 hover:bg-bittersweet hover:border-bittersweet hover:text-white transition md:text-2xl"
                        >
                            {login == 'login' ? 'Log In' : 'Sign Up'}
                        </button>
                    </form>
                </div>
            </div>
        </Layout>
    )
}