import { LoaderFunction, json } from "@remix-run/node";
import { Link, useLoaderData, useParams } from "@remix-run/react";
import CharacterAvatar from "~/components/character-avatar";
import Layout from "~/components/layout";
import UserCircle from "~/components/user-circle";
import { getCharacterbyId } from "~/utils/characters.server";
import { getUser } from "~/utils/users.server";

export const loader: LoaderFunction = async ({ request, params }) => {
    const { user } = await getUser(request)

    const { error, character } = await getCharacterbyId(params.characterId || '')

    return json({ user, character, error })
}

export default function Character() {
    const { user, character, error } = useLoaderData<typeof loader>()
    const params = useParams()
    return (
        <Layout
            user={user}
            navigation={true}
            navArray={[
                { name: "Grandmaster's Realm", id: "gm-realm", url: "/gm-realm" },
                { name: "Characters", id: "characters", url: "/gm-realm/characters", parent: "gm-realm" },
                (character && {
                    name: character.name,
                    id: character.name,
                    url: `/gm-realm/characters/${character.id}`
                })
            ]}
        >
            <div>
                {character ? (
                    <div className="flex justify-center items-center">
                        <div className="bg-licorice-600 md:w-2/3 lg:p-12 m-5 rounded-lg w-full p-8 relative">
                            {character?.ownerId === user?.id ? <div className="absolute top-0 right-2">
                                <Link to={`/gm-realm/characters/${params.characterId}/edit`}>
                                    Edit
                                </Link>
                            </div> : <Link
                                to={`/profile/${character.owner.slug}`}
                                className="absolute top-3 right-3 flex flex-row items-center"
                            >
                                <UserCircle
                                    username={character.owner.username}
                                    avatarColor={character.owner.avatar.avatarColor}
                                    avatarUrl={character.owner.avatar.avatarUrl}
                                    avatarType={character.owner.avatar.avatarType}
                                    size="SMALL"
                                />
                                <div className="ml-2 font-semibold">
                                    {character.owner.username} →
                                </div>
                            </Link>}
                            <div className="flex w-full items-end justify-start border-b-2 border-licorice-800 pb-2">
                                <CharacterAvatar
                                    avatarUrl={character.avatarUrl}
                                    size="XLARGE"
                                />
                                <div className="flex flex-col justify-between">
                                    {character.status === 'ACTIVE' ? <h1 className="text-4xl font-semibold mx-4">
                                        {character.name}
                                    </h1> : <h1 className="text-3xl font-semibold mx-4 opacity-80">
                                        <del>{character.name} (BANNED)</del>
                                    </h1>}

                                    <div className="px-3 pt-1 lg:pt-3 lg:px-8 font-semibold">
                                        <span className="mr-3">({character.pronouns})</span> {character.crowns} 👑 {character.strikes} ❌
                                    </div>
                                </div>

                            </div>
                            {character?.profileLink?.url && <div className="italic underline my-1">
                                <Link to={character?.profileLink?.url}>
                                    {character?.profileLink?.url}
                                </Link>
                            </div>}
                            <div className="my-4 italic">
                                {character.description}
                            </div>

                            {character?.featuredImageUrl && <div
                                style={{
                                    backgroundSize: "cover",
                                    backgroundImage: `url(${character.featuredImageUrl})`
                                }}
                                className="w-full h-48 bg-center my-4"
                            ></div>}

                            <div className="flex flex-row items-stretch justify-evenly flex-wrap sm:flex-nowrap font-semibold text-xl my-2 bg-dogwood text-licorice-900 rounded-md">
                                <div>STR: {character.stats.strength}</div>
                                <div>STL: {character.stats.stealth}</div>
                                <div>SKL: {character.stats.skill}</div>
                                <div>CHR: {character.stats.charisma}</div>
                            </div>

                            <div className="my-2">
                                <div className="text-2xl font-semibold">{character.specialAbility.name}</div>
                                <div className="text-lg italic">{character.specialAbility.description}</div>
                            </div>
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