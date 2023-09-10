import { Link } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { v4 } from "uuid";

interface props {
    elements: {
        imageUrl: string,
        credit?: {
            display: string,
            url: string
        },
        content: React.ReactNode
    }[]
}

export default function Slideshow({ elements }: props) {
    const [index, setIndex] = useState(0);
    const timeoutRef = useRef<any>(null);
    const delay = 5000;

    const resetTimeout = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    }

    useEffect(() => {
        resetTimeout();
        timeoutRef.current = setTimeout(
            () =>
                setIndex((prevIndex) =>
                    prevIndex === elements.length - 1 ? 0 : prevIndex + 1
                ),
            delay
        );

        return () => {
            resetTimeout();
        };
    }, [index]);
    return <div className="m-0 overflow-hidden max-w-full relative">
        <div className="whitespace-nowrap transition h-[18rem] sm:h-[22rem] md:h-[35rem]" style={{ transform: `translate3d(${-index * 100}%, 0, 0)` }}>
            {elements.map(elem => <div
                key={v4()}
                style={{ backgroundImage: `url(${elem.imageUrl})` }}
                className="bg-cover bg-center inline-block h-full w-full"
            >
                <span className="flex flex-col w-full h-full justify-center items-center text-center backdrop-blur-[3px] backdrop-brightness-[35%]">
                    {elem.content}
                </span>
            </div>)}
        </div>

        <div className="absolute bottom-3 w-full flex flex-row justify-center items-center">
            {elements.map((elem, idx) => <>
                <div
                    key={idx}
                    className={`m-2 ${idx === index ? "bg-slate-600 w-5 h-5" : 'bg-slate-400 w-4 h-4'} rounded-full border-2 border-slate-600 transition cursor-pointer shadow-lg`}
                    onClick={() => {
                        setIndex(idx);
                    }}
                />
            </>)}
        </div>

        {elements[index].credit ? <div className="absolute bottom-2 right-2 z-10 text-xs md:text-sm italic underline hover:no-underline">
            <Link to={elements[index].credit?.url || ''}>
                Image Credit: {elements[index]?.credit?.display}
            </Link>
        </div> : undefined}
    </div>
}