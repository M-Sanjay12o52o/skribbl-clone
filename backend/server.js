const WebSocket = require("ws");
const http = require("http");
const uuid = require("uuid");

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("WebSocket server is running");
});

const wss = new WebSocket.Server({ server });

const clients = new Map();

wss.on("connection", (ws) => {
  const clientId = uuid.v4();
  clients.set(clientId, ws);
  console.log(`Client connected: ${clientId}`);

  ws.on("message", (message) => {
    try {
      const parsedMessage = JSON.parse(message.toString());
      const type = parsedMessage.type;
      const data = parsedMessage.data;

      if (type === "draw") {
        // Handle draw message - for now, let's just log it
        console.log("Received draw message:", data);
        clients.forEach((client, id) => {
          console.log(
            `Attempting to send draw to client ID: ${id}, sender ID: ${clientId}`,
          );
          if (id !== clientId && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: "draw", data }));
            console.log(`Successfully sent draw to client ID: ${id}`);
          } else {
            console.log(
              `Not sending draw to client ID: ${id} (same sender or not open)`,
            );
          }
        });
      } else if (type === "clear") {
        // Handle clear message - for now, let's just log it
        console.log("Received clear message");
      } else {
        // Handle other text messages as chat
        console.log(`Received message: ${message.toString()} from ${clientId}`);
        // Broadcast the message to all other clients
        clients.forEach((client, id) => {
          if (id !== clientId && client.readyState === WebSocket.OPEN) {
            client.send(
              JSON.stringify({
                type: "message",
                data: { text: message.toString() },
              }),
            );
          }
        });
      }
    } catch (error) {
      console.error("Failed to parse message or handle:", error);
      // If it's not JSON, assume it's a chat message
      clients.forEach((client, id) => {
        if (id !== clientId && client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              type: "message",
              data: { text: message.toString() },
            }),
          );
        }
      });
    }
  });

  ws.on("close", () => {
    clients.delete(clientId);
    console.log(`Client disconnected: ${clientId}`);
  });

  ws.on("error", (error) => {
    console.error(`WebSocket error for client ${clientId}: ${error}`);
    clients.delete(clientId);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
