import { ActionFunction, LoaderFunction, json } from "@remix-run/node";
import { Link, useLoaderData, useParams } from "@remix-run/react";
import CharacterAvatar from "~/components/character-avatar";
import Layout from "~/components/layout";
import UserCircle from "~/components/user-circle";
import { followUser, getProfileData } from "~/utils/profile.server";
import { CharacterWithMods } from "~/utils/types";

export const loader: LoaderFunction = async ({ request, params }) => {
    const { user, owner, profileData, following } = await getProfileData(request, params)
    return json({ user, owner, profileData, following })
}

export const action: ActionFunction = async ({ request, params }) => {
    const form = await request.formData()
    const action = form.get("_action") as 'follow' | 'unfollow'

    const { error } = await followUser(request, params.userId || '', action)
    return json({ error })
}

export default function Profile() {
    const { user, owner, profileData, following } = useLoaderData()
    const params = useParams()

    return <Layout user={user} navigation={true}>
        <div className="flex justify-center items-center">
            {profileData ? (
                <div className="flex flex-col items-center rounded-xl bg-gradient-to-br from-licorice-600 to-licorice-700 min-h-[35rem] p-5 m-5 w-full md:w-2/3 relative">
                    <div className="relative w-full flex flex-row justify-start items-end border-b-2 border-licorice-800 pb-8 md:pb-1 md:p-2">
                        {user && (owner ? <Link
                            to={`/profile/${params.userId}/edit`}
                            className="absolute right-0 top-0 text-sm md:text-xl"
                        >
                            Edit Profile
                        </Link> : <form method="POST">
                            {following ? <button
                                type="submit"
                                name="_action"
                                value='unfollow'
                                className="absolute right-0 top-0 text-base md:text-lg px-2 rounded-full border-2 border-neonblue text-neonblue hover:border-transparent hover:bg-neonblue hover:text-licorice-600 flex flex-row justify-center items-center transition"
                            >
                                <span className="mr-2 font-bold">x</span>
                                <span>Unfollow</span>
                            </button> : <button
                                type="submit"
                                name="_action"
                                value='follow'
                                className="absolute right-0 top-0 text-base md:text-lg px-2 rounded-full border-2 border-neonblue text-neonblue hover:border-transparent hover:bg-neonblue hover:text-licorice-600 flex flex-row justify-center items-center transition hover:scale-110"
                            >
                                <span className="mr-2 font-bold">+</span>
                                <span>Follow</span>
                            </button>}
                        </form>)}

                        {profileData?.tagline && <div className="absolute bottom-1 right-0 italic">
                            {profileData.tagline}
                        </div>}

                        <UserCircle avatarType={profileData.avatar.avatarType} avatarColor={profileData.avatar.avatarColor} avatarUrl={profileData.avatar.avatarUrl} username={profileData.username} size="XLARGE" />
                        <div className="flex flex-col md:justify-between justify-center self-stretch">
                            <Link to={`/profile/${params.userId}`} className={`${profileData.username.length > 10 ? "text-3xl" : 'text-4xl'} px-3 lg:text-5xl lg:px-8 font-semibold mt-8 md:mt-4`}>
                                {profileData.username}
                            </Link>
                            <div className="absolute left-1 bottom-1 md:static md:px-3 md:pt-1 lg:pt-3 lg:px-8 font-semibold">
                                {profileData.crowns} 👑 {profileData.rubies} 💎
                            </div>
                        </div>
                    </div>
                    <div className="w-full text-center p-3 text-2xl">Characters</div>
                    <div className="flex flex-row w-full justify-center items-center flex-wrap">
                        {profileData.characters?.length > 0 ? profileData.characters.map((character: CharacterWithMods) => (
                            <Link to={`/gm-realm/characters/${character.id}`} key={character.id}>
                                <div
                                    className="bg-licorice-600 h-28 w-52 rounded-md m-2 hover:opacity-80 bg-cover transition overflow-hidden"
                                    style={character.featuredImageUrl ? { backgroundImage: `url(${character.featuredImageUrl})` } : undefined}
                                >
                                    <div className="w-full h-full relative backdrop-brightness-75">
                                        <div className="absolute top-1 right-1 flex flex-row text-sm">
                                            {character.crowns} 👑 {character.strikes} ❌
                                        </div>

                                        <div className="absolute bottom-1 left-1 flex flex-row justify-center items-end">
                                            <CharacterAvatar
                                                avatarUrl={character?.avatarUrl || undefined}
                                                size="SMALL"
                                            />
                                            <div className="ml-2 font-semibold">{character.displayName || character.name}</div>
                                        </div>
                                    </div>

                                </div>
                            </Link>
                        )) : !owner && <div
                            className="bg-licorice-600 h-28 w-52 rounded-md m-2 relative flex justify-center items-center"
                        >
                            No characters yet!
                        </div>}
                        {owner && profileData.characters.length < profileData.characterLimit && (
                            <Link to={`/gm-realm/characters/create`}>
                                <div
                                    className="bg-licorice-600 h-28 w-28 rounded-md m-2 relative flex justify-center items-center font-bold text-3xl hover:opacity-80"
                                >
                                    +
                                </div>
                            </Link>
                        )}
                    </div>

                    <div className="m-3" />

                    <div className="py-3">
                        <Link to={`/profile/${params.userId}/followers`} className="text-center text-2xl block">Followers - ({profileData.followedBy.length})</Link>
                        <div className="flex flex-row justify-center overflow-x-auto">
                            {profileData?.followedBy?.length > 0 ? profileData?.followedBy?.slice(0, 3)?.map((follower: any) => <Link to={`/profile/${follower.slug}`} key={follower.id} className="mx-1 md:mx-3">
                                <div className="flex flex-col justify-center items-center p-1 w-24 md:p-3">
                                    <div className="w-full flex justify-center">
                                        <UserCircle
                                            avatarType={follower.avatar.avatarType}
                                            avatarColor={follower.avatar.avatarColor}
                                            avatarUrl={follower.avatar.avatarUrl}
                                            username={follower.username}
                                            size="LARGE"
                                        />
                                    </div>
                                    <div className="min-w-full text-center text-sm md:text-base">
                                        {follower.username}
                                    </div>
                                </div>
                            </Link>) : <div className="py-5">No followers yet!</div>}
                            {profileData?.followedBy?.length > 3 && (
                                <Link to={`/profile/${params.userId}/followers`}>
                                    <div
                                        className="p-2 rounded-md m-2 flex justify-center items-center text-3xl font-bold hover:opacity-80"
                                    >
                                        ...
                                    </div>
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="py-3">
                        <Link to={`/profile/${params.userId}/followers`} className="text-center text-2xl block">Following - ({profileData.following.length})</Link>
                        <div className="flex flex-row justify-center overflow-x-auto">
                            {profileData?.following?.length > 0 ? profileData?.following?.slice(0, 3)?.map((follower: any) => <Link to={`/profile/${follower.slug}`} key={follower.id} className="mx-1 md:mx-3">
                                <div className="flex flex-col justify-center items-center p-1 w-24 md:p-3">
                                    <div className="w-full flex justify-center">
                                        <UserCircle
                                            avatarType={follower.avatar.avatarType}
                                            avatarColor={follower.avatar.avatarColor}
                                            avatarUrl={follower.avatar.avatarUrl}
                                            username={follower.username}
                                            size="LARGE"
                                        />
                                    </div>
                                    <div className="min-w-full text-center text-sm md:text-base">
                                        {follower.username}
                                    </div>
                                </div>
                            </Link>) : <div className="py-5">Not following anyone yet!</div>}
                            {profileData?.following?.length > 3 && (
                                <Link to={`/profile/${params.userId}/followers`}>
                                    <div
                                        className="p-2 rounded-md m-2 flex justify-center items-center text-3xl font-bold hover:opacity-80"
                                    >
                                        ...
                                    </div>
                                </Link>
                            )}
                        </div>
                    </div>

                    {owner && <>
                        <div className="m-8 bg-inherit" />
                        <Link to='/logout' className="absolute bottom-3 text-xl border-[1px] border-bittersweet text-bittersweet rounded-lg py-1 px-2 self-center mt-8 hover:bg-bittersweet hover:border-bittersweet hover:text-white transition md:text-2xl">
                            Log Out
                        </Link>
                    </>}
                </div>
            ) : (
                <div className="p-8 font-bold text-4xl">This user does not exist!</div>
            )}
        </div>
    </Layout>
}