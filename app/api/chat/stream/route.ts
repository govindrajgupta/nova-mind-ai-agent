import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/convex";
import { ChatRequestBody, SSE_DATA_PREFIX, SSE_LINE_DELIMITER, StreamMessage, StreamMessageType } from "@/lib/types";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {HumanMessage, AIMessage, ToolMessage} from "@langchain/core/messages";
import { submitQuestion } from "@/lib/langgraph";

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
                    
                });

                //conver msgs to langchain format
                const langchainMessages = [
                    ...messages.map((msg) => 
                        msg.role === "user"
                        ? new HumanMessage(msg.content)
                        : new AIMessage(msg.content)
                    ),
                    new HumanMessage(newMessage),
                ];

                try {
                    const eventStream = await submitQuestion(langchainMessages, chatId);

                for await (const event of eventStream) {

                    if (event.event === "on_chat_model_stream"){
                        const token = event.data.chunk;
                        if (token){
                            const text = token.content.at(0)?.["text"];

                            if (text) {
                                await sendSSEMessage(writer, {type: StreamMessageType.Token, token: text});
                            }
                        }

                    } else if (event.event === "on_tool_start") {
                        await sendSSEMessage(writer, {type: StreamMessageType.ToolStart, 
                            tool: event.name || "unknown", 
                            input: event.data.input});

                    } else if (event.event === "on_tool_end") {
                        const toolMessage = new ToolMessage(event.data.output);

                        await sendSSEMessage(writer, {type: StreamMessageType.ToolEnd,
                            tool: toolMessage.lc_kwargs.name || "unknown",
                            output: event.data.output,
                        });

                    }

                    
                }
                //send complition message without storing the response
                await sendSSEMessage(writer, {type: StreamMessageType.Done});
                    
                } catch (streamError) {
                    console.error("Error sending message to langchain:", streamError);
                    await sendSSEMessage(writer, {type: StreamMessageType.Error, error: 
                        streamError instanceof Error ? streamError.message
                        : "Stream processing failed",
                    });
                    
                }
                
            } catch (error) {
                console.error(error);
                await sendSSEMessage(writer, {type: StreamMessageType.Error, 
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            } finally {
                try {
                    await writer.close();
                    
                } catch (closeError) {
                    console.error("Error closing the stream:", closeError);
                }
            }
        };

        startStream();

        return response;

    } catch (error) {
        console.error(error);
        return NextResponse.json({error: "Failed to process the message. Please try again."} as const, {status: 500});

        
    }

}