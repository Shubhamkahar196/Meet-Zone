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

// STUN server (needed for NAT traversal)
const peerConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoMeet() {
  /*
  ====================================================
  STATE
  ====================================================
  */

  const [username, setUsername] = useState("");
  const [askForUsername, setAskForUsername] = useState(true);
  const [videos, setVideos] = useState([]);
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);

  /*
  ====================================================
  REFS
  ====================================================
  */

  const localVideoRef = useRef();   // local camera preview
  const socketRef = useRef();      // socket.io connection
  const socketIdRef = useRef();    // our socket id

  /*
  ====================================================
  STEP 1 – GET CAMERA + MIC
  ====================================================
  */

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        window.localStream = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      })
      .catch(() => toast.error("Camera already in use"));
  }, []);

  /*
  ====================================================
  STEP 2 – CONNECT TO SIGNALING SERVER
  ====================================================
  */

  const connect = () => {
    socketRef.current = io(server_url);

    socketRef.current.on("connect", () => {
      socketIdRef.current = socketRef.current.id;

      // URL = room id
      socketRef.current.emit("join-call", window.location.href);
      toast.success("Joined meeting");
    });

    /*
    When anyone joins, server sends:
    newUserId + all client ids
    */
    socketRef.current.on("user-joined", (newUserId, clients) => {

      clients.forEach(clientId => {
        if (clientId === socketIdRef.current) return;

        // Everyone creates peers for everyone
        if (!connections[clientId]) {
          // deterministic offerer (prevents glare)
          const offerer = socketIdRef.current < clientId;
          createPeer(clientId, offerer);
        }
      });
    });

    socketRef.current.on("signal", gotSignal);

    socketRef.current.on("user-left", id => {
      toast.warning("Participant left");
      setVideos(v => v.filter(x => x.socketId !== id));
      delete connections[id];
    });
  };

  /*
  ====================================================
  STEP 3 – HANDLE SDP + ICE
  ====================================================
  */

  const gotSignal = (fromId, message) => {

    // peer may not exist yet
    if (!connections[fromId]) {
      createPeer(fromId, false);
    }

    const pc = connections[fromId];
    const data = JSON.parse(message);

    // SDP
    if (data.sdp) {

      // avoid duplicate answers
      if (pc.signalingState === "stable" && data.sdp.type === "answer") return;

      pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
        .then(() => {
          if (data.sdp.type === "offer") {
            pc.createAnswer().then(answer => {
              pc.setLocalDescription(answer);
              socketRef.current.emit("signal", fromId, JSON.stringify({ sdp: answer }));
            });
          }
        })
        .catch(console.log);
    }

    // ICE
    if (data.ice) {
      pc.addIceCandidate(new RTCIceCandidate(data.ice)).catch(console.log);
    }
  };

  /*
  ====================================================
  STEP 4 – CREATE PEER
  ====================================================
  */

  const createPeer = (id, offerer) => {

    if (connections[id]) return;
    if (!window.localStream) return;

    connections[id] = new RTCPeerConnection(peerConfig);

    // ICE candidates
    connections[id].onicecandidate = e => {
      if (e.candidate) {
        socketRef.current.emit("signal", id, JSON.stringify({ ice: e.candidate }));
      }
    };

    // remote video
    connections[id].ontrack = e => {
      setVideos(v => {
        if (v.find(x => x.socketId === id)) return v;
        return [...v, { socketId: id, stream: e.streams[0] }];
      });
    };

    // add local tracks
    window.localStream.getTracks().forEach(track =>
      connections[id].addTrack(track, window.localStream)
    );

    // only offerer sends offer
    if (offerer) {
      connections[id].createOffer().then(desc => {
        connections[id].setLocalDescription(desc);
        socketRef.current.emit("signal", id, JSON.stringify({ sdp: desc }));
      });
    }
  };

  /*
  ====================================================
  CONTROLS
  ====================================================
  */

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

  /*
  ====================================================
  UI
  ====================================================
  */

  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col">

      {askForUsername ? (

        <div className="flex items-center justify-center h-full">
          <Card className="w-87.5">
            <CardContent className="space-y-4 p-6">
              <h2 className="text-xl font-semibold">Join Meeting</h2>

              <Textarea value={username} onChange={e => setUsername(e.target.value)} />

              <Button className="w-full" onClick={join}>Join</Button>

              <video ref={localVideoRef} autoPlay muted playsInline className="rounded-xl" />
            </CardContent>
          </Card>
        </div>

      ) : (

        <>
          {/* VIDEO GRID */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">

            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="rounded-xl bg-black"
            />

            {videos.map(v => (
              <video
                key={v.socketId}
                autoPlay
                playsInline
                ref={ref => ref && (ref.srcObject = v.stream)}
                className="rounded-xl bg-black"
              />
            ))}

          </div>

          {/* CONTROLS */}
          <div className="h-20 bg-zinc-900 flex justify-center gap-4 items-center">

            <Button size="icon" variant={mic ? "secondary" : "destructive"} onClick={toggleMic}>
              {mic ? <Mic /> : <MicOff />}
            </Button>

            <Button size="icon" variant={cam ? "secondary" : "destructive"} onClick={toggleCam}>
              {cam ? <Video /> : <VideoOff />}
            </Button>

            <Button size="icon" variant="destructive" onClick={() => window.location.reload()}>
              <LogOut />
            </Button>

          </div>
        </>
      )}
    </div>
  );
}
