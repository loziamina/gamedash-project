import { useEffect, useState } from "react";
import { joinQueue, leaveQueue } from "../services/matchmaking";

export default function Matchmaking() {
  const [status, setStatus] = useState("Idle");
  const [match, setMatch] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    const ws = new WebSocket(
      `ws://127.0.0.1:8000/ws/matchmaking?token=${token}`
    );

    ws.onopen = () => {
      console.log("WS connecté");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "match_found") {
        setMatch(data);
        setStatus("🎮 MATCH TROUVÉ !");
      }
    };

    return () => ws.close();
  }, []);

  const handleJoin = async () => {
    const res = await joinQueue();
    setStatus(res.message);
  };

  const handleLeave = async () => {
    const res = await leaveQueue();
    setStatus(res.message);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">

      <h1 className="text-4xl text-cyan-400 mb-8">
        🎯 Matchmaking
      </h1>

      <div className="flex gap-4 mb-6">

        <button
          onClick={handleJoin}
          className="px-6 py-3 bg-cyan-500 rounded-xl"
        >
          Join Queue
        </button>

        <button
          onClick={handleLeave}
          className="px-6 py-3 bg-red-500 rounded-xl"
        >
          Leave Queue
        </button>

      </div>

      <p>Status: {status}</p>

      {match && (
        <div className="mt-6 p-6 bg-white/5 border border-cyan-500/30 rounded-xl">
          <h2 className="text-2xl mb-2">🎮 Match trouvé</h2>
          <p>Opponent: {match.opponent}</p>
        </div>
      )}

    </div>
  );
}