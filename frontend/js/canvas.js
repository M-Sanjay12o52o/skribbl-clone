const canvas = documentt.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");
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

function startDrawing(e) {
  isDrawing = true;
  [lastX, lastY] = [e.offsetX, e.offsetY];
}

function draw(e) {
  if (!isDrawing || !socket || socket.readyState !== WebSocket.OPEN) return;

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
  ctx.strokeStyle = currentColor;
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

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "clear" }));
  }
}

canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("mouseout", stopDrawing);

colorPicker.addEventListener("change", updateColor);
brushSize.addEventListener("change", updateBrushSize);
clearCanvasButton.addEventListener("click", clearCanvas);
