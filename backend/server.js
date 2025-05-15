const WebSocket = require("ws");
const http = require("http");
const uuid = require("uuid");

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("WebSocket server is running");
});

const wss = new WebSocket.Server({ server });

const clients = new Map();
const words = ["apple", "banana", "cherry", "grape", "orange"];
let currentWord = null;
let drawer = null;

function selectWord() {
  return words[Math.floor(Math.random() * words.length)];
}

wss.on("connection", (ws) => {
  const clientId = uuid.v4();
  clients.set(clientId, ws);
  console.log(`Client connected: ${clientId}`);
  console.log(`Value of 'drawer' at connection: ${drawer}`);
  console.log(
    `Current drawer: ${drawer ? "assigned" : "null"}, Number of clients: ${clients.size}`,
  );

  const connectionMessage = { type: "connection", clientId, isDrawer: false };

  if (!drawer && clients.size === 1) {
    console.log("First client connected, assigning as drawer.");
    drawer = ws;
    currentWord = selectWord();
    console.log(`Selected word: ${currentWord}`);
    connectionMessage.isDrawer = true;
    ws.send(JSON.stringify({ type: "word", word: currentWord }));
    console.log("Word sent to drawer.");
    clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({ type: "message", text: "It's your turn to guess!" }),
        );
        console.log("Guess turn message sent to other client.");
      }
    });
  } else if (drawer !== ws) {
    console.log("Subsequent client connected, informing to guess.");
    ws.send(
      JSON.stringify({ type: "message", text: "It's your turn to guess!" }),
    );
  } else if (drawer === ws && currentWord) {
    console.log("Drawer reconnected, sending the word again.");
    connectionMessage.isDrawer = true;
    ws.send(JSON.stringify({ type: "word", word: currentWord }));
  }

  ws.send(JSON.stringify(connectionMessage));

  ws.on("message", (message) => {
    try {
      const parsedMessage = JSON.parse(message.toString());
      const type = parsedMessage.type;
      const data = parsedMessage.data;

      if (type === "draw") {
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
        console.log("Received clear message");
        clients.forEach((client, id) => {
          console.log(`Attempting to send clear to client ID: ${id}`);
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: "clear" }));
            console.log(`Successfully send clear to client ID: ${id}`);
          } else {
            console.log(`Not sending clear to client ID: ${id} (not open)`);
          }
        });
      } else {
        console.log(`Received message: ${message.toString()} from ${clientId}`);
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
    if (drawer === ws) {
      drawer = null;
      currentWord = null;
      if (clients.size > 0) {
        const nextDrawerId = clients.keys().next().value;
        drawer = clients.get(nextDrawerId);
        currentWord = selectWord();
        drawer.send(JSON.stringify({ type: "word", word: currentWord }));
        clients.forEach((client, id) => {
          if (id !== nextDrawerId && client.readyState === WebSocket.OPEN) {
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
    console.error(`WebSocket error for client ${clientId}: ${error}`);
    clients.delete(clientId);
    if (drawer === ws) {
      drawer = null;
      currentWord = null;
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
