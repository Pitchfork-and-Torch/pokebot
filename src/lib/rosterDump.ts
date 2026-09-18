import { classify, type ClassifyOptions } from "./classify";
import type { IdentifyResult } from "../data/types";
import { detectKind } from "./pasteKind";

export interface DumpBlock {
  name: string;
  body: string;
  raw: string;
}

export interface ImportRow {
  name: string;
  raw: string;
  result: IdentifyResult;
}

const KIND_LINE = /^kind:\s*(grok-bot|skill|mcp|clock|telegram|other)\s*$/i;

export function parseRosterDump(text: string): DumpBlock[] {
  const trimmed = text.replace(/\r\n/g, "\n").trim();
  if (!trimmed) return [];
  const chunks = trimmed.split(/\n\s*---\s*\n|\n{2,}/);
  const blocks: DumpBlock[] = [];
  for (const chunk of chunks) {
    const lines = chunk
      .split("\n")
      .map((line) => line.replace(/^\s*\d+[.)]\s*/, "").trim())
      .filter(Boolean);
    if (lines.length === 0) continue;
    let kindLine = "";
    const rest: string[] = [];
    for (const line of lines) {
      if (KIND_LINE.test(line)) {
        kindLine = line;
        continue;
      }
      rest.push(line);
    }
    const first = rest[0] ?? "";
    const named = first.match(/^name:\s*(.+)$/i);
    let name = "";
    let body = "";
    if (named?.[1]) {
      name = named[1].trim();
      body = rest.slice(1).join(" ");
    } else if (rest.length === 1 && /\s[-:|]\s/.test(first)) {
      const parts = first.split(/\s[-:|]\s/, 2);
      name = (parts[0] ?? "").trim();
      body = (parts[1] ?? "").trim();
    } else if (first.length <= 36 && rest.length > 1) {
      name = first.replace(/:$/, "");
      body = rest.slice(1).join(" ");
    } else {
      body = rest.join(" ");
    }
    const raw = [kindLine, name, body].filter(Boolean).join("\n");
    blocks.push({ name, body, raw });
  }
  return blocks;
}

export function identifyDump(text: string, options: ClassifyOptions = {}): ImportRow[] {
  return parseRosterDump(text).map((block) => {
    const payload = block.name ? `${block.name}. ${block.body}` : block.body;
    const result = classify(payload, options);
    const name = block.name || result.name;
    const kind = detectKind(block.raw);
    return { name, raw: block.raw, result: { ...result, name, kind } };
  });
}

export function killCost(result: IdentifyResult): number {
  let n = 0;
  if (result.verdict === "SKIP") n += 8;
  if (result.verdict === "WATCH") n += 4;
  if (result.never_list.length === 0) n += 4;
  if (result.risk === "high") n += 5;
  if (result.rarity === "common") n += 2;
  if (result.slot_advice === "do-not-create") n += 3;
  if (result.kind === "clock") n += 7;
  return n;
}

export function rankKillList(rows: ImportRow[]): ImportRow[] {
  return rows
    .filter((row) => row.result.verdict === "SKIP" || row.result.verdict === "WATCH")
    .sort((a, b) => killCost(b.result) - killCost(a.result));
}

export function killMessage(kill: ImportRow[]): string {
  if (kill.length === 0) return "No obvious kills. Still check overlap before Catch.";
  const n = Math.min(4, kill.length);
  const names = kill.slice(0, n).map((k) => k.name).join(", ");
  const clock = kill.find((k) => k.result.kind === "clock");
  if (clock) {
    return `Kill the clock: ${clock.name}. Then release these ${n} or you do not Catch anything new: ${names}.`;
  }
  return `Release these ${n} or you do not Catch anything new: ${names}.`;
}
