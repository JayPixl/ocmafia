import Toolbar from "./toolbar"

interface props {
    currentPage: 'home' | 'reports' | 'dashboard' | 'host' | 'join' | 'chat',
    gameId?: string,
    dashboard?: boolean,
    joinable?: boolean,
    host?: boolean,
    forceCollapse?: boolean
}

export default function GameToolbar({ currentPage, gameId, dashboard, joinable, host, forceCollapse = false }: props) {

    const tabs: {
        display: string,
        id: string,
        url: string,
        emoji: React.ReactNode
    }[] = [
            {
                display: "Home",
                id: 'home',
                url: `/games/${gameId}/`,
                emoji: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-bittersweet">
                    <path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clipRule="evenodd" />
                </svg>


            },
            {
                display: "Reports",
                id: 'reports',
                url: `/games/${gameId}/reports/`,
                emoji: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-amber-300">
                    <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h9A1.5 1.5 0 0114 3.5v11.75A2.75 2.75 0 0016.75 18h-12A2.75 2.75 0 012 15.25V3.5zm3.75 7a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5zm0 3a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5zM5 5.75A.75.75 0 015.75 5h4.5a.75.75 0 01.75.75v2.5a.75.75 0 01-.75.75h-4.5A.75.75 0 015 8.25v-2.5z" clipRule="evenodd" />
                    <path d="M16.5 6.5h-1v8.75a1.25 1.25 0 102.5 0V8a1.5 1.5 0 00-1.5-1.5z" />
                </svg>
            },
            {
                display: "Chat",
                id: 'chat',
                url: `/games/${gameId}/chat`,
                emoji: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M2 10c0-3.967 3.69-7 8-7 4.31 0 8 3.033 8 7s-3.69 7-8 7a9.165 9.165 0 01-1.504-.123 5.976 5.976 0 01-3.935 1.107.75.75 0 01-.584-1.143 3.478 3.478 0 00.522-1.756C2.979 13.825 2 12.025 2 10z" clipRule="evenodd" />
                </svg>

            },
            ...(dashboard ? [{
                display: "Dashboard",
                id: 'dashboard',
                url: `/games/${gameId}/dashboard/`,
                emoji: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-300">
                    <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                </svg>
            }] : []),
            ...(joinable ? [{
                display: "Join",
                id: 'join',
                url: `/games/${gameId}/join/`,
                emoji: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-300">
                    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
            }] : []),
            ...(host ? [{
                display: "Host",
                id: 'host',
                url: `/games/${gameId}/edit/`,
                emoji: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-indigo-400">
                    <path fillRule="evenodd" d="M8 7a5 5 0 113.61 4.804l-1.903 1.903A1 1 0 019 14H8v1a1 1 0 01-1 1H6v1a1 1 0 01-1 1H3a1 1 0 01-1-1v-2a1 1 0 01.293-.707L8.196 8.39A5.002 5.002 0 018 7zm5-3a.75.75 0 000 1.5A1.5 1.5 0 0114.5 7 .75.75 0 0016 7a3 3 0 00-3-3z" clipRule="evenodd" />
                </svg>
            }] : [])
        ]

    const compiler: React.ReactNode = <span className={"bg-zinc-900" || "bg-zinc-950" || "bg-zinc-800" || "border-b-zinc-950"} />

    return <Toolbar
        tabs={tabs}
        currentTab={currentPage}
        forceCollapse={forceCollapse}
        unselectedTabColor="zinc-900"
        selectedTabColor="zinc-950"
        textColor="white"
        bgColor="zinc-800"
    />
}