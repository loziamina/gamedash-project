import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import PageWrapper from "../components/PageWrapper";
import { resetPassword } from "../services/api";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const token = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("token") || "";
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("Lien de reinitialisation invalide.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsLoading(true);

    try {
      const data = await resetPassword(token, password);
      toast.success(data.message);
      window.location.href = "/";
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Impossible de reinitialiser le mot de passe.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageWrapper>
      <div className="flex min-h-screen items-center justify-center p-6 text-white">
        <div className="login-card w-full max-w-md border border-pink-500/30 bg-white/5 shadow-2xl">
          <div className="scanner" />
          <div className="mb-8 text-center">
            <h1 className="mb-3 text-4xl font-black text-pink-400 drop-shadow-[0_0_20px_rgba(236,72,153,0.7)]">
              NOUVEAU MOT DE PASSE
            </h1>
            <p className="text-white/70">
              Choisissez un nouveau mot de passe pour votre compte GameDash.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-14 w-full rounded-2xl border-2 border-pink-500/30 bg-white/5 p-4 text-lg text-white outline-none transition-all duration-300 focus:scale-[1.02] focus:border-pink-400 focus:ring-4 focus:ring-pink-500/20"
              placeholder="Nouveau mot de passe"
            />

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="h-14 w-full rounded-2xl border-2 border-yellow-500/30 bg-white/5 p-4 text-lg text-white outline-none transition-all duration-300 focus:scale-[1.02] focus:border-yellow-400 focus:ring-4 focus:ring-yellow-500/20"
              placeholder="Confirmer le mot de passe"
            />

            <button
              type="submit"
              disabled={isLoading}
              className="h-14 w-full rounded-2xl bg-pink-500 px-6 py-3 text-lg font-black uppercase tracking-wider text-slate-950 transition-all duration-300 hover:scale-[1.05] hover:shadow-2xl hover:shadow-pink-500/50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "REINITIALISATION..." : "REINITIALISER"}
            </button>
          </form>
        </div>
      </div>
    </PageWrapper>
  );
}
