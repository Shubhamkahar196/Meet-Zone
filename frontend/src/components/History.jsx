import { AuthContext } from "@/context/AuthContext";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const History = () => {
  const { getHistoryUser } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getHistoryUser();
        setMeetings(history);
      } catch (err) {
        console.error(err);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-10">

      <h1 className="text-3xl font-bold mb-6">Meeting History</h1>

      {meetings.length === 0 && (
        <p className="text-zinc-400">No meetings yet.</p>
      )}

      <div className="grid md:grid-cols-3 gap-4">

        {meetings.map((meeting, index) => (
          <Card key={index} className="bg-zinc-900 border-zinc-800">

            <CardHeader>
              <CardTitle className="text-sm">
                Meeting Code
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="font-mono text-lg">
                {meeting.meeting_code}
              </p>

              <Button
                className="w-full"
                onClick={() => navigate(`/${meeting.meeting_code}`)}
              >
                Join Again
              </Button>
            </CardContent>

          </Card>
        ))}

      </div>
    </div>
  );
};

export default History;
