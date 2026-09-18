import { looksLikeIndex } from "./indexMarkdown";
import { parseRosterDump } from "./rosterDump";
import { extractShareUrl } from "./wildLink";

export type PasteShape = "index" | "dump" | "url" | "wish";

export function looksLikeDump(text: string): boolean {
  const trimmed = text.replace(/\r\n/g, "\n").trim();
  if (!trimmed || looksLikeIndex(trimmed)) return false;
  const blocks = parseRosterDump(trimmed);
  if (blocks.length < 2) return false;
  if (/\n\s*---\s*\n/.test(trimmed)) return true;
  const named = blocks.filter((b) => b.name.length > 0 && b.name.length <= 36 && b.body.length > 0);
  return named.length >= 2;
}

export function pasteShape(text: string): PasteShape {
  const trimmed = text.trim();
  if (!trimmed) return "wish";
  if (looksLikeIndex(trimmed)) return "index";
  if (looksLikeDump(trimmed)) return "dump";
  if (extractShareUrl(trimmed)) return "url";
  return "wish";
}
