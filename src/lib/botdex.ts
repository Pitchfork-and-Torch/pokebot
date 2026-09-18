import { DEX } from "../data/dex";
import type { EncounterLog, SaveFile, Specimen, TypeId } from "../data/types";
import { nameKey } from "./names";

export type BotdexMark = "unseen" | "seen" | "caught" | "watch" | "skip";
export type BotdexBook = "field" | "wild";

export interface BotdexEntry {
  key: string;
  no: string;
  book: BotdexBook;
  id: string;
  name: string;
  title: string;
  types: TypeId[];
  mark: BotdexMark;
  specimen: Specimen | null;
  job: string;
}

function lastEncounter(save: SaveFile, id: string, name: string): EncounterLog | undefined {
  const key = nameKey(name);
  return save.encounters.find((e) => e.result.id === id || nameKey(e.result.name) === key);
}

function isCaught(save: SaveFile, id: string, name: string): boolean {
  const key = nameKey(name);
  return save.caught.some((c) => c.id === id || nameKey(c.name) === key);
}

export function isFieldName(name: string, id?: string): boolean {
  if (id && DEX.some((s) => s.id === id)) return true;
  const key = nameKey(name);
  return DEX.some((s) => nameKey(s.name) === key);
}

export function markOf(save: SaveFile, id: string, name: string): BotdexMark {
  if (isCaught(save, id, name)) return "caught";
  const last = lastEncounter(save, id, name);
  if (last?.action === "skip") return "skip";
  if (last?.action === "watch") return "watch";
  if (last || save.seenIds.includes(id)) return "seen";
  return "unseen";
}

export function fieldBook(save: SaveFile): BotdexEntry[] {
  return DEX.map((s, i) => ({
    key: "field-" + s.id,
    no: String(i + 1).padStart(3, "0"),
    book: "field" as const,
    id: s.id,
    name: s.name,
    title: s.title,
    types: [...s.types],
    mark: markOf(save, s.id, s.name),
    specimen: s,
    job: s.job,
  }));
}

export function wildBook(save: SaveFile): BotdexEntry[] {
  const order: BotdexEntry[] = [];
  const seen = new Set<string>();

  function consider(id: string, name: string, title: string, types: TypeId[], specimen: Specimen | null, job: string) {
    if (isFieldName(name, id)) return;
    const key = nameKey(name) || id;
    if (!key || seen.has(key)) return;
    seen.add(key);
    order.push({
      key: "wild-" + key,
      no: "",
      book: "wild",
      id,
      name,
      title,
      types,
      mark: markOf(save, id, name),
      specimen,
      job,
    });
  }

  for (const e of [...save.encounters].reverse()) {
    consider(e.result.id, e.result.name, e.result.title, e.result.types as TypeId[], null, e.result.job_one_liner);
  }
  for (const c of save.caught) {
    consider(c.id, c.name, c.title, [...c.types], c, c.job);
  }

  return order.map((e, i) => ({ ...e, no: "W" + String(i + 1).padStart(2, "0") }));
}

export function botdexCounts(save: SaveFile) {
  const field = fieldBook(save);
  const wild = wildBook(save);
  return {
    field: field.length,
    fieldSeen: field.filter((e) => e.mark !== "unseen").length,
    fieldCaught: field.filter((e) => e.mark === "caught").length,
    wild: wild.length,
    wildCaught: wild.filter((e) => e.mark === "caught").length,
  };
}
