import { useEffect, useState } from "react";
import PageWrapper from "../components/PageWrapper";
import UserMenu from "../components/UserMenu";
import { getMe } from "../services/api";

export default function Dashboard() {
  const [status, setStatus] = useState("Connexion...");
  const [players, setPlayers] = useState(0);
  const [elo, setElo] = useState(0);
  const [rank, setRank] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    getMe()
      .then((data) => {
        setCurrentUser(data);
        setElo(data.elo ?? 0);
        setRank(data.rank ?? "");
      })
      .catch((error) => console.error("Unable to load current user", error));

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
        setRank(data.rank ?? "");
      }
    };

    ws.onclose = () => {
      setStatus("Deconnecte");
    };

    return () => ws.close();
  }, []);

  const getRankColor = (currentRank) => {
    switch (currentRank) {
      case "Bronze":
        return "text-orange-400";
      case "Silver":
        return "text-gray-300";
      case "Gold":
        return "text-yellow-400";
      case "Platinum":
        return "text-cyan-400";
      case "Diamond":
        return "text-purple-400";
      default:
        return "text-white";
    }
  };

  return (
    <PageWrapper>
      <div className="min-h-screen p-6 text-white">
        <div className="mb-8 flex items-start justify-between gap-4">
          <h1 className="text-4xl font-bold text-cyan-400 drop-shadow-[0_0_20px_rgba(0,212,255,0.7)]">
            GameDash Dashboard
          </h1>
          <UserMenu user={currentUser} />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
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

          <div className="dashboard-card rounded-2xl p-6 text-center transition-all duration-200 hover:shadow-2xl hover:shadow-yellow-500/20">
            <h2 className="mb-2 text-xl">Rank</h2>
            <p className={`text-4xl font-bold animate-pulse ${getRankColor(rank)}`}>
              {rank || "Unranked"}
            </p>
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

          {currentUser?.role === "admin" && (
            <button
              onClick={() => window.location.href = "/admin"}
              className="rounded-xl bg-red-500 px-6 py-3 transition-all duration-200 hover:scale-110 hover:shadow-2xl hover:shadow-red-500/20 active:scale-95"
            >
              Admin Panel
            </button>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
