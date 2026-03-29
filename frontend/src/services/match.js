const API = "http://127.0.0.1:8000";

export const getHistory = async ({ mode = "", period = "", player = "" } = {}) => {
  const token = localStorage.getItem("token");
  const params = new URLSearchParams();

  if (mode) {
    params.set("mode", mode);
  }
  if (period) {
    params.set("period", period);
  }
  if (player) {
    params.set("player", player);
  }

  const query = params.toString();
  const res = await fetch(`${API}/matchmaking/history${query ? `?${query}` : ""}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Unable to fetch history");
  }

  return res.json();
};
