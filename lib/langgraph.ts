import { ChatAnthropic } from "@langchain/anthropic";
// import { ChatGroq } from "@langchain/groq";
// import { ChatVertexAI } from "@langchain/google-vertexai";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import wxflows from "@wxflows/sdk/langchain";
import {
    END,
    MemorySaver,
    MessagesAnnotation,
    START,
    StateGraph,
} from "@langchain/langgraph"
import SYSTEM_MESSAGE from "@/constants/systemMessage";
import { AIMessage, BaseMessage, HumanMessage, SystemMessage, trimMessages } from "@langchain/core/messages";
import {
    ChatPromptTemplate,
    MessagesPlaceholder,
} from "@langchain/core/prompts";

//customers at: https://introspection.apis.stepzen.com/customers
//Comments at: https://dummyjson.com/comments

//Trim the messages to manage conversation history
const trimmer = trimMessages({
    maxTokens: 10,
    strategy: "last",
    tokenCounter: (msgs) => msgs.length,
    includeSystem: true,
    allowPartial: false,
    startOn: "human",
});


//connect to wxflow
const toolClient = new wxflows({
    endpoint: process.env.WXFLOWS_ENDPOINT || "",
    apikey: process.env.WXFLOWS_API_KEY,
});

//retrieve the tools
const tools = await toolClient.lcTools;
const toolNode = new ToolNode(tools);

const initialiseModel = () => {
    const model = new ChatAnthropic({
        modelName: "gclaude-3-5-sonnet-20241022",
        anthropicApiKey: process.env.ANTHROPIC_API_KEY,
        temperature: 0.7,//higher tempreture for more creative responses
        // maxTokens:4096,//higher token for longer responses
        streaming:true,//enable streaming for faster responses
        clientOptions: {
            defaultHeaders: {
              "anthropic-beta": "prompt-caching-2024-07-31",
            },
          },
        callbacks:[
        {
            handleLLMStart: async () => {
                // console.log("LLM started");
            },
            handleLLMEnd: async (output) => {
                console.log("LLM ended", output);
                const usage = output.llmOutput?.usage;
                if (usage) {
                    // console.log("Usage: ", {
                    //     input_tokens: usage.input_tokens,
                    //     output_tokens: usage.output_tokens,
                    //     total_tokens: usage.input_tokens + usage.output_tokens,
                    //     cache_creation_input_tokens: usage.cache_creation_input_tokens || 0,
                    //     cache_read_input_tokens: usage.cache_read_input_tokens || 0,
                    // });
                }
            },
            // handleLLMNewToken: async (token: string) => {
            //     console.log("new token", token);
            // },
        }
    ]
    }).bindTools(tools);

    return model; 
};

//define the function that determines whether to continue or not
function shouldContinue(state: typeof MessagesAnnotation.State){
    const messages = state.messages;
    const lastMessage = messages[messages.length - 1] as AIMessage;

    //if llm makes a tool call, then we route to thr "tools" node
    if (lastMessage.tool_calls?.length){
        return 'tools';
    }

    //if the last message is the end message, then we end the conversation
    if (lastMessage.content && lastMessage._getType() === "tool"){
        return "agent";
    }

    //otherwise , we stop the conversation
    return END;
}

const createWorkflow = () => {
    const model = initialiseModel();

    const stateGraph = new StateGraph(MessagesAnnotation).addNode('agent', async (state) => {

        //create the systme message content
        const systemContent = SYSTEM_MESSAGE;

        //create the promt template with system message and messages placeholder
        const promptTemplate = ChatPromptTemplate.fromMessages([
        new SystemMessage(systemContent, {
            cache_control: { type: "ephemeral" },//set a cache breakpoint (max no. of breakpoints is 4)

        }),
        new MessagesPlaceholder("messages"),
        ]);

        // trim the messages to manage converstaion history
        const trimmedMessages = await trimmer.invoke(state.messages);

        //format the prompt template
        const prompt =  await promptTemplate.invoke({ messages: trimmedMessages });

        //get response from the model
        const response = await model.invoke(prompt);

        return { messages: [response] };



    }
).addEdge(START, 'agent')
.addNode('tools', toolNode)
.addConditionalEdges('agent', shouldContinue)
.addEdge('tools', 'agent');

return stateGraph;
};

function addCachingHeaders(messages: BaseMessage[]): BaseMessage[] {
    //rules of caching headers for turn-by-turn conversation
    //1. cache the first SYSTEM messge
    //2. cache the last message
    //3. cache the second to last HUMAN messge

    if (!messages.length) return messages;

    //create a copy of messages to avoid mutating the original
    const cachedMessages = [...messages];

    const addCache = (message: BaseMessage) => {
        message.content = [
            {
                type: "text",
                text: message.content as string,
                cache_control: { type: "ephemeral" },
            }
        ]
    }

    //cache the last system message
    // console.log("Caching last message")
    addCache(cachedMessages.at(-1)!);

    let humanCount = 0;
    for (let i = cachedMessages.length - 1; i >= 0; i--) {
        if (cachedMessages[i] instanceof HumanMessage) {
            humanCount++;
            if(humanCount === 2){
                addCache(cachedMessages[i]);
                break;
            }
        }
    }

    return cachedMessages;
}

export async function submitQuestion(messages: BaseMessage[], chatId: string){

    //add caching headers to messages
    const cachedMessages = addCachingHeaders(messages);
    console.log("Messages:", messages);

    const workflow = createWorkflow();

    //create a checkpoint to save the state of the conversation
    const checkpointer = new MemorySaver();
    const app = workflow.compile({ checkpointer });


    //run the graph and stream
    const stream = await app.streamEvents({
        
        messages: cachedMessages,
    },
        {
            version: 'v2',
            configurable: {
                thread_id: chatId,
            },
            streamMode: 'messages',
            runId: chatId,

    }
);

return stream;

}