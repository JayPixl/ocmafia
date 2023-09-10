interface props {
    name: string,
    onChange: (...args: any) => any,
    value: string,
    display: string,
    error?: string | null,
    maxLength?: number
}

export default function Textarea({ name, onChange, value, display, error, maxLength = 1000 }: props) {
    return <div className="flex flex-col">
        <label htmlFor={name} className="text-xl md:text-2xl">{display}</label>
        <textarea
            rows={3}
            name={name}
            onChange={onChange}
            value={value}
            className="rounded-md text-slate-600 md:text-xl p-3 my-1 bg-slate-200"
            maxLength={maxLength}
        />
        <div className="text-red-400">{error}</div>
    </div>
}