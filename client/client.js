import OpenAI from "openai";
import readline from "readline";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import dotenv from "dotenv";
dotenv.config();
// -----------------------------
// MCP CLIENT CONNECTION
// -----------------------------
const transport = new StdioClientTransport({
  command: "node",
  args: ["../mcp-server/server.js"] // adjust path if needed
});

const mcpClient = new Client({
  name: "india-mcp-client",
  version: "1.0.0"
});

await mcpClient.connect(transport);

// -----------------------------
// OPENAI / GROQ CLIENT
// -----------------------------
// For GROQ:
// npm install openai
// Use:
// export OPENAI_API_KEY=xxxxx
// export OPENAI_BASE_URL=https://api.groq.com/openai/v1

const llm = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL
});

// -----------------------------
// READLINE CHAT
// -----------------------------
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

// -----------------------------
// LOAD MCP TOOLS
// -----------------------------
const toolsResponse = await mcpClient.listTools();

const tools = toolsResponse.tools.map((tool) => ({
  type: "function",
  function: {
    name: tool.name,
    description: tool.description,
    parameters: tool.inputSchema || {
      type: "object",
      properties: {}
    }
  }
}));

console.log("\n✅ MCP Client Started");
console.log("Ask anything...\n");

// -----------------------------
// MAIN LOOP
// -----------------------------
while (true) {
  const userInput = await askQuestion("You: ");

  if (userInput.toLowerCase() === "exit") {
    console.log("Goodbye!");
    process.exit(0);
  }

  try {
    // ---------------------------------
    // SEND USER QUESTION TO LLM
    // ---------------------------------
    const response = await llm.chat.completions.create({
      model: "llama-3.3-70b-versatile", // GROQ MODEL
      messages: [
        {
          role: "system",
          content: `
You are an intelligent India assistant.

You have access to MCP tools:
- list_states
- get_capital
- get_weather

Rules:
- Use tools whenever required.
- If user asks weather in capital:
  first call get_capital
  then call get_weather
- Give human friendly answers.
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

    // ---------------------------------
    // TOOL CALL DETECTED
    // ---------------------------------
    if (message.tool_calls) {
      let toolResults = [];

      for (const toolCall of message.tool_calls) {
        const toolName = toolCall.function.name;

        const toolArgs = JSON.parse(toolCall.function.arguments);

        console.log(`\n🔧 Calling Tool: ${toolName}`);
        console.log(`Arguments:`, toolArgs);

        // ---------------------------------
        // CALL MCP TOOL
        // ---------------------------------
        const result = await mcpClient.callTool({
          name: toolName,
          arguments: toolArgs
        });

        console.log(`Tool Result:`, result);

        toolResults.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result)
        });
      }

      // ---------------------------------
      // SEND TOOL RESULTS BACK TO LLM
      // ---------------------------------
      const finalResponse = await llm.chat.completions.create({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: "Answer naturally."
          },
          {
            role: "user",
            content: userInput
          },
          message,
          ...toolResults
        ]
      });

      console.log(
        `\n🤖 AI: ${finalResponse.choices[0].message.content}\n`
      );
    } else {
      // ---------------------------------
      // NO TOOL NEEDED
      // ---------------------------------
      console.log(`\n🤖 AI: ${message.content}\n`);
    }
  } catch (err) {
    console.error("\n❌ ERROR:");
    console.error(err.message);
  }
}