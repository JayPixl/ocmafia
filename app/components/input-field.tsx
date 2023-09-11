import React, { HTMLInputTypeAttribute } from "react";

interface props {
    name: string,
    onChange: (...args: any) => any,
    type: HTMLInputTypeAttribute,
    value: string,
    display: string
    error?: string | null
    maxLength?: number
    disabled?: boolean
}
export default function InputField({ name, onChange, type, value, display, error, maxLength = 9999, disabled = false }: props) {
    return <div className="py-2">
        <div>
            <label htmlFor={name} className="text-xl md:text-2xl">
                {display}
            </label>
        </div>
        <div>
            <input
                className={`text-slate-600 rounded-md ${disabled ? "bg-slate-400" : "bg-slate-200"} w-full md:text-xl py-1 px-2 my-1`}
                type={type}
                name={name}
                onChange={onChange}
                value={value}
                maxLength={maxLength}
                disabled={disabled}
            />
        </div>
        <div className="text-red-400">
            {error}
        </div>
    </div>
}