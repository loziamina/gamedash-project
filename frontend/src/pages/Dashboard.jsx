import { useEffect, useState } from "react";

export default function Dashboard() {
  const [status, setStatus] = useState("Connexion...");
  const [players, setPlayers] = useState(0);
  const [elo, setElo] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");

    const ws = new WebSocket(
      `ws://127.0.0.1:8000/ws/matchmaking?token=${token}`
    );

    ws.onopen = () => {
      setStatus("🟢 Connecté au serveur");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "stats") {
        setPlayers(data.players);
      }

      if (data.type === "elo") {
        setElo(data.elo);
      }
    };

    ws.onclose = () => {
      setStatus("🔴 Déconnecté");
    };

    return () => ws.close();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-6">

      <h1 className="text-4xl font-bold mb-8 text-cyan-400">
        🎮 GameDash Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl">
          <h2 className="text-xl mb-2">Status</h2>
          <p>{status}</p>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <h2 className="text-xl mb-2">Players Online</h2>
          <p className="text-3xl text-green-400">{players}</p>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <h2 className="text-xl mb-2">ELO</h2>
          <p className="text-3xl text-pink-400">{elo}</p>
        </div>
          <button
              onClick={() => window.location.href = "/matchmaking"}
              className="mt-6 px-6 py-3 bg-purple-500 rounded-xl"
            >
              Go Matchmaking
            </button>
      </div>
    </div>
  );
}