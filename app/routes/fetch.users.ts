import { LoaderFunction, json } from "@remix-run/node";
import { getFilteredUserData } from "~/utils/resource.server";

export const loader: LoaderFunction = async ({ request }) => {
    const searchParams = new URL(request.url).searchParams
    const id = searchParams.get("id") || undefined
    const username = searchParams.get("username") || undefined
    const returnUsernames = searchParams.get("returnUsernames") || undefined
    const returnCharacters = searchParams.get("returnCharacters") || undefined

    const { results, error } = await getFilteredUserData({
        id,
        username
    },
        {
            id: true,
            username: returnUsernames ? true : false,
            characters: returnCharacters ? true : false,
        }, 5)

    return json({ results, error })
}