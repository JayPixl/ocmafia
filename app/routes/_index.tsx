import { User } from "@prisma/client";
import { ActionFunction, json, type LoaderFunction } from "@remix-run/node";
import { Link, Links, LiveReload, Meta, Scripts, ScrollRestoration, useLoaderData, useRouteError } from "@remix-run/react";
import { useState } from "react";
import { Modal } from "~/components/modal";
import Layout from "~/components/layout";
import { getUser } from "~/utils/users.server";
import { buildNavigation } from "~/utils/navigation";
import { V2_ErrorBoundaryComponent } from "@remix-run/react/dist/routeModules";
import Slideshow from "~/components/slideshow";

export const loader: LoaderFunction = async ({ request }) => {
  const { user } = await getUser(request)
  const navArray = buildNavigation([{ name: 'Games', id: 'games', url: '/games' }, { name: 'Season 1', id: 'fjijeiojf2098fhosidfj', url: '/games/slkdfjlskdfjslkdfj', parent: 'games' }])
  return json({ user, navArray })
}


export default function Index() {
  const { user, navArray } = useLoaderData()

  const [modalOpen, setModalOpen] = useState(false)

  return (
    <Layout user={user} navigation={true}>

      <Slideshow elements={[
        {
          imageUrl: 'https://res.cloudinary.com/dvs0gmvvc/image/upload/v1693543268/mafia-by-k1tty_wyw4jx.png',
          credit: {
            display: 'K1tty5 on DeviantArt',
            url: 'https://www.deviantart.com/k1tty5'
          },
          content: <>
            <div className="text-3xl md:text-5xl font-bold my-5">
              Welcome to OC Mafia!
            </div>
            {!user ? <Link to={`/archive/about`} className="text-lg md:text-xl font-semibold my-3 underline hover:no-underline">
              First time here? Read more about OC Mafia! 🔎
            </Link> : <Link to={`/games`} className="text-lg md:text-xl font-semibold my-3 underline hover:no-underline">
              Find a game! 🔎
            </Link>}
          </>
        },
        {
          imageUrl: 'https://res.cloudinary.com/dvs0gmvvc/image/upload/v1693543269/evoidless-peach-dark-angel_uegdcn.png',
          credit: {
            display: 'Evoidless on DeviantArt',
            url: 'https://www.deviantart.com/evoidless'
          },
          content: <>
            <div className="text-3xl md:text-5xl font-bold my-5">
              Season 2 begins soon!
            </div>
            <div className="text-lg md:text-xl font-semibold my-3">
              Keep an eye out for updates!
            </div>
          </>
        }
      ]} />

      <div className="py-12 sm:py-16 w-full border-b-licorice-900 border-b-2 flex flex-col items-center justify-center">
        <Link to={`https://discord.gg/XaTgNVxc`} className="flex flex-row items-center text-lg sm:text-3xl my-2 border-[1px] border-neonblue text-white rounded-2xl py-2 px-3 hover:bg-transparent bg-neonblue hover:border-white transition">
          Join our Discord server! <img src="/images/discord-mark-white.svg" className="h-8 w-8 sm:h-12 sm:w-12 ml-4" />
        </Link>
      </div>

      <div className="px-8 py-12 sm:py-14 w-full border-b-licorice-900 border-b-2 bg-dogwood text-licorice-800 flex flex-col">
        <div className="border-b border-b-licorice-900 text-2xl my-4 w-full">
          What is OC Mafia?
        </div>
        <div className="my-2">
          OC Mafia is an online game similar to traditional Forum Mafia,
          where you can bring your Original Characters, or OCs, to life in a perilous game of betrayal and charisma.
          Do you think you have what it takes to survive?
        </div>
        <Link to={'/archive/about'} className="underline hover:no-underline w-full text-right">
          Read more →
        </Link>
      </div>
    </Layout>
  );
}
