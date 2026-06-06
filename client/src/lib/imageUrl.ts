import { withBasePath } from "./basePath";

export function toImgUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("/") && !url.startsWith("//")) return withBasePath(url);
  return url;
}

export function toThumbnailUrl(url: string | null | undefined): string {
  return toImgUrl(url);
}
