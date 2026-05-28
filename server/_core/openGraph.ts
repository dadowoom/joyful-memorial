import type { Request } from "express";
import { getMemorialShareBySlug } from "../db";

const SERVICE_TITLE = "기쁨이 있는 곳 인생기념관";
const DEFAULT_DESCRIPTION =
  "부모님의 인생과 가족의 기억을 사진, 글, 영상으로 밝고 따뜻하게 남기는 온라인 인생기념관입니다.";
const DEFAULT_IMAGE = "/joyful-memorial-hero.png";
const MEMORIAL_PATH = /^\/memorial\/([^/?#]+)(?:\/(?:archive|family))?\/?$/;
const RESERVED_SLUGS = new Set(["create", "search"]);

type PageMeta = {
  title: string;
  description: string;
  url: string;
  image: string;
  imageAlt: string;
  type?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getSiteOrigin(req: Request) {
  const configured = process.env.PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  const forwardedProto = req.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto = forwardedProto || req.protocol || "http";
  return `${proto}://${req.get("host")}`;
}

function getPath(req: Request, origin: string) {
  return new URL(req.originalUrl || req.url || "/", origin).pathname;
}

function toAbsoluteUrl(value: string | null | undefined, origin: string) {
  if (!value) return new URL(DEFAULT_IMAGE, origin).toString();

  try {
    return new URL(value).toString();
  } catch {
    return new URL(value.startsWith("/") ? value : `/${value}`, origin).toString();
  }
}

function replaceMetaContent(
  html: string,
  attributeName: "name" | "property",
  attributeValue: string,
  content: string
) {
  const pattern = new RegExp(
    `<meta\\s+[^>]*\\b${attributeName}=["']${escapeRegExp(attributeValue)}["'][^>]*>`,
    "i"
  );
  const tag = `<meta ${attributeName}="${attributeValue}" content="${escapeHtml(content)}" />`;
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace("</head>", `    ${tag}\n  </head>`);
}

function injectMeta(html: string, meta: PageMeta) {
  let next = html.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeHtml(meta.title)}</title>`
  );

  next = replaceMetaContent(next, "name", "description", meta.description);
  next = replaceMetaContent(next, "property", "og:type", meta.type || "website");
  next = replaceMetaContent(next, "property", "og:site_name", SERVICE_TITLE);
  next = replaceMetaContent(next, "property", "og:title", meta.title);
  next = replaceMetaContent(next, "property", "og:description", meta.description);
  next = replaceMetaContent(next, "property", "og:url", meta.url);
  next = replaceMetaContent(next, "property", "og:image", meta.image);
  next = replaceMetaContent(next, "property", "og:image:alt", meta.imageAlt);
  next = replaceMetaContent(next, "name", "twitter:card", "summary_large_image");
  next = replaceMetaContent(next, "name", "twitter:title", meta.title);
  next = replaceMetaContent(next, "name", "twitter:description", meta.description);
  next = replaceMetaContent(next, "name", "twitter:image", meta.image);
  next = replaceMetaContent(next, "name", "twitter:image:alt", meta.imageAlt);
  return next;
}

async function getMemorialMeta(req: Request): Promise<PageMeta | null> {
  const origin = getSiteOrigin(req);
  const pathname = getPath(req, origin);
  const match = pathname.match(MEMORIAL_PATH);
  if (!match) return null;

  const slug = decodeURIComponent(match[1] || "");
  if (!slug || RESERVED_SLUGS.has(slug)) return null;

  const memorial = await getMemorialShareBySlug(slug);
  if (!memorial) return null;

  const url = new URL(pathname, origin).toString();
  const isPrivate = memorial.visibility === "private";
  const isMemorial = memorial.recordType === "memorial";

  if (isPrivate) {
    return {
      title: `비공개 기념관 | ${SERVICE_TITLE}`,
      description: "비밀번호로 보호된 기념관입니다.",
      url,
      image: toAbsoluteUrl(DEFAULT_IMAGE, origin),
      imageAlt: SERVICE_TITLE,
    };
  }

  const title = `${memorial.name} ${memorial.role} | ${SERVICE_TITLE}`;
  const description = isMemorial
    ? `${memorial.name} ${memorial.role}님의 추모 기록입니다.`
    : `${memorial.name} ${memorial.role}님의 인생기념관입니다.`;

  return {
    title,
    description,
    url,
    image: toAbsoluteUrl(memorial.photoUrl || DEFAULT_IMAGE, origin),
    imageAlt: memorial.photoCaption || description,
    type: "profile",
  };
}

export async function injectOpenGraphMeta(html: string, req: Request) {
  const origin = getSiteOrigin(req);
  const defaultMeta: PageMeta = {
    title: SERVICE_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: new URL(getPath(req, origin), origin).toString(),
    image: toAbsoluteUrl(DEFAULT_IMAGE, origin),
    imageAlt: SERVICE_TITLE,
  };

  let meta: PageMeta | null = null;
  try {
    meta = await getMemorialMeta(req);
  } catch (error) {
    console.warn("[OpenGraph] Falling back to default meta:", error);
  }

  return injectMeta(html, meta || defaultMeta);
}
