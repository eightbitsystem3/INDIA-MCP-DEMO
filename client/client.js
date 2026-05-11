import OpenAI from "openai";
import readline from "readline";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import dotenv from "dotenv";

dotenv.config();

// --------------------------------------------------
// MCP CLIENT CONNECTION
// --------------------------------------------------

const transport = new StdioClientTransport({
  command: "node",
  args: ["../mcp-server/server.js"]
});

const mcpClient = new Client({
  name: "india-mcp-client",
  version: "1.0.0"
});

await mcpClient.connect(transport);

// --------------------------------------------------
// OPENAI / GROQ CLIENT
// --------------------------------------------------

const llm = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL
});

// --------------------------------------------------
// READLINE CHAT
// --------------------------------------------------

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

// --------------------------------------------------
// TOOL DEFINITIONS
// --------------------------------------------------

const tools = [
  {
    type: "function",
    function: {
      name: "get_capital",
      description: "Get capital city by Indian state",
      parameters: {
        type: "object",
        properties: {
          state: {
            type: "string",
            description: "Indian state name"
          }
        },
        required: ["state"]
      }
    }
  },

  {
    type: "function",
    function: {
      name: "get_weather_by_state",
      description: "Get weather details by Indian state",
      parameters: {
        type: "object",
        properties: {
          state: {
            type: "string",
            description: "Indian state name"
          }
        },
        required: ["state"]
      }
    }
  },

  {
    type: "function",
    function: {
      name: "get_weather_by_city",
      description: "Get weather details by city",
      parameters: {
        type: "object",
        properties: {
          city: {
            type: "string",
            description: "City name"
          }
        },
        required: ["city"]
      }
    }
  },

  {
    type: "function",
    function: {
      name: "get_state_info",
      description:
        "Get complete state information including capital and weather",
      parameters: {
        type: "object",
        properties: {
          state: {
            type: "string",
            description: "Indian state name"
          }
        },
        required: ["state"]
      }
    }
  }
];

console.log("\n MCP Client Started");
console.log("Type 'exit' to quit.\n");

// --------------------------------------------------
// MAIN LOOP
// --------------------------------------------------

while (true) {

  const userInput = await askQuestion("You: ");

  // --------------------------------------------------
  // EXIT
  // --------------------------------------------------

  if (userInput.toLowerCase() === "exit") {

    console.log("Goodbye!");
    process.exit(0);
  }

  try {

    // --------------------------------------------------
    // ASK LLM
    // --------------------------------------------------

    const response = await llm.chat.completions.create({
      model: process.env.MODEL,
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `
                    You are an India assistant.

                    Available tools:
                    - get_capital
                    - get_weather_by_state
                    - get_weather_by_city
                    - get_state_info

                    Rules:
                    - If user asks:
                      "What is weather in capital of Rajasthan?"
                      then use:
                      get_state_info

                    - Always use tools.
                    - Never generate fake weather.
                    - Never assume weather.
                    - Only respond using tool results.
                    `
        },
        {
          role: "user",
          content: userInput
        }
      ],
      tools,
      tool_choice: "auto"
    });

    const message = response.choices[0].message;

    // --------------------------------------------------
    // TOOL CALLS
    // --------------------------------------------------

    if (message.tool_calls) {

      for (const toolCall of message.tool_calls) {

        const toolName = toolCall.function.name;

        const toolArgs = JSON.parse(
          toolCall.function.arguments
        );

        console.log(`\n🔧 Calling Tool: ${toolName}`);
        console.log("Arguments:", toolArgs);

        // --------------------------------------------------
        // CALL MCP TOOL
        // --------------------------------------------------

        const result = await mcpClient.callTool({
          name: toolName,
          arguments: toolArgs
        });

        console.log("\n MCP Response:");
        console.log(result);

        // --------------------------------------------------
        // EXTRACT RESPONSE
        // --------------------------------------------------

        const toolText =
          result?.content?.[0]?.text || "No response";

        // --------------------------------------------------
        // PRINT FINAL OUTPUT
        // --------------------------------------------------

        console.log(`
 AI Response:
${toolText}
`);
      }

    } else {

      // --------------------------------------------------
      // NO TOOL CALL
      // --------------------------------------------------

      console.log(`
 AI:
${message.content}
`);
    }

  } catch (err) {

    console.error("\n ERROR:");
    console.error(err.message);
  }
}