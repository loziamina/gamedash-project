const API = "http://127.0.0.1:8000";

export const getEloHistory = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/matchmaking/elo-history`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
};
