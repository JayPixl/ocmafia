import { useRef, useState } from "react"
import { ImageUploader } from "~/components/image-uploader"

export default function UploadImageForm() {
    const [inputs, setInputs] = useState({
        avatarUrl: ''
    })
    const loading = useRef(false)

    const handleChange = async (file: File) => {
        const formData = new FormData()
        formData.append("avatar", file)

        console.log("Sending")
        loading.current = true

        const result = await fetch('/upload-image?type=avatar', {
            method: "POST",
            body: formData
        })

        const { avatarUrl, error } = await result.json()
        setInputs({ avatarUrl })
        loading.current = false
    }
    return <>
        <label htmlFor="avatar">Avatar:</label>
        <ImageUploader
            onChange={handleChange}
            type={'circle'}
            imageUrl={inputs.avatarUrl}
            loading={loading.current}
        />
        <button>Submit</button>
        <div>{JSON.stringify(inputs.avatarUrl)}</div>
    </>
}