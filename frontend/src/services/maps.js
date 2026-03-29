const API = "http://127.0.0.1:8000";

export const getMaps = async (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      query.set(key, value);
    }
  });

  const token = localStorage.getItem("token");
  const res = await fetch(`${API}/maps?${query.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!res.ok) {
    throw new Error("Unable to fetch maps");
  }

  return res.json();
};

export const createMap = async ({ title, description, status, tags }) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/maps/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title, description, status, tags }),
  });

  if (!res.ok) {
    throw new Error("Unable to create map");
  }

  return res.json();
};

export const addMapVersion = async (mapId, notes) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/maps/version`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ map_id: mapId, notes }),
  });

  if (!res.ok) {
    throw new Error("Unable to add map version");
  }

  return res.json();
};

export const voteMap = async (id, value) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/maps/vote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ map_id: id, value }),
  });

  if (!res.ok) {
    throw new Error("Unable to vote on map");
  }

  return res.json();
};

export const toggleFavoriteMap = async (id) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/maps/favorite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ map_id: id }),
  });

  if (!res.ok) {
    throw new Error("Unable to favorite map");
  }

  return res.json();
};

export const commentMap = async (id, content) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/maps/comment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ map_id: id, content }),
  });

  if (!res.ok) {
    throw new Error("Unable to comment on map");
  }

  return res.json();
};
