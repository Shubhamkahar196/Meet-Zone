import { AuthContext } from "@/context/AuthContext";
import { useContext, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const History = () => {
  const { getHistoryUser, token } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getHistoryUser();
        setMeetings(history || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">

      {/* NAVBAR */}
      <nav className="flex justify-between items-center px-10 py-6 border-b border-zinc-800">

        <Link to="/dashboard">
          <h1 className="text-2xl font-bold">
            <span className="text-blue-400">Meet</span>-
            <span className="text-red-400">Zone</span>
          </h1>
        </Link>

        {token && (
          <Button
            variant="destructive"
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/");
            }}
          >
            Logout
          </Button>
        )}
      </nav>

      {/* CONTENT */}
      <div className="p-10">

        <h1 className="text-3xl font-bold mb-8">Meeting History</h1>

        {meetings.length === 0 && (
          <div className="text-center text-zinc-400 mt-20">
            <p>No meetings yet.</p>
          </div>
        )}

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">

          {meetings.map((meeting, index) => (
            <Card
              key={index}
              className="bg-zinc-900 border-zinc-800 hover:border-blue-500 transition"
            >
              <CardHeader>
                <CardTitle className="text-sm text-zinc-400">
                  Meeting Code
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">

                <p className="font-mono text-xl text-blue-400">
                  {meeting.meeting_code}
                </p>

                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => navigate(`/${meeting.meeting_code}`)}
                >
                  Join Again
                </Button>

              </CardContent>
            </Card>
          ))}

        </div>

      </div>
    </div>
  );
};

export default History;
