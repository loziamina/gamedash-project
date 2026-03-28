const API = "http://127.0.0.1:8000";

export const joinQueue = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/matchmaking/join`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
};

export const leaveQueue = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/matchmaking/leave`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
};

export const createMatch = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/matchmaking/match`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
};