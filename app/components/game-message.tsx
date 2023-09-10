import { ReactNode } from "react";
import { formatGameMessage } from "~/utils/formatters";

export default function GameMessage({ children, actor, target }: { children: ReactNode, actor?: { name: string, id: string }, target?: { name: string, id: string } }) {
    return <>
        {formatGameMessage(children as string, actor, target)}
    </>
}