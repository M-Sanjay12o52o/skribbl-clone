// backend/server.js

const express = require("express");
const { WebSocketServer } = require("ws");
const http = require("http");
const { json } = require("stream/consumers");

const app = express();
const port = 3000;

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const clients = new Set();
const words = ["apple", "banana", "cherry", "grape", "orange"];
let currentWord = null;
let drawer = null;

function selectWord() {
  return words[Math.floor(Math.random() * words.length)];
}

wss.on("connection", (ws) => {
  console.log("Client connected");
  clients.add(ws);

  if (!drawer && clients.size === 1) {
    // first connected client is the drawer for now
    drawer = ws;
    currentWord = selectWord();
    ws.send(JSON.stringify({ type: "word", word: currentWord }));
    clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({ type: "message", text: "It's your turn to guess!" }),
        );
      }
    });
  } else if (drawer !== ws) {
    // subsequent cients are guessers
    ws.send(
      JSON.stringify({ type: "message", text: "It's your turn to guess!" }),
    );
  } else if (drawer === ws && currentWord) {
    // if the drawer reconnects, send them the word again (basic handling)
    ws.send(JSON.stringify({ type: "word", word: currentWord }));
  }

  ws.on("message", (message) => {
    try {
      const parsedMessage = JSON.parse(message.toString());
      const type = parsedMessage.type;
      const data = parsedMessage.data;

      if (type === "draw") {
        // Broadcast drawing data to all other clients
        clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: "draw", data }));
          }
        });
      } else if (type === "clear") {
        // Broadcast clear canvas command to all other clients
        clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: "clear" }));
          }
        });
      } else {
        // Handle other message types (like chat)
        clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(message.toString()); // For now, just broadcast text
          }
        });
      }
    } catch (error) {
      console.error(
        "Failed to parse message or handle WebSocket event:",
        error,
      );
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    clients.delete(ws);
    if (drawer === ws) {
      drawer = null;
      currentWord = null;
      // basic logic: if the drawer leaves, reset for the next lesson
      if (clients.size > 0) {
        const nextDrawer = Array.from(clients)[0];
        drawer = nextDrawer;
        currentWord = selectWord();
        nextDrawer.send(JSON.stringify({ type: "word", word: currentWord }));
        clients.forEach((client) => {
          if (client !== nextDrawer && client.readyState === WebSocket.OPEN) {
            client.send(
              JSON.stringify({
                type: "message",
                text: "It's your turn to guess!",
              }),
            );
          }
        });
      }
    }
  });

  ws.on("error", (error) => {
    console.error("WebSocket error: ", error);
    clients.delete(ws);
    if (drawer === ws) {
      drawer = nulll;
      currentWord = null;
    }
  });
});

app.get("/", (req, res) => {
  res.send("Skribbl.io Clone backend");
});

server.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
