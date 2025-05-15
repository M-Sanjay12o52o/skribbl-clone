const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");

console.log("Canvas element: ", canvas);
console.log("Canvas context: ", ctx);

const colorPicker = document.getElementById("colorPicker");
const brushSize = document.getElementById("brushSize");
const clearCanvasButton = document.getElementById("clearCanvas");

let isDrawing = false;
let lastX = 0;
let lastY = 0;
let currentColor = colorPicker.value;
let currentBrushSize = brushSize.value;

// get the WebSocket object from script.js (assuming it's in the global scope)
const socket = window.socket;

function startDrawing(e, currentSocket) {
  console.log("startDrawing called", e.offsetX, e.offsetY);
  isDrawing = true;
  [lastX, lastY] = [e.offsetX, e.offsetY];
  socket = currentSocket;
}

function draw(e, currentSocket) {
  console.log("draw function called", isDrawing, e.offsetX, e.offsetY);
  console.log(
    "Condition check:",
    !isDrawing,
    !socket,
    socket.readyState !== WebSocket.OPEN,
  );
  if (
    !isDrawing ||
    !currentSocket ||
    !currentSocket.readyState ||
    socket.readyState !== WebSocket.OPEN
  )
    return;

  const data = {
    x: e.offsetX,
    y: e.offsetY,
    lastX,
    lastY,
    color: currentColor,
    size: currentBrushSize,
  };
  socket.send(JSON.stringify({ type: "draw", data }));

  ctx.beginPath();

  // start from
  ctx.moveTo(lastX, lastY);
  // go to
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.lineWidth = currentBrushSize;
  console.log("Brush size:", currentBrushSize);
  ctx.strokeStyle = currentColor;
  console.log("Color: ", currentColor);
  ctx.lineCap = "round";
  ctx.stroke();
  [lastX, lastY] = [e.offsetX, e.offsetY];
}

function stopDrawing() {
  isDrawing = false;
}

function updateColor(e) {
  currentColor = e.target.value;
}

function updateBrushSize(e) {
  currentBrushSize = e.target.value;
}

function clearCanvas(passedSocket) {
  console.log("From clearCanavs function");
  console.log(
    "Socket state on clear:",
    passedSocket && passedSocket.readyState,
  );
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (passedSocket && passedSocket.readyState === WebSocket.OPEN) {
    passedSocket.send(JSON.stringify({ type: "clear" }));
  } else {
    console.log("Socket not connected, cannot send clear messsage.");
  }
}

// canvas.addEventListener("mousedown", startDrawing);
// console.log("mousedown listener added");
// canvas.addEventListener("mousemove", draw);
// console.log("mousemove listener added");
// canvas.addEventListener("mouseup", stopDrawing);
// console.log("mouseup listener added");
// canvas.addEventListener("mouseout", stopDrawing);
// console.log("mouseout listener added");

colorPicker.addEventListener("change", updateColor);
brushSize.addEventListener("change", updateBrushSize);
