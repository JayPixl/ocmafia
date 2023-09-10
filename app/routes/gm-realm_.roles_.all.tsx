import { LoaderFunction, json } from "@remix-run/node";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import { useState } from 'react'
import Layout from "~/components/layout";
import { getUser } from "~/utils/users.server";
import CharacterAvatar from "~/components/character-avatar";
import { prisma } from "~/utils/prisma.server";
import { Alignment, Role } from "@prisma/client";
import { RoleAlignmentEmojis } from "~/utils/constants";
import { v4 } from "uuid";

export const loader: LoaderFunction = async ({ request }) => {
    const { user } = await getUser(request)
    const roles = (await prisma.role.findMany()).sort((a, b) => {
        const nameA = a.name.toUpperCase()
        const nameB = b.name.toUpperCase()
        if (nameA < nameB) {
            return -1
        }
        if (nameA > nameB) {
            return 1
        }

        return 0
    })

    return json({ user, roles })
}

export default function AllRoles() {
    const { user, roles } = useLoaderData()

    return (
        <Layout
            user={user}
            navigation={true}
            navArray={[
                { name: "Grandmaster's Realm", id: "gm-realm", url: "/gm-realm" },
                { name: "Roles", id: "roles", url: "/gm-realm/roles", parent: "gm-realm" },
            ]}
        >
            <div className="flex justify-center items-center">
                <div className="bg-licorice-600 md:w-2/3 lg:p-12 m-5 rounded-lg w-full p-8">
                    <div className="flex w-full items-end justify-center border-b-2 border-licorice-800 pb-2">
                        <h1 className="text-4xl font-semibold mx-4">
                            All Roles
                        </h1>
                    </div>
                    {Object.values(Alignment).map(alignment => <div key={v4()}>
                        <div className="text-3xl mt-4 mb-2 font-bold">{RoleAlignmentEmojis[alignment]} {alignment} {RoleAlignmentEmojis[alignment]}</div>
                        {roles.filter((role: Role) => role.alignment === alignment).map((role: Role) => <Link
                            key={role.id}
                            to={`/gm-realm/roles/${role.id}`}
                            className="ml-8 text-xl my-1 font-semibold underline hover:no-underline block"
                        >
                            {role.name}
                        </Link>)}
                    </div>)}
                </div>
            </div>
        </Layout>
    )
}