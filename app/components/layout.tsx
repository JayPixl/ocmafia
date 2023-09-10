import { User } from "@prisma/client";
import { Outlet } from "@remix-run/react";
import React, { useState } from "react";
import Navbar from "./navbar";
import Navigation from "./navigation";
import { Nav } from "~/utils/navigation";
import { UserWithMods } from "~/utils/types";

export default function Layout({
    children,
    navigation = false,
    user,
    navArray,
    gradientBg = false
}: {
    children: React.ReactNode,
    navigation?: boolean,
    user?: UserWithMods,
    navArray?: Nav[],
    gradientBg?: boolean
}) {
    const [mobileNavOpen, setMobileNavOpen] = useState(false)
    const triggerMobileNav = () => {
        setMobileNavOpen(curr => !curr)
    }
    return (
        <>
            <Outlet />
            <div className={`${gradientBg ? "bg-gradient-to-b from-licorice-700 to-licorice-800" : "bg-licorice-700"} text-dogwood font-ysabeau-office w-full min-h-screen flex flex-col items-stretch`}>
                <Navbar user={user} triggerMobileNav={triggerMobileNav} navigation={navigation} unreadMessages={user?.inbox?.inboxItems?.filter(item => item.read === false)?.length} />
                {navigation ? (
                    <>
                        <Navigation navOpen={mobileNavOpen} navArray={navArray} />
                        <div className="md:ml-48 mt-12 relative">
                            {children}
                        </div>
                    </>
                ) : (
                    <div>
                        <div className="pt-12 w-full" />
                        {children}
                    </div>
                )}
            </div>
        </>
    )
}