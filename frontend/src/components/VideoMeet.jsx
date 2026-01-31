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
  const [videoAvailable, setVideoAvailable] = useState(true);

  const [audioAvailable, setAudioAvailable] = useState(true);

  const [video, setVideo] = useState([]);

  const [audio, setAudio] = useState();

  const [screen, setScreen] = useState();

  const [showModal, setModal] = useState(true);

  const [screenAvailable, setScreenAvailable] = useState();

  const [messages, setMessages] = useState([]);

  const [message, setMessage] = useState("");

  const [newMessages, setNewMessages] = useState(3);

  const [askForUsername, setAskForUsername] = useState(true);

  const [username, setUsername] = useState("");

  const socketIdRef = useRef();
  const socketRef = useRef();
  const localVideoref = useRef();

  useEffect(() => {
    getPermissions();
  });

  const getDisplayMedia = () => {
    if (screen) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true, audio: true })
          .then(getDisplayMediaSuccess)
          .then((stream) => {})
          .catch((e) => console.log(e));
      }
    }
  };

  const getPermissions = async () => {
    try {
      // taking video permission
      const videoPermission = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      if (videoPermission) {
        setVideoAvailable(true);
        console.log("Video Permission granted");
      } else {
        setVideoAvailable(false);
        console.log("Video Permision denied");
      }

      // taking audio permission
      const audioPermission = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      if (audioPermission) {
        setAudioAvailable(true);
        console.log("Audio permission granted");
      } else {
        setAudioAvailable(false);
        console.log("Audio Permission denied");
      }

      if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
      } else {
        setScreenAvailable(false);
      }

      if (videoAvailable || audioAvailable) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: video,
          audio: audio,
        });
        if (stream) {
          window.localStream = stream;
          if (localVideoref.current) {
            localVideoref.current.srcObject = stream;
          }
        }
      }
    } catch (error) {
      console.log("Permission Error", error);
    }
  };

  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
      console.log("SET STATE Has", video, audio);
    }
  }, [video, audio]);

  const getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();
  };

  const getUserMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                console.log(description)
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }
      }
 


  

   const getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess)
                .then((stream) => { })
                .catch((e) => console.log(e))
        } else {
            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { }
        }
    }

    const getDisplayMediaSuccess = (stream) => {
    console.log("Here");
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      console.log(error);
    }

    window.localStream = stream;
    localVideoref.current.srcObject = stream

    for(let id in connections){
      if(id === socketIdRef.current) continue;

      connections[id].addStream(window.localStream);

      connections[id].createOffer().then((description)=>{
        connections[id].setLocalDescription(description)
        .then(()=>{
          socketRef.current.emit('signal', id, JSON,stringify({'sdp' : connections[id].localDescription}))
        }).catch(e => console.log(e));
      })
    }

    stream.getTracks().forEach(track => track.onended =() =>{
      setScreen(false);

      try {
        const tracks = localVideoref.current.srcObject.getTracks()
        tracks.forEach(track => track.stop());
      } catch (error) {
        console.log(error);
      }

      const blackSilence = (...args) => new MediaStream([black(...args),silence()])
      window.localStream = blackSilence()
      localVideoRef.current.srcObject = window.localStream

      getUserMedia();
    })
  };

  const gotMessageFromServer = (fromId,message)={

  }

  // ====================================================
  // UI
  // ====================================================

  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col">
      {askForUsername ? (
        <div className="flex items-center justify-center h-full">
          <Card className="w-87.5">
            <CardContent className="space-y-4 p-6">
              <Textarea
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <Button className="w-full" onClick={join}>
                Join
              </Button>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="rounded-xl"
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="rounded-xl bg-black"
            />

            {videos.map((v) => (
              <video
                key={v.socketId}
                autoPlay
                playsInline
                ref={(r) => r && (r.srcObject = v.stream)}
                className="rounded-xl bg-black"
              />
            ))}
          </div>

          <div className="h-20 bg-zinc-900 flex justify-center gap-3 items-center">
            <Button
              size="icon"
              variant={mic ? "secondary" : "destructive"}
              onClick={toggleMic}
            >
              {mic ? <Mic /> : <MicOff />}
            </Button>

            <Button
              size="icon"
              variant={cam ? "secondary" : "destructive"}
              onClick={toggleCam}
            >
              {cam ? <Video /> : <VideoOff />}
            </Button>

            <Button onClick={toggleScreenShare}>Share</Button>
            <Button onClick={() => setShowChat(!showChat)}>Chat</Button>

            <Button
              size="icon"
              variant="destructive"
              onClick={() => window.location.reload()}
            >
              <LogOut />
            </Button>
          </div>

          {showChat && (
            <div className="absolute right-0 top-0 h-full w-80 bg-zinc-900 p-4 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-2">
                {messages.map((m, i) => (
                  <div key={i}>
                    <b>{m.sender}:</b> {m.data}
                  </div>
                ))}
              </div>

              <input
                className="bg-zinc-800 p-2 mt-2"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type message..."
              />

              <Button onClick={sendMessage} className="mt-2">
                Send
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
