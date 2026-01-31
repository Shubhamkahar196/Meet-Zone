import { useEffect, useRef, useState } from "react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Mic, MicOff, Video, VideoOff, LogOut } from "lucide-react";
import { toast } from "sonner";
import io from "socket.io-client";

/*
====================================================
CONFIG
====================================================
*/

const server_url = "http://localhost:8000/";
let connections = {}; // socketId -> RTCPeerConnection

const peerConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoMeet() {

  // ================= STATE =================

  const [username, setUsername] = useState("");
  const [askForUsername, setAskForUsername] = useState(true);
  const [videos, setVideos] = useState([]);
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const [screen, setScreen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  // ================= REFS =================

  const localVideoRef = useRef();
  const socketRef = useRef();
  const socketIdRef = useRef();

  // ====================================================
  // GET CAMERA + MIC
  // ====================================================

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        window.localStream = stream;
        localVideoRef.current.srcObject = stream;
      })
      .catch(() => toast.error("Camera already in use"));
  }, []);

  // ====================================================
  // CONNECT SOCKET
  // ====================================================

  const connect = () => {
    socketRef.current = io(server_url);

    socketRef.current.on("connect", () => {
      socketIdRef.current = socketRef.current.id;
      socketRef.current.emit("join-call", window.location.href);
      toast.success("Joined meeting");
    });

    socketRef.current.on("user-joined", (newUserId, clients) => {
      clients.forEach(clientId => {
        if (clientId === socketIdRef.current) return;

        if (!connections[clientId]) {
          const offerer = socketIdRef.current < clientId;
          createPeer(clientId, offerer);
        }
      });
    });

    socketRef.current.on("signal", gotSignal);

    socketRef.current.on("user-left", id => {
      setVideos(v => v.filter(x => x.socketId !== id));
      delete connections[id];
    });

    socketRef.current.on("chat-message", (data, sender) => {
      setMessages(m => [...m, { sender, data }]);
    });
  };

  // ====================================================
  // SIGNAL HANDLER
  // ====================================================

  const gotSignal = (fromId, message) => {

    if (!connections[fromId]) createPeer(fromId, false);

    const pc = connections[fromId];
    const data = JSON.parse(message);

    if (data.sdp) {
      if (pc.signalingState === "stable" && data.sdp.type === "answer") return;

      pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
        .then(() => {
          if (data.sdp.type === "offer") {
            pc.createAnswer().then(answer => {
              pc.setLocalDescription(answer);
              socketRef.current.emit("signal", fromId, JSON.stringify({ sdp: answer }));
            });
          }
        });
    }

    if (data.ice) pc.addIceCandidate(new RTCIceCandidate(data.ice));
  };

  // ====================================================
  // CREATE PEER
  // ====================================================

  const createPeer = (id, offerer) => {

    if (connections[id] || !window.localStream) return;

    connections[id] = new RTCPeerConnection(peerConfig);

    connections[id].onicecandidate = e => {
      if (e.candidate)
        socketRef.current.emit("signal", id, JSON.stringify({ ice: e.candidate }));
    };

    connections[id].ontrack = e => {
      setVideos(v => {
        if (v.find(x => x.socketId === id)) return v;
        return [...v, { socketId: id, stream: e.streams[0] }];
      });
    };

    window.localStream.getTracks().forEach(track =>
      connections[id].addTrack(track, window.localStream)
    );

    if (offerer) {
      connections[id].createOffer().then(desc => {
        connections[id].setLocalDescription(desc);
        socketRef.current.emit("signal", id, JSON.stringify({ sdp: desc }));
      });
    }
  };

  // ====================================================
  // SCREEN SHARE
  // ====================================================

  const toggleScreenShare = async () => {

    if (!screen) {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = stream.getVideoTracks()[0];

      Object.values(connections).forEach(pc => {
        pc.getSenders().find(s => s.track.kind === "video").replaceTrack(screenTrack);
      });

      localVideoRef.current.srcObject = stream;
      setScreen(true);

      screenTrack.onended = () => stopScreen();
    } else stopScreen();
  };

  const stopScreen = () => {
    const camTrack = window.localStream.getVideoTracks()[0];

    Object.values(connections).forEach(pc => {
      pc.getSenders().find(s => s.track.kind === "video").replaceTrack(camTrack);
    });

    localVideoRef.current.srcObject = window.localStream;
    setScreen(false);
  };

  // ====================================================
  // CHAT
  // ====================================================

  const sendMessage = () => {
    if (!message.trim()) return;
    socketRef.current.emit("chat-message", message, username);
    setMessages(m => [...m, { sender: "Me", data: message }]);
    setMessage("");
  };

  // ====================================================
  // CONTROLS
  // ====================================================

  const toggleMic = () => {
    window.localStream.getAudioTracks()[0].enabled = !mic;
    setMic(!mic);
  };

  const toggleCam = () => {
    window.localStream.getVideoTracks()[0].enabled = !cam;
    setCam(!cam);
  };

  const join = () => {
    if (!username) return toast.error("Enter username");
    setAskForUsername(false);
    connect();
  };

  // ====================================================
  // UI
  // ====================================================

  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col">

      {askForUsername ? (

        <div className="flex items-center justify-center h-full">
          <Card className="w-87.5">
            <CardContent className="space-y-4 p-6">
              <Textarea value={username} onChange={e => setUsername(e.target.value)} />
              <Button className="w-full" onClick={join}>Join</Button>
              <video ref={localVideoRef} autoPlay muted playsInline className="rounded-xl" />
            </CardContent>
          </Card>
        </div>

      ) : (

        <>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">

            <video ref={localVideoRef} autoPlay muted playsInline className="rounded-xl bg-black" />

            {videos.map(v => (
              <video
                key={v.socketId}
                autoPlay
                playsInline
                ref={r => r && (r.srcObject = v.stream)}
                className="rounded-xl bg-black"
              />
            ))}

          </div>

          <div className="h-20 bg-zinc-900 flex justify-center gap-3 items-center">

            <Button size="icon" variant={mic ? "secondary" : "destructive"} onClick={toggleMic}>
              {mic ? <Mic /> : <MicOff />}
            </Button>

            <Button size="icon" variant={cam ? "secondary" : "destructive"} onClick={toggleCam}>
              {cam ? <Video /> : <VideoOff />}
            </Button>

            <Button onClick={toggleScreenShare}>Share</Button>
            <Button onClick={() => setShowChat(!showChat)}>Chat</Button>

            <Button size="icon" variant="destructive" onClick={() => window.location.reload()}>
              <LogOut />
            </Button>
          </div>

          {showChat && (
            <div className="absolute right-0 top-0 h-full w-80 bg-zinc-900 p-4 flex flex-col">

              <div className="flex-1 overflow-y-auto space-y-2">
                {messages.map((m,i)=>(
                  <div key={i}><b>{m.sender}:</b> {m.data}</div>
                ))}
              </div>

              <input
                className="bg-zinc-800 p-2 mt-2"
                value={message}
                onChange={e=>setMessage(e.target.value)}
                placeholder="Type message..."
              />

              <Button onClick={sendMessage} className="mt-2">Send</Button>

            </div>
          )}
        </>
      )}
    </div>
  );
}
