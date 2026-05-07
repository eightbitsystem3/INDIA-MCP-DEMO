import axios from "axios";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import {
  ListToolsRequestSchema,
  CallToolRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

/**
 * CREATE MCP SERVER
 */
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
      },

      {
        name: "get_state_info",
        description: "Get capital and weather info by state",
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

  /**
   * TOOL 1 -> GET CAPITAL
   */
  if (toolName === "get_capital") {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/capital/${args.state}`
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching capital: ${error.message}`
          }
        ]
      };
    }
  }

  /**
   * TOOL 2 -> GET WEATHER
   */
  if (toolName === "get_weather") {
    try {
      const response = await axios.get(
        `http://localhost:8081/api/weather/${args.city}`
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching weather: ${error.message}`
          }
        ]
      };
    }
  }

  /**
   * TOOL 3 -> GET STATE INFO
   * Combines:
   * 1. get_capital
   * 2. get_weather
   */
  if (toolName === "get_state_info") {
    try {
      /**
       * STEP 1 -> GET CAPITAL
       */
      const capitalResponse = await axios.get(
        `http://localhost:8080/api/capital/${args.state}`
      );

      const capitalData = capitalResponse.data;

      /**
       * Example API response:
       * {
       *   "state": "Rajasthan",
       *   "capital": "Jaipur"
       * }
       */

      const capital =
        capitalData.capital ||
        capitalData.city ||
        capitalData;

      /**
       * STEP 2 -> GET WEATHER USING CAPITAL
       */
      const weatherResponse = await axios.get(
        `http://localhost:8081/api/weather/${capital}`
      );

      const weatherData = weatherResponse.data;

      /**
       * FINAL COMBINED RESPONSE
       */
      const finalResponse = {
        state: args.state,
        capital: capital,
        weather: weatherData
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(finalResponse, null, 2)
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error fetching state info: ${error.message}`
          }
        ]
      };
    }
  }

  /**
   * UNKNOWN TOOL
   */
  throw new Error(`Unknown tool: ${toolName}`);
});

/**
 * START MCP SERVER
 */
const transport = new StdioServerTransport();

await server.connect(transport);

console.error("✅ MCP Server Started");