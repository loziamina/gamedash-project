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
      console.log("WS connecte");
    };

    ws.onmessage = (event) => {
      console.log("WS DATA:", event.data);

      const data = JSON.parse(event.data);

      if (data.type === "match_found") {
        localStorage.setItem("match", JSON.stringify(data));
        window.location.href = "/game";
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
    <div className="min-h-screen bg-black p-6 text-white">
      <h1 className="mb-8 text-4xl text-cyan-400">Matchmaking</h1>

      <div className="mb-6 flex gap-4">
        <button
          onClick={handleJoin}
          className="rounded-xl bg-cyan-500 px-6 py-3"
        >
          Join Queue
        </button>

        <button
          onClick={handleLeave}
          className="rounded-xl bg-red-500 px-6 py-3"
        >
          Leave Queue
        </button>
      </div>

      <p>Status: {status}</p>

      {match && (
        <div className="mt-6 rounded-xl border border-cyan-500/30 bg-white/5 p-6">
          <h2 className="mb-2 text-2xl">Match trouve</h2>
          <p>Opponent: {match.opponent}</p>
        </div>
      )}
    </div>
  );
}
