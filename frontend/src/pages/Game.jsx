import { useEffect, useState } from "react";
import { finishMatch } from "../services/game";

export default function Game() {
  const [opponent, setOpponent] = useState(null);
  const [status, setStatus] = useState("Chargement...");
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    const matchData = localStorage.getItem("match");

    if (matchData) {
      const data = JSON.parse(matchData);
      setOpponent(data.opponent);
      setStatus("Combat en cours");
    } else {
      setStatus("Aucun match");
    }
  }, []);

  const handleWin = async () => {
    setWinner("YOU");

    await finishMatch(1, 1);

    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 2000);
  };

  const handleLose = async () => {
    setWinner("OPPONENT");

    await finishMatch(1, opponent);

    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 2000);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
      <h1 className="mb-10 text-4xl text-cyan-400">GAME SESSION</h1>

      {opponent && (
        <>
          <div className="mb-10 flex items-center gap-16">
            <div className="text-center">
              <div className="h-32 w-32 rounded-full bg-cyan-500 animate-pulse" />
              <p className="mt-4 text-xl">YOU</p>
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
                className="rounded-xl bg-green-500 px-6 py-3 transition hover:scale-110"
              >
                Gagner
              </button>

              <button
                onClick={handleLose}
                className="rounded-xl bg-red-500 px-6 py-3 transition hover:scale-110"
              >
                Perdre
              </button>
            </div>
          )}

          {winner && (
            <div className="mt-10 text-center">
              <h2 className="text-3xl animate-pulse">
                {winner === "YOU" ? "VICTOIRE !" : "DEFAITE"}
              </h2>
            </div>
          )}
        </>
      )}

      {!opponent && <p>{status}</p>}
    </div>
  );
}
