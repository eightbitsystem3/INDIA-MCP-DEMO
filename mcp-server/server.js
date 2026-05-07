import axios from "axios";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import {
  ListToolsRequestSchema,
  CallToolRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "india-mcp-server",
    version: "1.0.0"
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

/**
 * LIST TOOLS
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_capital",
        description: "Get capital city by state",
        inputSchema: {
          type: "object",
          properties: {
            state: {
              type: "string",
              description: "Indian state name"
            }
          },
          required: ["state"]
        }
      },
      {
        name: "get_weather",
        description: "Get weather and geographical info by city",
        inputSchema: {
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
    ]
  };
});

/**
 * CALL TOOL
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  const args = request.params.arguments;

  if (toolName === "get_capital") {
    const response = await axios.get(
      `http://localhost:8080/capital/${args.state}`
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(response.data)
        }
      ]
    };
  }

  if (toolName === "get_weather") {
    const response = await axios.get(
      `http://localhost:8081/api/weather/${args.city}`
    );

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(response.data)
        }
      ]
    };
  }

  throw new Error(`Unknown tool: ${toolName}`);
});

/**
 * START SERVER
 */
const transport = new StdioServerTransport();

await server.connect(transport);

console.error("MCP Server Started");