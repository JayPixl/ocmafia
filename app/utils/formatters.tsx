import { Link } from "@remix-run/react"
import { createElement } from 'react'
import { v4 as uuidv4 } from 'uuid'

export const formatCase: (string: string) => string = (string) => {
    return string[0].toUpperCase() + string.slice(1).toLowerCase()
}

export const formatText: (string: string) => any = (string) => {
    let newString = (string.replace(/^\s*$/g, ' ')).trim()

    let words = newString.split(' ')

    let newArray: any[] = []

    words.map(word => {
        if (/^\@\w+$/.test(word)) {
            let newElement = createElement(Link, { to: `/profile/${word.slice(1)}`, className: 'font-semibold', children: word })
            newArray.push(newElement)
        } else {
            if (typeof newArray[newArray.length - 1] === 'string') {
                newArray[newArray.length - 1] += ` ${word}`
            } else {
                newArray.push(word)
            }
        }
    })

    return <span>
        {newArray.map(elem => <span key={uuidv4()}>{elem} </span>)}
    </span>
}

export const formatGameMessage: (string?: string, actor?: { name: string, id: string }, target?: { name: string, id: string }) => any = (string, actor, target) => {
    let newString = (string?.replace(/^\s*$/g, ' '))?.trim() || ''

    let words = newString.split(' ')

    let newArray: any[] = []

    words.map(word => {
        if (/^\@\@$/.test(word) && target?.name && target?.id) {
            let newElement = createElement(Link, { to: `/gm-realm/characters/${target?.id}`, className: 'font-semibold', children: target?.name })
            newArray.push(newElement)
        } else if (/^\@\@\@$/.test(word) && actor?.name && actor?.id) {
            let newElement = createElement(Link, { to: `/gm-realm/characters/${actor?.id}`, className: 'font-semibold', children: actor?.name })
            newArray.push(newElement)
        }
        else {
            if (typeof newArray[newArray.length - 1] === 'string') {
                newArray[newArray.length - 1] += ` ${word}`
            } else {
                newArray.push(word)
            }
        }
    })

    return <span>
        {newArray.map(elem => <span key={uuidv4()}>{elem} </span>)}
    </span>
}

export const insertRawGameName: (string?: string, actor?: string, target?: string) => any = (string, actor, target) => {
    let newString = (string?.replace(/^\s*$/g, ' '))?.trim() || ''

    let words = newString.split(' ')

    let newArray: any[] = []

    words.map(word => {
        if (/^\@\@$/.test(word) && target) {
            newArray.push(target)
        } else if (/^\@\@\@$/.test(word) && actor) {
            newArray.push(actor)
        }
        else {
            newArray.push(word)
        }
    })

    return newArray.join(' ')
}