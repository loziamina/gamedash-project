const API = "http://127.0.0.1:8000";

export const getEloHistory = async (mode = "ranked") => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/matchmaking/elo-history?mode=${mode}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Unable to fetch ELO history");
  }

  return res.json();
};
