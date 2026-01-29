import { useEffect, useRef ,useState} from "react";

const server_url = "http://localhost:8000/";
var connections = {};
const peerConfigConnections = {
    "iceServers": {
        "urls": "stun:stun.1.google.com:19302"
    }
}
const VideoMeet = ()=>{
    const [videoAvailable,setVideoAvailable] = useState(true);
    const [audioAvailable,setAudioAvailable] = useState(true);
    const [video,setVideo] = useState();
    const [audio,setAudio] = useState();
    const [screen,setScreen] = useState();
    const [showModal,setShowModal] = useState();
    const [screenAvailable,setScreenAvailable] = useState();
    const [messages,setMessages] = useState([]);
    const [message,setMessage] = useState("");
    const [newMessages,setNewMessages] = useState(0);
    const [askForUsername,setAskForUsername] = useState(true);
    const [username,setUsername] = useState("");
    const [videos,setVideos] = useState([]);


     let socketRef = useRef();
     let socketIdRef = useRef();
     let localVideoRef = useRef();
     const videoRef = useRef([]);

      
     const getPermission = async()=>{
        try {
            // video permission
             const videoPermission = await navigator.mediaDevices.getUserMedia({video: true});
             if(videoPermission){
                setVideoAvailable(true);
             }else{
                setVideoAvailable(false);
             }
              
            //  audiopermission
             const audioPermission = navigator.mediaDevices.getUserMedia({audio: true});
             if(audioPermission){
                setAskForUsername(true);
             }else{
                setAskForUsername(false);
             }

            //  video sharing
            if(navigator.mediaDevices.getDisplayMedia){
                setScreenAvailable(true);
            }else{
                setScreenAvailable(false);
            }
        } catch (error) {
            console.log("Error",error);
        }
       
     }
     useEffect(()=>{
      getPermission();
     },[])
     
     
    return (
        <>
        <div>
           
           {askForUsername === true ? 
            
            <div>
            
            <h2>Welcome to lobby</h2>
           
             <Textarea
                    
                    id="form-rhf-textarea-about"
                    onClick={e=>(setAskForUsername(e))}
                    placeholder="Please enter a username"
                    className="min-h-30"
                  />

            </div> : <></>
           
        }


        </div>
        </>
    )
}

export default VideoMeet