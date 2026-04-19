const API = "http://127.0.0.1:8000";

const authHeaders = (json = false) => ({
  ...(json ? { "Content-Type": "application/json" } : {}),
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const getShopOverview = async () => {
  const res = await fetch(`${API}/shop/overview`, {
    headers: authHeaders(),
  });

  if (!res.ok) {
    throw new Error("Unable to fetch shop overview");
  }

  return res.json();
};

export const purchaseShopItem = async (sku) => {
  const res = await fetch(`${API}/shop/items/${sku}/purchase`, {
    method: "POST",
    headers: authHeaders(),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Unable to purchase item");
  }

  return res.json();
};

export const checkoutPack = async (sku, provider) => {
  const res = await fetch(`${API}/shop/packs/${sku}/checkout`, {
    method: "POST",
    headers: authHeaders(true),
    body: JSON.stringify({ provider }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Unable to checkout pack");
  }

  return res.json();
};

export const purchaseSeasonPass = async () => {
  const res = await fetch(`${API}/shop/season-pass/purchase`, {
    method: "POST",
    headers: authHeaders(),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Unable to purchase season pass");
  }

  return res.json();
};

export const claimSeasonPassTier = async (tier) => {
  const res = await fetch(`${API}/shop/season-pass/claim/${tier}`, {
    method: "POST",
    headers: authHeaders(),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Unable to claim season pass tier");
  }

  return res.json();
};

export const equipInventoryItem = async (inventoryId) => {
  const res = await fetch(`${API}/shop/inventory/${inventoryId}/equip`, {
    method: "POST",
    headers: authHeaders(),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Unable to equip inventory item");
  }

  return res.json();
};
