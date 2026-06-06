export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

import { getCurrentAppPath, stripBasePath, withBasePath } from "@/lib/basePath";

export const getLoginUrl = (redirectTo?: string) => {
  const rawNext =
    redirectTo ||
    (typeof window !== "undefined"
      ? getCurrentAppPath()
      : "/");
  const next = stripBasePath(rawNext);

  if (!next || next === "/" || next.startsWith("/login")) {
    return withBasePath("/login");
  }

  return withBasePath(`/login?redirect=${encodeURIComponent(next)}`);
};
