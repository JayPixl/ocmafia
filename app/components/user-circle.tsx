import { AvatarColors, AvatarTypes } from "@prisma/client"
import { gradientMap } from "~/utils/constants"

interface props {
    avatarType?: AvatarTypes
    avatarColor?: AvatarColors
    avatarUrl?: string
    username: string
    size?: 'SMALL' | 'LARGE' | 'XLARGE'
}

export default function UserCircle({ avatarType = 'COLOR', avatarColor, avatarUrl, username, size = 'SMALL' }: props) {
    return (
        <>
            {avatarType === "COLOR" ? (
                <div
                    className={
                        `flex items-center text-slate-200 justify-center rounded-full border-slate-200 font-bold
                        ${size === 'SMALL' && `h-8 w-8 border-2 text-base`} 
                        ${size === 'LARGE' && `h-16 w-16 border-[3px] text-2xl`} 
                        ${size === 'XLARGE' && `h-16 w-16 border-[3px] text-3xl lg:h-24 lg:w-24 lg:border-[4px] lg:text-5xl`} 
                        ${avatarColor && gradientMap[gradientMap.indexOf(gradientMap.filter(obj => obj.color === avatarColor)[0])].styles}`
                    }
                >
                    {avatarType === 'COLOR' && username[0].toUpperCase()}
                </div>
            ) : (
                <div
                    style={{
                        ...(avatarUrl ? { backgroundImage: `url('${avatarUrl}')` } as React.CSSProperties : {})
                    }}
                    className={
                        `${size === 'SMALL' && `h-8 w-8 border-2`} 
                        ${size === 'LARGE' && `h-16 w-16 border-[3px]`} 
                        ${size === 'XLARGE' && `h-16 w-16 border-[3px] lg:h-24 lg:w-24 lg:border-[4px]`} 
                        flex items-center justify-center rounded-full bg-cover`
                    }
                />
            )}

        </>
    )
}