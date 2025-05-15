const express = require("express");
const { WebSocketServer } = require("ws");
const http = require("http");

const app = express();
const port = 3000;

// create an http server from the express app
const server = http.createServer(app);

// create a websocket server instance
const wss = new WebSocketServer({ server });

// store connected clients (for a single default room for now);
const clients = new Set();

wss.on("connection", (ws) => {
  console.log("Client connected");
  clients.add(ws);

  ws.on("message", (message) => {
    console.log("received: %s", message);

    // broadcast the received message to all other cients
    clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message.toString());
      }
    });
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    clients.delete(ws);
  });

  ws.on("error", (error) => {
    console.error("Websocket error: ", error);
    clients.delete(ws);
  });
});

app.get("/", (req, res) => {
  res.send("Skribbl.io Clone backend");
});

server.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
