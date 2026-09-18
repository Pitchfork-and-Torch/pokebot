import { classify, type ClassifyOptions } from "./classify";
import { detectKind } from "./pasteKind";
import { classifyPublicTemplate, extractShareUrl } from "./wildLink";
import type { IdentifyResult } from "../data/types";

function emptyPreview(url: string, options: ClassifyOptions): IdentifyResult {
  const fallback = classify(`${url}. Public share link. Unclear job without a preview.`, options);
  return {
    ...fallback,
    sourceUrl: url,
    kind: "grok-bot",
    why: ["Preview had no job text. Paste the blurb instead.", ...fallback.why].slice(0, 4),
  };
}

export async function identifyInput(raw: string, options: ClassifyOptions = {}): Promise<IdentifyResult> {
  const url = extractShareUrl(raw.trim());
  if (!url) {
    const result = classify(raw, options);
    return { ...result, kind: result.kind ?? detectKind(raw) };
  }
  try {
    const res = await fetch("/api/identify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) return emptyPreview(url, options);
    const data = (await res.json()) as { html?: string };
    if (!data.html || data.html.trim().length < 40) return emptyPreview(url, options);
    const result = classifyPublicTemplate(data.html, options);
    return { ...result, sourceUrl: url, kind: "grok-bot" };
  } catch {
    return emptyPreview(url, options);
  }
}
