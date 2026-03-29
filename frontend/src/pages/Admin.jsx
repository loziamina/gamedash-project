import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import BackToDashboardButton from "../components/BackToDashboardButton";
import PageWrapper from "../components/PageWrapper";
import UserMenu from "../components/UserMenu";
import { getMe } from "../services/api";
import {
  banUser,
  getAdminStats,
  getMatchmakingOverview,
  getMatchmakingSettings,
  getRankSettings,
  getUsers,
  unbanUser,
  updateMatchmakingSettings,
  updateRankSettings,
} from "../services/admin";

export default function Admin() {
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [settings, setSettings] = useState({
    max_elo_gap: 150,
    max_wait_seconds: 45,
    team_size: 1,
    ranked_enabled: true,
    unranked_enabled: true,
    fun_enabled: true,
  });
  const [overview, setOverview] = useState(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [rankSettings, setRankSettings] = useState({
    silver_min: 1000,
    gold_min: 1200,
    platinum_min: 1400,
    diamond_min: 1600,
  });
  const [isSavingRanks, setIsSavingRanks] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const me = await getMe();
      setCurrentUser(me);

      if (me.role !== "admin") {
        toast.error("Acces reserve aux admins.");
        window.location.href = "/dashboard";
        return;
      }

      const [adminStats, adminUsers, adminSettings, matchmakingOverview, rankSettingsData] = await Promise.all([
        getAdminStats(),
        getUsers(),
        getMatchmakingSettings(),
        getMatchmakingOverview(),
        getRankSettings(),
      ]);

      setStats(adminStats);
      setUsers(adminUsers);
      setSettings(adminSettings);
      setOverview(matchmakingOverview);
      setRankSettings(rankSettingsData);
    } catch (error) {
      console.error(error);
      toast.error("Impossible de charger l'admin panel.");
    }
  };

  const handleBan = async (userId) => {
    try {
      await banUser(userId);
      toast.success("Utilisateur banni.");
      await load();
    } catch (error) {
      console.error(error);
      toast.error("Impossible de bannir cet utilisateur.");
    }
  };

  const handleUnban = async (userId) => {
    try {
      await unbanUser(userId);
      toast.success("Utilisateur reactive.");
      await load();
    } catch (error) {
      console.error(error);
      toast.error("Impossible de reactiver cet utilisateur.");
    }
  };

  const handleSettingsChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async (event) => {
    event.preventDefault();

    try {
      setIsSavingSettings(true);
      const updated = await updateMatchmakingSettings({
        ...settings,
        max_elo_gap: Number(settings.max_elo_gap),
        max_wait_seconds: Number(settings.max_wait_seconds),
        team_size: Number(settings.team_size),
      });
      setSettings(updated);
      toast.success("Parametres matchmaking mis a jour.");
      await load();
    } catch (error) {
      console.error(error);
      toast.error("Impossible de sauvegarder la configuration.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleRankSettingsChange = (key, value) => {
    setRankSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveRankSettings = async (event) => {
    event.preventDefault();

    try {
      setIsSavingRanks(true);
      const updated = await updateRankSettings({
        silver_min: Number(rankSettings.silver_min),
        gold_min: Number(rankSettings.gold_min),
        platinum_min: Number(rankSettings.platinum_min),
        diamond_min: Number(rankSettings.diamond_min),
      });
      setRankSettings(updated);
      toast.success("Mapping des rangs mis a jour.");
    } catch (error) {
      console.error(error);
      toast.error("Impossible de sauvegarder les seuils de rang.");
    } finally {
      setIsSavingRanks(false);
    }
  };

  if (currentUser && currentUser.role !== "admin") {
    return null;
  }

  return (
    <PageWrapper>
      <div className="min-h-screen p-6 text-white">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl text-red-400 drop-shadow-[0_0_20px_rgba(248,113,113,0.6)]">
              ADMIN PANEL
            </h1>
            <p className="mt-2 max-w-3xl text-slate-400">
              Pilote les files de jeu, surveille l'etat des joueurs et ajuste
              les regles du matchmaking en temps reel.
            </p>
            <BackToDashboardButton className="mt-4" />
          </div>
          <UserMenu user={currentUser} />
        </div>

        <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3 xl:grid-cols-6">
          <div className="dashboard-card rounded-2xl p-4">Users: {stats.total_users ?? 0}</div>
          <div className="dashboard-card rounded-2xl p-4">Matches: {stats.total_matches ?? 0}</div>
          <div className="dashboard-card rounded-2xl p-4">Active: {stats.active_users ?? 0}</div>
          <div className="dashboard-card rounded-2xl p-4">
            Online: {stats.players_online ?? 0}
          </div>
          <div className="dashboard-card rounded-2xl p-4">
            Queue: {stats.players_in_queue ?? 0}
          </div>
          <div className="dashboard-card rounded-2xl p-4">
            In-game: {stats.players_in_game ?? 0}
          </div>
        </div>

        <div className="mb-10 grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <form onSubmit={handleSaveSettings} className="dashboard-card rounded-3xl p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-red-300/70">Live Ops</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Configuration matchmaking</h2>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Ecart ELO max</p>
                <input
                  type="number"
                  min="0"
                  value={settings.max_elo_gap}
                  onChange={(e) => handleSettingsChange("max_elo_gap", e.target.value)}
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none"
                />
              </label>

              <label className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Attente max</p>
                <input
                  type="number"
                  min="5"
                  value={settings.max_wait_seconds}
                  onChange={(e) => handleSettingsChange("max_wait_seconds", e.target.value)}
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none"
                />
              </label>

              <label className="rounded-2xl border border-white/10 bg-white/5 p-4 md:col-span-2">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Taille equipe</p>
                <input
                  type="number"
                  min="1"
                  value={settings.team_size}
                  onChange={(e) => handleSettingsChange("team_size", e.target.value)}
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none"
                />
              </label>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
              {[
                ["ranked_enabled", "Classe"],
                ["unranked_enabled", "Non classe"],
                ["fun_enabled", "Fun"],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={settings[key]}
                    onChange={(e) => handleSettingsChange(key, e.target.checked)}
                  />
                </label>
              ))}
            </div>

            <button
              type="submit"
              disabled={isSavingSettings}
              className="mt-6 rounded-2xl bg-red-500 px-6 py-3 font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-red-500/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingSettings ? "Sauvegarde..." : "Sauvegarder la configuration"}
            </button>
          </form>

          <div className="dashboard-card rounded-3xl p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Queue monitoring</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Vue des files de jeu</h2>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              {["ranked", "unranked", "fun"].map((mode) => (
                <div key={mode} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-bold text-white">{mode}</h3>
                    <span className="text-sm text-slate-400">
                      {overview?.queue?.[mode]?.length ?? 0}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {(overview?.queue?.[mode] || []).slice(0, 4).map((entry) => (
                      <div
                        key={`${mode}-${entry.user_id}`}
                        className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2"
                      >
                        <p className="font-semibold text-cyan-200">{entry.pseudo}</p>
                        <p className="text-xs text-slate-500">ELO {entry.elo}</p>
                      </div>
                    ))}
                    {(overview?.queue?.[mode] || []).length === 0 && (
                      <p className="text-sm text-slate-500">File vide.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveRankSettings} className="mb-10 dashboard-card rounded-3xl p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-yellow-300/70">Competitive system</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Mapping MMR vers rang</h2>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
            {[
              ["silver_min", "Silver min"],
              ["gold_min", "Gold min"],
              ["platinum_min", "Platinum min"],
              ["diamond_min", "Diamond min"],
            ].map(([key, label]) => (
              <label key={key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{label}</p>
                <input
                  type="number"
                  value={rankSettings[key]}
                  onChange={(e) => handleRankSettingsChange(key, e.target.value)}
                  className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none"
                />
              </label>
            ))}
          </div>

          <button
            type="submit"
            disabled={isSavingRanks}
            className="mt-6 rounded-2xl bg-yellow-500 px-6 py-3 font-semibold text-slate-950 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-yellow-500/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingRanks ? "Sauvegarde..." : "Sauvegarder les rangs"}
          </button>
        </form>

        <div className="space-y-4">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white/5 p-4"
            >
              <div>
                {user.email} | ELO: {user.elo} | {user.role} | Etat: {user.player_status}
              </div>

              <div>
                {user.active ? (
                  <button
                    onClick={() => handleBan(user.id)}
                    className="rounded bg-red-500 px-4 py-2 transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    Ban
                  </button>
                ) : (
                  <button
                    onClick={() => handleUnban(user.id)}
                    className="rounded bg-green-500 px-4 py-2 transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    Unban
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}
