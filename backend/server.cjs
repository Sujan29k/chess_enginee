const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // In production, restrict this to your domain
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

  socket.on("undo", ({ gameId, fen }) => {
    console.log(`Undo in game ${gameId} by ${socket.id}`);
    socket.to(gameId).emit("undo", { fen });
  });

  socket.on("quit", ({ gameId, playerId }) => {
    socket.to(gameId).emit("opponentQuit", { playerId });
  });
  
  socket.on("rematchRequest", ({ gameId }) => {
    socket.to(gameId).emit("rematchRequest");
  });
  
  socket.on("rematch", ({ gameId }) => {
    socket.to(gameId).emit("rematch");
  });
  


    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  }); // Ensure this closing bracket is correctly placed

  const PORT = 3001;
  server.listen(PORT, () => {
    console.log(`✅ Socket.IO server listening on http://localhost:${PORT}`);
  });
