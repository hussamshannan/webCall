const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors()); // ...existing code...
const io = new Server(server, {
  cors: { origin: "https://683ca844f028c8379abf1464--gocall.netlify.app" },
});
io.on("connection", (socket) => {
  // ...existing code...

  socket.on("audio-chunk", ({ roomId, chunk }) => {
    console.log(`Received audio chunk from ${socket.id} in room ${roomId}`);
    // You can set a flag or emit an event here for indication
  });

  // ...existing code...
});

const server = http.createServer(app);

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
