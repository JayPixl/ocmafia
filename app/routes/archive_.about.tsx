import { LoaderFunction, json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import Layout from "~/components/layout";
import { getUser } from "~/utils/users.server";

export const loader: LoaderFunction = async ({ request }) => {
    const { user } = await getUser(request)
    return json({ user })
}

export default function About() {
    const { user } = useLoaderData()
    return (
        <Layout
            user={user}
            navigation={true}
            navArray={[{ name: "Archive", id: "archive", url: "/archive" },
            { name: "About", id: "about", url: "/archive/about", parent: 'archive' }]}
        >
            <Link to={`/archive`} className="py-5 px-8 block">← Back to Archive</Link>
            <div className="flex justify-center items-center">
                <div className="bg-licorice-600 md:w-2/3 lg:p-12 m-5 rounded-lg w-full p-8 flex flex-col items-center">
                    <div className="text-4xl font-bold my-8">About</div>
                    <div>
                        <div className="text-lg font-dancing-script">
                            &nbsp; &nbsp; &nbsp; Greetings, traveler. It seems that you have entered my domain.
                            Who am I, you ask? I am an entity known only as the Grandmaster,
                            but you may refer to me as G or GM. Do you have what it takes to win my Game?
                            We&apos;ll have to wait and see now, won&apos;t we?
                            <br />
                            <div className="text-right pr-8">-the Grandmaster</div>
                        </div>
                    </div>

                    <div className="mb-8 pb-2 border-b border-b-dogwood w-full" />

                    <div>
                        {/* <div>
                            &nbsp; &nbsp; &nbsp; So the sparkle of treasure and adventure has caught your eye, 
                            has it? Many a traveler has been drawn in by danger&apos;s beckoning. 
                            Some have come out with newfound wealth, some don&apos;t leave at all…
                        </div> */}
                        <div>
                            &nbsp; &nbsp; &nbsp; Welcome to the world of OC Mafia! OC Mafia is an online game
                            similar to traditional forum Mafia. In this game you will be roleplaying one of
                            your OCs (original characters) in a game of Mafia.
                        </div>
                        <div>
                            &nbsp; &nbsp; &nbsp; If you would like to participate in OC Mafia, feel free to&nbsp;
                            <Link to="/login" className="text-tropicalindigo underline hover:no-underline">
                                create your free account here
                            </Link>! Be sure to&nbsp;
                            <Link to="/gm-realm/character/create" className="text-tropicalindigo underline hover:no-underline">
                                create a character
                            </Link> once you have your account set up, and check out the&nbsp;
                            <Link to="/games" className="text-tropicalindigo underline hover:no-underline">
                                Games page
                            </Link> to find an active game. If you have any questions or suggestions, be sure to&nbsp;
                            <Link to="https://discord.gg/XaTgNVxc" className="text-tropicalindigo underline hover:no-underline">
                                join our Discord
                            </Link>!
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    )
}