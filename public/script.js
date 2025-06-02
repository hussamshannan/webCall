const socket = io("https://webcall-7f8y.onrender.com");

const videoGrid = document.getElementById("video-grid");
const myPeer = new Peer(); // use default PeerJS cloud server
const peers = {};
const myVideo = createVideoElement(true); // local stream muted

(async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" }, // improve compatibility
      audio: true,
    });

    addVideoStream(myVideo, stream);

    // When connected to PeerJS server
    myPeer.on("open", (id) => {
      socket.emit("join-room", ROOM_ID, id);
    });

    // Handle incoming call
    myPeer.on("call", (call) => handleIncomingCall(call, stream));

    // When a new user joins
    socket.on("user-connected", (userId) => {
      if (!peers[userId]) connectToPeer(userId, stream);
    });

    // When a user disconnects
    socket.on("user-disconnected", (userId) => {
      disconnectPeer(userId);
    });

    // Reconnect handling
    socket.io.on("reconnect", () => {
      if (myPeer.id) {
        socket.emit("join-room", ROOM_ID, myPeer.id);
      }
    });
  } catch (error) {
    console.error("Failed to get media stream:", error);
    alert("Camera and microphone access are required.");
  }
})();

// ========== Call Handling ==========

function handleIncomingCall(call, stream) {
  if (peers[call.peer]) return;

  call.answer(stream);
  const video = createVideoElement();

  setupRemoteStreamHandlers(call, video);
  peers[call.peer] = call;
}

function connectToPeer(userId, stream) {
  if (peers[userId]) return;

  const call = myPeer.call(userId, stream);
  const video = createVideoElement();

  setupRemoteStreamHandlers(call, video);
  peers[userId] = call;
}

function disconnectPeer(userId) {
  if (peers[userId]) {
    peers[userId].close();
    delete peers[userId];
  }
}

// ========== Helpers ==========

function createVideoElement(muted = false) {
  const video = document.createElement("video");
  video.playsInline = true;
  video.autoplay = true;
  video.muted = muted;
  return video;
}

function addVideoStream(video, stream) {
  if (video.srcObject) return;

  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play().catch((err) => {
      console.warn("Autoplay issue:", err);
    });
  });
  videoGrid.appendChild(video);
}

function setupRemoteStreamHandlers(call, video) {
  // Newer browsers
  call.on("track", (_, remoteStream) => {
    if (!video.srcObject) {
      addVideoStream(video, remoteStream);
    }
  });

  // Fallback for older browsers
  call.on("stream", (remoteStream) => {
    if (!video.srcObject) {
      addVideoStream(video, remoteStream);
    }
  });

  call.on("close", () => {
    video.remove();
  });

  call.on("error", (err) => {
    console.error("Call error:", err);
    video.remove();
  });
}
