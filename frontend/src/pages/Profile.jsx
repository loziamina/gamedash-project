import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import PageWrapper from "../components/PageWrapper";
import UserMenu from "../components/UserMenu";
import { getMe } from "../services/api";

export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch((error) => {
        console.error(error);
        toast.error("Impossible de charger le profil.");
      });
  }, []);

  return (
    <PageWrapper>
      <div className="min-h-screen p-6 text-white">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-cyan-400 drop-shadow-[0_0_20px_rgba(0,212,255,0.7)]">
              Mon Profil
            </h1>
            <p className="mt-2 text-slate-400">
              Consultez votre identite joueur et votre progression competitive.
            </p>
          </div>
          <UserMenu user={user} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          <div className="dashboard-card rounded-3xl p-8 text-center">
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 via-sky-500 to-pink-500 text-3xl font-black text-slate-950 shadow-2xl shadow-cyan-500/20">
              {(user?.pseudo || user?.email || "GD").slice(0, 2).toUpperCase()}
            </div>
            <h2 className="mt-6 text-2xl font-bold text-white">
              {user?.pseudo || "Joueur"}
            </h2>
            <p className="mt-2 text-slate-400">{user?.email || "Chargement..."}</p>
          </div>

          <div className="dashboard-card rounded-3xl p-8">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-cyan-500/20 bg-white/5 p-5">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Pseudo</p>
                <p className="mt-3 text-2xl font-semibold text-white">{user?.pseudo || "-"}</p>
              </div>
              <div className="rounded-2xl border border-pink-500/20 bg-white/5 p-5">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Email</p>
                <p className="mt-3 break-all text-xl font-semibold text-white">{user?.email || "-"}</p>
              </div>
              <div className="rounded-2xl border border-yellow-500/20 bg-white/5 p-5">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Role</p>
                <p className="mt-3 text-2xl font-semibold text-yellow-300">{user?.role || "-"}</p>
              </div>
              <div className="rounded-2xl border border-cyan-500/20 bg-white/5 p-5">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Rang</p>
                <p className="mt-3 text-2xl font-semibold text-cyan-300">{user?.rank || "-"}</p>
              </div>
              <div className="rounded-2xl border border-pink-500/20 bg-white/5 p-5 md:col-span-2">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">ELO</p>
                <p className="mt-3 text-4xl font-black text-pink-400">{user?.elo ?? "-"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
