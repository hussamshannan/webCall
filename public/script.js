const socket = io("/");
const videoGrid = document.getElementById("video-grid");

const myPeer = new Peer(); // PeerJS cloud server
const myVideo = document.createElement("video");
myVideo.muted = true;
myVideo.playsInline = true;

const peers = {};

// Wait for user interaction to start media access
document.addEventListener("DOMContentLoaded", () => {
  const startButton = document.createElement("button");
  startButton.innerText = "Start Video";
  startButton.style.padding = "1em";
  document.body.appendChild(startButton);

  startButton.addEventListener("click", () => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        addVideoStream(myVideo, stream);
        startButton.remove(); // Remove start button

        myPeer.on("call", (call) => {
          call.answer(stream);
          const video = document.createElement("video");
          video.playsInline = true;
          call.on("stream", (userVideoStream) => {
            addVideoStream(video, userVideoStream);
          });
        });

        socket.on("user-connected", (userId) => {
          connectToNewUser(userId, stream);
        });
      })
      .catch((err) => {
        console.error("iPhone camera/mic permission denied:", err);
        alert("Please allow access to camera and mic.");
      });
  });
});

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) peers[userId].close();
});

myPeer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
});

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  const video = document.createElement("video");
  video.playsInline = true;
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
  });

  peers[userId] = call;
}

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.playsInline = true;
  video.addEventListener("loadedmetadata", () => {
    video.play().catch((err) => {
      console.error("Autoplay error on iPhone:", err);
    });
  });
  videoGrid.append(video);
}
