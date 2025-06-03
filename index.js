const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidV4 } = require("uuid");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // in production, replace * with your frontend domain
    methods: ["GET", "POST"],
  },
});

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.redirect(`/${uuidV4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

// ... existing backend code ...

const usersMediaPreferences = []; // Global list of users and their media types

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, useVideo) => {
    socket.join(roomId);

    // Save user data in socket
    socket.userData = { userId, useVideo, roomId };

    // Add to global list
    usersMediaPreferences.push({ userId, useVideo, roomId });

    // Emit to the new user: list of users already in the room
    const existingUsers = usersMediaPreferences.filter(
      (user) => user.roomId === roomId && user.userId !== userId
    );
    socket.emit("existing-users", existingUsers);

    // Broadcast updated user list to all in the room
    const updatedUsers = usersMediaPreferences.filter(
      (user) => user.roomId === roomId
    );
    // Notify everyone in the room about new user
    io.to(roomId).emit("user-connected", updatedUsers);
    // When the user disconnects
    socket.on("disconnect", () => {
      // Remove from global list
      const index = usersMediaPreferences.findIndex(
        (user) => user.userId === userId && user.roomId === roomId
      );
      if (index !== -1) {
        usersMediaPreferences.splice(index, 1);
      }

      // Notify room
      io.to(roomId).emit("user-disconnected", userId);

      // Send updated list
      const updatedUsers = usersMediaPreferences.filter(
        (user) => user.roomId === roomId
      );
      io.to(roomId).emit("update-users-media", updatedUsers);
    });
  });
});

// ... rest of backend ...

server.listen(3000, () => {
  console.log("Server listening on http://localhost:3000");
});
