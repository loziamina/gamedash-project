import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import toast from "react-hot-toast";
import BackToDashboardButton from "../components/BackToDashboardButton";
import PageWrapper from "../components/PageWrapper";
import UserMenu from "../components/UserMenu";
import { getMe } from "../services/api";
import {
  banUser,
  deleteSeasonPassTier,
  deleteStoreItem,
  deleteStorePack,
  getEconomySettings,
  getEconomyTransactions,
  getAdminMaps,
  getAdminStats,
  getMapsOverview,
  getMatchmakingOverview,
  getMatchmakingSettings,
  getRankSettings,
  getRewardSettings,
  getSanctions,
  getSeasonPassTiers,
  getStoreItems,
  getStorePacks,
  getUsers,
  moderateMap,
  unbanUser,
  updateEconomySettings,
  updateMatchmakingSettings,
  updateRankSettings,
  updateRewardSettings,
  upsertSeasonPassTier,
  upsertStoreItem,
  upsertStorePack,
} from "../services/admin";

const rankColors = ["#fb923c", "#cbd5e1", "#facc15", "#22d3ee", "#a855f7", "#f472b6"];

const defaultItemDraft = {
  sku: "",
  name: "",
  description: "",
  category: "cosmetic",
  item_type: "avatar_frame",
  rarity: "rare",
  price_soft: 0,
  price_hard: 0,
  asset: "",
  season_tier_required: 0,
  is_featured: false,
  is_active: true,
};

const defaultPackDraft = {
  sku: "",
  name: "",
  description: "",
  soft_currency: 0,
  hard_currency: 0,
  bonus_percent: 0,
  price_cents: 499,
  is_active: true,
  is_featured: false,
};

const defaultTierDraft = {
  tier: 1,
  xp_required: 0,
  free_reward_type: "soft_currency",
  free_reward_amount: 0,
  free_reward_sku: "",
  premium_reward_type: "soft_currency",
  premium_reward_amount: 0,
  premium_reward_sku: "",
  is_active: true,
};

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
  const [rankSettings, setRankSettings] = useState({
    silver_min: 1000,
    gold_min: 1200,
    platinum_min: 1400,
    diamond_min: 1600,
  });
  const [rewardSettings, setRewardSettings] = useState({
    win_xp: 35,
    loss_xp: 18,
    win_currency: 20,
    loss_currency: 10,
    daily_quest_bonus_xp: 30,
    weekly_quest_bonus_xp: 120,
  });
  const [sanctions, setSanctions] = useState([]);
  const [economySettings, setEconomySettings] = useState({
    starter_soft_currency: 0,
    starter_hard_currency: 0,
    season_name: "",
    season_tier_xp: 0,
    premium_pass_price_hard: 0,
    stripe_enabled: false,
    paypal_enabled: false,
  });
  const [mapsOverview, setMapsOverview] = useState(null);
  const [adminMaps, setAdminMaps] = useState([]);
  const [storeItems, setStoreItems] = useState([]);
  const [storePacks, setStorePacks] = useState([]);
  const [seasonPassTiers, setSeasonPassTiers] = useState([]);
  const [economyTransactions, setEconomyTransactions] = useState([]);
  const [itemDraft, setItemDraft] = useState(defaultItemDraft);
  const [packDraft, setPackDraft] = useState(defaultPackDraft);
  const [tierDraft, setTierDraft] = useState(defaultTierDraft);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSavingRanks, setIsSavingRanks] = useState(false);
  const [isSavingRewards, setIsSavingRewards] = useState(false);
  const [isSavingEconomy, setIsSavingEconomy] = useState(false);
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [isSavingPack, setIsSavingPack] = useState(false);
  const [isSavingTier, setIsSavingTier] = useState(false);
  const itemFormRef = useRef(null);
  const packFormRef = useRef(null);
  const tierFormRef = useRef(null);

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

      const [
        adminStats,
        adminUsers,
        adminSettings,
        matchmakingOverview,
        rankSettingsData,
        rewardSettingsData,
        economySettingsData,
        sanctionsData,
        mapsOverviewData,
        adminMapsData,
        storeItemsData,
        storePacksData,
        seasonPassTiersData,
        economyTransactionsData,
      ] = await Promise.all([
        getAdminStats(),
        getUsers(),
        getMatchmakingSettings(),
        getMatchmakingOverview(),
        getRankSettings(),
        getRewardSettings(),
        getEconomySettings(),
        getSanctions(),
        getMapsOverview(),
        getAdminMaps(),
        getStoreItems(),
        getStorePacks(),
        getSeasonPassTiers(),
        getEconomyTransactions(),
      ]);

      setStats(adminStats);
      setUsers(adminUsers);
      setSettings(adminSettings);
      setOverview(matchmakingOverview);
      setRankSettings(rankSettingsData);
      setRewardSettings(rewardSettingsData);
      setEconomySettings(economySettingsData);
      setSanctions(sanctionsData);
      setMapsOverview(mapsOverviewData);
      setAdminMaps(adminMapsData);
      setStoreItems(storeItemsData);
      setStorePacks(storePacksData);
      setSeasonPassTiers(seasonPassTiersData.tiers || []);
      setEconomyTransactions(economyTransactionsData.transactions || []);
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
      await updateMatchmakingSettings({
        ...settings,
        max_elo_gap: Number(settings.max_elo_gap),
        max_wait_seconds: Number(settings.max_wait_seconds),
        team_size: Number(settings.team_size),
      });
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
      await updateRankSettings({
        silver_min: Number(rankSettings.silver_min),
        gold_min: Number(rankSettings.gold_min),
        platinum_min: Number(rankSettings.platinum_min),
        diamond_min: Number(rankSettings.diamond_min),
      });
      toast.success("Mapping des rangs mis a jour.");
      await load();
    } catch (error) {
      console.error(error);
      toast.error("Impossible de sauvegarder les seuils de rang.");
    } finally {
      setIsSavingRanks(false);
    }
  };

  const handleRewardChange = (key, value) => {
    setRewardSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleEconomyChange = (key, value) => {
    setEconomySettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveRewards = async (event) => {
    event.preventDefault();
    try {
      setIsSavingRewards(true);
      await updateRewardSettings(
        Object.fromEntries(
          Object.entries(rewardSettings).map(([key, value]) => [key, Number(value)])
        )
      );
      toast.success("Recompenses mises a jour.");
      await load();
    } catch (error) {
      console.error(error);
      toast.error("Impossible de sauvegarder les recompenses.");
    } finally {
      setIsSavingRewards(false);
    }
  };

  const handleSaveEconomy = async (event) => {
    event.preventDefault();
    try {
      setIsSavingEconomy(true);
      await updateEconomySettings({
        ...economySettings,
        starter_soft_currency: Number(economySettings.starter_soft_currency),
        starter_hard_currency: Number(economySettings.starter_hard_currency),
        season_tier_xp: Number(economySettings.season_tier_xp),
        premium_pass_price_hard: Number(economySettings.premium_pass_price_hard),
      });
      toast.success("Reglages economie mis a jour.");
      await load();
    } catch (error) {
      console.error(error);
      toast.error("Impossible de sauvegarder les reglages economie.");
    } finally {
      setIsSavingEconomy(false);
    }
  };

  const handleSaveItem = async (event) => {
    event.preventDefault();
    try {
      setIsSavingItem(true);
      await upsertStoreItem({
        ...itemDraft,
        price_soft: Number(itemDraft.price_soft),
        price_hard: Number(itemDraft.price_hard),
        season_tier_required: Number(itemDraft.season_tier_required),
      });
      toast.success("Objet boutique enregistre.");
      setItemDraft(defaultItemDraft);
      await load();
    } catch (error) {
      console.error(error);
      toast.error("Impossible d'enregistrer l'objet.");
    } finally {
      setIsSavingItem(false);
    }
  };

  const handleSavePack = async (event) => {
    event.preventDefault();
    try {
      setIsSavingPack(true);
      await upsertStorePack(
        Object.fromEntries(
          Object.entries(packDraft).map(([key, value]) => [
            key,
            ["soft_currency", "hard_currency", "bonus_percent", "price_cents"].includes(key)
              ? Number(value)
              : value,
          ])
        )
      );
      toast.success("Pack enregistre.");
      setPackDraft(defaultPackDraft);
      await load();
    } catch (error) {
      console.error(error);
      toast.error("Impossible d'enregistrer le pack.");
    } finally {
      setIsSavingPack(false);
    }
  };

  const handleSaveTier = async (event) => {
    event.preventDefault();
    try {
      setIsSavingTier(true);
      await upsertSeasonPassTier({
        ...tierDraft,
        tier: Number(tierDraft.tier),
        xp_required: Number(tierDraft.xp_required),
        free_reward_amount: Number(tierDraft.free_reward_amount),
        premium_reward_amount: Number(tierDraft.premium_reward_amount),
      });
      toast.success("Tier du pass enregistre.");
      setTierDraft(defaultTierDraft);
      await load();
    } catch (error) {
      console.error(error);
      toast.error("Impossible d'enregistrer le tier.");
    } finally {
      setIsSavingTier(false);
    }
  };

  const handleModerateMap = async (mapId, payload) => {
    try {
      await moderateMap(mapId, payload);
      toast.success("Moderation map appliquee.");
      await load();
    } catch (error) {
      console.error(error);
      toast.error("Impossible de moderer cette map.");
    }
  };

  const rankDistributionData = useMemo(
    () =>
      Object.entries(stats.rank_distribution || {}).map(([label, value], index) => ({
        label,
        value,
        color: rankColors[index % rankColors.length],
      })),
    [stats.rank_distribution]
  );

  const focusForm = (ref, message) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    toast.success(message);
  };

  const handleDeleteStoreItem = async (sku) => {
    try {
      await deleteStoreItem(sku);
      toast.success("Objet supprime.");
      if (itemDraft.sku === sku) {
        setItemDraft(defaultItemDraft);
      }
      await load();
    } catch (error) {
      console.error(error);
      toast.error("Impossible de supprimer l'objet.");
    }
  };

  const handleDeleteStorePack = async (sku) => {
    try {
      await deleteStorePack(sku);
      toast.success("Pack supprime.");
      if (packDraft.sku === sku) {
        setPackDraft(defaultPackDraft);
      }
      await load();
    } catch (error) {
      console.error(error);
      toast.error("Impossible de supprimer le pack.");
    }
  };

  const handleDeleteSeasonPassTier = async (tier) => {
    try {
      await deleteSeasonPassTier(tier);
      toast.success("Tier supprime.");
      if (Number(tierDraft.tier) === Number(tier)) {
        setTierDraft(defaultTierDraft);
      }
      await load();
    } catch (error) {
      console.error(error);
      toast.error("Impossible de supprimer le tier.");
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
            <p className="mt-2 max-w-4xl text-slate-400">
              Backoffice studio complet pour suivre l'activite, regler l'economie, piloter le matchmaking
              et superviser le contenu communautaire.
            </p>
            <BackToDashboardButton className="mt-4" />
          </div>
          <UserMenu user={currentUser} />
        </div>

        <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3 xl:grid-cols-7">
          <div className="dashboard-card rounded-2xl p-4">Users: {stats.total_users ?? 0}</div>
          <div className="dashboard-card rounded-2xl p-4">Matches: {stats.total_matches ?? 0}</div>
          <div className="dashboard-card rounded-2xl p-4">Active: {stats.active_users ?? 0}</div>
          <div className="dashboard-card rounded-2xl p-4">Queue: {stats.players_in_queue ?? 0}</div>
          <div className="dashboard-card rounded-2xl p-4">In-game: {stats.players_in_game ?? 0}</div>
          <div className="dashboard-card rounded-2xl p-4">Virtual revenue: {stats.virtual_revenue ?? 0}</div>
          <div className="dashboard-card rounded-2xl p-4">Community maps: {stats.community_maps ?? 0}</div>
        </div>

        <div className="mb-10 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="dashboard-card rounded-3xl p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-red-300/70">KPIs</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Matchs par jour</h2>
            <div className="mt-4 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.matches_per_day || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="day" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="matches" fill="#f43f5e" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="dashboard-card rounded-3xl p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Meta</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Distribution des rangs</h2>
            <div className="mt-4 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={rankDistributionData} dataKey="value" nameKey="label" outerRadius={90}>
                    {rankDistributionData.map((entry) => (
                      <Cell key={entry.label} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mb-10 grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <form onSubmit={handleSaveSettings} className="dashboard-card rounded-3xl p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-red-300/70">Live Ops</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Configuration matchmaking</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Ecart ELO max</p>
                <input type="number" min="0" value={settings.max_elo_gap} onChange={(e) => handleSettingsChange("max_elo_gap", e.target.value)} className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
              </label>
              <label className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Attente max</p>
                <input type="number" min="5" value={settings.max_wait_seconds} onChange={(e) => handleSettingsChange("max_wait_seconds", e.target.value)} className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
              </label>
              <label className="rounded-2xl border border-white/10 bg-white/5 p-4 md:col-span-2">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Taille equipe</p>
                <input type="number" min="1" value={settings.team_size} onChange={(e) => handleSettingsChange("team_size", e.target.value)} className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
              </label>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
              {[["ranked_enabled", "Classe"], ["unranked_enabled", "Non classe"], ["fun_enabled", "Fun"]].map(([key, label]) => (
                <label key={key} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <span>{label}</span>
                  <input type="checkbox" checked={settings[key]} onChange={(e) => handleSettingsChange(key, e.target.checked)} />
                </label>
              ))}
            </div>
            <button type="submit" disabled={isSavingSettings} className="mt-6 rounded-2xl bg-red-500 px-6 py-3 font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-red-500/30 disabled:cursor-not-allowed disabled:opacity-60">
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
                    <span className="text-sm text-slate-400">{overview?.queue?.[mode]?.length ?? 0}</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {(overview?.queue?.[mode] || []).slice(0, 4).map((entry) => (
                      <div key={`${mode}-${entry.user_id}`} className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2">
                        <p className="font-semibold text-cyan-200">{entry.pseudo}</p>
                        <p className="text-xs text-slate-500">ELO {entry.elo}</p>
                      </div>
                    ))}
                    {(overview?.queue?.[mode] || []).length === 0 && <p className="text-sm text-slate-500">File vide.</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-10 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
          <form onSubmit={handleSaveRankSettings} className="dashboard-card rounded-3xl p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-yellow-300/70">Competitive system</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Mapping MMR vers rang</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
              {[["silver_min", "Silver min"], ["gold_min", "Gold min"], ["platinum_min", "Platinum min"], ["diamond_min", "Diamond min"]].map(([key, label]) => (
                <label key={key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{label}</p>
                  <input type="number" value={rankSettings[key]} onChange={(e) => handleRankSettingsChange(key, e.target.value)} className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
                </label>
              ))}
            </div>
            <button type="submit" disabled={isSavingRanks} className="mt-6 rounded-2xl bg-yellow-500 px-6 py-3 font-semibold text-slate-950 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-yellow-500/30 disabled:cursor-not-allowed disabled:opacity-60">
              {isSavingRanks ? "Sauvegarde..." : "Sauvegarder les rangs"}
            </button>
          </form>

          <form onSubmit={handleSaveRewards} className="dashboard-card rounded-3xl p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/70">Economy</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Parametrage des recompenses</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              {[
                ["win_xp", "XP victoire"],
                ["loss_xp", "XP defaite"],
                ["win_currency", "Coins victoire"],
                ["loss_currency", "Coins defaite"],
                ["daily_quest_bonus_xp", "Bonus quete daily"],
                ["weekly_quest_bonus_xp", "Bonus quete weekly"],
              ].map(([key, label]) => (
                <label key={key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{label}</p>
                  <input type="number" value={rewardSettings[key]} onChange={(e) => handleRewardChange(key, e.target.value)} className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
                </label>
              ))}
            </div>
            <button type="submit" disabled={isSavingRewards} className="mt-6 rounded-2xl bg-emerald-500 px-6 py-3 font-semibold text-slate-950 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60">
              {isSavingRewards ? "Sauvegarde..." : "Sauvegarder les recompenses"}
            </button>
          </form>
        </div>

        <div className="mb-10 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
          <form onSubmit={handleSaveEconomy} className="dashboard-card rounded-3xl p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-300/70">Monetization</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Reglages economie & saison</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              {[
                ["starter_soft_currency", "Soft de depart"],
                ["starter_hard_currency", "Hard de depart"],
                ["premium_pass_price_hard", "Prix pass premium"],
              ].map(([key, label]) => (
                <label key={key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{label}</p>
                  <input type="number" value={economySettings[key]} onChange={(e) => handleEconomyChange(key, e.target.value)} className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
                </label>
              ))}
              <label className="rounded-2xl border border-white/10 bg-white/5 p-4 md:col-span-2">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Nom de saison</p>
                <input type="text" value={economySettings.season_name} onChange={(e) => handleEconomyChange("season_name", e.target.value)} className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
              </label>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              {[["stripe_enabled", "Stripe simule"], ["paypal_enabled", "PayPal simule"]].map(([key, label]) => (
                <label key={key} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <span>{label}</span>
                  <input type="checkbox" checked={economySettings[key]} onChange={(e) => handleEconomyChange(key, e.target.checked)} />
                </label>
              ))}
            </div>
            <button type="submit" disabled={isSavingEconomy} className="mt-6 rounded-2xl bg-amber-400 px-6 py-3 font-semibold text-slate-950 transition-all duration-200 hover:scale-[1.02] disabled:opacity-60">
              {isSavingEconomy ? "Sauvegarde..." : "Sauvegarder l'economie"}
            </button>
          </form>

          <div className="dashboard-card rounded-3xl p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Ledger</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Journal des transactions</h2>
            <div className="mt-5 space-y-3">
              {economyTransactions.slice(0, 10).map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-white">
                      {entry.kind === "payment"
                        ? `${entry.provider?.toUpperCase()} ${entry.pack_sku}`
                        : `${entry.currency_type} ${entry.amount > 0 ? "+" : ""}${entry.amount}`}
                    </p>
                    <p className="text-xs text-slate-500">
                      {entry.created_at ? new Date(entry.created_at).toLocaleString() : "-"}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    {entry.kind === "payment" ? `${entry.status} | ${entry.external_ref}` : entry.source}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-10 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
          <form ref={itemFormRef} onSubmit={handleSaveItem} className="dashboard-card rounded-3xl p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-fuchsia-300/70">Store content</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Creer / mettre a jour un objet</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              {[
                ["sku", "SKU"],
                ["name", "Nom"],
                ["description", "Description"],
                ["category", "Categorie"],
                ["item_type", "Type"],
                ["rarity", "Rareté"],
                ["price_soft", "Prix soft"],
                ["price_hard", "Prix hard"],
                ["asset", "Asset"],
                ["season_tier_required", "Tier saison"],
              ].map(([key, label]) => (
                <label key={key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{label}</p>
                  <input type={["price_soft", "price_hard", "season_tier_required"].includes(key) ? "number" : "text"} value={itemDraft[key]} onChange={(e) => setItemDraft((prev) => ({ ...prev, [key]: ["price_soft", "price_hard", "season_tier_required"].includes(key) ? e.target.value : e.target.value }))} className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
                </label>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              {[["is_featured", "Featured"], ["is_active", "Actif"]].map(([key, label]) => (
                <label key={key} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <span>{label}</span>
                  <input type="checkbox" checked={itemDraft[key]} onChange={(e) => setItemDraft((prev) => ({ ...prev, [key]: e.target.checked }))} />
                </label>
              ))}
            </div>
            <button type="submit" disabled={isSavingItem} className="mt-6 rounded-2xl bg-fuchsia-500 px-6 py-3 font-semibold text-white transition-all duration-200 hover:scale-[1.02] disabled:opacity-60">
              {isSavingItem ? "Sauvegarde..." : "Enregistrer l'objet"}
            </button>
            <button type="button" onClick={() => setItemDraft(defaultItemDraft)} className="mt-3 rounded-2xl border border-white/10 px-6 py-3 font-semibold text-slate-200 transition-all duration-200 hover:bg-white/5">
              Nouveau formulaire
            </button>
            <div className="mt-6 space-y-3">
              {storeItems.map((item) => (
                <div key={item.sku} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="font-semibold text-white">{item.name}</p>
                  <p className="text-sm text-slate-400">{item.sku} | soft {item.price_soft} | hard {item.price_hard}</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setItemDraft({
                          sku: item.sku,
                          name: item.name,
                          description: item.description || "",
                          category: item.category,
                          item_type: item.item_type,
                          rarity: item.rarity,
                          price_soft: item.price_soft,
                          price_hard: item.price_hard,
                          asset: item.asset || "",
                          season_tier_required: item.season_tier_required,
                          is_featured: item.is_featured,
                          is_active: item.is_active,
                        });
                        focusForm(itemFormRef, `Objet ${item.name} charge dans le formulaire.`);
                      }}
                      className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Charger
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteStoreItem(item.sku)}
                      className="rounded-xl bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-200"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </form>

          <form ref={packFormRef} onSubmit={handleSavePack} className="dashboard-card rounded-3xl p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/70">Packs</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Creer / mettre a jour un pack</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              {[
                ["sku", "SKU"],
                ["name", "Nom"],
                ["description", "Description"],
                ["soft_currency", "Soft"],
                ["hard_currency", "Hard"],
                ["bonus_percent", "Bonus %"],
                ["price_cents", "Prix centimes"],
              ].map(([key, label]) => (
                <label key={key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{label}</p>
                  <input type={["soft_currency", "hard_currency", "bonus_percent", "price_cents"].includes(key) ? "number" : "text"} value={packDraft[key]} onChange={(e) => setPackDraft((prev) => ({ ...prev, [key]: e.target.value }))} className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none" />
                </label>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              {[["is_featured", "Featured"], ["is_active", "Actif"]].map(([key, label]) => (
                <label key={key} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <span>{label}</span>
                  <input type="checkbox" checked={packDraft[key]} onChange={(e) => setPackDraft((prev) => ({ ...prev, [key]: e.target.checked }))} />
                </label>
              ))}
            </div>
            <button type="submit" disabled={isSavingPack} className="mt-6 rounded-2xl bg-emerald-500 px-6 py-3 font-semibold text-slate-950 transition-all duration-200 hover:scale-[1.02] disabled:opacity-60">
              {isSavingPack ? "Sauvegarde..." : "Enregistrer le pack"}
            </button>
            <button type="button" onClick={() => setPackDraft(defaultPackDraft)} className="mt-3 rounded-2xl border border-white/10 px-6 py-3 font-semibold text-slate-200 transition-all duration-200 hover:bg-white/5">
              Nouveau formulaire
            </button>
            <div className="mt-6 space-y-3">
              {storePacks.map((pack) => (
                <div key={pack.sku} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="font-semibold text-white">{pack.name}</p>
                  <p className="text-sm text-slate-400">{pack.sku} | soft {pack.total_soft_currency} | hard {pack.total_hard_currency}</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setPackDraft({
                          sku: pack.sku,
                          name: pack.name,
                          description: pack.description || "",
                          soft_currency: pack.soft_currency,
                          hard_currency: pack.hard_currency,
                          bonus_percent: pack.bonus_percent,
                          price_cents: pack.price_cents,
                          is_active: pack.is_active,
                          is_featured: pack.is_featured,
                        });
                        focusForm(packFormRef, `Pack ${pack.name} charge dans le formulaire.`);
                      }}
                      className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Charger
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteStorePack(pack.sku)}
                      className="rounded-xl bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-200"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </form>
        </div>

        <div className="mb-10 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
          <form ref={tierFormRef} onSubmit={handleSaveTier} className="dashboard-card rounded-3xl p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Season Pass</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Creer / mettre a jour un tier</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              {[
                ["tier", "Tier"],
                ["xp_required", "XP requis"],
                ["free_reward_type", "Type reward free"],
                ["free_reward_amount", "Montant free"],
                ["free_reward_sku", "SKU free"],
                ["premium_reward_type", "Type reward premium"],
                ["premium_reward_amount", "Montant premium"],
                ["premium_reward_sku", "SKU premium"],
              ].map(([key, label]) => (
                <label key={key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{label}</p>
                  <input
                    type={["tier", "xp_required", "free_reward_amount", "premium_reward_amount"].includes(key) ? "number" : "text"}
                    value={tierDraft[key]}
                    onChange={(e) => setTierDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none"
                  />
                </label>
              ))}
            </div>
            <div className="mt-5">
              <label className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span>Actif</span>
                <input type="checkbox" checked={tierDraft.is_active} onChange={(e) => setTierDraft((prev) => ({ ...prev, is_active: e.target.checked }))} />
              </label>
            </div>
            <button type="submit" disabled={isSavingTier} className="mt-6 rounded-2xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950 transition-all duration-200 hover:scale-[1.02] disabled:opacity-60">
              {isSavingTier ? "Sauvegarde..." : "Enregistrer le tier"}
            </button>
            <button type="button" onClick={() => setTierDraft(defaultTierDraft)} className="mt-3 rounded-2xl border border-white/10 px-6 py-3 font-semibold text-slate-200 transition-all duration-200 hover:bg-white/5">
              Nouveau formulaire
            </button>
          </form>

          <div className="dashboard-card rounded-3xl p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">Season Pass</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Tiers configures</h2>
            <div className="mt-5 space-y-3">
              {seasonPassTiers.map((tier) => (
                <div key={tier.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="font-semibold text-white">Tier {tier.tier} | XP {tier.xp_required}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Free: {tier.free_reward.type} {tier.free_reward.amount || tier.free_reward.sku || ""}
                  </p>
                  <p className="text-sm text-slate-400">
                    Premium: {tier.premium_reward.type} {tier.premium_reward.amount || tier.premium_reward.sku || ""}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setTierDraft({
                          tier: tier.tier,
                          xp_required: tier.xp_required,
                          free_reward_type: tier.free_reward.type,
                          free_reward_amount: tier.free_reward.amount || 0,
                          free_reward_sku: tier.free_reward.sku || "",
                          premium_reward_type: tier.premium_reward.type,
                          premium_reward_amount: tier.premium_reward.amount || 0,
                          premium_reward_sku: tier.premium_reward.sku || "",
                          is_active: tier.is_active,
                        });
                        focusForm(tierFormRef, `Tier ${tier.tier} charge dans le formulaire.`);
                      }}
                      className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Charger
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSeasonPassTier(tier.tier)}
                      className="rounded-xl bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-200"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
              {seasonPassTiers.length === 0 && (
                <p className="text-sm text-slate-500">Aucun tier configure.</p>
              )}
            </div>
          </div>
        </div>

        <div className="mb-10 grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="dashboard-card rounded-3xl p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-purple-300/70">UGC Activity</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Activite maps communautaires</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Visible: {mapsOverview?.community_activity?.visible_maps ?? 0}</div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Featured: {mapsOverview?.community_activity?.featured_maps ?? 0}</div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Reports open: {mapsOverview?.community_activity?.reports_open ?? 0}</div>
            </div>
            <div className="mt-5 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mapsOverview?.top_creators || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="creator" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="tests" fill="#8b5cf6" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="dashboard-card rounded-3xl p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-pink-300/70">Sanctions</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Historique des sanctions</h2>
            <div className="mt-5 space-y-3">
              {sanctions.slice(0, 8).map((sanction) => (
                <div key={sanction.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-white">{sanction.action.toUpperCase()}</p>
                    <p className="text-xs text-slate-500">{new Date(sanction.created_at).toLocaleString()}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">
                    Target #{sanction.target_user_id} by admin #{sanction.actor_user_id}
                  </p>
                </div>
              ))}
              {sanctions.length === 0 && <p className="text-sm text-slate-500">Aucune sanction enregistree.</p>}
            </div>
          </div>
        </div>

        <div className="mb-10 dashboard-card rounded-3xl p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/70">UGC Moderation</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Backoffice maps</h2>
          <div className="mt-5 space-y-4">
            {adminMaps.map((map) => (
              <div key={map.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-bold text-white">{map.title}</p>
                    <p className="text-sm text-slate-400">
                      {map.author} | {map.status} | tests {map.tests_count} | rating {map.average_rating}
                    </p>
                    <p className="text-sm text-slate-500">
                      reports {map.reports} | retention {map.retention_score} | updated {map.last_updated_at ? new Date(map.last_updated_at).toLocaleDateString() : "-"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => handleModerateMap(map.id, { featured: !map.featured })}
                      className={`rounded-xl px-4 py-2 font-semibold transition ${map.featured ? "bg-yellow-400 text-slate-950" : "bg-yellow-400/20 text-yellow-200 hover:scale-105"}`}
                    >
                      {map.featured ? "Retirer featured" : "Mettre en avant"}
                    </button>
                    <button
                      onClick={() => handleModerateMap(map.id, { hidden: !map.hidden })}
                      className={`rounded-xl px-4 py-2 font-semibold transition ${map.hidden ? "bg-emerald-500 text-slate-950" : "bg-red-500/20 text-red-200 hover:scale-105"}`}
                    >
                      {map.hidden ? "Reafficher" : "Masquer"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white/5 p-4">
              <div>
                {user.email} | ELO: {user.elo} | level {user.level} | soft {user.soft_currency} | hard {user.hard_currency} | {user.role} | Etat: {user.player_status}
              </div>
              <div>
                {user.active ? (
                  <button onClick={() => handleBan(user.id)} className="rounded bg-red-500 px-4 py-2 transition-all duration-200 hover:scale-105 active:scale-95">
                    Ban
                  </button>
                ) : (
                  <button onClick={() => handleUnban(user.id)} className="rounded bg-green-500 px-4 py-2 transition-all duration-200 hover:scale-105 active:scale-95">
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
