import { useState, useEffect } from "react";
import { login } from "../services/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [particles, setParticles] = useState([]);
  
  // Générateur particules 
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => {
        const newParticles = [...prev];
        for (let i = 0; i < 5; i++) {
          newParticles.push({
            id: Date.now() + i,
            x: Math.random() * 100,
            size: Math.random() * 6 + 2,
            duration: Math.random() * 5 + 6,
            delay: 0
          });
        }
        // Nettoie les anciennes
        return newParticles.filter(p => Date.now() - p.id < 11000);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

const handleLogin = async (e) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    const data = await login(email, password);

    // sauvegarde token (important pour WS + API)
    if (data?.access_token) {
      localStorage.setItem("token", data.access_token);
    } else {
      throw new Error("Token non reçu");
    }

    // redirection propre
    window.location.href = "/dashboard";

  } catch (err) {
    console.error(err);

    alert(
      "Erreur login: " +
      (err.response?.data?.detail || "Vérifiez vos identifiants")
    );

    setIsLoading(false);
  }
};
  return (
    <>
      {/* GRID BG ANIMÉ */}
      <div className="fixed inset-0 grid-bg z-0" />

      {/* PARTICULES COSMIQUES */}
      <div className="fixed inset-0 particles-container z-10 overflow-hidden">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="particle absolute bg-gradient-to-r from-cyan-400 via-pink-500 to-yellow-400 rounded-full shadow-lg"
            style={{
              left: `${particle.x}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animation: `float ${particle.duration}s linear infinite`,
              animationDelay: `${particle.delay}s`
            }}
          />
        ))}
      </div>

      {/* CARTE LOGIN PRINCIPALE */}
      <div className="flex items-center justify-center min-h-screen p-6 relative z-20">
        <div className="login-card w-full max-w-md bg-white/5 border border-cyan-500/30 shadow-2xl">          
          {/* SCANNER SECURITY */}
          <div className="scanner" />

          {/* LOGO */}
          <div className="logo mb-10 text-center">
            <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-cyan-400 via-pink-500 to-yellow-400 bg-clip-text text-transparent drop-shadow-2xl mb-3 animate-glow">
              GAME DASH
            </h1>
            <p className="text-lg text-cyan-200/70 font-light tracking-wider">
              Entrez dans l'arène
            </p>
          </div>

          {/* FORMULAIRE */}
          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* EMAIL */}
            <div className="input-group relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field peer w-full h-14 p-4 bg-white/5 backdrop-blur-sm border-2 border-cyan-500/30 rounded-2xl text-white font-mono text-lg placeholder-transparent focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 focus:scale-[1.02] transition-all duration-300 outline-none"
                placeholder=" "
              />
              <label 
                className="input-label absolute left-4 top-4 text-cyan-300 text-sm font-semibold peer-focus:text-xs peer-focus:top-[-10px] peer-focus:left-3 peer-focus:bg-slate-900/90 peer-focus:px-2 peer-focus:rounded-lg peer-focus:text-cyan-200 peer-not-empty:text-xs peer-not-empty:top-[-10px] peer-not-empty:left-3 peer-not-empty:bg-slate-900/90 peer-not-empty:px-2 peer-not-empty:rounded-lg transition-all duration-300"
              >
                Email
              </label>
            </div>

            {/* PASSWORD */}
            <div className="input-group relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-field peer w-full h-14 p-4 bg-white/5 backdrop-blur-sm border-2 border-pink-500/30 rounded-2xl text-white font-mono text-lg placeholder-transparent focus:border-pink-400 focus:ring-4 focus:ring-pink-500/20 focus:scale-[1.02] transition-all duration-300 outline-none"
                placeholder=" "
              />
              <label 
                className="input-label absolute left-4 top-4 text-pink-300 text-sm font-semibold peer-focus:text-xs peer-focus:top-[-10px] peer-focus:left-3 peer-focus:bg-slate-900/90 peer-focus:px-2 peer-focus:rounded-lg peer-focus:text-pink-200 peer-not-empty:text-xs peer-not-empty:top-[-10px] peer-not-empty:left-3 peer-not-empty:bg-slate-900/90 peer-not-empty:px-2 peer-not-empty:rounded-lg transition-all duration-300"
              >
                Mot de passe
              </label>
            </div>

            {/* BOUTON LOGIN */}
            <button 
              type="submit" 
              disabled={isLoading}
              className="btn-primary w-full h-14 rounded-2xl font-black text-lg uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none hover:scale-[1.05] hover:shadow-2xl hover:shadow-cyan-500/50 active:scale-[0.98] active:animate-shockwave transition-all duration-300"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⚡</span>
                  CONNEXION EN COURS...
                </>
              ) : (
                "🔐 ENTRER DANS L'ARÈNE"
              )}
            </button>
          </form>

          {/* SSO */}
          <div className="sso-section mt-10 pt-8 border-t border-white/10">
            <div className="sso-title text-xs uppercase tracking-wider text-white/50 mb-6 text-center">
              Ou connectez-vous avec
            </div>
            <div className="sso-buttons flex flex-col sm:flex-row gap-4 justify-center">
              <button className="sso-btn flex items-center justify-center gap-3 h-14 px-6 rounded-2xl border-2 border-white/20 bg-white/5 backdrop-blur-sm hover:border-cyan-400 hover:bg-cyan-500/10 hover:shadow-xl hover:shadow-cyan-400/30 hover:-translate-y-1 transition-all duration-300 font-mono font-semibold">
                <span className="text-2xl">🎮</span>
                Steam
              </button>
              <button className="sso-btn flex items-center justify-center gap-3 h-14 px-6 rounded-2xl border-2 border-white/20 bg-white/5 backdrop-blur-sm hover:border-pink-400 hover:bg-pink-500/10 hover:shadow-xl hover:shadow-pink-400/30 hover:-translate-y-1 transition-all duration-300 font-mono font-semibold">
                <span className="text-2xl">💬</span>
                Discord
              </button>
            </div>
          </div>

          {/* LIEN INSCRIPTION */}
          <div className="signup-link mt-8 pt-6 border-t border-white/10 text-center">
            <span className="text-sm text-white/60">Pas de compte ? </span>
            <a href="/register" className="text-cyan-400 hover:text-cyan-300 font-semibold hover:underline transition-all duration-200 hover:shadow-glow">
              Créer un compte
            </a>
          </div>
        </div>
      </div>
    </>
  );
}