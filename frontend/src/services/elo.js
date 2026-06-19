import { API_URL as API } from "../config";

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
