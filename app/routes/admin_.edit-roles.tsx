import { ActionType, Alignment, Role } from "@prisma/client";
import { ActionFunction, LoaderFunction, json, redirect } from "@remix-run/node";
import { Link, useActionData, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import InputField from "~/components/input-field";
import Layout from "~/components/layout";
import Textarea from "~/components/textarea";
import { prisma } from "~/utils/prisma.server";
import { manageRoles } from "~/utils/roles.server";
import { requireClearance } from "~/utils/users.server";

export const loader: LoaderFunction = async ({ request }) => {
    const { user, authorized } = await requireClearance(request, "ADMIN")
    if (!authorized || !user) return redirect('/authenticate-admin')

    const roles = await prisma.role.findMany()
    return json({ user, roles })
}

export const action: ActionFunction = async ({ request }) => {
    const form = await request.formData()
    const name = form.get("name")
    const description = form.get("description")
    const alignment = form.get('alignment') as Alignment

    let i: number = 0
    let dayActions: ActionType[] = []
    let nightActions: ActionType[] = []

    while (true) {
        const dayAction = form.get(`dayActions[${i}]`) as ActionType
        if (dayAction) {
            dayActions.push(dayAction)
            i++
        } else {
            break
        }
    }

    i = 0

    while (true) {
        const nightAction = form.get(`nightActions[${i}]`) as ActionType
        if (nightAction) {
            nightActions.push(nightAction)
            i++
        } else {
            break
        }
    }

    if (typeof name !== 'string' || typeof description !== 'string') return json({ error: "Invalid form data" }, { status: 500 })

    let errors = {
        name: name.length > 20 && 'Name of role cannot be longer than 20 characters',
        description: description.length > 1000 && 'Name of description cannot be longer than 1000 characters'
    }

    if (Object.values(errors).some(Boolean)) {
        return json({ errors, fields: { name, description, alignment, dayActions, nightActions } }, { status: 404 })
    }

    console.log(dayActions, nightActions)

    const { newRole, error } = await manageRoles({ name, description, alignment, dayActions, nightActions }, 'add')
    console.log(error, newRole?.id)
    if (error) return json({ error, fields: { name, description, alignment } })

    return json({ newRole })
}

export default function EditRoles() {
    const { user, roles } = useLoaderData()
    const action = useActionData()

    const [inputs, setInputs] = useState<{
        name: string,
        description: string,
        alignment: Alignment,
        dayActionSelect: string,
        dayActions: string[],
        nightActionSelect: string,
        nightActions: string[]
    }>({
        name: action?.fields?.name || '',
        description: action?.fields?.description || '',
        alignment: action?.fields?.alignment || 'TOWN' as Alignment,
        dayActionSelect: 'VOTE',
        dayActions: action?.fields?.dayActions || ['VOTE'],
        nightActionSelect: 'VOTE',
        nightActions: action?.fields?.nightActions || []
    })

    return <Layout user={user} navigation={true}>
        <div className="p-5 w-full flex flex-col items-center">
            <h1 className="text-2xl p-3">Add Role</h1>
            <div className="p-2 text-lg">
                <Link to={'/admin'}>Back to Admin Home</Link>
            </div>
            <div className="flex flex-col items-center justify-center p-5 rounded-xl bg-licorice-600 w-2/3">
                <form method="POST" className="flex flex-col py-3 border-b-2 border-b-licorice-800">
                    <div className="text-bittersweet">
                        {action?.error}
                    </div>

                    <InputField
                        name="name"
                        type="text"
                        onChange={e => setInputs({ ...inputs, name: e.target.value })}
                        display="Role Name"
                        error={action?.errors?.name}
                        value={inputs.name}
                    />

                    <Textarea
                        name="description"
                        onChange={e => setInputs({ ...inputs, description: e.target.value })}
                        display="Role Description"
                        error={action?.errors?.description}
                        value={inputs.description}
                    />
                    <div className="bg-dogwood rounded-lg text-licorice-800 p-3 my-3">
                        <div className="text-xl">Alignment</div>
                        <select
                            name="alignment"
                            value={inputs.alignment}
                            onChange={e => setInputs({
                                ...inputs,
                                alignment: e.target.value as Alignment
                            })}
                            className="bg-opacity-[1%] bg-licorice-600 font-bold text-lg rounded-lg py-1 hover:opacity-80"
                        >
                            {Object.values(Alignment).map(alignment => <option key={alignment} value={alignment}>
                                {alignment}
                            </option>)}
                        </select>
                    </div>

                    <div className="bg-dogwood rounded-lg text-licorice-800 p-3 my-3">
                        <div className="text-xl">Day Actions</div>

                        {inputs.dayActions.length !== 0 ? inputs.dayActions?.map((value: string, index: number) => <div className="text-lg font-semibold italic ml-3 py-2" key={value}>
                            <input type="hidden" name={`dayActions[${index}]`} value={value} />
                            {value} <span className="ml-2 cursor-pointer font-bold px-2 rounded-full bg-bittersweet" onClick={e => setInputs({ ...inputs, dayActions: [...(inputs.dayActions.filter((action: string) => action !== value))] })}>-</span>
                        </div>) : <div className="text-lg font-semibold italic ml-3 py-2">
                            - None
                        </div>}

                        <div className="border-b-licorice-800 border-b-2 w-full" />
                        <div className="flex flex-row items-baseline">
                            <select
                                value={inputs.dayActionSelect}
                                onChange={e => setInputs({
                                    ...inputs,
                                    dayActionSelect: e.target.value as string
                                })}
                                className="bg-opacity-[1%] bg-licorice-600 font-bold text-lg rounded-lg py-1 hover:opacity-80"
                            >
                                {Object.values(ActionType).map(actionType => <option key={actionType} value={actionType}>
                                    {actionType}
                                </option>)}
                            </select>
                            <div
                                className="text-lg underline hover:no-underline p-2 cursor-pointer"
                                onClick={e => {
                                    setInputs({
                                        ...inputs,
                                        dayActions: [
                                            ...inputs.dayActions,
                                            inputs.dayActionSelect as string
                                        ]
                                    })
                                }}>
                                Add
                            </div>
                        </div>
                    </div>

                    <div className="bg-dogwood rounded-lg text-licorice-800 p-3 my-3">
                        <div className="text-xl">Night Actions</div>

                        {inputs.nightActions.length !== 0 ? inputs.nightActions?.map((value: string, index: number) => <div className="text-lg font-semibold italic ml-3 py-2" key={value}>
                            <input type="hidden" name={`nightActions[${index}]`} value={value} />
                            {value} <span className="ml-2 cursor-pointer font-bold px-2 rounded-full bg-bittersweet" onClick={e => setInputs({ ...inputs, nightActions: [...(inputs.nightActions.filter((action: string) => action !== value))] })}>-</span>
                        </div>) : <div className="text-lg font-semibold italic ml-3 py-2">
                            - None
                        </div>}

                        <div className="border-b-licorice-800 border-b-2 w-full" />
                        <div className="flex flex-row items-baseline">
                            <select
                                value={inputs.nightActionSelect}
                                onChange={e => setInputs({
                                    ...inputs,
                                    nightActionSelect: e.target.value as string
                                })}
                                className="bg-opacity-[1%] bg-licorice-600 font-bold text-lg rounded-lg py-1 hover:opacity-80"
                            >
                                {Object.values(ActionType).map(actionType => <option key={actionType} value={actionType}>
                                    {actionType}
                                </option>)}
                            </select>
                            <div
                                className="text-lg underline hover:no-underline p-2 cursor-pointer"
                                onClick={e => {
                                    setInputs({
                                        ...inputs,
                                        nightActions: [
                                            ...inputs.nightActions,
                                            inputs.nightActionSelect as string
                                        ]
                                    })
                                }}>
                                Add
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="underline hover:no-underlinetext-xl"
                    >
                        Submit
                    </button>
                </form>

                {roles.map((role: Role) => <Link to={`/admin/edit-roles/${role.id}`} key={role.id} className="py-3 text-xl">
                    {role.name}
                </Link>)}
            </div>
        </div>
    </Layout>
}