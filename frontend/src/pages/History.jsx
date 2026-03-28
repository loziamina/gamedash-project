import { useEffect, useState } from "react";
import PageWrapper from "../components/PageWrapper";
import UserMenu from "../components/UserMenu";
import { getMe } from "../services/api";
import { getHistory } from "../services/match";

export default function History() {
  const [matches, setMatches] = useState([]);
  const [userId, setUserId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const [history, me] = await Promise.all([getHistory(), getMe()]);
        setMatches(history);
        setUserId(me.id);
        setCurrentUser(me);
      } catch (error) {
        console.error("Unable to load history", error);
      }
    };

    loadHistory();
  }, []);

  const getResult = (match) => {
    if (!match.winner) {
      return "pending";
    }

    return match.winner === userId ? "win" : "lose";
  };

  return (
    <PageWrapper>
      <div className="min-h-screen p-6 text-white">
        <div className="mb-10 flex items-start justify-between gap-4">
          <h1 className="bg-gradient-to-r from-cyan-400 via-pink-500 to-yellow-400 bg-clip-text text-5xl font-black text-transparent">
            MATCH HISTORY
          </h1>
          <UserMenu user={currentUser} />
        </div>

        <div className="mx-auto max-w-3xl space-y-6">
          {matches.map((match) => {
            const result = getResult(match);

            return (
              <div
                key={match.match_id}
                className={`
                rounded-2xl border p-6 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02]
                ${result === "win" ? "border-green-400 bg-green-500/10 shadow-lg shadow-green-500/30" : ""}
                ${result === "lose" ? "border-red-400 bg-red-500/10 shadow-lg shadow-red-500/30" : ""}
                ${result === "pending" ? "border-yellow-400 bg-yellow-500/10" : ""}
              `}
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-lg font-bold">
                    {match.player1} vs {match.player2}
                  </p>

                  <span className="text-sm text-gray-400">
                    {new Date(match.date).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm">Match ID: {match.match_id}</div>

                  <div>
                    {result === "win" && (
                      <span className="text-xl font-bold text-green-400 animate-pulse">
                        VICTOIRE
                      </span>
                    )}

                    {result === "lose" && (
                      <span className="text-xl font-bold text-red-400 animate-pulse">
                        DEFAITE
                      </span>
                    )}

                    {result === "pending" && (
                      <span className="text-yellow-400">EN COURS</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {matches.length === 0 && (
            <p className="mt-20 text-center text-gray-400">
              Aucun match joue pour le moment...
            </p>
          )}
        </div>

        <div className="mt-10 text-center">
          <button
            onClick={() => window.location.href = "/dashboard"}
            className="rounded-xl bg-cyan-500 px-6 py-3 transition-all duration-200 hover:scale-110 hover:shadow-2xl hover:shadow-cyan-500/20 active:scale-95"
          >
            Retour Dashboard
          </button>
        </div>
      </div>
    </PageWrapper>
  );
}
