import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import PageWrapper from "../components/PageWrapper";
import { getMe } from "../services/api";
import { finishMatch } from "../services/game";

export default function Game() {
  const [currentUser, setCurrentUser] = useState(null);
  const [matchId, setMatchId] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [status, setStatus] = useState("Chargement...");
  const [winner, setWinner] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadGameData = async () => {
      try {
        const me = await getMe();
        setCurrentUser(me);

        const matchData = localStorage.getItem("match");

        if (matchData) {
          const data = JSON.parse(matchData);
          setMatchId(data.match_id ?? null);
          setOpponent(data.opponent ?? null);
          setStatus("Combat en cours");
        } else {
          setStatus("Aucun match");
        }
      } catch (error) {
        console.error(error);
        setStatus("Impossible de charger le match");
      }
    };

    loadGameData();
  }, []);

  const handleFinish = async (winnerId, winnerLabel) => {
    if (!matchId || !winnerId) {
      toast.error("Match introuvable.");
      return;
    }

    try {
      setIsSubmitting(true);
      setWinner(winnerLabel);
      await finishMatch(matchId, winnerId);
      localStorage.removeItem("match");

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);
    } catch (error) {
      console.error(error);
      toast.error("Impossible de terminer le match.");
      setWinner(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWin = async () => {
    await handleFinish(currentUser?.id, "YOU");
  };

  const handleLose = async () => {
    await handleFinish(opponent, "OPPONENT");
  };

  return (
    <PageWrapper>
      <div className="flex min-h-screen flex-col items-center justify-center text-white">
        <h1 className="mb-10 text-4xl text-cyan-400 drop-shadow-[0_0_20px_rgba(0,212,255,0.7)]">
          GAME SESSION
        </h1>

        {opponent && currentUser && (
          <>
            <div className="mb-4 text-sm text-slate-400">Match ID: {matchId}</div>

            <div className="mb-10 flex items-center gap-16">
              <div className="text-center">
                <div className="h-32 w-32 rounded-full bg-cyan-500 animate-pulse" />
                <p className="mt-4 text-xl">YOU</p>
                <p className="text-sm text-slate-400">Player {currentUser.id}</p>
              </div>

              <div className="text-5xl animate-bounce">VS</div>

              <div className="text-center">
                <div className="h-32 w-32 rounded-full bg-pink-500 animate-pulse" />
                <p className="mt-4 text-xl">Player {opponent}</p>
              </div>
            </div>

            {!winner && (
              <div className="flex gap-6">
                <button
                  onClick={handleWin}
                  disabled={isSubmitting}
                  className="rounded-xl bg-green-500 px-6 py-3 transition-all duration-200 hover:scale-110 hover:shadow-2xl hover:shadow-green-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Gagner
                </button>

                <button
                  onClick={handleLose}
                  disabled={isSubmitting}
                  className="rounded-xl bg-red-500 px-6 py-3 transition-all duration-200 hover:scale-110 hover:shadow-2xl hover:shadow-red-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Perdre
                </button>
              </div>
            )}

            {winner && (
              <div className="mt-10 text-center">
                <h2
                  className={`text-4xl ${
                    winner === "YOU"
                      ? "animate-bounce text-green-400"
                      : "animate-pulse text-red-400"
                  }`}
                >
                  {winner === "YOU" ? "VICTOIRE !" : "DEFAITE"}
                </h2>
              </div>
            )}
          </>
        )}

        {(!opponent || !currentUser) && <p>{status}</p>}
      </div>
    </PageWrapper>
  );
}
