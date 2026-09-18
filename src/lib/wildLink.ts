import { classify, type ClassifyOptions } from "./classify";
import type { IdentifyResult } from "../data/types";

const SHARE = /https?:\/\/(?:www\.)?(?:x\.ai|grok\.com)\/bot\/[A-Za-z0-9_-]+/i;

export function extractShareUrl(text: string): string | null {
  const m = text.match(SHARE);
  return m ? m[0] : null;
}

export function isShareUrl(text: string): boolean {
  return extractShareUrl(text.trim()) === text.trim();
}

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function parsePublicTemplate(html: string): { name: string; title: string; description: string; text: string } {
  const ogTitle = html.match(/property=["']og:title["']\s+content=["']([^"']+)/i)?.[1]
    || html.match(/content=["']([^"']+)["']\s+property=["']og:title["']/i)?.[1];
  const ogDesc = html.match(/property=["']og:description["']\s+content=["']([^"']+)/i)?.[1]
    || html.match(/name=["']description["']\s+content=["']([^"']+)/i)?.[1];
  const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  const name = (ogTitle || titleTag || "Wild template").replace(/\s+/g, " ").trim();
  const description = (ogDesc || "").replace(/\s+/g, " ").trim();
  const text = stripHtml(html).slice(0, 4000);
  return { name, title: name, description, text };
}

export function classifyPublicTemplate(html: string, options: ClassifyOptions = {}): IdentifyResult {
  const parsed = parsePublicTemplate(html);
  const payload = [parsed.name, parsed.description, parsed.text.slice(0, 800)].filter(Boolean).join(". ");
  const result = classify(payload, options);
  return {
    ...result,
    name: parsed.name.slice(0, 40) || result.name,
    kind: "grok-bot",
  };
}

export function allowIdentifyHost(url: string): boolean {
  try {
    const u = new URL(url);
    return (u.protocol === "https:" || u.protocol === "http:") && (u.hostname === "x.ai" || u.hostname === "www.x.ai" || u.hostname === "grok.com" || u.hostname === "www.grok.com");
  } catch {
    return false;
  }
}

/** Body for POST /api/identify. Null / arrays / primitives are not objects with .url. */
export function identifyRequestUrl(body: unknown): string | null {
  if (body == null || typeof body !== "object" || Array.isArray(body)) return null;
  const raw = (body as { url?: unknown }).url;
  if (typeof raw !== "string") return null;
  const url = raw.trim();
  return url || null;
}
