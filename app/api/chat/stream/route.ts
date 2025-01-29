import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/convex";
import { ChatRequestBody, SSE_DATA_PREFIX, SSE_LINE_DELIMITER, StreamMessage, StreamMessageType } from "@/lib/types";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

function sendSSEMessage(
    writer: WritableStreamDefaultWriter<Uint8Array>,
    data: StreamMessage
  ) {
    const encoder = new TextEncoder();
    return writer.write(
      encoder.encode(
        `${SSE_DATA_PREFIX}${JSON.stringify(data)}${SSE_LINE_DELIMITER}`
      )
    );
  }

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if(!userId){
            return new Response("Unauthorized", {status: 401});
        }

        const body = (await req.json()) as ChatRequestBody;

        const { messages, newMessage, chatId } = body;

        const convex = getConvexClient();

        const stream = new TransformStream({}, {highWaterMark: 1024});
        const writer = stream.writable.getWriter();

        const response = new Response(stream.readable, {
            headers:{
                "Content-Type": "text/event-stream",
                // "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",//disable buffering
            },
        });

        const startStream = async () => {
            try {
                //stream implementation

                //send initial connection established message
                await sendSSEMessage(writer, {type: StreamMessageType.Connected});


                //send user message to the convex
                await convex.mutation(api.messages.send,{
                    chatId,
                    content: newMessage,
                    
                })
                
            } catch (error) {
                console.error(error);
                return NextResponse.json({error: "Failed to process the message. Please try again."} as const, {status: 500});
            }
        };

        startStream();

        return response;

    } catch (error) {
        console.error(error);
        return NextResponse.json({error: "Failed to process the message. Please try again."} as const, {status: 500});

        
    }

}