import { useState } from "react";
import toast from "react-hot-toast";
import PageWrapper from "../components/PageWrapper";
import { forgotPassword } from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = await forgotPassword(email);
      toast.success(data.message);
    } catch (error) {
      console.error(error);
      toast.error("Impossible d'envoyer l'email de reinitialisation.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageWrapper>
      <div className="flex min-h-screen items-center justify-center p-6 text-white">
        <div className="login-card w-full max-w-md border border-cyan-500/30 bg-white/5 shadow-2xl">
          <div className="scanner" />
          <div className="mb-8 text-center">
            <h1 className="mb-3 text-4xl font-black text-cyan-400 drop-shadow-[0_0_20px_rgba(0,212,255,0.7)]">
              MOT DE PASSE OUBLIE
            </h1>
            <p className="text-white/70">
              Entrez votre email pour recevoir un lien de reinitialisation.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-14 w-full rounded-2xl border-2 border-cyan-500/30 bg-white/5 p-4 text-lg text-white outline-none transition-all duration-300 focus:scale-[1.02] focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20"
              placeholder="Email"
            />

            <button
              type="submit"
              disabled={isLoading}
              className="h-14 w-full rounded-2xl bg-cyan-500 px-6 py-3 text-lg font-black uppercase tracking-wider text-slate-950 transition-all duration-300 hover:scale-[1.05] hover:shadow-2xl hover:shadow-cyan-500/50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "ENVOI..." : "ENVOYER LE LIEN"}
            </button>
          </form>
        </div>
      </div>
    </PageWrapper>
  );
}
