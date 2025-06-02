const socket = io("https://webcall-7f8y.onrender.com"); // change if hosting backend yourself
const myPeer = new Peer(undefined); // optionally use your own PeerJS server
const peers = {};
const videoGrid = document.getElementById("video-grid");
const myVideo = createVideoElement(true);

const a = "";
myPeer.on("open", async (id) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    addVideoStream(myVideo, stream);
    socket.emit("join-room", ROOM_ID, id);

    socket.on("user-connected", (userId) => {
      setTimeout(() => connectToPeer(userId, stream), 1000); // helps on mobile
    });

    myPeer.on("call", (call) => handleIncomingCall(call, stream));
    socket.on("user-disconnected", (userId) => disconnectPeer(userId));
    socket.on("joined-room", (roomId) => {
      console.log("Connected to room:", roomId);
    });
  } catch (error) {
    console.error("Error accessing media devices:", error);
  }
});

function handleIncomingCall(call, stream) {
  if (peers[call.peer]) return;

  call.answer(stream);
  const video = createVideoElement();

  call.on("stream", (remoteStream) => addVideoStream(video, remoteStream));
  call.on("close", () => video.remove());
  call.on("error", (err) => console.error("Call error:", err));

  peers[call.peer] = call;
}

function connectToPeer(userId, stream) {
  if (peers[userId]) return;

  const call = myPeer.call(userId, stream);
  const video = createVideoElement();

  call.on("stream", (remoteStream) => addVideoStream(video, remoteStream));
  call.on("close", () => video.remove());
  call.on("error", (err) => console.error("Outgoing call error:", err));

  peers[userId] = call;
}

function disconnectPeer(userId) {
  if (peers[userId]) {
    peers[userId].close();
    delete peers[userId];
  }
}

function createVideoElement(muted = false) {
  const video = document.createElement("video");
  video.playsInline = true;
  video.autoplay = true;
  video.muted = muted;
  return video;
}

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play().catch((err) => console.error("Auto-play failed:", err));
  });
  videoGrid.appendChild(video);
}
