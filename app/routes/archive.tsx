import { LoaderFunction, json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import Layout from "~/components/layout";
import { getUser } from "~/utils/users.server";

export const loader: LoaderFunction = async ({ request }) => {
    const { user } = await getUser(request)
    return json({ user })
}

export default function Archive() {
    const { user } = useLoaderData()
    return (
        <Layout
            user={user}
            navigation={true}
            navArray={[{ name: "Archive", id: "archive", url: "/archive" }]}
        >
            <div className="flex justify-center items-center">
                <div className="bg-licorice-600 md:w-2/3 lg:p-12 m-5 rounded-lg w-full p-8 flex flex-col items-center">
                    <div className="text-4xl font-bold my-8">Archive</div>
                    <Link to={`/archive/about`} className="text-3xl font-semibold my-4 underline hover:no-underline hover:opacity-70">About</Link>
                </div>
            </div>
        </Layout>
    )
}