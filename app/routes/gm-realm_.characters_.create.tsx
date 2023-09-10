import { ActionFunction, LoaderFunction, json, redirect } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { ImageUploader } from "~/components/image-uploader";
import InputField from "~/components/input-field";
import Layout from "~/components/layout";
import Textarea from "~/components/textarea";
import { createCharacter } from "~/utils/characters.server";
import { prisma } from "~/utils/prisma.server";
import { getUser } from "~/utils/users.server";
import { validateLength, validateStat } from "~/utils/validators";

export const loader: LoaderFunction = async ({ request }) => {
    const { user } = await getUser(request)
    if (!user || ((await prisma.character.findMany({ where: { ownerId: user.id } })).length) >= (user?.characterLimit || 1)) return redirect("/gm-realm/characters")

    return json({ user })
}

export const action: ActionFunction = async ({ request }) => {
    const form = await request.formData()
    const name = form.get("name") as string || ''
    const description = form.get("description") as string || ''
    const pronouns = form.get("pronouns") as string || ''
    const specialAbilityName = form.get("specialAbilityName") as string || ''
    const specialAbilityDescription = form.get("specialAbilityDescription") as string || ''
    const strength = Number(form.get("strength"))
    const stealth = Number(form.get("stealth"))
    const skill = Number(form.get("skill"))
    const charisma = Number(form.get("charisma"))
    const avatarUrl = form.get("avatarUrl") as string || ''

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
        avatarUrl: avatarUrl || undefined
    }

    const fieldErrors = {
        name: validateLength(name, 15, 1),
        description: validateLength(description, 200, 10),
        pronouns: validateLength(pronouns, 10, 1),
        specialAbilityName: validateLength(specialAbilityName, 20, 1),
        specialAbilityDescription: validateLength(specialAbilityDescription, 200, 1),
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

    const { error, character } = await createCharacter({
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
        }
    }, request)

    if (character) return redirect(`/gm-realm/characters/${character.id}`)
    return json({
        formError: error,
        fields
    })
}

export default function CreateCharacter() {
    const { user } = useLoaderData()
    const actionData = useActionData()

    const [inputs, setInputs] = useState({
        name: actionData?.fields?.name || '',
        pronouns: actionData?.fields?.pronouns || '',
        description: actionData?.fields?.description || '',
        specialAbilityName: actionData?.fields?.specialAbilityName || '',
        specialAbilityDescription: actionData?.fields?.specialAbilityDescription || '',
        charisma: actionData?.fields?.charisma || '5',
        stealth: actionData?.fields?.stealth || '5',
        strength: actionData?.fields?.strength || '5',
        skill: actionData?.fields?.skill || '5',
        avatarUrl: actionData?.fields?.avatarUrl || '',
    })

    const [loading, setLoading] = useState(false)

    const handleImageChange = async (file: File) => {
        const formData = new FormData()
        formData.append("image", file)

        setLoading(l => true)

        const result = await fetch('/upload-image', {
            method: "POST",
            body: formData
        })

        const { image, error }: { image?: string, error?: string } = await result.json()
        setInputs({ ...inputs, avatarUrl: image })
        setLoading(l => false)
    }

    return (
        <Layout
            user={user}
            navigation={true}
            navArray={[{ name: "Grandmaster's Realm", id: "gm-realm", url: "/gm-realm" }, { name: "Characters", id: "characters", url: "/gm-realm/characters", parent: "gm-realm" }]}
        >
            <div className="w-full h-full flex justify-center items-center">
                <div className="bg-licorice-600 md:w-1/2 lg:p-16 m-5 rounded-lg w-72 p-8">
                    <div className="text-3xl md:text-4xl mb-4">Create new character</div>
                    <form method="POST">
                        <div className="text-red-400">
                            {actionData?.formError}
                        </div>
                        {inputs.avatarUrl && <input
                            type="hidden"
                            name="avatarUrl"
                            value={inputs.avatarUrl}
                        />}
                        <div className="w-full flex justify-center">
                            <ImageUploader
                                onChange={handleImageChange}
                                imageUrl={inputs.avatarUrl}
                                loading={loading}
                                type="circle"
                                maxSize={2}
                            />
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
                        <div className="w-full flex justify-center items-center">
                            <button
                                type="submit"
                                className="text-xl border-[1px] border-dogwood rounded-lg py-1 px-2 mt-8 hover:bg-bittersweet hover:border-bittersweet hover:text-white transition md:text-2xl"
                            >
                                Create Character
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    )
}

// Add edit character page