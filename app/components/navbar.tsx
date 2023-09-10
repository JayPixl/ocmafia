import { User } from "@prisma/client"
import UserCircle from "./user-circle"
import { Link } from "@remix-run/react"

interface props {
    user?: User | null
    triggerMobileNav: any
    unreadMessages?: number
    navigation?: boolean
}

export default function Navbar({ user, triggerMobileNav, navigation, unreadMessages = 0 }: props) {
    return (
        <div className="w-full h-12 bg-gradient-to-b from-slate-800 to-slate-900 flex justify-between items-center text-white fixed top-0 z-20">

            <div className="whitespace-nowrap">
                {navigation && <button className="md:hidden p-2 rounded-md ml-1 hover:bg-slate-700" onClick={triggerMobileNav}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                    </svg>
                </button>}
                <Link
                    to='/'
                    className={`bg-gradient-to-b from-bittersweet to-cinnabar bg-clip-text bg-clip-text-wbk text-transparent font-extrabold text-2xl ml-1 md:ml-5 ${!navigation && `ml-5`} whitespace-nowrap`}
                >
                    OC Mafia
                </Link>
            </div>

            {user ? <div className="flex flex-row items-center h-full">
                <Link to={`/profile/${user?.slug}`} className="hover:bg-slate-800 h-full flex items-center">
                    <div className="flex flex-row justify-center items-center">
                        <div className="px-2 text-slate-200">
                            {user?.username}
                        </div>
                        <div className="px-2">
                            {user ? <>
                                <UserCircle
                                    username={user.username}
                                    avatarType={user.avatar?.avatarType || undefined}
                                    avatarColor={user.avatar?.avatarColor || undefined}
                                    avatarUrl={user.avatar?.avatarUrl || undefined}
                                />
                            </> : ''}
                        </div>
                    </div>
                </Link>
                <Link to={`/inbox`} className="relative p-2 h-full hover:bg-slate-800 mr-2 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 sm:w-7 sm:h-7">
                        <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
                        <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
                    </svg>
                    {unreadMessages ? <>
                        <div className="absolute top-2 sm:top-1 right-0 px-[7px] flex items-center justify-center text-xs sm:text-sm rounded-full bg-cinnabar">
                            {unreadMessages}
                        </div>
                        <div className="absolute top-2 sm:top-1 right-0 px-[7px] flex items-center justify-center text-transparent animate-ping text-xs sm:text-sm rounded-full bg-cinnabar">
                            {unreadMessages}
                        </div>
                    </> : ''}
                </Link>
            </div> : (
                <Link to={`/login`} className="hover:bg-slate-800 h-full flex items-center">
                    <div className="flex flex-row justify-center items-center">
                        <div className="px-2 text-slate-200">
                            Log In | Sign Up
                        </div>
                    </div>
                </Link>
            )
            }
        </div>
    )
}