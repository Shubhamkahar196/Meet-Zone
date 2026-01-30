import { useEffect, useRef, useState } from "react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import io from "socket.io-client";

const server_url = "http://localhost:8000/";
let connections = {};

const peerConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoMeet() {
  const [username, setUsername] = useState("");
  const [askForUsername, setAskForUsername] = useState(true);
  const [videos, setVideos] = useState([]);

  const localVideoRef = useRef();
  const socketRef = useRef();
  const socketIdRef = useRef();

  // ================= MEDIA =================

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((s) => {
      window.localStream = s;
      localVideoRef.current.srcObject = s;
    });
  }, []);

  // ================= SOCKET =================

  const connect = () => {
    socketRef.current = io(server_url);

    socketRef.current.on("connect", () => {
      socketIdRef.current = socketRef.current.id;
      socketRef.current.emit("join-call", window.location.href);
    });

    socketRef.current.on("user-joined", (id, clients) => {
      clients.forEach((clientId) => {
        if (!connections[clientId]) createPeer(clientId, true);
      });
    });

    socketRef.current.on("signal", gotSignal);

    socketRef.current.on("user-left", (id) => {
      setVideos((v) => v.filter((x) => x.socketId !== id));
      delete connections[id];
    });
  };

  // ================= SIGNAL =================

  const gotSignal = (fromId, message) => {
    const data = JSON.parse(message);

    if (data.sdp) {
      connections[fromId]
        .setRemoteDescription(new RTCSessionDescription(data.sdp))
        .then(() => {
          if (data.sdp.type === "offer") {
            connections[fromId].createAnswer().then((answer) => {
              connections[fromId].setLocalDescription(answer);
              socketRef.current.emit(
                "signal",
                fromId,
                JSON.stringify({ sdp: answer })
              );
            });
          }
        });
    }

    if (data.ice) {
      connections[fromId].addIceCandidate(new RTCIceCandidate(data.ice));
    }
  };

  // ================= PEER =================

  const createPeer = (id, offerer) => {
    connections[id] = new RTCPeerConnection(peerConfig);

    connections[id].onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current.emit("signal", id, JSON.stringify({ ice: e.candidate }));
      }
    };

    connections[id].ontrack = (e) => {
      setVideos((v) => {
        if (v.find((x) => x.socketId === id)) return v;
        return [...v, { socketId: id, stream: e.streams[0] }];
      });
    };

    window.localStream.getTracks().forEach((t) =>
      connections[id].addTrack(t, window.localStream)
    );

    if (offerer) {
      connections[id].createOffer().then((desc) => {
        connections[id].setLocalDescription(desc);
        socketRef.current.emit("signal", id, JSON.stringify({ sdp: desc }));
      });
    }
  };

  // ================= JOIN =================

  const join = () => {
    if (!username) return alert("Enter username");
    setAskForUsername(false);
    connect();
  };

  return (
    <div>
      {askForUsername ? (
        <>
          <Textarea value={username} onChange={(e) => setUsername(e.target.value)} />
          <Button onClick={join}>Join</Button>
          <video ref={localVideoRef} autoPlay muted />
        </>
      ) : (
        <>
          <video ref={localVideoRef} autoPlay muted />

          {videos.map((v, i) => (
            <video
              key={i}
              ref={(ref) => ref && (ref.srcObject = v.stream)}
              autoPlay
            />
          ))}
        </>
      )}
    </div>
  );
}
