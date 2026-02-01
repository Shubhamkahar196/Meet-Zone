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

const peerConfigConnections = {
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

  const [videos,setVideos] = useState([]);

  const [messages, setMessages] = useState([]);

  const [message, setMessage] = useState("");

  const [newMessages, setNewMessages] = useState(3);

  const [askForUsername, setAskForUsername] = useState(true);

  const [username, setUsername] = useState("");

  const socketIdRef = useRef();
  const socketRef = useRef();
  const localVideoref = useRef();
  const videoRef = useRef([])

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
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    localVideoref.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      connections[id].addStream(window.localStream);

      connections[id].createOffer().then((description) => {
        console.log(description);
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription }),
            );
          })
          .catch((e) => console.log(e));
      });
    }
  };

  const getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({ video: video, audio: audio })
        .then(getUserMediaSuccess)
        .then((stream) => {})
        .catch((e) => console.log(e));
    } else {
      try {
        let tracks = localVideoref.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      } catch (e) {}
    }
  };

  const getDisplayMediaSuccess = (stream) => {
    console.log("Here");
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      console.log(error);
    }

    window.localStream = stream;
    localVideoref.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;
      //  facing error check it addStram()
      connections[id].addTrack(window.localStream);

      connections[id].createOffer().then((description) => {
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            // sdp = session description Protocol
            socketRef.current.emit(
              "signal",
              id,
              JSON.
              stringify({ sdp: connections[id].localDescription }),
            );
          })
          .catch((e) => console.log(e));
      });
    }

    stream.getTracks().forEach(
      (track) =>
        (track.onended = () => {
          setScreen(false);

          try {
            const tracks = localVideoref.current.srcObject.getTracks();
            tracks.forEach((track) => track.stop());
          } catch (error) {
            console.log(error);
          }

          const blackSilence = (...args) =>
            new MediaStream([black(...args), silence()]);
          window.localStream = blackSilence();
          localVideoref.current.srcObject = window.localStream;

          getUserMedia();
        }),
    );
  };

  const gotMessageFromServer = (fromId, message) => {
    let signal = JSON.parse(message);

    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === "offer") {
              connections[fromId]
                .createAnswer()
                .then((description) => {
                  connections[fromId]
                    .setLocalDescription(description)
                    .then(() => {
                      socketRef.current.emit(
                        "signal",
                        fromId,
                        JSON.stringify({
                          sdp: connections[fromId].localDescription,
                        }),
                      );
                    })
                    .catch((e) => console.log(e));
                })
                .catch((e) => console.log(e));
            }
          })
          .catch((e) => console.log(e));
      }

      if (signal.ice) {
        connections[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((e) => console.log(e));
      }
    }
  };

  // connect to server

  
     const connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false })

        socketRef.current.on('signal', gotMessageFromServer)

        socketRef.current.on('connect', () => {
          toast.success("Connected to meeting");

            socketRef.current.emit('join-call', window.location.href)
            socketIdRef.current = socketRef.current.id

            socketRef.current.on('chat-message', addMessage)

            socketRef.current.on('user-left', (id) => {
              toast.error("Participant left the meeting");
                setVideos((videos) => videos.filter((video) => video.socketId !== id))
            })

            socketRef.current.on('user-joined', (id, clients) => {
              toast.success("New participant joined");

                clients.forEach((socketListId) => {

                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections)
                    // Wait for their ice candidate       
                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                        }
                    }

                    // Wait for their video stream
                    connections[socketListId].onaddstream = (event) => {
                        console.log("BEFORE:", videoRef.current);
                        console.log("FINDING ID: ", socketListId);

                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                        if (videoExists) {
                            console.log("FOUND EXISTING");

                            // Update the stream of the existing video
                            setVideos(videos => {
                                const updatedVideos = videos.map(video =>
                                    video.socketId === socketListId ? { ...video, stream: event.stream } : video
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        } else {
                            // Create a new video
                            console.log("CREATING NEW");
                            let newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
                                autoplay: true,
                                playsinline: true
                            };

                            setVideos(videos => {
                                const updatedVideos = [...videos, newVideo];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        }
                    };


                    // Add the local video stream
                    if (window.localStream !== undefined && window.localStream !== null) {
                        connections[socketListId].addStream(window.localStream)
                    } else {
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                        window.localStream = blackSilence()
                        connections[socketListId].addStream(window.localStream)
                    }
                })

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue

                        try {
                            connections[id2].addStream(window.localStream)
                        } catch (e) { }

                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }))
                                })
                                .catch(e => console.log(e))
                        })
                    }
                }
            })
        })
    }

    let silence = () => {
        let ctx = new AudioContext()
        let oscillator = ctx.createOscillator()
        let dst = oscillator.connect(ctx.createMediaStreamDestination())
        oscillator.start()
        ctx.resume()
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
    }
    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height })
        canvas.getContext('2d').fillRect(0, 0, width, height)
        let stream = canvas.captureStream()
        return Object.assign(stream.getVideoTracks()[0], { enabled: false })
    }

    const handleVideo = () => {
        setVideo(!video);
        toast(video ? "Camera off" : "Camera on");
    }
    const handleAudio = () => {
        setAudio(!audio)
        
    }

    useEffect(() => {
        if (screen !== undefined) {
            getDisplayMedia();
        }
    }, [screen])

    const handleScreen = () => {
        setScreen(!screen);
        toast(!screen ? "Screen sharing started" : "Screen sharing stopped");
    }

    const handleEndCall = () => {
        try {
            let tracks = localVideoref.current.srcObject.getTracks()
            tracks.forEach(track => track.stop())
        } catch (e) { console.log(e)}
        window.location.href = "/"
    }

    const openChat = () => {
        setModal(true);
        setNewMessages(0);
    }
    const closeChat = () => {
        setModal(false);
    }
    const handleMessage = (e) => {
        setMessage(e.target.value);
    }

    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prevNewMessages) => prevNewMessages + 1);
             toast(`${sender}`, {
          description: data,
        });
        }
    };



    const sendMessage = () => {
        console.log(socketRef.current);
        socketRef.current.emit('chat-message', message, username)
        setMessage("");

        // this.setState({ message: "", sender: username })
    }

    
    const connect = () => {
        setAskForUsername(false);
        getMedia();
    }



  // ====================================================
  // UI
  // ====================================================
return (
  <div className="h-screen w-full bg-gradient-to-br from-zinc-950 to-zinc-900 text-white relative overflow-hidden">

    {/* JOIN SCREEN */}
    {askForUsername ? (
      <div className="flex items-center justify-center h-full">
        <Card className="w-[380px] bg-zinc-900/80 backdrop-blur border-zinc-800">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold text-center">Join Meeting</h2>

            <Textarea
              placeholder="Enter your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <video
              ref={localVideoref}
              autoPlay
              muted
              playsInline
              className="rounded-xl bg-black h-48 w-full object-cover"
            />

            <Button onClick={connect} className="w-full">
              Join Call
            </Button>
          </CardContent>
        </Card>
      </div>
    ) : (
      <>
        {/* VIDEO GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 h-[calc(100%-90px)]">

          {/* Local Video */}
          <div className="relative rounded-xl overflow-hidden shadow-lg">
            <video
              ref={localVideoref}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover bg-black"
            />
            <span className="absolute bottom-2 left-2 text-xs bg-black/60 px-2 py-1 rounded">
              You
            </span>
          </div>

          {/* Remote Videos */}
          {videos.map((v) => (
            <div
              key={v.socketId}
              className="relative rounded-xl overflow-hidden shadow-lg"
            >
              <video
                autoPlay
                playsInline
                ref={(ref) => ref && (ref.srcObject = v.stream)}
                className="h-full w-full object-cover bg-black"
              />

              <span className="absolute bottom-2 left-2 text-xs bg-black/60 px-2 py-1 rounded">
                Participant
              </span>
            </div>
          ))}
        </div>

        {/* CONTROL BAR */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-zinc-900/80 backdrop-blur px-6 py-3 rounded-full flex gap-4 shadow-xl">

          <Button
            size="icon"
            onClick={handleAudio}
            className="rounded-full"
            variant={audio ? "secondary" : "destructive"}
          >
            {audio ? <Mic /> : <MicOff />}
          </Button>

          <Button
            size="icon"
            onClick={handleVideo}
            className="rounded-full"
            variant={video ? "secondary" : "destructive"}
          >
            {video ? <Video /> : <VideoOff />}
          </Button>

          <Button onClick={handleScreen} className="rounded-full">
            Share
          </Button>

          <Button
            size="icon"
            variant="destructive"
            className="rounded-full"
            onClick={handleEndCall}
          >
            <LogOut />
          </Button>
        </div>

        {/* CHAT PANEL */}
        {showModal && (
          <div className="absolute right-0 top-0 h-full w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col">

            <div className="p-3 border-b border-zinc-800 font-semibold">
              Chat
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
              {messages.map((m, i) => (
                <div key={i}>
                  <b>{m.sender}:</b> {m.data}
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-zinc-800">
              <input
                value={message}
                onChange={handleMessage}
                placeholder="Type message..."
                className="w-full bg-zinc-800 p-2 rounded text-sm outline-none"
              />

              <Button onClick={sendMessage} className="w-full mt-2">
                Send
              </Button>
            </div>
          </div>
        )}
      </>
    )}
  </div>
);

}
