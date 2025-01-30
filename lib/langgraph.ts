import { ChatAnthropic } from "@langchain/anthropic";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import wxflows from "@wxflows/sdk/langchain";
import {
    END,
    MessagesAnnotation,
    START,
    StateGraph,
} from "@langchain/langgraph"

//customers at: https://introspection.apis.stepzen.com/customers
//Comments at: https://dummyjson.com/comments


//connect to wxflow
const toolClient = new wxflows({
    endpoint: process.env.WXFLOW_ENDPOINT || "",
    apikey: process.env.WXFLOW_API_KEY,
});

//retrieve the tools
const tools = await toolClient.lcTools;
const toolNode = new ToolNode(tools);

const initialiseModel = () => {
    const model = new ChatAnthropic({
        modelName: "claude-3-5-sonnet-20241022",
        anthropicApiKey: process.env.ANTHROPIC_API_KEY,
        temperature: 0.7,//higher tempreture for more creative responses
        maxTokens:4096,//higher token for longer responses
        streaming:true,//enable streaming for faster responses
        clientOptions:{
            defaultHeaders:{
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
}

const createWorkflow = () => {
    const model = initialiseModel();

    const stateGraph = new StateGraph(MessagesAnnotation).addNode('agent', async (state) => {
        const systemContent = SYSTEM_MESSAGE;
    })
}