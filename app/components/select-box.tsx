import React, { HTMLInputTypeAttribute } from "react";

interface props {
    name: string
    onChange: (...args: any) => any
    value: string
    display: string
    options: {
        name: string
        value: any
    }[]
    error?: string | null
}
export default function SelectBox({ name, onChange, value, display, error, options }: props) {
    return <div className="py-2">
        <div>
            <label htmlFor={name} className="text-lg mr-4">
                {display}
            </label>
            <select
                className="text-slate-600 rounded-md bg-slate-300 text-lg cursor-pointer"
                name={name}
                onChange={onChange}
                value={value}
                id={value}
            >
                {options.map(option => (
                    <option key={option.name} value={option.value}>{option.name}</option>
                ))}
            </select>
        </div>
        <div className="text-red-400">
            {error}
        </div>
    </div>
}