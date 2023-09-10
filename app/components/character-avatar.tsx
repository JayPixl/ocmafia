import { AvatarColors, AvatarTypes } from "@prisma/client"
import { gradientMap } from "~/utils/constants"

interface props {
    avatarUrl?: string
    size?: 'SMALL' | 'MEDIUM' | 'LARGE' | 'XLARGE'
}

export default function CharacterAvatar({ avatarUrl, size = 'SMALL' }: props) {
    return (
        <>
            {!avatarUrl ? (
                <div
                    className={
                        `flex items-center text-slate-200 justify-center rounded-full border-slate-200 font-bold
                        ${size === 'SMALL' && `h-8 w-8 border-2 text-base`} 
                        ${size === 'MEDIUM' && `h-12 w-12 border-2 text-base`} 
                        ${size === 'LARGE' && `h-16 w-16 border-[3px] text-2xl`} 
                        ${size === 'XLARGE' && `h-16 w-16 border-[3px] text-3xl lg:h-24 lg:w-24 lg:border-[4px] lg:text-5xl`} 
                        bg-gradient-to-br from-gray-400 to-gray-600`
                    }
                />
            ) : (
                <div
                    style={{
                        ...(avatarUrl ? { backgroundImage: `url('${avatarUrl}')` } as React.CSSProperties : {})
                    }}
                    className={
                        `${size === 'SMALL' && `h-8 w-8 border-2`} 
                        ${size === 'MEDIUM' && `h-12 w-12 border-2 text-base`} 
                        ${size === 'LARGE' && `h-16 w-16 border-[3px]`} 
                        ${size === 'XLARGE' && `h-16 w-16 border-[3px] lg:h-24 lg:w-24 lg:border-[4px]`} 
                        flex items-center justify-center rounded-full bg-cover`
                    }
                />
            )}

        </>
    )
}