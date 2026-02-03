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
  const { addToHistory } = useContext(AuthContext);

  const handleJoinVideoCall = async () => {
    if (!isGuest) await addToHistory(meetingCode);
    navigate(`/${meetingCode}`);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      {/* NAVBAR */}
      <div className="flex justify-between items-center px-10 py-6 border-b border-zinc-800">

        <h2 className="text-xl font-bold">Meet-Zone</h2>

        <Button
          variant="destructive"
          onClick={() => {
            localStorage.removeItem("token");
            navigate("/");
          }}
        >
          Logout
        </Button>

      </div>

      {/* BODY */}
      <div className="flex flex-col md:flex-row items-center justify-center px-10 mt-20">

        <div className="md:w-1/2 space-y-6">

          <h1 className="text-4xl font-bold">
            Start or Join Meeting
          </h1>

          <div className="flex gap-3">
            <input
              value={meetingCode}
              onChange={(e) => setMeetingCode(e.target.value)}
              placeholder="Meeting Code"
              className="bg-zinc-800 px-4 py-2 rounded w-64 outline-none"
            />

            <Button onClick={handleJoinVideoCall}>
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
