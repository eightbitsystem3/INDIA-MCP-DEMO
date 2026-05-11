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
        description: "Get capital city by Indian state",
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
        name: "get_weather_by_state",
        description: "Get weather details by state",
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
        name: "get_weather_by_city",
        description: "Get weather details by city",
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
        description:
          "Get complete state information including capital and weather",
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
   * TOOL 2 -> GET WEATHER BY STATE
   */
  if (toolName === "get_weather_by_state") {

    try {

      const response = await axios.get(
        `http://localhost:8081/api/weather/state/${args.state}`
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
            text: `Error fetching weather by state: ${error.message}`
          }
        ]
      };
    }
  }

  /**
   * TOOL 3 -> GET WEATHER BY CITY
   */
  if (toolName === "get_weather_by_city") {

    try {

      const response = await axios.get(
        `http://localhost:8081/api/weather/city/${args.city}`
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
            text: `Error fetching weather by city: ${error.message}`
          }
        ]
      };
    }
  }

  /**
   * TOOL 4 -> GET COMPLETE STATE INFO
   *
   * FLOW:
   * 1. Get Capital
   * 2. Get Weather by Capital City
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
       * HANDLE DIFFERENT RESPONSE STRUCTURES
       */
      let capital = "";

      if (typeof capitalData === "string") {

        capital = capitalData;

      } else if (capitalData.capital) {

        capital = capitalData.capital;

      } else if (capitalData.city) {

        capital = capitalData.city;

      } else {

        capital = JSON.stringify(capitalData);
      }

      /**
       * CLEAN CAPITAL VALUE
       */
      capital = capital.replace(/"/g, "").trim();

      /**
       * STEP 2 -> GET WEATHER BY CITY
       */
      const weatherResponse = await axios.get(
        `http://localhost:8081/api/weather/city/${capital}`
      );

      const weatherData = weatherResponse.data;

      /**
       * FINAL RESPONSE
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