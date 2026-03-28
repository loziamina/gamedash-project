const API = "http://127.0.0.1:8000";

export const getStats = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/dashboard/stats`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
};