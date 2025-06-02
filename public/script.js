const socket = io("https://webcall-7f8y.onrender.com");
const videoGrid = document.getElementById("video-grid");
const myPeer = new Peer(); // uses default PeerJS server
const myVideo = createVideoElement(true); // local video should be muted
const peers = {};

// Start the connection
(async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    addVideoStream(myVideo, stream);

    // When PeerJS opens connection
    myPeer.on("open", (id) => {
      socket.emit("join-room", ROOM_ID, id);
    });

    // Handle incoming call
    myPeer.on("call", (call) => handleIncomingCall(call, stream));

    // Listen for new users
    socket.on("user-connected", (userId) => {
      if (!peers[userId]) connectToPeer(userId, stream);
    });

    // Handle disconnection
    socket.on("user-disconnected", (userId) => {
      if (peers[userId]) {
        peers[userId].close();
        delete peers[userId];
      }
    });

    // Reconnect logic (for mobile reconnection)
    socket.io.on("reconnect", () => {
      if (myPeer.id) {
        socket.emit("join-room", ROOM_ID, myPeer.id);
      }
    });
  } catch (error) {
    console.error("Media access error:", error);
    alert("Please allow camera and microphone access.");
  }
})();

function handleIncomingCall(call, stream) {
  if (peers[call.peer]) return;

  call.answer(stream);
  const video = createVideoElement();

  call.on("track", (track, remoteStream) => {
    if (!video.srcObject) addVideoStream(video, remoteStream);
  });

  call.on("stream", (remoteStream) => {
    if (!video.srcObject) addVideoStream(video, remoteStream); // fallback
  });

  call.on("close", () => video.remove());

  peers[call.peer] = call;
}

function connectToPeer(userId, stream) {
  if (peers[userId]) return;

  const call = myPeer.call(userId, stream);
  const video = createVideoElement();

  call.on("track", (track, remoteStream) => {
    if (!video.srcObject) addVideoStream(video, remoteStream);
  });

  call.on("stream", (remoteStream) => {
    if (!video.srcObject) addVideoStream(video, remoteStream); // fallback
  });

  call.on("close", () => video.remove());

  peers[userId] = call;
}

function createVideoElement(muted = true) {
  const video = document.createElement("video");
  video.playsInline = true;
  video.muted = muted;
  return video;
}

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play().catch((err) => {
      console.warn("Autoplay failed on mobile:", err);
    });
  });
  videoGrid.append(video);
}
