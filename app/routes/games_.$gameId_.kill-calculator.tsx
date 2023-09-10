import { User } from "@prisma/client";
import { LoaderFunction, json, redirect } from "@remix-run/node";
import { useLoaderData, useParams } from "@remix-run/react";
import { useState, useEffect } from 'react'
import { v4 } from "uuid";
import GameEditToolbar from "~/components/game-edit-toolbar";
import Layout from "~/components/layout";
import { effectivenessDice, effectivenessResult } from "~/utils/constants";
import { getGameById, requireHost } from "~/utils/games.server";
import { prisma } from "~/utils/prisma.server";
import { CharacterWithMods, GameWithMods, UserWithMods } from "~/utils/types";
import { getUser } from "~/utils/users.server";

export const loader: LoaderFunction = async ({ request, params }) => {
    const { user } = await getUser(request)
    const { game } = await getGameById(params.gameId || '')
    if (!game) return redirect('/games')

    const { authorized } = await requireHost(request, game.id)
    if (!authorized) return redirect(`/games/${params.gameId}`)

    const characters = await prisma.character.findMany({
        where: {
            currentGameId: game.id
        },

    })

    return json({ user, game, characters })
}

export default function KillCalculator() {
    const loaderData = useLoaderData()
    const { user, game, characters }: { user?: UserWithMods, game?: GameWithMods, characters?: CharacterWithMods[] } = loaderData
    const params = useParams()

    const [inputs, setInputs] = useState({
        strategy: 'STRENGTH',
        attacker: {
            characterId: '',
            modifier: '0',
            totalValue: '0',
            inputValue: '0'
        },
        defender: {
            characterId: '',
            modifier: '0',
            totalValue: '0',
            inputValue: '0'
        }
    })

    const [result, setResult] = useState<string[]>([])

    useEffect(() => {
        const strat: 'stealth' | 'strength' | 'skill' | 'charisma' = inputs.strategy.toLowerCase() as 'stealth' | 'strength' | 'skill' | 'charisma'
        setInputs({
            ...inputs,
            attacker: {
                ...inputs.attacker,
                totalValue: characters?.filter(char => char.id === inputs.attacker.characterId)[0]?.stats[strat] ? (Number(characters?.filter(char => char.id === inputs.attacker.characterId)[0]?.stats[strat]) + Number(inputs.attacker.modifier)).toString() : inputs.attacker.totalValue
            },
            defender: {
                ...inputs.defender,
                totalValue: characters?.filter(char => char.id === inputs.defender.characterId)[0]?.stats[strat] ? (Number(characters?.filter(char => char.id === inputs.defender.characterId)[0]?.stats[strat]) + Number(inputs.defender.modifier)).toString() : inputs.defender.totalValue
            }
        })

    }, [inputs.attacker.characterId, inputs.attacker.modifier, inputs.defender.characterId, inputs.defender.modifier, inputs.strategy])

    const calculate: () => void = () => {
        const effectiveness = Number(inputs.attacker.totalValue) - Number(inputs.defender.totalValue) + effectivenessDice()
        setResult([`Effectiveness: ${effectiveness}`, ...(effectiveness < 0 ? effectivenessResult[inputs.strategy].NEGATIVE : effectiveness > 10 ? effectivenessResult[inputs.strategy].GREATER : effectivenessResult[inputs.strategy][effectiveness])])
    }

    return (
        <Layout
            user={user}
            navigation={true}
            navArray={[
                { name: 'Games', url: `/games`, id: 'games' },
                { name: game?.name || '', url: `/games/${params?.gameId}`, id: params?.gameId || '', parent: 'games' },
                { name: "Edit", url: `/games/${params?.gameId}/edit`, id: 'edit' || '', parent: params?.gameId }
            ]}
        >
            <GameEditToolbar
                currentPage="killCalculator"
                gameId={game?.id}
            />
            <div className="text-3xl font-bold mt-6 w-full text-center">
                Kill Calculator
            </div>

            <div className="w-full flex flex-col lg:flex-row justify-between items-center p-5">

                <div className="flex flex-col lg:flex-row items-center justify-center">
                    <div className="flex flex-col">
                        <div className="text-lg font-semibold pt-2">
                            Character
                        </div>
                        <select
                            value={inputs.attacker.characterId}
                            onChange={e => setInputs({
                                ...inputs,
                                attacker: {
                                    ...inputs.attacker,
                                    characterId: e.target.value
                                }
                            })}
                            className="px-2 py-1 bg-slate-200 text-licorice-900 rounded-lg"
                        >
                            <option value=''>( None )</option>
                            {characters?.map(char => <option value={char.id} key={v4()}>{char.name} - ({char.stats?.[inputs.strategy.toLowerCase() as 'stealth' | 'strength' | 'skill' | 'charisma']})</option>)}
                        </select>

                        <div className="text-lg font-semibold pt-2">
                            Modifier
                        </div>
                        <input
                            type="number"
                            value={inputs.attacker.modifier}
                            onChange={e => setInputs({
                                ...inputs,
                                attacker: {
                                    ...inputs.attacker,
                                    modifier: e.target.value,
                                }
                            })}
                            className="px-2 py-1 bg-slate-200 text-licorice-900 rounded-lg"
                            max={5}
                            min={-5}
                        />

                        <div className="text-lg font-semibold pt-2">
                            Total
                        </div>
                        <input
                            type="number"
                            value={inputs.attacker.inputValue}
                            onChange={e => setInputs({
                                ...inputs,
                                attacker: {
                                    characterId: '',
                                    modifier: '0',
                                    inputValue: e.target.value,
                                    totalValue: e.target.value || '0'
                                }
                            })}
                            className="px-2 py-1 bg-slate-200 text-licorice-900 rounded-lg"
                            max={5}
                            min={-5}
                        />
                    </div>
                    <div className="p-4 text-4xl lg:text-5xl">
                        {inputs.attacker.totalValue}
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center py-4">
                    <select
                        value={inputs.strategy}
                        onChange={e => setInputs({
                            ...inputs,
                            strategy: e.target.value
                        })}
                        className="bg-opacity-[1%] bg-licorice-600 font-bold text-3xl rounded-lg py-1 hover:opacity-80"
                    >
                        <option value='STRENGTH'>STRENGTH</option>
                        <option value='STEALTH'>STEALTH</option>
                        <option value='SKILL'>SKILL</option>
                        <option value='CHARISMA'>CHARISMA</option>
                    </select>
                    <button
                        onClick={calculate}
                        className="text-xl my-3 border-[1px] border-bittersweet text-licorice-800 rounded-lg py-1 px-2 hover:bg-transparent bg-bittersweet hover:text-bittersweet transition md:text-2xl whitespace-nowrap"
                    >
                        🔪 Calculate 🔪
                    </button>

                </div>

                <div className="flex flex-col lg:flex-row items-center justify-center">
                    <div className="p-4 text-4xl lg:text-5xl">
                        {inputs.defender.totalValue}
                    </div>
                    <div className="flex flex-col">
                        <div className="text-lg font-semibold pt-2">
                            Character
                        </div>
                        <select
                            value={inputs.defender.characterId}
                            onChange={e => setInputs({
                                ...inputs,
                                defender: {
                                    ...inputs.defender,
                                    characterId: e.target.value
                                }
                            })}
                            className="px-2 py-1 bg-slate-200 text-licorice-900 rounded-lg"
                        >
                            <option value=''>( None )</option>
                            {characters?.map(char => <option value={char.id} key={v4()}>{char.name} - ({char.stats?.[inputs.strategy.toLowerCase() as 'stealth' | 'strength' | 'skill' | 'charisma']})</option>)}
                        </select>

                        <div className="text-lg font-semibold pt-2">
                            Modifier
                        </div>
                        <input
                            type="number"
                            value={inputs.defender.modifier}
                            onChange={e => setInputs({
                                ...inputs,
                                defender: {
                                    ...inputs.defender,
                                    modifier: e.target.value,
                                }
                            })}
                            className="px-2 py-1 bg-slate-200 text-licorice-900 rounded-lg"
                            max={5}
                            min={-5}
                        />

                        <div className="text-lg font-semibold pt-2">
                            Total
                        </div>
                        <input
                            type="number"
                            value={inputs.defender.inputValue}
                            onChange={e => setInputs({
                                ...inputs,
                                defender: {
                                    characterId: '',
                                    modifier: '0',
                                    inputValue: e.target.value,
                                    totalValue: e.target.value || '0'
                                }
                            })}
                            className="px-2 py-1 bg-slate-200 text-licorice-900 rounded-lg"
                            max={5}
                            min={-5}
                        />
                    </div>
                </div>

            </div>

            <div className="w-full text-center mb-5">
                {result.map(item => <div key={v4()}>
                    - {item}
                </div>)}
            </div>
        </Layout>
    )
}