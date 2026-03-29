import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import PageWrapper from "../components/PageWrapper";
import UserMenu from "../components/UserMenu";
import { getMe } from "../services/api";
import {
  addMapVersion,
  commentMap,
  createMap,
  getMaps,
  toggleFavoriteMap,
  voteMap,
} from "../services/maps";

const STATUS_OPTIONS = ["draft", "beta", "stable"];
const SORT_OPTIONS = [
  { value: "trending", label: "Trending" },
  { value: "top", label: "Top Rated" },
  { value: "favorites", label: "Most Favorited" },
  { value: "newest", label: "Newest" },
];

export default function Maps() {
  const [maps, setMaps] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("draft");
  const [tags, setTags] = useState("");
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [sort, setSort] = useState("trending");
  const [versionNotes, setVersionNotes] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});

  useEffect(() => {
    getMe().then(setCurrentUser).catch((error) => console.error(error));
  }, []);

  useEffect(() => {
    load();
  }, [search, selectedStatus, selectedTag, sort]);

  const load = async () => {
    try {
      setMaps(
        await getMaps({
          q: search,
          status: selectedStatus,
          tag: selectedTag,
          sort,
        })
      );
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

  const handleCreateMap = async (e) => {
    e.preventDefault();

    try {
      await createMap({
        title,
        description,
        status,
        tags: tags
          .split(",")
          .map((tagName) => tagName.trim())
          .filter(Boolean),
      });
      toast.success("Map publiee.");
      setTitle("");
      setDescription("");
      setStatus("draft");
      setTags("");
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

  return (
    <PageWrapper>
      <div className="min-h-screen p-6 text-white">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl text-purple-400 drop-shadow-[0_0_20px_rgba(192,132,252,0.7)]">
              Community Maps Hub
            </h1>
            <p className="mt-2 max-w-3xl text-slate-400">
              Explorez les maps de la communaute, suivez les tendances et construisez
              votre propre espace de creation avec versions, favoris et commentaires.
            </p>
          </div>
          <UserMenu user={currentUser} />
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="dashboard-card rounded-[2rem] p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-purple-300/70">
                  Discover
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white">Map Browser</h2>
              </div>
              <div className="rounded-full border border-purple-400/20 bg-purple-500/10 px-4 py-2 text-sm text-purple-200">
                {maps.length} maps visibles
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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
            </div>
          </div>

          <form
            onSubmit={handleCreateMap}
            className="dashboard-card rounded-[2rem] p-6"
          >
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/70">
              Creator Studio
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">Publier une nouvelle map</h2>
            <div className="mt-5 grid grid-cols-1 gap-4">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre de la map"
                className="rounded-2xl border border-cyan-500/20 bg-white/5 px-4 py-3 text-white outline-none"
                required
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description de l'experience"
                rows={4}
                className="rounded-2xl border border-cyan-500/20 bg-white/5 px-4 py-3 text-white outline-none"
                required
              />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="tags: duel, arena, cyber"
                  className="rounded-2xl border border-cyan-500/20 bg-white/5 px-4 py-3 text-white outline-none"
                />
              </div>
              <button
                type="submit"
                className="rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-400 px-6 py-3 font-semibold text-slate-950 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/30"
              >
                Publier la map
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          {maps.map((map) => (
            <div
              key={map.id}
              className="dashboard-card overflow-hidden rounded-[2rem] p-6 transition-all duration-200 hover:shadow-2xl hover:shadow-purple-500/20"
            >
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.7fr]">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-3xl font-bold text-white">{map.title}</h2>
                    <span className="rounded-full border border-purple-400/30 bg-purple-500/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-purple-300">
                      {map.status}
                    </span>
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-cyan-200">
                      by {map.author.pseudo}
                    </span>
                  </div>

                  <p className="mt-4 max-w-4xl text-slate-300">{map.description}</p>

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

                  <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Score</p>
                      <p className="mt-2 text-2xl font-bold text-yellow-300">{map.score}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Likes</p>
                      <p className="mt-2 text-2xl font-bold text-emerald-300">{map.likes}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Favoris</p>
                      <p className="mt-2 text-2xl font-bold text-pink-300">{map.favorites}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Commentaires</p>
                      <p className="mt-2 text-2xl font-bold text-cyan-300">{map.comments_count}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Popularite</p>
                      <p className="mt-2 text-2xl font-bold text-purple-300">{map.popularity}</p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                      <p className="mb-3 text-sm uppercase tracking-[0.25em] text-slate-400">
                        Versions
                      </p>
                      <div className="space-y-2">
                        {map.versions.map((version) => (
                          <div
                            key={version.id}
                            className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-semibold text-cyan-300">{version.version}</p>
                              <p className="text-xs text-slate-500">
                                {new Date(version.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <p className="mt-2 text-sm text-slate-300">{version.notes}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                      <p className="mb-3 text-sm uppercase tracking-[0.25em] text-slate-400">
                        Community Feed
                      </p>
                      <div className="space-y-2">
                        {map.comments.slice(0, 4).map((comment) => (
                          <div
                            key={comment.id}
                            className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-semibold text-pink-300">Player {comment.author_id}</p>
                              <p className="text-xs text-slate-500">
                                {new Date(comment.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <p className="mt-2 text-sm text-slate-300">{comment.content}</p>
                          </div>
                        ))}
                        {map.comments.length === 0 && (
                          <p className="text-sm text-slate-500">Aucun commentaire pour le moment.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-3xl border border-cyan-500/20 bg-white/5 p-5">
                    <p className="mb-3 text-sm uppercase tracking-[0.25em] text-slate-400">
                      Reactions
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => handleVote(map.id, 1)}
                        className={`rounded-2xl px-4 py-3 text-xl transition ${
                          map.user_vote === 1
                            ? "bg-emerald-500 text-slate-950"
                            : "bg-emerald-500/20 hover:scale-105"
                        }`}
                      >
                        👍
                      </button>
                      <button
                        onClick={() => handleVote(map.id, -1)}
                        className={`rounded-2xl px-4 py-3 text-xl transition ${
                          map.user_vote === -1
                            ? "bg-rose-500 text-white"
                            : "bg-rose-500/20 hover:scale-105"
                        }`}
                      >
                        👎
                      </button>
                      <button
                        onClick={() => handleFavorite(map.id)}
                        className={`rounded-2xl px-4 py-3 text-xl transition ${
                          map.is_favorited
                            ? "bg-yellow-400 text-slate-950"
                            : "bg-yellow-400/20 hover:scale-105"
                        }`}
                      >
                        ★
                      </button>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-cyan-500/20 bg-white/5 p-5">
                    <p className="mb-3 text-sm uppercase tracking-[0.25em] text-slate-400">
                      Ajouter une version
                    </p>
                    <textarea
                      value={versionNotes[map.id] || ""}
                      onChange={(e) =>
                        setVersionNotes((prev) => ({ ...prev, [map.id]: e.target.value }))
                      }
                      rows={3}
                      placeholder="Notes de version"
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none"
                    />
                    <button
                      onClick={() => handleAddVersion(map.id)}
                      className="mt-3 w-full rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:scale-[1.02]"
                    >
                      Publier la version
                    </button>
                  </div>

                  <div className="rounded-3xl border border-pink-500/20 bg-white/5 p-5">
                    <p className="mb-3 text-sm uppercase tracking-[0.25em] text-slate-400">
                      Laisser un commentaire
                    </p>
                    <textarea
                      value={commentDrafts[map.id] || ""}
                      onChange={(e) =>
                        setCommentDrafts((prev) => ({ ...prev, [map.id]: e.target.value }))
                      }
                      rows={4}
                      placeholder="Votre retour sur la map"
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white outline-none"
                    />
                    <button
                      onClick={() => handleComment(map.id)}
                      className="mt-3 w-full rounded-2xl bg-pink-500 px-4 py-3 font-semibold text-slate-950 transition hover:scale-[1.02]"
                    >
                      Envoyer le commentaire
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
