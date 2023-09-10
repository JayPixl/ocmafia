import { ActionFunction, UploadHandler, UploadHandlerPart, json, unstable_parseMultipartFormData } from "@remix-run/node";
import { uploadImage } from "~/utils/cloudinary.server";

export const action: ActionFunction = async ({ request }) => {
    const uploadHandler: UploadHandler = async ({ name, filename, contentType, data }: UploadHandlerPart) => {
        if (name !== 'image') return undefined
        console.log(filename, contentType)

        const { result } = await uploadImage(data)
        return result?.secure_url
    }
    const formData = await unstable_parseMultipartFormData(request, uploadHandler)
    const img = formData.get("image")

    if (!img) return json({ error: "Error while uploading image..." })
    return json({ image: img })
}