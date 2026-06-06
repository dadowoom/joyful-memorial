import type { Express } from "express";
import express from "express";
import { ENV } from "./env";
import { getMountPaths } from "./basePath";
import { UPLOAD_DIR, UPLOAD_URL_PREFIX } from "../storage";

export function registerStorageProxy(app: Express) {
  getMountPaths(UPLOAD_URL_PREFIX).forEach(pathname => {
    app.use(
      pathname,
      express.static(UPLOAD_DIR, {
        fallthrough: false,
        maxAge: "30d",
        immutable: true,
      })
    );
  });

  const proxyHandler = async (req: express.Request, res: express.Response) => {
    const key = (req.params as unknown as Record<string, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(404).send("Storage object not found");
      return;
    }

    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);

      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });

      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }

      const { url } = (await forgeResp.json()) as { url: string };
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }

      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  };

  getMountPaths("/manus-storage").forEach(pathname => {
    app.get(`${pathname}/*`, proxyHandler);
  });
}
