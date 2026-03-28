import { useEffect } from "react";
import PageWrapper from "../components/PageWrapper";

export default function OAuthSuccess() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem("token", token);
      window.location.href = "/dashboard";
    }
  }, []);

  return (
    <PageWrapper>
      <div className="flex min-h-screen items-center justify-center text-white">
        <p className="text-xl text-cyan-400">Connexion Google en cours...</p>
      </div>
    </PageWrapper>
  );
}
