import fetch from "node-fetch";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("Ask your question: ", async (input) => {

  let state = input.split("of ")[1];

  const res = await fetch("http://localhost:3000/call", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: "get_capital",
      arguments: { state }
    })
  });

  const data = await res.json();
  console.log("\nAnswer:", data.content[0].text);

  rl.close();
});