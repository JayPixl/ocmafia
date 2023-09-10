import { LoaderFunction, json } from "@remix-run/node";
import { getFilteredGameData } from "~/utils/resource.server";

export const loader: LoaderFunction = async ({ request }) => {
    const searchParams = new URL(request.url).searchParams
    const id = searchParams.get("id") || undefined
    const name = searchParams.get("name") || undefined

    const { results, error } = await getFilteredGameData({
        id,
        name
    },
        {
            id: true,
            name: true,
            playerCount: true,
            participatingCharacterIds: true
        }, 5)


    return json({ results, error })
}