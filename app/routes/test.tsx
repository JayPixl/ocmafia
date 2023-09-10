// import { GameChatMessage } from "@prisma/client";
// import { ActionFunction, LoaderFunction, json } from "@remix-run/node";
// import { useState } from "react";
// import { prisma } from "~/utils/prisma.server";
// import { useLiveLoader } from "~/utils/use-live-loader";

// export const loader: LoaderFunction = async ({ request }) => {
//     const messages = await prisma.gameChatMessage.findMany({
//         where: {
//             room: {
//                 name: "testchat"
//             }
//         }
//     })
//     console.log("Refreshing")
//     return json({ messages })
// }

// export const action: ActionFunction = async ({ request }) => {
//     const form = await request.formData()
//     const message = form.get('message') as string

//     // await prisma.gameChatMessage.create({
//     //     data: {
//     //         content: message,
//     //         senderId: '649f6f6c85a88cf1999db208',
//     //         room: {
//     //             connect: {
//     //                 id: '64f74cde28545985c11224c2'
//     //             }
//     //         }
//     //     }
//     // })
//     return null
// }

// export default function Eventclient() {
//     const { messages } = useLiveLoader<typeof loader>()

//     const [inputs, setInputs] = useState({ message: '' })
//     return <div>
//         {/* {users.map((user: any) => <div key={user.username}>{user.username}</div>)} */}
//         <div>
//             {messages.map((message: GameChatMessage) => <div key={message.id}>
//                 {message.content}
//             </div>)}
//         </div>
//         <form method="POST">
//             <input type="text" name="message" value={inputs.message} onChange={e => setInputs({ ...inputs, message: e.target.value })} />
//             <button type="submit">Send!</button>
//         </form>
//     </div>
// }