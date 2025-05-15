// frontend/js/script.js

const drawingCanvas = document.getElementById("drawingCanvas");
const ctx = drawingCanvas.getContext("2d");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const chatMessages = document.getElementById("chatMessages");

// Establish WebSocket connection to the backend
const socket = new WebSocket("ws://localhost:3000");
window.socket = socket; // Make it globally accessible for canvas.js (simple approach for now)

socket.onopen = () => {
  console.log("WebSocket connection established.");
};

socket.onmessage = (event) => {
  try {
    const parsedMessage = JSON.parse(event.data);
    const type = parsedMessage.type;
    const data = parsedMessage.data;

    if (type === "draw") {
      // Draw on the canvas based on received data
      drawLine(data.lastX, data.lastY, data.x, data.y, data.color, data.size);
    } else if (type === "clear") {
      // Clear the canvas
      ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    } else {
      // Handle other message types (like chat)
      const message = event.data;
      const listItem = document.createElement("li");
      listItem.textContent = `Server: ${message}`;
      chatMessages.appendChild(listItem);
    }
  } catch (error) {
    // If it's not a JSON message, assume it's a chat message
    const message = event.data;
    const listItem = document.createElement("li");
    listItem.textContent = `Server: ${message}`;
    chatMessages.appendChild(listItem);
  }
};

socket.onclose = () => {
  console.log("WebSocket connection closed.");
};

socket.onerror = (error) => {
  console.error("WebSocket error:", error);
};

sendButton.addEventListener("click", () => {
  const message = messageInput.value.trim();
  if (message) {
    socket.send(message);
    const listItem = document.createElement("li");
    listItem.textContent = `You: ${message}`;
    chatMessages.appendChild(listItem);
    messageInput.value = "";
  }
});

messageInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    sendButton.click();
  }
});

function drawLine(startX, startY, endX, endY, color, size) {
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.lineWidth = size;
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.stroke();
}
