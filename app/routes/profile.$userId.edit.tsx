import { AvatarColors, AvatarTypes } from "@prisma/client";
import { ActionFunction, LoaderFunction, json, redirect } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigate, useParams, useRevalidator } from "@remix-run/react";
import { useRef, useState } from "react";
import { ImageUploader } from "~/components/image-uploader";
import InputField from "~/components/input-field";
import { Modal } from "~/components/modal";
import SelectBox from "~/components/select-box";
import UserCircle from "~/components/user-circle";
import { gradientMap } from "~/utils/constants";
import { formatCase } from "~/utils/formatters";
import { getProfileData, updateUserProfile } from "~/utils/profile.server";

export const loader: LoaderFunction = async ({ request, params }) => {
    const { user, owner, profileData } = await getProfileData(request, params)
    if (!owner) return redirect(`/profile/${params.userId}`)
    return json({ user, owner, profileData })
}

export const action: ActionFunction = async ({ request, params }) => {
    const form = await request.formData()
    const avatar = {
        avatarType: form.get('avatarType') as AvatarTypes || undefined,
        avatarColor: form.get('avatarColor') as AvatarColors || undefined,
        avatarUrl: form.get('avatarUrl') as string || undefined
    }
    const tagline = form.get('tagline') as string
    const { error } = await updateUserProfile(request, avatar, tagline)

    if (error) return json({ error })
    return redirect(`/profile/${params.userId}`)
}

export default function Edit() {
    const { user } = useLoaderData()
    const action = useActionData()
    const params = useParams()
    const navigate = useNavigate()
    const revalidate = useRevalidator()

    const maxTaglineLength = 30

    const [formData, setFormData] = useState<any>({
        avatarType: action?.fields?.avatarType || user.avatar.avatarType,
        avatarColor: action?.fields?.avatarColor || user.avatar.avatarColor,
        avatarUrl: action?.fields?.avatarUrl || user.avatar.avatarUrl,
        tagline: action?.fields?.tagline || user.tagline || ''
    })

    const getValuesFromMap: (map: { color: string, styles?: string }[]) => { name: string, value: string }[] = (map) => {
        let arr: { value: string, name: string }[] = []
        map.map(obj => {
            arr.push({ value: obj.color, name: `${formatCase(obj.color)}` })
        })
        return arr
    }

    const [loading, setLoading] = useState(false)

    const handleChange = async (file: File) => {
        const formData = new FormData()
        formData.append("image", file)

        console.log("Sending")
        setLoading(l => true)

        const result = await fetch('/upload-image', {
            method: "POST",
            body: formData
        })

        const { image, error }: { image?: string, error?: string } = await result.json()
        setLoading(l => false)
        setFormData({ ...formData, avatarUrl: image })
    }

    return <Modal isOpen={true} onClick={() => navigate(`/profile/${params.userId}`)} className="w-2/3 md:w-1/3 h-96">
        <form method="POST" className="flex flex-col items-center relative h-full">
            <span className="absolute top-0 right-2 cursor-pointer font-bold text-3xl p-1 hover:text-slate-500" onClick={() => navigate(`/profile/${params.userId}`)}>x</span>
            {
                formData.avatarType === 'COLOR' ?
                    <UserCircle
                        avatarType={formData.avatarType}
                        avatarColor={formData.avatarColor}
                        avatarUrl={formData.avatarUrl}
                        username={user.username}
                        size="LARGE"
                    />
                    :
                    <ImageUploader
                        onChange={handleChange}
                        type={'circle'}
                        imageUrl={formData.avatarUrl}
                        loading={loading}
                    />
            }
            <div className="font-semibold text-xl mb-3">{user.username}</div>
            <input
                type="hidden"
                name="avatarUrl"
                value={formData.avatarUrl}
            />
            <div className="flex flex-row">
                <InputField
                    type="text"
                    onChange={e => setFormData({
                        ...formData,
                        tagline: e.target.value
                    })}
                    name="tagline"
                    value={formData.tagline}
                    display="Tagline"
                    maxLength={maxTaglineLength}
                />
                {<div className={`ml-3 mb-4 font-bold self-end ${formData?.tagline?.length > maxTaglineLength - 5 ? "text-cinnabar" : ''}`}>
                    {maxTaglineLength - formData?.tagline?.length}
                </div>}
            </div>

            <SelectBox name="avatarType" value={formData.avatarType} display="Avatar Type" onChange={e => setFormData({ ...formData, avatarType: e.target.value })} options={[{ name: 'Image', value: 'IMAGE' }, { name: 'Color', value: 'COLOR' }]} error={''} />
            <SelectBox name="avatarColor" value={formData.avatarColor} display="Avatar Color" onChange={e => setFormData({ ...formData, avatarColor: e.target.value })} options={[...getValuesFromMap(gradientMap)]} error={''} />

            <button
                className="absolute bottom-0 text-xl border-[1px] border-slate-600 text-slate-600 rounded-lg py-1 px-2 self-center mt-8 hover:bg-bittersweet hover:border-bittersweet hover:text-white transition md:text-2xl"
                type="submit"
            >
                Submit
            </button>
        </form>
    </Modal>
}