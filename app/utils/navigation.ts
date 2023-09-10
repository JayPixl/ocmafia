export type Nav = {
    name: string,
    url: string,
    id: string,
    parent?: string
}

export const navigation: Nav[] = [
    {
        name: 'Games',
        id: 'games',
        url: '/games'
    },
    {
        name: 'Archive',
        id: 'archive',
        url: '/archive'
    },
    {
        name: 'Grandmaster\'s Realm',
        id: 'gm-realm',
        url: '/gm-realm'
    },
]

export const buildNavigation: (
    entries: Nav[]
) => Nav[] | undefined = (entries) => {
    let navArray: Nav[] = entries
    let currObj: Nav = entries[0]
    while (true) {
        if (currObj.parent) {
            const parent = navigation[navigation.indexOf(navigation.filter(obj => obj.id === currObj.parent)[0])]
            if (!parent) throw undefined
            navArray.unshift(parent)
            currObj = navArray[0]
        } else {
            break
        }
    }
    return navArray
}

// Games
// Games/Season 2 Game 3(uuid)
// Games/Season 2 Game 3/reports
// Games/Season 2 Game 3/rp/ancient-woods
// Games/Season 2 Game 3/

// Archive
// Archive/Roles
// Archive/Lore
// Archive/Handbook

// Grandmaster's Realm
// Grandmaster's Realm/Hosting