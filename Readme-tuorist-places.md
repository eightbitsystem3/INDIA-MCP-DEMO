# 🌍 MCP Tourism Extension for India Demo

This document explains how to extend the existing MCP India Demo by adding:

- Tourist APIs
- MCP Tourism Tools
- LLM Tool Registration
- AI System Prompt Updates
- Advanced MCP Orchestration Tool (`get_complete_travel_info`)

---

# 📌 Architecture Overview

```text
+-------------------+
|   MCP CLIENT      |
|  (LLM + Tools)    |
+---------+---------+
          |
          v
+-------------------+
|    MCP SERVER     |
| Tool Orchestrator |
+----+---------+----+
     |         |
     |         |
     v         v
+---------+  +----------------+
| Spring  |  | Spring Boot 2  |
| Boot 1  |  | Weather + Tour |
| Capital |  | APIs           |
+---------+  +----------------+
```

---

# 🚀 Features Added

## ✅ Tourism APIs

Added APIs for:

- Tourist places by **State**
- Tourist places by **City**

---

## ✅ MCP Tools Added

| Tool Name | Description |
|---|---|
| `get_tourism_by_state` | Returns tourist places by state |
| `get_tourism_by_city` | Returns tourist places by city |
| `get_complete_travel_info` | Returns capital + weather + tourism |

---

# 1️⃣ Spring Boot App 2 → Add Tourist APIs

Create a new controller:

## 📄 `TouristController.java`

```java
package com.example.mcpdemo.controller;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/tourism")
public class TouristController {

    private static final Map<String, List<String>> stateTourism = Map.of(
            "Rajasthan",
            List.of("Hawa Mahal", "Amber Fort", "City Palace"),

            "Maharashtra",
            List.of("Gateway of India", "Ajanta Caves", "Marine Drive"),

            "Karnataka",
            List.of("Mysore Palace", "Hampi", "Coorg")
    );

    private static final Map<String, List<String>> cityTourism = Map.of(
            "Jaipur",
            List.of("Hawa Mahal", "Jal Mahal", "Nahargarh Fort"),

            "Mumbai",
            List.of("Gateway of India", "Marine Drive", "Juhu Beach"),

            "Bengaluru",
            List.of("Lalbagh", "Cubbon Park", "Bangalore Palace")
    );

    @GetMapping("/state/{state}")
    public List<String> getTourismByState(
            @PathVariable String state
    ) {

        return stateTourism.getOrDefault(
                state,
                List.of("No Tourist Places Found")
        );
    }

    @GetMapping("/city/{city}")
    public List<String> getTourismByCity(
            @PathVariable String city
    ) {

        return cityTourism.getOrDefault(
                city,
                List.of("No Tourist Places Found")
        );
    }
}
```

---

# 🌟 Advanced MCP Orchestration Tool

## `get_complete_travel_info`

This tool demonstrates:

- Multi-service orchestration
- AI Agent workflows
- MCP composition
- Cross-service aggregation

---

# ✅ Expected Response

```json
{
  "state": "Rajasthan",
  "capital": "Jaipur",
  "weather": {
    "city": "Jaipur",
    "temperature": 38.5,
    "condition": "Hot",
    "latitude": 26.9124,
    "longitude": 75.7873
  },
  "touristPlaces": [
    "Hawa Mahal",
    "Amber Fort",
    "City Palace"
  ]
}
```

---

# 🎯 What This Demonstrates

## ✅ Microservices Architecture

| Service | Responsibility |
|---|---|
| Spring Boot App 1 | Capital APIs |
| Spring Boot App 2 | Weather APIs |
| Tourism APIs | Tourist data |
| MCP Server | Tool orchestration |
| MCP Client | AI + Tool calling |

---

# 🏁 Final Result

Your AI assistant can now:

- Find capitals
- Fetch weather
- Suggest tourist places
- Build complete travel plans
- Combine multiple APIs intelligently using MCP

---

# 📚 Technologies Used

- Java
- Spring Boot
- Node.js
- MCP SDK
- OpenAI / Groq
- Axios
- REST APIs

---
1. Spring Boot App 2 → Add Tourist APIs
2. MCP Server → Add new tools
3. MCP Client → Register tools for LLM
4. System Prompt → Tell AI when to use them


TouristController.java
```
package com.example.mcpdemo.controller;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/tourism")
public class TouristController {

    // --------------------------------------------------
    // TOURIST POINTS BY STATE
    // --------------------------------------------------

    private static final Map<String, List<String>> stateTourism = Map.of(
            "Rajasthan",
            List.of("Hawa Mahal", "Amber Fort", "City Palace"),

            "Maharashtra",
            List.of("Gateway of India", "Ajanta Caves", "Marine Drive"),

            "Karnataka",
            List.of("Mysore Palace", "Hampi", "Coorg")
    );

    // --------------------------------------------------
    // TOURIST POINTS BY CITY
    // --------------------------------------------------

    private static final Map<String, List<String>> cityTourism = Map.of(
            "Jaipur",
            List.of("Hawa Mahal", "Jal Mahal", "Nahargarh Fort"),

            "Mumbai",
            List.of("Gateway of India", "Marine Drive", "Juhu Beach"),

            "Bengaluru",
            List.of("Lalbagh", "Cubbon Park", "Bangalore Palace")
    );

    // --------------------------------------------------
    // GET TOURIST PLACES BY STATE
    // --------------------------------------------------

    @GetMapping("/state/{state}")
    public List<String> getTourismByState(
            @PathVariable String state
    ) {

        return stateTourism.getOrDefault(
                state,
                List.of("No Tourist Places Found")
        );
    }

    // --------------------------------------------------
    // GET TOURIST PLACES BY CITY
    // --------------------------------------------------

    @GetMapping("/city/{city}")
    public List<String> getTourismByCity(
            @PathVariable String city
    ) {

        return cityTourism.getOrDefault(
                city,
                List.of("No Tourist Places Found")
        );
    }
}
```

2. MCP SERVER CHANGES 
Add 2 new tools inside ListToolsRequestSchema
```
{
  name: "get_tourism_by_state",
  description: "Get tourist places by Indian state",
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
  name: "get_tourism_by_city",
  description: "Get tourist places by city",
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
```

3. ADD TOOL IMPLEMENTATION IN server.js

Add below get_state_info
    GET TOURISM BY STATE
    GET TOURISM BY CITY
```
/**
 * TOOL 5 -> GET TOURISM BY STATE
 * TOOL 6 → GET TOURISM BY CITY
 */
if (toolName === "get_tourism_by_state") {

  try {

    const response = await axios.get(
      `http://localhost:8081/api/tourism/state/${args.state}`
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
          text: `Error fetching tourism by state: ${error.message}`
        }
      ]
    };
  }
}
/**
 * TOOL 6 -> GET TOURISM BY CITY
 */
if (toolName === "get_tourism_by_city") {

  try {

    const response = await axios.get(
      `http://localhost:8081/api/tourism/city/${args.city}`
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
          text: `Error fetching tourism by city: ${error.message}`
        }
      ]
    };
  }
}
```

4. CLIENT.JS CHANGES
```
{
  type: "function",
  function: {
    name: "get_tourism_by_state",
    description: "Get tourist places by Indian state",
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
    name: "get_tourism_by_city",
    description: "Get tourist places by city",
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
```

6. TEST QUERIES

Now your MCP client can answer:

Tourist places in Rajasthan
Tourist places in Jaipur
Best tourist places in Mumbai
Show tourism spots in Karnataka

---

ADVANCED TOOL (get_complete_travel_info)
---
STEP 1 — ADD NEW TOOL IN server.js
Inside ListToolsRequestSchema
```
{
  name: "get_complete_travel_info",
  description:
    "Get complete travel information including capital, weather and tourist places",
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
```

STEP 2 — ADD TOOL IMPLEMENTATION
```
/**
 * TOOL 7 -> GET COMPLETE TRAVEL INFO
 *
 * FLOW:
 * 1. Get Capital
 * 2. Get Weather By Capital
 * 3. Get Tourist Places By State
 * 4. Merge Response
 */
if (toolName === "get_complete_travel_info") {

  try {

    // --------------------------------------------------
    // STEP 1 -> GET CAPITAL
    // --------------------------------------------------

    const capitalResponse = await axios.get(
      `http://localhost:8080/api/capital/${args.state}`
    );

    const capitalData = capitalResponse.data;

    let capital = "";

    if (typeof capitalData === "string") {

      capital = capitalData;

    } else if (capitalData.capital) {

      capital = capitalData.capital;

    } else {

      capital = JSON.stringify(capitalData);
    }

    capital = capital.replace(/"/g, "").trim();

    // --------------------------------------------------
    // STEP 2 -> GET WEATHER BY CITY
    // --------------------------------------------------

    const weatherResponse = await axios.get(
      `http://localhost:8081/api/weather/city/${capital}`
    );

    const weatherData = weatherResponse.data;

    // --------------------------------------------------
    // STEP 3 -> GET TOURIST PLACES
    // --------------------------------------------------

    const tourismResponse = await axios.get(
      `http://localhost:8081/api/tourism/state/${args.state}`
    );

    const tourismData = tourismResponse.data;

    // --------------------------------------------------
    // STEP 4 -> FINAL RESPONSE
    // --------------------------------------------------

    const finalResponse = {
      state: args.state,
      capital: capital,

      weather: {
        city: weatherData.city,
        temperature: weatherData.temperature,
        condition: weatherData.condition,
        latitude: weatherData.latitude,
        longitude: weatherData.longitude
      },

      touristPlaces: tourismData
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
          text: `Error fetching complete travel info: ${error.message}`
        }
      ]
    };
  }
}
```
STEP 3 — ADD TOOL IN client.js

```
{
  type: "function",
  function: {
    name: "get_complete_travel_info",
    description:
      "Get complete travel information including capital, weather and tourist places",
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
```

STEP 4 — UPDATE SYSTEM PROMPT

Add tool:

- get_complete_travel_info
rules:
    - If user asks:
    "Travel info for Rajasthan"
    "Complete travel details of Rajasthan"
    "Plan Rajasthan trip"
    "Tourism and weather in Rajasthan"

    then use:
    get_complete_travel_info

STEP 5 — TEST QUERIES
Now your AI can handle:

Travel info for Rajasthan
Plan a Rajasthan trip
Complete travel details of Karnataka
Tourism and weather in Maharashtra


EXPECTED RESPONSE
{
  "state": "Rajasthan",
  "capital": "Jaipur",
  "weather": {
    "city": "Jaipur",
    "temperature": 38.5,
    "condition": "Hot",
    "latitude": 26.9124,
    "longitude": 75.7873
  },
  "touristPlaces": [
    "Hawa Mahal",
    "Amber Fort",
    "City Palace"
  ]
}