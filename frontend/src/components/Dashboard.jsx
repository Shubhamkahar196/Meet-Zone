import withAuth from "@/lib/withAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useContext, useState } from "react";
import { Button } from "./ui/button";
import { AuthContext } from "@/context/AuthContext";



const Dashboard = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isGuest = params.get("guest");

  const [meetingCode, setMeetingCode] = useState("");

  const { addHistory, token } = useContext(AuthContext);

  
 

  const handleJoinVideoCall = async () => {
    if (!isGuest && meetingCode.trim()) {
      await addHistory(meetingCode);
    }

    navigate(`/${meetingCode}`);
    
  };

  return (
    <div className="min-h-screen  text-white">

      {/* NAVBAR */}
      <nav className="flex justify-between items-center px-8 py-6 border-b border-zinc-800">

        <h1 className="text-2xl font-bold">
          <span className="text-blue-400">Meet</span>-<span className="text-red-400">Zone</span>
        </h1>

        <div className="flex gap-3">

          {/* HISTORY ONLY FOR LOGGED USERS */}
          {!isGuest && token && (
            <Button
              variant="secondary"
              onClick={() => navigate("/history")}
            >
              History
            </Button>
          )}

          {/* LOGIN / LOGOUT */}
          {token ? (
            <Button
              variant="destructive"
              onClick={() => {
                localStorage.removeItem("token");
                navigate("/");
              }}
            >
              Logout
            </Button>
          ) : (
            <Button onClick={() => navigate("/signup")}>
              Login
            </Button>
          )}
        </div>
      </nav>

      {/* BODY */}
      <div className="flex flex-col md:flex-row items-center justify-center px-10 mt-24">

        <div className="md:w-1/2 space-y-6">

          <h1 className="text-4xl font-bold">
            Start or Join Meeting
          </h1>

          <div className="flex gap-3">
            <input
              value={meetingCode}
              onChange={(e) => setMeetingCode(e.target.value)}
              placeholder="Meeting Code"
              className="bg-zinc-800 px-4 py-2 rounded w-64 outline-none text-white "
            />

            <Button onClick={handleJoinVideoCall} className="cursor-pointer">
              Join
            </Button>
          </div>

          {isGuest && (
            <p className="text-sm text-zinc-400">
              You are joining as guest
            </p>
          )}
        </div>

        <div className="md:w-1/2 mt-10 flex justify-center">
          <img src="/logo3.png" className="w-80" />
        </div>

      </div>
    </div>
  );
};

export default withAuth(Dashboard);

