import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import PageWrapper from "../components/PageWrapper";
import { getCheckoutSession, resolveCheckoutSession } from "../services/shop";

const providerThemes = {
  stripe: {
    accent: "bg-violet-500",
    border: "border-violet-400/30",
    glow: "shadow-violet-500/20",
    label: "Stripe",
  },
  paypal: {
    accent: "bg-sky-500",
    border: "border-sky-400/30",
    glow: "shadow-sky-500/20",
    label: "PayPal",
  },
};

export default function CheckoutSim() {
  const { providerSlug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const provider = providerSlug?.replace("-sim", "") || "stripe";
  const theme = providerThemes[provider] || providerThemes.stripe;
  const externalRef = searchParams.get("session");

  useEffect(() => {
    const load = async () => {
      if (!externalRef) {
        toast.error("Session de paiement manquante.");
        navigate("/store");
        return;
      }

      try {
        const data = await getCheckoutSession(externalRef);
        setSession(data);
      } catch (error) {
        console.error(error);
        toast.error(error.message || "Impossible de charger la session.");
        navigate("/store");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [externalRef, navigate]);

  const handleDecision = async (action) => {
    try {
      setBusy(true);
      await resolveCheckoutSession(externalRef, action);
      toast.success(action === "confirm" ? "Paiement simule confirme." : "Paiement simule annule.");
      navigate("/store");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Operation impossible.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex min-h-screen items-center justify-center text-white">
          Chargement du checkout...
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="flex min-h-screen items-center justify-center p-6 text-white">
        <div className={`w-full max-w-2xl rounded-[32px] border ${theme.border} bg-slate-950/90 p-8 shadow-2xl ${theme.glow}`}>
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Checkout simule</p>
              <h1 className="mt-2 text-4xl font-black text-white">{theme.label}</h1>
            </div>
            <div className={`rounded-2xl ${theme.accent} px-4 py-2 text-sm font-bold text-white`}>
              {session?.status?.toUpperCase()}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Pack</p>
              <p className="mt-2 text-2xl font-bold text-white">{session?.pack?.name || "-"}</p>
              <p className="mt-2 text-sm text-slate-400">{session?.pack?.description || "Pack boutique simule."}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Montant</p>
              <p className="mt-2 text-2xl font-bold text-white">
                {session?.amount_cents ? (session.amount_cents / 100).toFixed(2) : "0.00"} EUR
              </p>
              <p className="mt-2 text-sm text-slate-400">Reference: {session?.external_ref}</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Contenu credite apres confirmation</p>
            <p className="mt-3 text-lg text-white">
              +{session?.pack?.total_soft_currency ?? 0} soft | +{session?.pack?.total_hard_currency ?? 0} hard
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <button
              disabled={busy || session?.status !== "pending"}
              onClick={() => handleDecision("confirm")}
              className={`rounded-2xl ${theme.accent} px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50`}
            >
              Confirmer le paiement
            </button>
            <button
              disabled={busy || session?.status !== "pending"}
              onClick={() => handleDecision("cancel")}
              className="rounded-2xl border border-white/10 px-6 py-3 font-semibold text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={() => navigate("/store")}
              className="rounded-2xl border border-white/10 px-6 py-3 font-semibold text-slate-400"
            >
              Retour boutique
            </button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
