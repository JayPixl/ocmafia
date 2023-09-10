import { ActionFunction, LoaderFunction, json, redirect } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigate, useParams } from "@remix-run/react";
import { useState } from "react";
import { ImageUploader } from "~/components/image-uploader";
import InputField from "~/components/input-field";
import Layout from "~/components/layout";
import { Modal } from "~/components/modal";
import Textarea from "~/components/textarea";
import { getCharacterbyId, updateCharacter } from "~/utils/characters.server";
import { CharacterWithMods, UserWithMods } from "~/utils/types";
import { getUser } from "~/utils/users.server";
import { validateLength, validateStat, validateURL } from "~/utils/validators";

export const loader: LoaderFunction = async ({ request, params }) => {
    const { user } = await getUser(request)

    const { error, character } = await getCharacterbyId(params.characterId || '')
    if (!user || !character || character.ownerId !== user.id) return redirect(`gm-realm/characters/${params.characterId}`)

    return json({ user, character, error })
}

export const action: ActionFunction = async ({ request, params }) => {
    const form = await request.formData()
    const name = form.get("name") as string || ''
    const description = form.get("description") as string || ''
    const pronouns = form.get("pronouns") as string || ''
    const url = form.get("link") as string || ''
    const specialAbilityName = form.get("specialAbilityName") as string || ''
    const specialAbilityDescription = form.get("specialAbilityDescription") as string || ''
    const strength = Number(form.get("strength"))
    const stealth = Number(form.get("stealth"))
    const skill = Number(form.get("skill"))
    const charisma = Number(form.get("charisma"))
    const avatarUrl = form.get("avatarUrl") as string || undefined
    const featuredImageUrl = form.get("featuredImageUrl") as string || undefined

    const fields = {
        name,
        description,
        pronouns,
        specialAbilityName,
        specialAbilityDescription,
        strength,
        skill,
        stealth,
        charisma,
        avatarUrl,
        link: url,
        featuredImageUrl
    }

    const fieldErrors = {
        name: validateLength(name, 15, 1),
        description: validateLength(description, 200, 10),
        pronouns: validateLength(pronouns, 10, 1),
        specialAbilityName: validateLength(specialAbilityName, 20, 1),
        specialAbilityDescription: validateLength(specialAbilityDescription, 200, 1),
        link: url ? (validateLength(url, 50, 5) || validateURL(url)) : undefined,
        charisma: validateStat(charisma),
        strength: validateStat(strength),
        skill: validateStat(skill),
        stealth: validateStat(stealth),
    }

    if (Object.values(fieldErrors).some(Boolean)) {
        return json({
            fieldErrors,
            fields
        })
    }

    if ((charisma! + strength! + skill! + stealth!) !== 20) return json({
        fields,
        formError: "Stats must add up to 20"
    })

    const { error, character } = await updateCharacter({
        name,
        description,
        pronouns,
        specialAbility: {
            name: specialAbilityName,
            description: specialAbilityDescription
        },
        stats: {
            charisma,
            strength,
            skill,
            stealth
        },
        avatarUrl,
        ...(url ? { profileLink: { url } } : { profileLink: { url: '' } }),
        featuredImageUrl

    }, params?.characterId || '', request)

    if (character) return redirect(`/gm-realm/characters/${character.id}`)
    return json({
        formError: error,
        fields
    })
}

export default function EditCharacter() {
    const loaderData = useLoaderData()
    const { user, character, error }: { user?: UserWithMods, character?: any, error?: string } = loaderData
    const actionData = useActionData()

    const params = useParams()
    const navigate = useNavigate()

    const [inputs, setInputs] = useState({
        name: actionData?.fields?.name || character.name || '',
        description: actionData?.fields?.description || character.description || '',
        pronouns: actionData?.fields?.pronouns || character.pronouns || '',
        charisma: actionData?.fields?.charisma || character.stats.charisma || '',
        strength: actionData?.fields?.strength || character.stats.strength || '',
        stealth: actionData?.fields?.stealth || character.stats.stealth || '',
        skill: actionData?.fields?.skill || character.stats.skill || '',
        specialAbilityName: actionData?.fields?.specialAbilityName || character.specialAbility.name || '',
        specialAbilityDescription: actionData?.fields?.specialAbilityDescription || character.specialAbility.description || '',
        avatarUrl: actionData?.fields?.avatarUrl || character.avatarUrl || undefined,
        link: actionData?.fields?.link || character?.profileLink?.url || '',
        featuredImageUrl: actionData?.fields?.featuredImageUrl || character?.featuredImageUrl || '',
    })

    const [loading, setLoading] = useState(false)

    const handleImageChange = async (file: File, name: 'avatarUrl' | 'featuredImageUrl') => {
        const formData = new FormData()
        formData.append('image', file)
        console.log(file.name, name)
        setLoading(l => true)

        const result = await fetch('/upload-image', {
            method: "POST",
            body: formData
        })

        const { image, error }: { image?: string, error?: string } = await result.json()
        console.log(image, error)
        setInputs({ ...inputs, [name]: image })
        setLoading(l => false)
    }

    return (
        <Modal isOpen={true} onClick={() => navigate(`/gm-realm/characters/${params.characterId}`)}>
            <div className="w-full md:w-[30rem]">
                <form method="POST" className="flex flex-col max-w-full">
                    {inputs.avatarUrl && <input
                        type="hidden"
                        name="avatarUrl"
                        value={inputs.avatarUrl}
                    />}
                    {inputs.featuredImageUrl && <input
                        type="hidden"
                        name="featuredImageUrl"
                        value={inputs.featuredImageUrl}
                    />}
                    <div className="text-3xl self-center p-2">
                        Edit Character
                    </div>

                    <div className="w-full flex justify-center">
                        <ImageUploader
                            onChange={(val) => handleImageChange(val, 'avatarUrl')}
                            imageUrl={inputs.avatarUrl}
                            loading={loading}
                            type="circle"
                            maxSize={2}
                        />
                    </div>
                    <div className="text-red-400 self-center">
                        {actionData?.formError}
                    </div>

                    <InputField
                        type="text"
                        onChange={e => setInputs({
                            ...inputs,
                            name: e.target.value
                        })}
                        name="name"
                        value={inputs.name}
                        display="Character Name"
                        error={actionData?.fieldErrors?.name}
                    />
                    <InputField
                        type="text"
                        onChange={e => setInputs({
                            ...inputs,
                            pronouns: e.target.value
                        })}
                        name="pronouns"
                        value={inputs.pronouns}
                        display="Pronouns"
                        error={actionData?.fieldErrors?.pronouns}
                    />
                    <Textarea
                        name="description"
                        value={inputs.description}
                        onChange={e => setInputs({
                            ...inputs,
                            description: e.target.value
                        })}
                        display="Description"
                        error={actionData?.fieldErrors?.description}
                        maxLength={200}
                    />
                    <InputField
                        type="text"
                        name="link"
                        value={inputs.link}
                        onChange={e => setInputs({
                            ...inputs,
                            link: e.target.value
                        })}
                        display="Profile Link"
                        error={actionData?.fieldErrors?.link}
                        maxLength={100}
                    />

                    <div className="w-full flex flex-col justify-center items-center">
                        <div className="text-xl md:text-2xl mb-1">
                            Featured Image
                        </div>
                        <ImageUploader
                            onChange={(val) => handleImageChange(val, 'featuredImageUrl')}
                            imageUrl={inputs.featuredImageUrl}
                            loading={loading}
                            type="medium square"
                            maxSize={3}
                        />
                    </div>

                    <div className="flex flex-row w-full">
                        <div className="mx-2">
                            <InputField
                                type="number"
                                onChange={e => setInputs({
                                    ...inputs,
                                    charisma: e.target.value
                                })}
                                name="charisma"
                                value={inputs.charisma}
                                display="CHR"
                                error={actionData?.fieldErrors?.charisma}
                            />
                        </div>
                        <div className="mx-2">
                            <InputField
                                type="number"
                                onChange={e => setInputs({
                                    ...inputs,
                                    strength: e.target.value
                                })}
                                name="strength"
                                value={inputs.strength}
                                display="STR"
                                error={actionData?.fieldErrors?.strength}
                            />
                        </div>
                        <div className="mx-2">
                            <InputField
                                type="number"
                                onChange={e => setInputs({
                                    ...inputs,
                                    stealth: e.target.value
                                })}
                                name="stealth"
                                value={inputs.stealth}
                                display="STL"
                                error={actionData?.fieldErrors?.stealth}
                            />
                        </div>
                        <div className="mx-2">
                            <InputField
                                type="number"
                                onChange={e => setInputs({
                                    ...inputs,
                                    skill: e.target.value
                                })}
                                name="skill"
                                value={inputs.skill}
                                display="SKL"
                                error={actionData?.fieldErrors?.skill}
                            />
                        </div>

                    </div>
                    <InputField
                        type="text"
                        onChange={e => setInputs({
                            ...inputs,
                            specialAbilityName: e.target.value
                        })}
                        name="specialAbilityName"
                        value={inputs.specialAbilityName}
                        display="Special Ability Name"
                        error={actionData?.fieldErrors?.specialAbilityName}
                    />
                    <Textarea
                        name="specialAbilityDescription"
                        value={inputs.specialAbilityDescription}
                        onChange={e => setInputs({
                            ...inputs,
                            specialAbilityDescription: e.target.value
                        })}
                        display="Special Ability Description"
                        error={actionData?.fieldErrors?.specialAbilityDescription}
                        maxLength={200}
                    />
                    <button
                        type="submit"
                        className="self-center text-xl border-[1px] border-slate-700 text-slate-700 rounded-lg py-1 px-2 mt-8 hover:bg-bittersweet hover:border-bittersweet hover:text-white transition md:text-2xl"
                    >
                        Save Changes
                    </button>
                </form>
            </div>
        </Modal>
    )
}