import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import BackToDashboardButton from "../components/BackToDashboardButton";
import PageWrapper from "../components/PageWrapper";
import UserMenu from "../components/UserMenu";
import { getMe } from "../services/api";
import {
  addMapVersion,
  commentMap,
  createMap,
  getCreatorStats,
  getMaps,
  reportMap,
  testMap,
  toggleFavoriteMap,
  voteMap,
} from "../services/maps";

const STATUS_OPTIONS = ["draft", "beta", "stable"];
const SORT_OPTIONS = [
  { value: "trending", label: "Trending" },
  { value: "top", label: "Top Rated" },
  { value: "favorites", label: "Most Favorited" },
  { value: "tested", label: "Most Tested" },
  { value: "newest", label: "Newest" },
];

const filesToDataUrls = async (files) =>
  Promise.all(
    Array.from(files).map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
    )
  );

export default function Maps() {
  const [maps, setMaps] = useState([]);
  const [creatorStats, setCreatorStats] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("draft");
  const [tags, setTags] = useState("");
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [sort, setSort] = useState("trending");
  const [author, setAuthor] = useState("");
  const [versionNotes, setVersionNotes] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [reportDrafts, setReportDrafts] = useState({});
  const [mapContent, setMapContent] = useState("");
  const [mapScreenshots, setMapScreenshots] = useState([]);

  useEffect(() => {
    getMe().then(setCurrentUser).catch((error) => console.error(error));
  }, []);

  useEffect(() => {
    load();
  }, [search, selectedStatus, selectedTag, sort, author]);

  const load = async () => {
    try {
      const [mapsData, creatorData] = await Promise.all([
        getMaps({
          q: search,
          status: selectedStatus,
          tag: selectedTag,
          sort,
          author,
        }),
        getCreatorStats(),
      ]);
      setMaps(mapsData);
      setCreatorStats(creatorData);
    } catch (error) {
      console.error(error);
      toast.error("Impossible de charger les maps.");
    }
  };

  const availableTags = useMemo(() => {
    const unique = new Set();
    maps.forEach((map) => map.tags.forEach((tag) => unique.add(tag)));
    return Array.from(unique).sort();
  }, [maps]);

  const handleScreenshotUpload = async (event) => {
    const files = event.target.files;
    if (!files?.length) {
      return;
    }

    try {
      const uploads = await filesToDataUrls(files);
      setMapScreenshots(uploads.slice(0, 4));
      toast.success("Captures chargees.");
    } catch (error) {
      console.error(error);
      toast.error("Impossible de charger les captures.");
    }
  };

  const handleMapContentUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const [content] = await filesToDataUrls([file]);
      setMapContent(content);
      toast.success("Contenu map importe.");
    } catch (error) {
      console.error(error);
      toast.error("Impossible de charger le contenu map.");
    }
  };

  const handleCreateMap = async (e) => {
    e.preventDefault();

    try {
      await createMap({
        title,
        description,
        status,
        tags: tags.split(",").map((tagName) => tagName.trim()).filter(Boolean),
        content_url: mapContent,
        screenshot_urls: mapScreenshots,
      });
      toast.success("Map publiee.");
      setTitle("");
      setDescription("");
      setStatus("draft");
      setTags("");
      setMapContent("");
      setMapScreenshots([]);
      await load();
    } catch (error) {
      console.error(error);
      toast.error("Impossible de creer la map.");
    }
  };

  const handleVote = async (mapId, value) => {
    try {
      await voteMap(mapId, value);
      await load();
    } catch (error) {
      console.error(error);
      toast.error("Impossible d'enregistrer le vote.");
    }
  };

  const handleFavorite = async (mapId) => {
    try {
      const result = await toggleFavoriteMap(mapId);
      toast.success(result.is_favorited ? "Ajoute aux favoris." : "Retire des favoris.");
      await load();
    } catch (error) {
      console.error(error);
      toast.error("Impossible de mettre a jour les favoris.");
    }
  };

  const handleAddVersion = async (mapId) => {
    try {
      await addMapVersion(mapId, versionNotes[mapId] || "Update");
      toast.success("Nouvelle version ajoutee.");
      setVersionNotes((prev) => ({ ...prev, [mapId]: "" }));
      await load();
    } catch (error) {
      console.error(error);
      toast.error("Impossible d'ajouter la version.");
    }
  };

  const handleComment = async (mapId) => {
    try {
      await commentMap(mapId, commentDrafts[mapId] || "");
      toast.success("Commentaire ajoute.");
      setCommentDrafts((prev) => ({ ...prev, [mapId]: "" }));
      await load();
    } catch (error) {
      console.error(error);
      toast.error("Impossible d'ajouter le commentaire.");
    }
  };

  const handleTestMap = async (mapId) => {
  const token = localStorage.getItem("token");

  if (!token) {
    toast.error("Tu dois être connecté pour tester une map.");
    return;
  }

  
  const deeplink = `gamedash://testmap?map_id=${mapId}&token=${encodeURIComponent(token)}`;

  
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = deeplink;
  document.body.appendChild(iframe);

  
  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 3000);

  toast(
    (t) => (
      <div className="flex flex-col gap-2">
        <p className="font-semibold text-white">Ouverture de Unity...</p>
        <p className="text-sm text-slate-300">
          Si Unity ne s'ouvre pas, clique sur <strong>"Ouvrir GameDash"</strong> dans la
          fenêtre qui s'est affichée.
        </p>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="mt-1 rounded-lg bg-cyan-500 px-3 py-1 text-sm font-semibold text-slate-950"
        >
          OK
        </button>
      </div>
    ),
    { duration: 6000 }
  );

  
  setTimeout(async () => {
    try {
      await testMap(mapId, 300, 1.0);
      await load(); // refresh les stats de la map
    } catch (err) {
      console.warn("Impossible d'enregistrer le test API :", err);
    }
  }, 4000);
};

  const handleReportMap = async (mapId) => {
    try {
      await reportMap(mapId, reportDrafts[mapId] || "Contenu a revoir");
      toast.success("Signalement envoye.");
      setReportDrafts((prev) => ({ ...prev, [mapId]: "" }));
      await load();
    } catch (error) {
      console.error(error);
      toast.error("Impossible d'envoyer le signalement.");
    }
  };

  return (
    <PageWrapper>
      <div className="min-h-screen p-6 text-white">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl text-purple-400 drop-shadow-[0_0_20px_rgba(192,132,252,0.7)]">
              Community Maps Hub
            </h1>
            <p className="mt-2 max-w-3xl text-slate-400">
              Explore les maps communautaires, publie du vrai contenu, suis les tests et
              mets les createurs en avant.
            </p>
            <BackToDashboardButton className="mt-4" />
          </div>
          <UserMenu user={currentUser} />
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="dashboard-card rounded-[2rem] p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-purple-300/70">Discover</p>
                <h2 className="mt-2 text-2xl font-bold text-white">Map Browser</h2>
              </div>
              <div className="rounded-full border border-purple-400/20 bg-purple-500/10 px-4 py-2 text-sm text-purple-200">
                {maps.length} maps visibles
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Recherche"
                className="rounded-2xl border border-cyan-500/20 bg-white/5 px-4 py-3 text-white outline-none"
              />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-2xl border border-cyan-500/20 bg-slate-950 px-4 py-3 text-white outline-none"
              >
                <option value="">Tous les statuts</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="rounded-2xl border border-cyan-500/20 bg-slate-950 px-4 py-3 text-white outline-none"
              >
                <option value="">Tous les tags</option>
                {availableTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-2xl border border-cyan-500/20 bg-slate-950 px-4 py-3 text-white outline-none"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Auteur"
                className="rounded-2xl border border-cyan-500/20 bg-white/5 px-4 py-3 text-white outline-none"
              />
            </div>
          </div>

          <div className="dashboard-card rounded-[2rem] p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-pink-300/70">Top creators</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Createurs a suivre</h2>
            <div className="mt-5 space-y-3">
              {creatorStats.slice(0, 4).map((creator) => (
                <div key={creator.creator} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-lg font-bold text-white">{creator.creator}</p>
                      <p className="text-sm text-slate-400">
                        {creator.maps_published} maps | {creator.tests_count} tests
                      </p>
                    </div>
                    <div className="rounded-full bg-purple-500/10 px-3 py-2 text-sm text-purple-200">
                      Pop {creator.popularity}
                    </div>
                  </div>
                </div>
              ))}
              {creatorStats.length === 0 && <p className="text-sm text-slate-500">Aucun createur classe pour le moment.</p>}
            </div>
          </div>
        </div>

        <form onSubmit={handleCreateMap} className="mb-8 dashboard-card rounded-[2rem] p-6">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/70">Creator Studio</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Publier une nouvelle map</h2>
          <div className="mt-5 grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre de la map"
                className="rounded-2xl border border-cyan-500/20 bg-white/5 px-4 py-3 text-white outline-none"
                required
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-2xl border border-cyan-500/20 bg-slate-950 px-4 py-3 text-white outline-none"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description de l'experience"
              rows={4}
              className="rounded-2xl border border-cyan-500/20 bg-white/5 px-4 py-3 text-white outline-none"
              required
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="tags: duel, arena, cyber"
                className="rounded-2xl border border-cyan-500/20 bg-white/5 px-4 py-3 text-white outline-none"
              />
              <label className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                Captures d'ecran
                <input type="file" accept="image/*" multiple onChange={handleScreenshotUpload} className="mt-2 block w-full text-xs" />
              </label>
              <label className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                Contenu map
                <input type="file" onChange={handleMapContentUpload} className="mt-2 block w-full text-xs" />
              </label>
            </div>
            {mapScreenshots.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {mapScreenshots.map((shot, index) => (
                  <img key={`${index}-${shot.slice(0, 10)}`} src={shot} alt={`Screenshot ${index + 1}`} className="h-20 w-32 rounded-2xl object-cover" />
                ))}
              </div>
            )}
            <button
              type="submit"
              className="rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-400 px-6 py-3 font-semibold text-slate-950 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/30"
            >
              Publier la map
            </button>
          </div>
        </form>

        <div className="space-y-6">
          {maps.map((map) => (
            <div key={map.id} className="dashboard-card overflow-hidden rounded-[2rem] p-6 transition-all duration-200 hover:shadow-2xl hover:shadow-purple-500/20">
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.7fr]">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-3xl font-bold text-white">{map.title}</h2>
                    <span className="rounded-full border border-purple-400/30 bg-purple-500/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-purple-300">
                      {map.status}
                    </span>
                    {map.featured && (
                      <span className="rounded-full border border-yellow-400/30 bg-yellow-500/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-yellow-300">
                        featured
                      </span>
                    )}
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-cyan-200">
                      by {map.author.pseudo}
                    </span>
                  </div>

                  <p className="mt-4 max-w-4xl text-slate-300">{map.description}</p>

                  {map.screenshots?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {map.screenshots.map((shot, index) => (
                        <img key={`${map.id}-shot-${index}`} src={shot} alt={`${map.title} screenshot ${index + 1}`} className="h-28 w-44 rounded-2xl object-cover" />
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {map.tags.length > 0 ? (
                      map.tags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setSelectedTag(tag)}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-200"
                        >
                          #{tag}
                        </button>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">Aucun tag</span>
                    )}
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-6">
                    {[
                      ["Score", map.score, "text-yellow-300"],
                      ["Likes", map.likes, "text-emerald-300"],
                      ["Favoris", map.favorites, "text-pink-300"],
                      ["Tests", map.tests_count, "text-cyan-300"],
                      ["Note moyenne", map.average_rating, "text-orange-300"],
                      ["Retention", map.retention_score, "text-purple-300"],
                    ].map(([label, value, color]) => (
                      <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{label}</p>
                        <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                      <p className="mb-3 text-sm uppercase tracking-[0.25em] text-slate-400">Versions</p>
                      <div className="space-y-2">
                        {map.versions.map((version) => (
                          <div key={version.id} className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-semibold text-cyan-300">{version.version}</p>
                              <p className="text-xs text-slate-500">{new Date(version.created_at).toLocaleDateString()}</p>
                            </div>
                            <p className="mt-2 text-sm text-slate-300">{version.notes}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                      <p className="mb-3 text-sm uppercase tracking-[0.25em] text-slate-400">Creator stats</p>
                      <div className="space-y-2 text-sm text-slate-300">
                        <p>Maps publiees: {map.author.stats.maps_published}</p>
                        <p>Tests cumules: {map.author.stats.tests_count}</p>
                        <p>Popularite createur: {map.author.stats.popularity}</p>
                        <p>Derniere mise a jour: {map.last_updated_at ? new Date(map.last_updated_at).toLocaleDateString() : "-"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-3xl border border-cyan-500/20 bg-white/5 p-5">
                    <p className="mb-3 text-sm uppercase tracking-[0.25em] text-slate-400">Reactions</p>
                    <div className="grid grid-cols-4 gap-3">
                      <button onClick={() => handleVote(map.id, 1)} className={`rounded-2xl px-4 py-3 text-xl transition ${map.user_vote === 1 ? "bg-emerald-500 text-slate-950" : "bg-emerald-500/20 hover:scale-105"}`}>+</button>
                      <button onClick={() => handleVote(map.id, -1)} className={`rounded-2xl px-4 py-3 text-xl transition ${map.user_vote === -1 ? "bg-rose-500 text-white" : "bg-rose-500/20 hover:scale-105"}`}>-</button>
                      <button onClick={() => handleFavorite(map.id)} className={`rounded-2xl px-4 py-3 text-xl transition ${map.is_favorited ? "bg-yellow-400 text-slate-950" : "bg-yellow-400/20 hover:scale-105"}`}>*</button>
                      <button onClick={() => handleTestMap(map.id)} className="rounded-2xl bg-cyan-500/20 px-4 py-3 text-sm font-semibold transition hover:scale-105">Test</button>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-cyan-500/20 bg-white/5 p-5">
                    <p className="mb-3 text-sm uppercase tracking-[0.25em] text-slate-400">Ajouter une version</p>
                    <textarea
                      value={versionNotes[map.id] || ""}
                      onChange={(e) => setVersionNotes((prev) => ({ ...prev, [map.id]: e.target.value }))}
                      rows={3}
                      placeholder="Notes de version"
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none"
                    />
                    <button onClick={() => handleAddVersion(map.id)} className="mt-3 w-full rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:scale-[1.02]">
                      Publier la version
                    </button>
                  </div>

                  <div className="rounded-3xl border border-pink-500/20 bg-white/5 p-5">
                    <p className="mb-3 text-sm uppercase tracking-[0.25em] text-slate-400">Commentaire</p>
                    <textarea
                      value={commentDrafts[map.id] || ""}
                      onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [map.id]: e.target.value }))}
                      rows={3}
                      placeholder="Votre retour sur la map"
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none"
                    />
                    <button onClick={() => handleComment(map.id)} className="mt-3 w-full rounded-2xl bg-pink-500 px-4 py-3 font-semibold text-slate-950 transition hover:scale-[1.02]">
                      Envoyer le commentaire
                    </button>
                  </div>

                  <div className="rounded-3xl border border-yellow-500/20 bg-white/5 p-5">
                    <p className="mb-3 text-sm uppercase tracking-[0.25em] text-slate-400">Signaler cette map</p>
                    <textarea
                      value={reportDrafts[map.id] || ""}
                      onChange={(e) => setReportDrafts((prev) => ({ ...prev, [map.id]: e.target.value }))}
                      rows={2}
                      placeholder="Raison du signalement"
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none"
                    />
                    <button onClick={() => handleReportMap(map.id)} className="mt-3 w-full rounded-2xl bg-yellow-400 px-4 py-3 font-semibold text-slate-950 transition hover:scale-[1.02]">
                      Signaler
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}
