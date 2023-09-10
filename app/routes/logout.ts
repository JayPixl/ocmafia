import { LoaderFunction, redirect } from "@remix-run/node";
import { destroyUserSession } from "~/utils/users.server";

export const loader: LoaderFunction = async ({ request }) => {
    const { path, body } = await destroyUserSession(request)
    return redirect(path, body)
}