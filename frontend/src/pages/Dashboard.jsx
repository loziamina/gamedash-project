import { useEffect, useState } from "react";
import PageWrapper from "../components/PageWrapper";

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
      setStatus("Connecte au serveur");
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
      setStatus("Deconnecte");
    };

    return () => ws.close();
  }, []);

  return (
    <PageWrapper>
      <div className="min-h-screen p-6 text-white">
        <h1 className="mb-8 text-4xl font-bold text-cyan-400 drop-shadow-[0_0_20px_rgba(0,212,255,0.7)]">
          GameDash Dashboard
        </h1>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="dashboard-card rounded-2xl p-6 transition-all duration-200 hover:shadow-2xl hover:shadow-cyan-500/20">
            <h2 className="mb-2 text-xl">Status</h2>
            <p>{status}</p>
          </div>

          <div className="dashboard-card rounded-2xl p-6 transition-all duration-200 hover:shadow-2xl hover:shadow-cyan-500/20">
            <h2 className="mb-2 text-xl">Players Online</h2>
            <p className="text-3xl text-green-400">{players}</p>
          </div>

          <div className="dashboard-card rounded-2xl p-6 transition-all duration-200 hover:shadow-2xl hover:shadow-pink-500/20">
            <h2 className="mb-2 text-xl">ELO</h2>
            <p className="text-3xl text-pink-400">{elo}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <button
            onClick={() => window.location.href = "/matchmaking"}
            className="rounded-xl bg-purple-500 px-6 py-3 transition-all duration-200 hover:scale-110 hover:shadow-2xl hover:shadow-purple-500/20 active:scale-95"
          >
            Go Matchmaking
          </button>

          <button
            onClick={() => window.location.href = "/history"}
            className="rounded-xl bg-cyan-500 px-6 py-3 transition-all duration-200 hover:scale-110 hover:shadow-2xl hover:shadow-cyan-500/20 active:scale-95"
          >
            Voir historique
          </button>

          <button
            onClick={() => window.location.href = "/elo"}
            className="rounded-xl bg-pink-500 px-6 py-3 transition-all duration-200 hover:scale-110 hover:shadow-2xl hover:shadow-pink-500/20 active:scale-95"
          >
            Voir evolution ELO
          </button>
        </div>
      </div>
    </PageWrapper>
  );
}
