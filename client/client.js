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
// SIMPLE TOOL DEFINITIONS
// --------------------------------------------------

const tools = [
  {
    type: "function",
    function: {
      name: "list_states",
      description: "List all Indian states",
      parameters: {
        type: "object",
        properties: {}
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_capital",
      description: "Get capital city by state name",
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
      name: "get_weather",
      description: "Get weather by city name",
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
  }
];

console.log("\n✅ MCP Client Started");
console.log("Ask anything...\n");

// --------------------------------------------------
// MAIN LOOP
// --------------------------------------------------

while (true) {

  const userInput = await askQuestion("You: ");

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
- list_states
- get_capital
- get_weather

Rules:
- If user asks weather in capital:
  1. call get_capital
  2. then call get_weather

- Never generate fake weather.
- Never assume weather.
- If tool says not found then say:
  "Weather information not found."

- Always use tools.
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

      let capitalName = "";
      let weatherData = "";

      for (const toolCall of message.tool_calls) {

        const toolName = toolCall.function.name;

        const toolArgs = JSON.parse(toolCall.function.arguments);

        console.log(`\n🔧 Calling Tool: ${toolName}`);
        console.log("Arguments:", toolArgs);

        // --------------------------------------------------
        // CALL MCP TOOL
        // --------------------------------------------------

        const result = await mcpClient.callTool({
          name: toolName,
          arguments: toolArgs
        });

        console.log("Tool Result:", result);

        const toolText = result?.content?.[0]?.text || "";

        // --------------------------------------------------
        // CAPITAL
        // --------------------------------------------------

        if (toolName === "get_capital") {

          capitalName = toolText.replace(/"/g, "").trim();

          console.log(`\n🏛 Capital Found: ${capitalName}`);

          // --------------------------------------------------
          // NOW CALL WEATHER MANUALLY
          // --------------------------------------------------

          console.log(`\n🔧 Calling Tool: get_weather`);
          console.log(`Arguments: { city: "${capitalName}" }`);

          const weatherResult = await mcpClient.callTool({
            name: "get_weather",
            arguments: {
              city: capitalName
            }
          });

          console.log("Tool Result:", weatherResult);

          const weatherText =
            weatherResult?.content?.[0]?.text || "";

          // --------------------------------------------------
          // VALIDATE WEATHER
          // --------------------------------------------------

          if (
            weatherText.includes("Not Found") ||
            weatherText.includes('"temperature": 0') ||
            weatherText.includes('"condition": "Not Found"')
          ) {

            console.log("\n❌ Weather information not found.\n");
            weatherData = "Weather information not found.";

          } else {

            weatherData = weatherText;
          }
        }

        // --------------------------------------------------
        // DIRECT WEATHER TOOL
        // --------------------------------------------------

        else if (toolName === "get_weather") {

          if (
            toolText.includes("Not Found") ||
            toolText.includes('"temperature": 0') ||
            toolText.includes('"condition": "Not Found"')
          ) {

            weatherData = "Weather information not found.";

          } else {

            weatherData = toolText;
          }
        }

        // --------------------------------------------------
        // LIST STATES
        // --------------------------------------------------

        else if (toolName === "list_states") {

          console.log(`\n🤖 AI:\n${toolText}\n`);
        }
      }

      // --------------------------------------------------
      // FINAL RESPONSE
      // --------------------------------------------------

      if (capitalName && weatherData) {

        console.log(`
🤖 AI:
Capital: ${capitalName}

Weather:
${weatherData}
`);
      }
      else if (weatherData) {

        console.log(`
🤖 AI:
${weatherData}
`);
      }

    } else {

      // --------------------------------------------------
      // NO TOOL CALL
      // --------------------------------------------------

      console.log(`\n🤖 AI: ${message.content}\n`);
    }

  } catch (err) {

    console.error("\n❌ ERROR:");
    console.error(err.message);
  }
}