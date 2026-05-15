import OpenAI from "openai";
import readline from "readline";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

import { pool } from "./db.js";

dotenv.config();


// --------------------------------------------------
// DATABASE FUNCTIONS
// --------------------------------------------------

async function createSession() {
  const sessionId = uuidv4();

  await pool.query(
    `INSERT INTO chat_session (id, title)
     VALUES ($1, $2)`,
    [sessionId, "New Chat"]
  );

  return sessionId;
}

async function saveMessage(sessionId, role, content) {
  const result = await pool.query(
    `INSERT INTO chat_message (session_id, role, content)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [sessionId, role, content]
  );

  return result.rows[0].id;
}


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
// LLM CLIENT (Groq/OpenAI Compatible)
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
// FETCH MCP TOOLS
// --------------------------------------------------

const mcpTools = await mcpClient.listTools();

const tools = mcpTools.tools.map((tool) => ({
  type: "function",
  function: {
    name: tool.name,
    description: tool.description,
    parameters: tool.inputSchema
  }
}));


// --------------------------------------------------
// START CHAT SESSION
// --------------------------------------------------

console.log("\nMCP Client Started");
console.log("Type 'exit' to quit.\n");

const sessionId = await createSession();
console.log("Session ID:", sessionId);


// --------------------------------------------------
// MAIN LOOP
// --------------------------------------------------

while (true) {
  const userInput = await askQuestion("You: ");

  // EXIT
  if (userInput.toLowerCase() === "exit") {
    console.log("Goodbye!");
    process.exit(0);
  }

  try {
    // ----------------------------------------------
    // SAVE USER MESSAGE
    // ----------------------------------------------
    await saveMessage(sessionId, "user", userInput);

    // ----------------------------------------------
    // ASK LLM
    // ----------------------------------------------
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
- Always use tools.
- Never generate fake weather.
- Never assume data.
- Only answer from tool results.

Example:
If user asks:
"What is weather in capital of Rajasthan?"

Use:
get_state_info
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

    // ----------------------------------------------
    // TOOL CALL HANDLING
    // ----------------------------------------------
    if (message.tool_calls) {
      for (const toolCall of message.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);

        console.log(`\nCalling Tool: ${toolName}`);
        console.log("Arguments:", toolArgs);

        const result = await mcpClient.callTool({
          name: toolName,
          arguments: toolArgs
        });

        const toolText =
          result?.content?.[0]?.text || "No response";

        console.log(`
AI Response:
${toolText}
`);

        // SAVE ASSISTANT RESPONSE
        await saveMessage(sessionId, "assistant", toolText);
      }
    } else {
      console.log(`
AI:
${message.content}
`);

      await saveMessage(
        sessionId,
        "assistant",
        message.content || ""
      );
    }
  } catch (err) {
    console.error("\nERROR:");
    console.error(err.message);
  }
}