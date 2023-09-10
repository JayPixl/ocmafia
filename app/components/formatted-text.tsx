import { ReactNode } from "react";
import { formatText } from "~/utils/formatters";

export default function FormattedText({ children }: { children: ReactNode }) {
    return <>
        {formatText(children as string)}
    </>
}