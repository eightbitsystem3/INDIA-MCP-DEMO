import OpenAI from "openai";
import readline from "readline";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

import { generateEmbedding } from "./embeddingService.js";
import { esClient } from "./elastic.js";

dotenv.config();

// --------------------------------------------------
// ELASTICSEARCH SETUP
// --------------------------------------------------

const INDEX_NAME = "chat_memory";

// Create index if not exists
async function ensureIndex() {
  const exists = await esClient.indices.exists({
    index: INDEX_NAME
  });

  if (!exists) {
    console.log("Creating Elasticsearch index...");

    await esClient.indices.create({
      index: INDEX_NAME,
      mappings: {
        properties: {
          session_id: {
            type: "keyword"
          },
          role: {
            type: "keyword"
          },
          content: {
            type: "text"
          },
          embedding: {
            type: "dense_vector",
            dims: 384,
            index: true,
            similarity: "cosine"
          },
          created_at: {
            type: "date"
          }
        }
      }
    });

    console.log("Index created.");
  }
}

// --------------------------------------------------
// SESSION
// --------------------------------------------------

async function createSession() {
  return uuidv4();
}

// --------------------------------------------------
// SAVE MEMORY
// --------------------------------------------------

async function saveMemory(
  sessionId,
  role,
  content,
  embedding
) {
  await esClient.index({
    index: INDEX_NAME,
    document: {
      session_id: sessionId,
      role,
      content,
      embedding,
      created_at: new Date()
    }
  });
}

// --------------------------------------------------
// SEARCH MEMORY
// --------------------------------------------------

async function searchMemory(queryEmbedding) {
  const result = await esClient.search({
    index: INDEX_NAME,
    knn: {
      field: "embedding",
      query_vector: queryEmbedding,
      k: 5,
      num_candidates: 50
    },
    _source: [
      "role",
      "content",
      "session_id",
      "created_at"
    ]
  });

  return result.hits.hits.map((hit) => ({
    score: hit._score,
    ...hit._source
  }));
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
// OPENAI CLIENT
// --------------------------------------------------

const llm = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL
});

// --------------------------------------------------
// READLINE
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
// INITIALIZE
// --------------------------------------------------

await ensureIndex();

console.log("\nMCP Client Started");
console.log("Type 'exit' to quit.\n");

const sessionId = await createSession();

console.log("Session ID:", sessionId);

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
    // ----------------------------------------------
    // GENERATE USER EMBEDDING
    // ----------------------------------------------

    console.log("Generating embedding...");

    const userEmbedding =
      await generateEmbedding(userInput);

    // ----------------------------------------------
    // SEARCH SIMILAR MEMORY
    // ----------------------------------------------

    console.log("Searching memory...");

    const memories = await searchMemory(
      userEmbedding
    );

    const memoryContext = memories
      .map(
        (m) =>
          `[${m.role}] ${m.content}`
      )
      .join("\n");

    // ----------------------------------------------
    // SAVE USER MEMORY
    // ----------------------------------------------

    await saveMemory(
      sessionId,
      "user",
      userInput,
      userEmbedding
    );

    // ----------------------------------------------
    // CALL LLM
    // ----------------------------------------------

    const response =
      await llm.chat.completions.create({
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
- Always use tools
- Never generate fake weather
- Never assume data
- Only answer using tool results

Relevant memory:
${memoryContext}
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

    const message =
      response.choices[0].message;

    // ----------------------------------------------
    // TOOL CALLS
    // ----------------------------------------------

    if (message.tool_calls) {
      for (const toolCall of message.tool_calls) {
        const toolName =
          toolCall.function.name;

        const toolArgs = JSON.parse(
          toolCall.function.arguments
        );

        console.log(
          `\nCalling Tool: ${toolName}`
        );

        console.log(
          "Arguments:",
          toolArgs
        );

        const result =
          await mcpClient.callTool({
            name: toolName,
            arguments: toolArgs
          });

        const toolText =
          result?.content?.[0]?.text ||
          "No response";

        console.log(`
AI:
${toolText}
`);

        // ------------------------------------------
        // SAVE ASSISTANT MEMORY
        // ------------------------------------------

        const assistantEmbedding =
          await generateEmbedding(toolText);

        await saveMemory(
          sessionId,
          "assistant",
          toolText,
          assistantEmbedding
        );
      }
    } else {
      const assistantText =
        message.content || "";

      console.log(`
AI:
${assistantText}
`);

      // ------------------------------------------
      // SAVE ASSISTANT MEMORY
      // ------------------------------------------

      const assistantEmbedding =
        await generateEmbedding(
          assistantText
        );

      await saveMemory(
        sessionId,
        "assistant",
        assistantText,
        assistantEmbedding
      );
    }
  } catch (err) {
    console.error("\nERROR:");
    console.error(err);
  }
}