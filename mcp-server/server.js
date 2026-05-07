import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const PORT = 3000;

//
// ✅ TOOL DEFINITIONS (like MCP /tools)
//
app.get("/tools", (req, res) => {
  res.json([
    {
      name: "get_capital",
      description: "Get capital of Indian state",
      input_schema: {
        type: "object",
        properties: {
          state: { type: "string" }
        },
        required: ["state"]
      }
    },
    {
      name: "list_states",
      description: "List all states",
      input_schema: {
        type: "object",
        properties: {}
      }
    }
  ]);
});

//
// ✅ TOOL EXECUTION (like MCP /call)
//
app.post("/call", async (req, res) => {
  const { name, arguments: args } = req.body;

  try {
    if (name === "get_capital") {
      const response = await fetch(
        `http://localhost:8080/capital/${args.state}`
      );
      const capital = await response.text();

      return res.json({
        content: [{ type: "text", text: `Capital of ${args.state} is ${capital}` }]
      });
    }

    if (name === "list_states") {
      const response = await fetch("http://localhost:8080/states");
      const states = await response.json();

      return res.json({
        content: [{ type: "text", text: states.join(", ") }]
      });
    }

    res.status(400).json({ error: "Unknown tool" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//
// ✅ START SERVER
//
app.listen(PORT, () => {
  console.log(`MCP HTTP Server running on http://localhost:${PORT}`);
});