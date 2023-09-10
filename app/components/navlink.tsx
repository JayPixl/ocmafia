import { Link } from "@remix-run/react";

export default function Navlink({ children, slug, display, current = false, size }: { children?: React.ReactNode, slug: string, display: string, current?: boolean, size?: string }) {
    return (
        <ul className="ml-2">
            <Link to={slug} className="w-full h-full">
                <li className={
                    `border-b-2  hover:border-b-bittersweet
                    ${size === "XL" && 'font-semibold text-lg mt-3'}
                    ${size === "LG" && 'font-normal text-base mt-2'}
                    ${current ? 'border-b-licorice-600' : 'border-b-transparent'}`
                }>
                    {display}
                </li>
            </Link>
            {children}
        </ul>
    )
}