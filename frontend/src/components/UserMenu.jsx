import { useMemo, useState } from "react";

export default function UserMenu({ user }) {
  const [isOpen, setIsOpen] = useState(false);

  const initials = useMemo(() => {
    const source = user?.pseudo || user?.email || "GD";
    return source.slice(0, 2).toUpperCase();
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("match");
    window.location.href = "/";
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((value) => !value)}
        className="flex items-center gap-3 rounded-full border border-cyan-400/30 bg-slate-950/70 px-3 py-2 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/20"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 via-sky-500 to-pink-500 font-black text-slate-950">
          {initials}
        </div>
        <div className="hidden text-left sm:block">
          <p className="max-w-40 truncate text-sm font-semibold text-white">
            {user?.pseudo || "Profil"}
          </p>
          <p className="max-w-40 truncate text-xs text-slate-400">
            {user?.email || "Compte"}
          </p>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-3 w-56 rounded-2xl border border-cyan-500/20 bg-slate-950/95 p-2 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
          <button
            onClick={() => {
              window.location.href = "/profile";
            }}
            className="w-full rounded-xl px-4 py-3 text-left text-sm text-white transition hover:bg-white/10"
          >
            Voir profil
          </button>
          <button
            onClick={handleLogout}
            className="w-full rounded-xl px-4 py-3 text-left text-sm text-red-300 transition hover:bg-red-500/10"
          >
            Se deconnecter
          </button>
        </div>
      )}
    </div>
  );
}
