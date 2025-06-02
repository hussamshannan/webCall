const express = require("express");
const app = express();
const https = require("https");
const server = https.createServer(options, app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*", // or limit to your domain
    methods: ["GET", "POST"],
  },
});
const socket = io("https://webcall-7f8y.onrender.com", {
  transports: ["websocket"],
});
  
const { v4: uuidV4 } = require("uuid");

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.redirect(`/${uuidV4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", userId);

    socket.on("disconnect", () => {
      socket.to(roomId).emit("user-disconnected", userId);
    });
  });
});

server.listen(443); // For HTTPS

