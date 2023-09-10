import { LoaderFunction, json } from "@remix-run/node";
import { Link, useLoaderData, useParams } from "@remix-run/react";
import CharacterAvatar from "~/components/character-avatar";
import Layout from "~/components/layout";
import { RoleAlignmentEmojis } from "~/utils/constants";
import { getRoleById } from "~/utils/roles.server";
import { getUser } from "~/utils/users.server";

export const loader: LoaderFunction = async ({ request, params }) => {
    const { user } = await getUser(request)

    const { error, role } = await getRoleById(params.roleId || '')

    return json({ user, role, error })
}

export default function Role() {
    const { user, role, error } = useLoaderData<typeof loader>()
    const params = useParams()
    return (
        <Layout
            user={user}
            navigation={true}
            navArray={[
                { name: "Grandmaster's Realm", id: "gm-realm", url: "/gm-realm" },
                { name: "Roles", id: "roles", url: "/gm-realm/roles", parent: "gm-realm" },
                (role && {
                    name: role.name,
                    id: role.name,
                    url: `/gm-realm/roles/${role.id}`
                })
            ]}
        >
            <div>
                {role ? (
                    <div className="flex justify-center items-center">
                        <div className="bg-licorice-600 md:w-2/3 lg:p-12 m-5 rounded-lg w-full p-8">
                            <div className="flex w-full items-end justify-between border-b-2 border-licorice-800 pb-2">
                                <div className="flex flex-col justify-between">
                                    <h1 className="text-4xl font-semibold mx-4">
                                        {role.name}
                                    </h1>
                                </div>
                                <div className="font-semibold text-xl">
                                    {RoleAlignmentEmojis[role.alignment]} {role.alignment} {RoleAlignmentEmojis[role.alignment]}
                                </div>
                            </div>




                            <div className="text-licorice-800 bg-dogwood rounded-lg border-l-licorice-800 border-l-4 p-2 my-4 italic">
                                {role.description}
                            </div>

                            {role?.imageUrl && <div
                                style={{
                                    backgroundSize: "cover",
                                    backgroundImage: `url(${role.imageUrl})`
                                }}
                                className="w-full h-48 bg-center my-4"
                            ></div>}
                        </div>
                    </div>

                ) : (
                    <div>
                        {error}
                    </div>
                )}
            </div>
        </Layout>
    )
}