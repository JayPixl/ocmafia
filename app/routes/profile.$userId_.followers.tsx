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

export default function ProfileFollowers() {
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

                    <div className="py-3">
                        <div className="text-center text-2xl">Followers - ({profileData.followedBy.length})</div>
                        <div className="flex flex-row justify-center flex-wrap">
                            {profileData?.followedBy?.length > 0 ? profileData?.followedBy?.map((follower: any) => <Link to={`/profile/${follower.slug}`} key={follower.id} className="mx-1 md:mx-3">
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
                        </div>
                    </div>

                    <div className="py-3">
                        <div className="text-center text-2xl">Following - ({profileData.following.length})</div>
                        <div className="flex flex-row justify-center flex-wrap">
                            {profileData?.following?.length > 0 ? profileData?.following?.map((follower: any) => <Link to={`/profile/${follower.slug}`} key={follower.id} className="mx-1 md:mx-3">
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