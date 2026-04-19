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

export const getMatchmakingSettings = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/admin/matchmaking-settings`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Unable to fetch matchmaking settings");
  }

  return res.json();
};

export const updateMatchmakingSettings = async (payload) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/admin/matchmaking-settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Unable to update matchmaking settings");
  }

  return res.json();
};

export const getMatchmakingOverview = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/admin/matchmaking-overview`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Unable to fetch matchmaking overview");
  }

  return res.json();
};

export const getRankSettings = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/admin/rank-settings`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Unable to fetch rank settings");
  }

  return res.json();
};

export const updateRankSettings = async (payload) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/admin/rank-settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Unable to update rank settings");
  }

  return res.json();
};

export const getRewardSettings = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/admin/reward-settings`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Unable to fetch reward settings");
  }

  return res.json();
};

export const getEconomySettings = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/admin/economy-settings`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Unable to fetch economy settings");
  }

  return res.json();
};

export const updateEconomySettings = async (payload) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/admin/economy-settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Unable to update economy settings");
  }

  return res.json();
};

export const getStoreItems = async () => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API}/admin/store-items`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Unable to fetch store items");
  }

  return res.json();
};

export const upsertStoreItem = async (payload) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API}/admin/store-items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Unable to save store item");
  }

  return res.json();
};

export const getStorePacks = async () => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API}/admin/store-packs`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Unable to fetch store packs");
  }

  return res.json();
};

export const upsertStorePack = async (payload) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API}/admin/store-packs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Unable to save store pack");
  }

  return res.json();
};

export const getEconomyTransactions = async () => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API}/admin/economy-transactions`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Unable to fetch economy transactions");
  }

  return res.json();
};

export const updateRewardSettings = async (payload) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/admin/reward-settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Unable to update reward settings");
  }

  return res.json();
};

export const getSanctions = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/admin/sanctions`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Unable to fetch sanctions");
  }

  return res.json();
};

export const getMapsOverview = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/admin/maps/overview`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Unable to fetch maps overview");
  }

  return res.json();
};

export const getAdminMaps = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/admin/maps`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Unable to fetch admin maps");
  }

  return res.json();
};

export const moderateMap = async (mapId, payload) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/admin/maps/${mapId}/moderate`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Unable to moderate map");
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
