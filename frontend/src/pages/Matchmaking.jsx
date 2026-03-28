import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import PageWrapper from "../components/PageWrapper";
import UserMenu from "../components/UserMenu";
import { getMe } from "../services/api";
import { joinQueue, leaveQueue } from "../services/matchmaking";

export default function Matchmaking() {
  const [status, setStatus] = useState("Idle");
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    getMe().then(setCurrentUser).catch((error) => console.error(error));

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
        setMatch(data);
        localStorage.setItem("match", JSON.stringify(data));
        toast.success("Match trouve !");
        window.location.href = "/game";
      }
    };

    return () => ws.close();
  }, []);

  const handleJoin = async () => {
    try {
      setLoading(true);
      const res = await joinQueue();
      setStatus(res.message);
      toast.success(res.message || "Recherche lancee");
    } catch (error) {
      console.error(error);
      toast.error("Impossible de rejoindre la file");
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    try {
      const res = await leaveQueue();
      setStatus(res.message);
      toast.success(res.message || "File quittee");
    } catch (error) {
      console.error(error);
      toast.error("Impossible de quitter la file");
    }
  };

  return (
    <PageWrapper>
      <div className="min-h-screen p-6 text-white">
        <div className="mb-8 flex items-start justify-between gap-4">
          <h1 className="text-4xl text-cyan-400 drop-shadow-[0_0_20px_rgba(0,212,255,0.7)]">
            Matchmaking
          </h1>
          <UserMenu user={currentUser} />
        </div>

        <div className="mb-6 flex gap-4">
          <button
            onClick={handleJoin}
            disabled={loading}
            className="rounded-xl bg-cyan-500 px-6 py-3 transition-all duration-200 hover:scale-110 hover:shadow-2xl hover:shadow-cyan-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Recherche..." : "Join Queue"}
          </button>

          <button
            onClick={handleLeave}
            className="rounded-xl bg-red-500 px-6 py-3 transition-all duration-200 hover:scale-110 hover:shadow-2xl hover:shadow-red-500/20 active:scale-95"
          >
            Leave Queue
          </button>
        </div>

        <div className="dashboard-card max-w-xl rounded-2xl p-6">
          <p className="text-lg text-slate-200">Status: {status}</p>

          {match && (
            <div className="mt-6 rounded-xl border border-cyan-500/30 bg-white/5 p-6">
              <h2 className="mb-2 text-2xl text-cyan-300">Match trouve</h2>
              <p>Opponent: {match.opponent}</p>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
