import { useEffect, useRef, useState } from "react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Mic, MicOff, Video, VideoOff, LogOut } from "lucide-react";
import { toast } from "sonner";
import io from "socket.io-client";

const server_url = "http://localhost:8000/";
let connections = {};

const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoMeet() {

  // ORIGINAL STATES
  const [videoAvailable, setVideoAvailable] = useState(true);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [video, setVideo] = useState([]);
  const [audio, setAudio] = useState();

  const [videos, setVideos] = useState([]);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [showChat,setShowChat] = useState(true);
  const [askForUsername, setAskForUsername] = useState(true);
  const [username, setUsername] = useState("");

  const socketIdRef = useRef();
  const socketRef = useRef();
  const localVideoref = useRef();
  const videoRef = useRef([]);
  const streamRef = useRef(null); 

  // ====================================================
  // PERMISSIONS 
  // ====================================================

  const getPermissions = async () => {
    try {
      const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoPermission) setVideoAvailable(true);

      const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (audioPermission) setAudioAvailable(true);

      if (videoAvailable || audioAvailable) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: video,
          audio: audio,
        });

        streamRef.current = stream;
        if (localVideoref.current) {
          localVideoref.current.srcObject = streamRef.current;
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  // ====================================================
  // USER MEDIA (ORIGINAL)
  // ====================================================

  const getUserMediaSuccess = (stream) => {
    try {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    } catch(e){
      console.log(e)
    }

    streamRef.current = stream;
    localVideoref.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      connections[id].addStream(streamRef.current);

      connections[id].createOffer().then((description) => {
        connections[id].setLocalDescription(description).then(() => {
          socketRef.current.emit(
            "signal",
            id,
            JSON.stringify({ sdp: connections[id].localDescription }),
          );
        });
      });
    }
  };

  const getUserMedia = () => {
    navigator.mediaDevices
      .getUserMedia({ video: video, audio: audio })
      .then(getUserMediaSuccess)
      .catch(console.log);
  };

  // ====================================================
  // SOCKET (ORIGINAL)
  // ====================================================

  const gotMessageFromServer = (fromId, message) => {
    let signal = JSON.parse(message);

    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === "offer") {
              connections[fromId].createAnswer().then((description) => {
                connections[fromId].setLocalDescription(description).then(() => {
                  socketRef.current.emit(
                    "signal",
                    fromId,
                    JSON.stringify({ sdp: connections[fromId].localDescription }),
                  );
                });
              });
            }
          });
      }

      if (signal.ice) {
        connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice));
      }
    }
  };

  const connectToSocketServer = () => {
    socketRef.current = io(server_url);

    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("connect", () => {
      toast.success("Connected");

      socketRef.current.emit("join-call", window.location.href);
      socketIdRef.current = socketRef.current.id;

      socketRef.current.on("chat-message", addMessage);

      socketRef.current.on("user-left", (id) => {
        toast.error("Participant left");
        setVideos((videos) => videos.filter((video) => video.socketId !== id));
      });

      socketRef.current.on("user-joined", (id, clients) => {
        toast.success("New participant joined");

        clients.forEach((socketListId) => {
          connections[socketListId] = new RTCPeerConnection(peerConfigConnections);

          connections[socketListId].onicecandidate = (event) => {
            if (event.candidate != null) {
              socketRef.current.emit(
                "signal",
                socketListId,
                JSON.stringify({ ice: event.candidate }),
              );
            }
          };

          connections[socketListId].onaddstream = (event) => {
            let videoExists = videoRef.current.find((video) => video.socketId === socketListId);

            if (videoExists) {
              setVideos((videos) =>
                videos.map((video) =>
                  video.socketId === socketListId ? { ...video, stream: event.stream } : video,
                ),
              );
            } else {
              setVideos((videos) => [...videos, { socketId: socketListId, stream: event.stream }]);
            }
          };

          if (streamRef.current) connections[socketListId].addStream(streamRef.current);
        });
      });
    });
  };

  // ====================================================
  // CHAT
  // ====================================================

  const addMessage = (data, sender) => {
    setMessages((prev) => [...prev, { sender, data }]);
    toast(sender, { description: data });
  };

  const sendMessage = () => {
    socketRef.current.emit("chat-message", message, username);
    setMessage("");
  };

  // ====================================================
  // CONTROLS
  // ====================================================

  const handleVideo = () => {
    const enabled = !video;
  setVideo(enabled);

  streamRef.current?.getVideoTracks().forEach(track => {
    track.enabled = enabled;
  });
  };

  const handleAudio = () => {
    const enabled = !audio;
  setAudio(enabled);

  streamRef.current?.getAudioTracks().forEach(track => {
    track.enabled = enabled;
  });
  };

  const handleEndCall = () => window.location.reload();
   
  const handleKeyPress =(e)=>{
    if(e.key === "Enter" && message.trim()!== ""){
      sendMessage();
    }
  }

  const connect = () => {
    setAskForUsername(false);
    connectToSocketServer();
    getUserMedia();
  };

  // ====================================================
  // EFFECTS 
  // ====================================================

 // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    getPermissions();
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (video !== undefined && audio !== undefined) getUserMedia();
  }, [video, audio]);

  // ====================================================
  // UI
  // ====================================================
return (
  <div className="h-screen bg-zinc-950 text-white">

    {askForUsername ? (
      <div className="flex h-full items-center justify-center">
        <Card className="w-96 bg-zinc-900">
          <CardContent className="p-6 space-y-4">
            <Textarea
              placeholder="Enter your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <video
              ref={localVideoref}
              autoPlay
              muted
              className="rounded w-full h-48 object-cover"
            />

            <Button onClick={connect} className="w-full">
              Join
            </Button>
          </CardContent>
        </Card>
      </div>
    ) : (
      <>
        {/* VIDEO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4">

          {/* LOCAL VIDEO */}
          <div className="relative rounded bg-black flex items-center justify-center">
            {video ? (
              <video
                ref={localVideoref}
                autoPlay
                muted
                className="w-full h-full object-cover rounded"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-zinc-700 flex items-center justify-center text-4xl font-bold">
                {username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* REMOTE VIDEOS */}
          {videos.map((v) => (
            <div
              key={v.socketId}
              className="relative rounded bg-black flex items-center justify-center"
            >
              <video
                ref={(r) => r && (r.srcObject = v.stream)}
                autoPlay
                className="w-full h-full object-cover rounded"
              />
            </div>
          ))}
        </div>

        {/* CONTROL BAR */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex gap-3 bg-zinc-900 px-4 py-2 rounded-full">

          <Button size="icon" onClick={handleAudio}>
            {audio ? <Mic /> : <MicOff />}
          </Button>

          <Button size="icon" onClick={handleVideo}>
            {video ? <Video /> : <VideoOff />}
          </Button>

          <Button onClick={() => setShowChat(!showChat)}>
            {showChat ? "Hide Chat" : "Show Chat"}
          </Button>

          <Button size="icon" variant="destructive" onClick={handleEndCall}>
            <LogOut />
          </Button>
        </div>

        {/* CHAT PANEL */}
        {showChat && (
          <div className="fixed right-0 top-0 w-72 h-full bg-zinc-900 p-3">

            <div className="h-[85%] overflow-y-auto space-y-2">
              {messages.map((m, i) => (
                <div key={i}>
                  <b>{m.sender}:</b> {m.data}
                </div>
              ))}
            </div>

            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type message..."
              className="w-full bg-zinc-800 p-2 mt-2 rounded outline-none"
            />

            <Button onClick={sendMessage} className="w-full mt-2">
              Send
            </Button>
          </div>
        )}
      </>
    )}
  </div>
);

}