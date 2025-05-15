// backend/server.js

const express = require("express");
const { WebSocketServer } = require("ws");
const http = require("http");

const app = express();
const port = 3000;

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const clients = new Set();

wss.on("connection", (ws) => {
  console.log("Client connected");
  clients.add(ws);

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
  });

  ws.on("error", (error) => {
    console.error("WebSocket error: ", error);
    clients.delete(ws);
  });
});

app.get("/", (req, res) => {
  res.send("Skribbl.io Clone backend");
});

server.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
