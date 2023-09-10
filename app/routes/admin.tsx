import { LoaderFunction, json, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import Layout from "~/components/layout";
import { requireClearance } from "~/utils/users.server";

export const loader: LoaderFunction = async ({ request }) => {
    const { user, authorized } = await requireClearance(request, "ADMIN")
    if (!authorized || !user) return redirect('/authenticate-admin')
    return json({ user })
}

export default function Admin() {
    const { user } = useLoaderData()
    return <Layout user={user} navigation={true}>
        <div className="p-5 w-full flex flex-col items-center">
            <h1 className="text-2xl p-3">Admin Zone</h1>
            <div className="p-2 text-lg flex flex-col">
                <Link to={'/admin/create-game'}>Create Game</Link>
                <Link to={'/admin/edit-roles'}>Edit Roles</Link>
            </div>
        </div>
    </Layout>
}