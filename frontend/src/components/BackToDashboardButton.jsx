export default function BackToDashboardButton({ className = "" }) {
  return (
    <button
      onClick={() => {
        window.location.href = "/dashboard";
      }}
      className={`rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-5 py-3 font-semibold text-cyan-200 transition-all duration-200 hover:scale-[1.02] hover:border-cyan-300/40 hover:bg-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/20 active:scale-95 ${className}`.trim()}
    >
      Retour Dashboard
    </button>
  );
}
