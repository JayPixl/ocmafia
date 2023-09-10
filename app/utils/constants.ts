import { ActionType, Alignment, AvatarColors, CharacterStatus, Clearance, GameCharacterStatus, GameStatus, PhaseCharacterGameStatus, Role } from "@prisma/client"

export const clearanceMap: {
    [index: string]: Clearance[]
} = {
    USER: ['USER'],
    ADMIN: ['USER', 'ADMIN']
}

export const gradientMap: {
    color: AvatarColors,
    styles: string
}[] = [
        {
            color: 'RED',
            styles: 'bg-gradient-to-br from-red-400 to-red-600'
        },
        {
            color: 'BLUE',
            styles: 'bg-gradient-to-br from-blue-400 to-blue-600'
        },
        {
            color: 'GREEN',
            styles: 'bg-gradient-to-br from-green-400 to-green-600'
        }
    ]

export const GameCharacterStatusEmojis: any = {
    ALIVE: '💚',
    WOUNDED: '🩹',
    DEAD: '💀'
}

export const RoleAlignmentEmojis: any = {
    TOWN: '🎈',
    MAFIA: "🔪",
    NEUTRAL: "☘️",
    HOSTILE: "💣"
}

export const requiredTargetFields: any = {
    KILL: ['target', 'actor'],
    VOTING_EXECUTION: ['target'],
    WOUND: ['target', 'actor'],
    VOTING_SKIP: [],
    RESURRECTION: ['target'],
    QUIET_NIGHT: [],
    GAME_START: [],
    GAME_END: []
}

export const effectivenessResult: any = {
    STRENGTH: {
        NEGATIVE: ['Attacker Wounded', 'Target Wounded', '2 Accurate Clues'],
        0: ['Attacker Wounded', 'Target Wounded', '2 Accurate Clues'],
        1: ['Attacker Wounded', 'Target Killed', '2 Accurate Clues'],
        2: ['Target Killed', '2 Accurate Clues'],
        3: ['Target Killed', '2 Accurate Clues'],
        4: ['Target Killed', '1 Accurate Clue', '1 Inaccurate Clue'],
        5: ['Target Killed', '1 Accurate Clue', '1 Inaccurate Clue'],
        6: ['Target Killed', '1 Accurate Clue', '1 Inaccurate Clue'],
        7: ['Target Killed', '1 Accurate Clue', '1 Inaccurate Clue'],
        8: ['Target Killed Without A Trace'],
        9: ['Target Killed Without A Trace'],
        10: ['Target Killed Without A Trace'],
        GREATER: ['Target Killed Without A Trace'],
    },
    STEALTH: {
        NEGATIVE: ['Attacker Revealed To Target', 'Target Wounded', '1 Accurate Clue'],
        0: ['Attacker Revealed To Target', 'Target Wounded', '1 Accurate Clue'],
        1: ['Target Wounded', '1 Inaccurate Clue'],
        2: ['Target Wounded', '1 Inaccurate Clue'],
        3: ['Target Wounded', '1 Inaccurate Clue'],
        4: ['Target Killed', '1 Inaccurate Clue'],
        5: ['Target Killed', '1 Inaccurate Clue'],
        6: ['Target Killed', '1 Inaccurate Clue'],
        7: ['Target Killed', '1 Inaccurate Clue'],
        8: ['Target Killed Without A Trace'],
        9: ['Target Killed Without A Trace'],
        10: ['Target Killed Without A Trace'],
        GREATER: ['Target Killed Without A Trace'],
    },
    SKILL: {
        NEGATIVE: ['Target Wounded', 'Attacker Wounded', '1 Accurate Clue', '1 Inaccurate Clue'],
        0: ['Target Wounded', 'Attacker Wounded', '1 Accurate Clue', '1 Inaccurate Clue'],
        1: ['Target Wounded', 'Attacker Wounded', '1 Accurate Clue', '1 Inaccurate Clue'],
        2: ['Target Killed', 'Attacker Wounded', '1 Accurate Clue', '1 Inaccurate Clue'],
        3: ['Target Killed', 'Attacker Wounded', '1 Accurate Clue', '1 Inaccurate Clue'],
        4: ['Target Killed', 'Attacker Wounded', '1 Accurate Clue', '1 Inaccurate Clue'],
        5: ['Target Killed', '1 Accurate Clue'],
        6: ['Target Killed', '1 Accurate Clue'],
        7: ['Target Killed', '1 Accurate Clue'],
        8: ['Target Killed', '1 Accurate Clue'],
        9: ['Target Killed Without A Trace'],
        10: ['Target Killed Without A Trace'],
        GREATER: ['Target Killed Without A Trace'],
    },
    CHARISMA: {
        NEGATIVE: ['Attacker Killed', 'Target Wounded', '2 Accurate Clues'],
        0: ['Attacker Killed', 'Target Wounded', '2 Accurate Clues'],
        1: ['Target Wounded', '1 Inaccurate Clue', 'Attacker Revealed To Target'],
        2: ['Target Wounded', '1 Inaccurate Clue', 'Attacker Revealed To Target'],
        3: ['Target Killed Without A Trace'],
        4: ['Target Killed Without A Trace'],
        5: ['Target Killed Without A Trace'],
        6: ['Target Killed Without A Trace'],
        7: ['Target Killed Without A Trace'],
        8: ['Target Killed Without A Trace'],
        9: ['Target Killed Without A Trace'],
        10: ['Target Killed Without A Trace'],
        GREATER: ['Target Killed Without A Trace'],
    },
}

export const effectivenessDice: () => number = () => {
    return [-5, -4, -3, -2, -2, -1, -1, -1, 0, 0, 0, 0, 1, 1, 1, 2, 2, 3, 4, 5][Math.floor(Math.random() * 20)]
}