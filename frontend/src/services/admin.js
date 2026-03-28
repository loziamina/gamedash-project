const API = "http://127.0.0.1:8000";

export const getAdminStats = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Unable to fetch admin stats");
  }

  return res.json();
};

export const getUsers = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/admin/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Unable to fetch users");
  }

  return res.json();
};

export const banUser = async (id) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/admin/ban/${id}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Unable to ban user");
  }
};

export const unbanUser = async (id) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/admin/unban/${id}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Unable to unban user");
  }
};
