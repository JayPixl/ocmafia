import { useLoaderData, useLocation, useRevalidator } from "@remix-run/react";
import { useEffect } from "react";
import { useEventSource } from "remix-utils";

export function useLiveLoader<T>(path: string, event: string, refreshCallback: () => void) {

    const data = useEventSource(path, { event });

    useEffect(() => {
        //console.log("REVALIDATING")
        refreshCallback()
    }, [data]);

    return useLoaderData<T>();
}