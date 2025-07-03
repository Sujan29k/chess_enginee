const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("join", (gameId) => {
    socket.join(gameId);
    console.log(`Client ${socket.id} joined game ${gameId}`);
  });

  socket.on("move", ({ gameId, move }) => {
    console.log(`Move in game ${gameId}:`, move);
    socket.to(gameId).emit("move", move);
  });

  // === UNDO ===
  // Listen for undo from one player, broadcast (no payload) to the opponent
  socket.on("undo", ({ gameId, fen }) => {
    socket.to(gameId).emit("undo", { fen });
  });
  

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`✅ Socket.IO server listening on http://localhost:${PORT}`);
});
