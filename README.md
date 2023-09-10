# OC Mafia

### >>>> [Enter the world of OC Mafia](https://ocmafia-fly.fly.dev/) <<<<

*Created by Joshua Lawrence, Jr.*

==============================================================

## Quick Facts

>- Created with Remix, TypeScript, Tailwind, MongoDB, Prisma, and Cloudinary
>- Hosted by Flyio (previously Vercel)

This project demonstrates my skill with fullstack web development. I brought an idea to life through code, and was able to work through any of the issues I ran into.

## The Journey

<hr>

Joshua here! 👋

This project has been so helpful in helping me learn and understand fullstack web development with JavaScript. Remix is an awesome tool, both easy to understand and powerful in production. I've documented some of the major issues I've had to deal with and how I was able to find a solution.


<hr>

>### Issues with server utility files
>
> Halfway through writing the user utility functions in the `/utils/users.server.ts` file, I found that returning response objects such as `redirect()` or `json()` made it very hard to deal with the data returned from the function. I rewrote all the functions to return objects with the data I needed from them. 

For instance I changed

```ts
// ... Imports
const getUser: 
    (request: Request) => Promise<
        User | TypedResponse
    > = async (request) => {
    
    const user = await // ... get user from database

    if (!user) return json({
        error: "Could not find user in database"
    }, {
        status: 404
    })

    return json({user})
}


```

into

```ts
// Imports ...

const getUser: (request: Request) => Promise<{
    user?: User,
    error?: string,
    status?: number
}> = async (request) => {

    const user = await // ... get user from database

    if (!user) return {
        error: "Could not find user in database",
        status: 404
    }

    return {
        user,
        status: 200
    }
}

```

> This way I can import the errors or user object more easily both in other utility functions or in the `loader` function on my route.

```ts

const loader: LoaderFunction = ({ request }) => {
    const {
        user,
        status,
        error
    } = await getUser(request)

    if (error) return json({ error }, { status })

    return json({ user })
}

```

>### Auto-populating the navigation
>
>This was definitely a challenge, but I was finally able to figure out a way to make the left-side navigation section dynamic for future use. The way the site will be set up, many routes, especially under the `/games` route will be dynamic with dynamic display names and urls, while others, such as those in the `/archive` route will be static, just a lot of static information and game rules. So I needed a way to be able to display the correct navigation, whether it was dynamic or static.
>
> The first step in accomplishing this was creating an array of objects of type `Nav`, with the major static navigation routes. Then I created a function that builds the full navigation path for an array of `Nav` elements passed to it. That way I don't have to pass the entire full navigation path, only up to the nearest static anchor link in the array. Each link in this navigation path is connected to the next through the optional `parent` attribute.
>
> Then the `Navigation` component takes over, converting this array into a string of JSX elements that is passed into the element with the correct URL and display name, and underlined if it is the current route.