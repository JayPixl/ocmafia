import { ActionFunction, LoaderFunction, json, redirect } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import InputField from "~/components/input-field";
import Layout from "~/components/layout";
import { authenticateAdmin, getUser } from "~/utils/users.server";

export const loader: LoaderFunction = async ({ request }) => {
    const { user } = await getUser(request)
    if (!user) return redirect('/')
    return json({ user })
}

export const action: ActionFunction = async ({ request }) => {
    const form = await request.formData()
    const password = form.get('password')

    if (!(typeof password === "string")) return json({ error: "Invalid form data" }, { status: 404 })

    const { authenticated, error, status } = await authenticateAdmin(request, password)
    if (!authenticated) return json({ authenticated, error, password }, { status })
    return redirect('/admin')
}

export default function AuthenticateAdmin() {
    const { user } = useLoaderData()
    const action = useActionData()

    const [inputs, setInputs] = useState({
        password: action?.password || ''
    })

    return <Layout navigation={false} user={user}>
        <form method="POST" className="p-5 flex flex-col justify-center items-center w-full">
            <p>
                Enter Admin password in order to proceed.
            </p>
            <InputField name="password" onChange={e => setInputs({ ...inputs, password: e.target.value })} type="password" value={inputs.password} display="Admin Password" error={action?.error} />
        </form>
    </Layout>
}