import { type Express } from "express";

const SITE_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-labelledby="title desc">
  <title id="title">기쁨이 있는 곳 인생기념관</title>
  <desc id="desc">기쁨이 있는 곳 인생기념관 서비스 아이콘</desc>
  <rect width="64" height="64" rx="18" fill="#7a835f"/>
  <path d="M32 15v34M15 32h34" fill="none" stroke="#fffdf8" stroke-width="6" stroke-linecap="round"/>
  <circle cx="32" cy="32" r="7" fill="#fffdf8"/>
  <path d="M22 20c3-3 7-5 10-5s7 2 10 5M22 44c3 3 7 5 10 5s7-2 10-5" fill="none" stroke="#e8decd" stroke-width="2.5" stroke-linecap="round"/>
</svg>`;

const LEGACY_ICON_PATHS = [
  "/favicon.ico",
  "/logo.png",
  "/icon.png",
  "/apple-touch-icon.png",
];

export function registerSiteAssetFallbacks(app: Express) {
  app.get(LEGACY_ICON_PATHS, (_req, res) => {
    res
      .status(200)
      .set({
        "Cache-Control": "public, max-age=86400",
        "Content-Type": "image/svg+xml; charset=utf-8",
      })
      .send(SITE_ICON_SVG);
  });
}
