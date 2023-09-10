import type { LoaderArgs } from "@remix-run/node";
import { eventStream } from "remix-utils";

import { prisma } from "~/utils/prisma.server";

export const loader = async ({ request, params }: LoaderArgs) => {

    const chatRoom = params.roomId;

    let lastSnapshot = await prisma.gameChatMessage.findMany({
        where: {
            roomId: chatRoom
        },
        select: {
            id: true
        }
    })

    console.log("CLIENT CONNECTED")

    return eventStream(request.signal, (send) => {

        let timer = setInterval(() => {
            prisma.gameChatMessage.findMany({
                where: {
                    roomId: chatRoom
                },
                select: {
                    id: true
                }
            })
                .then(currentSnapshot => {
                    if (JSON.stringify(lastSnapshot.sort()) !== JSON.stringify(currentSnapshot.sort())) {
                        console.log("TRIGGER CHANGE!")
                        send({ event: "update", data: new Date().toISOString() });
                    }

                    lastSnapshot = currentSnapshot
                })
        }, 500);

        return function clear() {
            console.log("CLIENT DISCONNECTED")
            clearInterval(timer);
        };
    });

};