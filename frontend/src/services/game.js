const API = "http://127.0.0.1:8000";

export const finishMatch = async (match_id, winner_id) => {
  const token = localStorage.getItem("token");

  await fetch(`${API}/matchmaking/result?match_id=${match_id}&winner_id=${winner_id}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  await fetch(`${API}/matchmaking/finish?match_id=${match_id}&winner_id=${winner_id}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};