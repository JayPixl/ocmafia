import cloudinary from "cloudinary";
import { writeAsyncIterableToWritable } from "@remix-run/node";

cloudinary.v2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});

export const uploadImage: (data: AsyncIterable<Uint8Array>) => Promise<any> = async (data) => {
    const uploadPromise = new Promise(async (resolve, reject) => {
        const uploadStream = cloudinary.v2.uploader.upload_stream(
            { folder: "ocmafia" },
            (error, result) => {
                if (error) {
                    reject({ error })
                    return;
                }
                resolve({ result })
            }
        )
        await writeAsyncIterableToWritable(data, uploadStream);
    });
    return uploadPromise;
}
