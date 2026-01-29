import { useEffect, useRef, useState } from "react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import io from "socket.io-client";

const server_url = "http://localhost:8000/";
var connections = {};

const peerConfigConnections = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

const VideoMeet = () => {
  const [videoAvailable, setVideoAvailable] = useState(true);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [video, setVideo] = useState(true);
  const [audio, setAudio] = useState(true);
  const [screen, setScreen] = useState(false);
  const [screenAvailable, setScreenAvailable] = useState(false);
  const [askForUsername, setAskForUsername] = useState(true);
  const [username, setUsername] = useState("");
  const [videos, setVideos] = useState([]);

  let socketRef = useRef();
  let socketIdRef = useRef();
  let localVideoRef = useRef();
  const videoRef = useRef([]);

  // ==== Permissions ===

  const getPermission = async () => {
    try {
        
    if(navigator.mediaDevices.getDisplayMedia){
        setScreenAvailable(true);
    }

    const stream = await navigator.mediaDevices.getUserMedia({
        video: video,
        audio: audio
    })

   window.localStream = stream;

   if(localVideoRef.current){
    localVideoRef.current.srcObject = stream;
   }

    } catch (error) {
      console.log("Permission error", error);
      setVideoAvailable(false);
      setAudioAvailable(false);
    }
  };

  useEffect(() => {
    getPermission();
  }, []);

  // ======== Media =========

  const getUserMedia = async () => {
    try {

        if((video && videoAvailable) || (audio && audioAvailable)){
            const stream = await navigator.mediaDevices.getUserMedia({
                video,
                audio
            })
        
          
        window.localStream = stream;

        if(localVideoRef.current){
            localVideoRef.current.srcObject = stream;
        }
    }else {
        if (window.localStream) {
          window.localStream.getTracks().forEach((track) => track.stop());
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (video !== undefined || audio !== undefined) {
      getUserMedia();
    }
  }, [video, audio]);

  // =========== Socket ============

  const connectToSokectServer = () => {
    socketRef.current = io(server_url);

    socketRef.current.on("connect", () => {
      socketIdRef.current = socketRef.current.id;
      console.log("Connected:", socketIdRef.current);
    });
  };

  // ========== Join =========

  const getMedia = () => {
    if (!username.trim()) return alert("Enter username");

    setAskForUsername(false);
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSokectServer();
  };

  return (
    <>
      <div>
        {askForUsername ? (
          <div>
            <h2>Welcome to lobby</h2>

            <Textarea
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Please enter a username"
            />

            <Button onClick={getMedia}>Connect</Button>

            <div>
              <video ref={localVideoRef} autoPlay muted playsInline />
            </div>
          </div>
        ) : (
          <>
            <h2>Meeting Started</h2>

            <Button onClick={() => setVideo(!video)}>
              {video ? "Camera Off" : "Camera On"}
            </Button>

            <Button onClick={() => setAudio(!audio)}>
              {audio ? "Mute" : "Unmute"}
            </Button>

            <div>
              <video ref={localVideoRef} autoPlay muted playsInline />
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default VideoMeet;
