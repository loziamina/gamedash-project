import { useEffect, useState } from "react";
import { login } from "../services/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setParticles((prev) => {
        const newParticles = [...prev];
        for (let i = 0; i < 5; i += 1) {
          newParticles.push({
            id: Date.now() + i,
            x: Math.random() * 100,
            size: Math.random() * 6 + 2,
            duration: Math.random() * 5 + 6,
            delay: 0,
          });
        }
        return newParticles.filter((particle) => Date.now() - particle.id < 11000);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = await login(email, password);

      if (data?.access_token) {
        localStorage.setItem("token", data.access_token);
      } else {
        throw new Error("Token non recu");
      }

      window.location.href = "/dashboard";
    } catch (err) {
      console.error(err);
      alert(
        "Erreur login: " +
          (err.response?.data?.detail || "Verifiez vos identifiants")
      );
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 grid-bg z-0" />

      <div className="fixed inset-0 particles-container z-10 overflow-hidden">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="particle absolute rounded-full bg-gradient-to-r from-cyan-400 via-pink-500 to-yellow-400 shadow-lg"
            style={{
              left: `${particle.x}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animation: `float ${particle.duration}s linear infinite`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-20 flex min-h-screen items-center justify-center p-6">
        <div className="login-card w-full max-w-md border border-cyan-500/30 bg-white/5 shadow-2xl">
          <div className="scanner" />

          <div className="logo mb-10 text-center">
            <h1 className="mb-3 bg-gradient-to-r from-cyan-400 via-pink-500 to-yellow-400 bg-clip-text text-5xl font-black text-transparent drop-shadow-2xl animate-glow md:text-6xl">
              GAME DASH
            </h1>
            <p className="text-lg font-light tracking-wider text-cyan-200/70">
              Entrez dans l'arene
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="input-group relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field peer h-14 w-full rounded-2xl border-2 border-cyan-500/30 bg-white/5 p-4 text-lg text-white outline-none transition-all duration-300 placeholder-transparent focus:scale-[1.02] focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20"
                placeholder=" "
              />
              <label className="input-label absolute left-4 top-4 text-sm font-semibold text-cyan-300 transition-all duration-300 peer-focus:-top-[10px] peer-focus:left-3 peer-focus:rounded-lg peer-focus:bg-slate-900/90 peer-focus:px-2 peer-focus:text-xs peer-focus:text-cyan-200">
                Email
              </label>
            </div>

            <div className="input-group relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-field peer h-14 w-full rounded-2xl border-2 border-pink-500/30 bg-white/5 p-4 text-lg text-white outline-none transition-all duration-300 placeholder-transparent focus:scale-[1.02] focus:border-pink-400 focus:ring-4 focus:ring-pink-500/20"
                placeholder=" "
              />
              <label className="input-label absolute left-4 top-4 text-sm font-semibold text-pink-300 transition-all duration-300 peer-focus:-top-[10px] peer-focus:left-3 peer-focus:rounded-lg peer-focus:bg-slate-900/90 peer-focus:px-2 peer-focus:text-xs peer-focus:text-pink-200">
                Mot de passe
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary h-14 w-full rounded-2xl text-lg font-black uppercase tracking-wider transition-all duration-300 hover:scale-[1.05] hover:shadow-2xl hover:shadow-cyan-500/50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none"
            >
              {isLoading ? "CONNEXION EN COURS..." : "ENTRER DANS L'ARENE"}
            </button>
          </form>

          <div className="sso-section mt-10 border-t border-white/10 pt-8">
            <div className="sso-title mb-6 text-center text-xs uppercase tracking-wider text-white/50">
              Ou connectez-vous avec
            </div>
            <div className="sso-buttons flex flex-col justify-center gap-4 sm:flex-row">
              <button className="sso-btn flex h-14 items-center justify-center gap-3 rounded-2xl border-2 border-white/20 bg-white/5 px-6 font-mono font-semibold transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400 hover:bg-cyan-500/10 hover:shadow-xl hover:shadow-cyan-400/30">
                <span className="text-2xl">S</span>
                Steam
              </button>
              <button
                onClick={() => {
                  window.location.href = "http://localhost:8000/auth/google";
                }}
                className="sso-btn flex h-14 items-center justify-center gap-3 rounded-2xl border-2 border-white/20 bg-white/5 px-6 font-mono font-semibold transition-all duration-300 hover:-translate-y-1 hover:border-pink-400 hover:bg-pink-500/10 hover:shadow-xl hover:shadow-pink-400/30"
              >
                <span className="text-2xl">G</span>
                Google
              </button>
            </div>
          </div>

          <div className="signup-link mt-8 border-t border-white/10 pt-6 text-center">
            <span className="text-sm text-white/60">Pas de compte ? </span>
            <a
              href="/register"
              className="font-semibold text-cyan-400 transition-all duration-200 hover:text-cyan-300 hover:underline hover:shadow-glow"
            >
              Creer un compte
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
