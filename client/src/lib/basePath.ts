function normalizeBasePath(value: string | undefined) {
  const raw = (value || "").trim();
  if (!raw || raw === "/") return "";

  const pathOnly = raw.split("?")[0].split("#")[0].replace(/\/+$/, "");
  if (!pathOnly) return "";

  return `/${pathOnly.replace(/^\/+/, "")}`;
}

export const APP_BASE_PATH = normalizeBasePath(import.meta.env.VITE_BASE_PATH);

export function stripBasePath(path: string) {
  if (!APP_BASE_PATH) return path || "/";
  if (path === APP_BASE_PATH) return "/";
  if (path.startsWith(`${APP_BASE_PATH}/`)) {
    return path.slice(APP_BASE_PATH.length) || "/";
  }
  return path || "/";
}

export function withBasePath(path: string) {
  if (!path) return APP_BASE_PATH || "/";
  if (/^(https?:|mailto:|tel:|#)/i.test(path)) return path;

  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!APP_BASE_PATH) return normalized;
  if (normalized === APP_BASE_PATH || normalized.startsWith(`${APP_BASE_PATH}/`)) {
    return normalized;
  }

  return `${APP_BASE_PATH}${normalized}`;
}

export function getCurrentAppPath() {
  if (typeof window === "undefined") return "/";
  return stripBasePath(`${window.location.pathname}${window.location.search}`);
}
