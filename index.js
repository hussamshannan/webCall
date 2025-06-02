const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidV4 } = require("uuid");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // replace with frontend URL in production
    methods: ["GET", "POST"],
  },
});

app.use(express.static(path.join(__dirname, "public"))); // serve React build or static files

app.get("/", (req, res) => {
  if (!req.query.room) {
    // If no room query param, redirect with a generated one
    return res.redirect(`/?room=${uuidV4()}`);
  }
  // Serve index.html (React app entrypoint)
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Optional: remove or keep based on your app design
// app.get("/:room", (req, res) => {
//   res.render("room", { roomId: req.params.room });
// });

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", userId);
    socket.emit("joined-room", roomId);

    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-disconnected", userId);
    });
  });
});

server.listen(3000, () => {
  console.log("Server listening on http://localhost:3000");
});
