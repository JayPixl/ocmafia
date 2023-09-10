import { LoaderFunction, json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import Layout from "~/components/layout";
import { getUser } from "~/utils/users.server";

export const loader: LoaderFunction = async ({ request }) => {
    const { user } = await getUser(request)
    return json({ user })
}

export default function GMRealm() {
    const { user } = useLoaderData()
    return (
        <Layout
            user={user}
            navigation={true}
            navArray={[{ name: "Grandmaster's Realm", id: "gm-realm", url: "/gm-realm" }]}
        >
            <div className="flex justify-center items-center">
                <div className="bg-licorice-600 md:w-2/3 lg:p-12 m-5 rounded-lg w-full p-8 flex flex-col items-center">
                    <div className="text-4xl font-bold my-8">Grandmaster's Realm</div>
                    <Link to={`/gm-realm/characters`} className="text-3xl font-semibold my-4 underline hover:no-underline hover:opacity-70">Characters</Link>
                    <Link to={`/gm-realm/roles`} className="text-3xl font-semibold my-4 underline hover:no-underline hover:opacity-70">Roles</Link>
                </div>
            </div>

        </Layout>
    )
}