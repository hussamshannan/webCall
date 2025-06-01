const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

const PORT = 5500;

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("join-call", (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-joined", socket.id);

    // ✅ Emit back to the user who just joined
    socket.emit("joined-successfully", { roomId, socketId: socket.id });
  });

  socket.on("signal", ({ roomId, data }) => {
    socket.to(roomId).emit("signal", { from: socket.id, data });
  });

  socket.on("end-call", (roomId) => {
    socket.to(roomId).emit("call-ended");
    io.in(roomId).socketsLeave(roomId);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

app.get("/create-room", (req, res) => {
  const roomId = uuidv4();
  res.json({ roomId });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
