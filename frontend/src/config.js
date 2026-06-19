const DEFAULT_API_URL = "http://127.0.0.1:8000";

export const API_URL = import.meta.env.VITE_API_URL || DEFAULT_API_URL;

export function getWebSocketUrl(path) {
  const wsBase = API_URL.replace(/^https:\/\//i, "wss://").replace(/^http:\/\//i, "ws://");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${wsBase}${normalizedPath}`;
}
