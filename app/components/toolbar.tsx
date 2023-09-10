import { Link } from "@remix-run/react"

interface props {
    currentTab: string,
    tabs: {
        display: string,
        id: string,
        url: string,
        emoji: React.ReactNode
    }[],
    unselectedTabColor?: string,
    selectedTabColor?: string,
    textColor?: string,
    bgColor?: string,
    forceCollapse?: boolean
}

export default function Toolbar({ currentTab, tabs, unselectedTabColor = "zinc-900", selectedTabColor = "zinc-950", textColor = "white", bgColor = "zinc-800", forceCollapse = false }: props) {

    return <>
        <div className={`bg-${bgColor} pt-2 fixed w-full`}>
            <div className={`flex flex-row justify-start items-stretch h-12 border-b-8 border-b-${selectedTabColor} w-full shadow-md`}>
                {tabs.map(tab => <div key={tab.id} className={`py-2 px-3 flex justify-center items-center rounded-t-xl text-${textColor} ${tab.id === currentTab ? `bg-${selectedTabColor}` : `bg-${unselectedTabColor}`}`}>
                    <Link to={tab.url} className="flex flex-row flex-nowrap items-center">
                        <span className={`mr-3 hidden ${forceCollapse ? '' : (tabs.length > 4 ? 'lg:block' : 'sm:block')}`}>{tab.display}</span>{tab.emoji}
                    </Link>
                </div>)}
            </div>
        </div>
        <div className="w-full pt-14" />
    </>
}