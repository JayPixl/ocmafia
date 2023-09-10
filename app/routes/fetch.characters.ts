import { LoaderFunction, json } from "@remix-run/node";
import { getFilteredCharacterData, getFilteredUserData } from "~/utils/resource.server";

export const loader: LoaderFunction = async ({ request }) => {
    const searchParams = new URL(request.url).searchParams
    const id = searchParams.get("id") || undefined
    const name = searchParams.get("name") || undefined
    const username = searchParams.get("username") || undefined
    const returnOwnerUsernames = searchParams.get("returnownerusernames") || undefined
    const returnCharacterNames = searchParams.get("returncharacternames") || undefined

    const { results, error } = await getFilteredCharacterData({
        id,
        ...(username ? {
            owner: {
                username
            }
        } : {}),
        name
    },
        {
            avatarUrl: true,
            id: true,
            ...(returnOwnerUsernames ? { owner: { select: { username: true, id: true, slug: true } } } : {}),
            name: returnCharacterNames ? true : false
        }, 5)

    return json({ results, error })
}