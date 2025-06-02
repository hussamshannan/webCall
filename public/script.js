const socket = io("https://webcall-7f8y.onrender.com");

const videoGrid = document.getElementById("video-grid");
const myPeer = new Peer(undefined); // default PeerJS server
const myVideo = createVideoElement(true);
const peers = {};

// Start
(async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    addVideoStream(myVideo, stream);

    myPeer.on("open", (id) => {
      socket.emit("join-room", ROOM_ID, id);
    });

    myPeer.on("call", (call) => handleIncomingCall(call, stream));
    socket.on("user-connected", (userId) => connectToPeer(userId, stream));
    socket.on("user-disconnected", (userId) => disconnectPeer(userId));
  } catch (error) {
    console.error("Media access error:", error);
  }
})();

function handleIncomingCall(call, stream) {
  if (peers[call.peer]) return; // already connected
  call.answer(stream);

  const video = createVideoElement();
  call.on("stream", (remoteStream) => addVideoStream(video, remoteStream));
  call.on("close", () => video.remove());

  peers[call.peer] = call;
}

function connectToPeer(userId, stream) {
  if (peers[userId]) return;

  const call = myPeer.call(userId, stream);
  const video = createVideoElement();

  call.on("stream", (remoteStream) => addVideoStream(video, remoteStream));
  call.on("close", () => video.remove());

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
  video.muted = muted;
  return video;
}

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play().catch((err) => {
      console.error("Auto-play failed:", err);
    });
  });
  videoGrid.append(video);
}
