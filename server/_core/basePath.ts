function normalizeBasePath(value: string | undefined) {
  const raw = (value || "").trim();
  if (!raw || raw === "/") return "";

  let pathOnly = raw;
  try {
    pathOnly = new URL(raw).pathname;
  } catch {
    pathOnly = raw.split("?")[0].split("#")[0];
  }

  pathOnly = pathOnly.replace(/\/+$/, "");
  if (!pathOnly) return "";

  return `/${pathOnly.replace(/^\/+/, "")}`;
}

export const APP_BASE_PATH = normalizeBasePath(
  process.env.APP_BASE_PATH || process.env.VITE_BASE_PATH
);

export function stripBasePath(pathname: string) {
  if (!APP_BASE_PATH) return pathname || "/";
  if (pathname === APP_BASE_PATH) return "/";
  if (pathname.startsWith(`${APP_BASE_PATH}/`)) {
    return pathname.slice(APP_BASE_PATH.length) || "/";
  }
  return pathname || "/";
}

export function withBasePath(pathname: string) {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (!APP_BASE_PATH) return normalized;
  if (normalized === APP_BASE_PATH || normalized.startsWith(`${APP_BASE_PATH}/`)) {
    return normalized;
  }
  return `${APP_BASE_PATH}${normalized}`;
}

export function getMountPaths(pathname: string) {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (!APP_BASE_PATH) return [normalized];
  return [normalized, withBasePath(normalized)];
}
