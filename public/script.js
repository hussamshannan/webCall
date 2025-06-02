const socket = io("/");
const videoGrid = document.getElementById("video-grid");

// Initialize Peer with explicit TURN/STUN configuration
var peer = new Peer({
  config: {
    iceServers: [{ url: "stun:stun.l.google.com:19302" }],
  } /* Sample servers, please use appropriate ones */,
});

const myVideo = document.createElement("video");
myVideo.muted = true;
myVideo.playsInline = true;
myVideo.setAttribute("autoplay", "true"); // Explicit autoplay attribute

const peers = {};

// Handle media stream errors explicitly
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    addVideoStream(myVideo, stream);

    peer.on("open", (id) => {
      socket.emit("join-room", ROOM_ID, id);
    });

    myPeer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      video.playsInline = true;
      video.setAttribute("autoplay", "true"); // Required for iOS
      video.muted = true; // Mute remote streams initially

      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });

      call.on("close", () => video.remove());
      peers[call.peer] = call;
    });

    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });
  })
  .catch((err) => {
    console.error("Media Error:", err);
    // Implement user-facing error message here
  });

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) peers[userId].close();
  delete peers[userId];
});

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  const video = document.createElement("video");
  video.playsInline = true;
  video.setAttribute("autoplay", "true"); // Required for iOS
  video.muted = true; // Mute remote streams initially

  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });

  call.on("close", () => video.remove());
  peers[userId] = call;
}

function addVideoStream(video, stream) {
  video.srcObject = stream;

  // Use 'canplay' instead of 'loadedmetadata' for iOS
  video.addEventListener(
    "canplay",
    () => {
      video.play().catch((err) => {
        console.error("Playback Failed:", err);
        // Implement fallback like mute/unmute button
      });
    },
    { once: true }
  );

  videoGrid.appendChild(video);
}
