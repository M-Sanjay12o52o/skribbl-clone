if (window.socket) {
  console.warn(
    "Script.js seems to be running again, but socket is already initialised",
  );
} else {
  const drawingCanvas = document.getElementById("drawingCanvas");
  // const ctx = drawingCanvas.getContext("2d");
  const messageInput = document.getElementById("messageInput");
  const sendButton = document.getElementById("sendButton");
  const chatMessages = document.getElementById("chatMessages");
  const currentWordDisplay = document.getElementById("currentWord");

  // Establish WebSocket connection to the backend
  const socket = new WebSocket("ws://localhost:3000");
  window.socket = socket; // Make it globally accessible (though we'll try to avoid this later)

  let currentSocket = null;
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;
  let isDrawer = false;

  socket.onopen = () => {
    console.log("WebSocket connection established.");
    currentSocket = socket;
  };

  const clearCanvasButton = document.getElementById("clearCanvas");
  clearCanvasButton.addEventListener("click", () => {
    clearCanvas(currentSocket);
  });

  socket.onmessage = (event) => {
    console.log("Received message data:", event.data);
    try {
      const parsedMessage = JSON.parse(event.data);
      const type = parsedMessage.type;

      if (type === "connection") {
        if (parsedMessage && parsedMessage.isDrawer !== undefined) {
          isDrawer = parsedMessage.isDrawer;
          console.log("Is this client the drawer?", isDrawer);
        }
      } else if (type === "draw") {
        // Draw on the canvas based on received data
        drawLine(
          drawingCanvas.getContext("2d"),
          data.lastX,
          data.lastY,
          data.x,
          data.y,
          data.color,
          data.size,
        );
      } else if (type === "clear") {
        // Clear the canvas
        clearCanvas();
      } else if (type === "word") {
        console.log("Parsed message: ", parsedMessage);
        if (parsedMessage && parsedMessage.word) {
          const wordLength = parsedMessage.word.length;
          const underscores = "_ ".repeat(wordLength).trim();
          currentWordDisplay.textContent = `Word: ${underscores}`;
          console.log("Displayed underscores:", underscores);
          if (isDrawer) {
            console.log("Drawer\'s word:", parsedMessage.word);
          }
        } else {
          console.warn("Received 'word' message without a word.");
        }
      } else if (type === "message") {
        const listItem = document.createElement("li");
        listItem.textContent = `Server: ${parsedMessage.data.text}`;
        chatMessages.appendChild(listItem);
      } else {
        // Handle other text messages as chat
        const listItem = document.createElement("li");
        listItem.textContent = `Server: ${event.data}`;
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

  drawingCanvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
    drawingCanvas.addEventListener("mousemove", drawOnCanvas);
    drawingCanvas.addEventListener("mouseup", stopDrawing);
    drawingCanvas.addEventListener("mouseout", stopDrawing);
  });

  function drawOnCanvas(e) {
    if (
      !isDrawing ||
      !currentSocket ||
      currentSocket.readyState !== WebSocket.OPEN
    )
      return;

    const colorPicker = document.getElementById("colorPicker");
    const brushSizeInput = document.getElementById("brushSize");
    const currentColor = colorPicker.value;
    const currentBrushSize = brushSizeInput.value;

    const data = {
      x: e.offsetX,
      y: e.offsetY,
      lastX,
      lastY,
      color: currentColor,
      size: currentBrushSize,
    };
    // Send the drawing data to the backend
    currentSocket.send(JSON.stringify({ type: "draw", data }));

    const ctx = drawingCanvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.lineWidth = currentBrushSize;
    ctx.strokeStyle = currentColor;
    ctx.lineCap = "round";
    ctx.stroke();
    [lastX, lastY] = [e.offsetX, e.offsetY];
  }

  function stopDrawing() {
    isDrawing = false;
    drawingCanvas.removeEventListener("mousemove", drawOnCanvas);
  }

  function drawLine(ctx, startX, startY, endX, endY, color, size) {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.lineWidth = size;
    ctx.strokeStyle = color;
    ctx.lineCap = "round";
    ctx.stroke();
  }
}
