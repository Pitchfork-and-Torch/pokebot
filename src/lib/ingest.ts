import type { IdentifyResult, SaveFile, Specimen } from "../data/types";
import { resultToSpecimen } from "./classify";
import { nameKey, stubId } from "./names";
import { accountUsed, CAP_MAX, kindOf } from "./roster";
import type { ImportRow } from "./rosterDump";

export function makeStub(name: string): Specimen {
  const trimmed = name.trim() || "Unidentified";
  return {
    id: stubId(trimmed),
    name: trimmed,
    title: "Unidentified",
    types: ["ops"],
    job: "Unknown. Counts toward 50 until identified.",
    never_list: [],
    tools: [],
    rarity: "common",
    risk: "mid",
    origin: "stub",
    flavor: "A name on the account. Not a job. Identify it or release it.",
  };
}

export function findByName(caught: readonly Specimen[], name: string, id?: string): Specimen | undefined {
  const key = nameKey(name);
  return caught.find((s) => s.id === id || s.id === stubId(name) || nameKey(s.name) === key);
}

export function cheapestKill(caught: readonly Specimen[]): Specimen | null {
  if (caught.length === 0) return null;
  let best: { spec: Specimen; cost: number } | null = null;
  for (const spec of caught) {
    let cost = 0;
    if (spec.origin === "stub") cost += 6;
    if (spec.origin === "duplicate") cost += 4;
    if (spec.never_list.length === 0) cost += 5;
    if (spec.risk === "high") cost += 6;
    if (spec.rarity === "common") cost += 2;
    if (spec.job.toLowerCase().includes("unknown")) cost += 3;
    if (kindOf(spec) === "clock") cost += 8;
    if (!best || cost > best.cost) best = { spec, cost };
  }
  return best?.spec ?? null;
}

export function upgradeOrAdd(
  save: SaveFile,
  result: IdentifyResult,
  origin: Specimen["origin"] = "wild",
): { save: SaveFile; upgraded: boolean; blocked?: string } {
  const existing = findByName(save.caught, result.name, result.id);
  const nextSpec = resultToSpecimen(result, existing?.origin === "stub" ? "wild" : origin);
  if (existing) {
    const caught = save.caught.map((s) =>
      s.id === existing.id ? { ...nextSpec, id: existing.id, name: nextSpec.name || existing.name } : s,
    );
    return { save: { ...save, caught }, upgraded: true };
  }
  const isBot = (nextSpec.kind ?? "grok-bot") === "grok-bot";
  const used = accountUsed(save.caught, save.declaredExisting ?? 0);
  if (isBot && used >= CAP_MAX) {
    const kill = cheapestKill(save.caught.filter((s) => kindOf(s) === "grok-bot"));
    const hint = kill ? ` Cheapest kill: ${kill.name}.` : "";
    return { save, upgraded: false, blocked: `Cap 50.${hint}` };
  }
  const declared = isBot ? Math.max(0, (save.declaredExisting ?? 0) - 1) : (save.declaredExisting ?? 0);
  return {
    save: {
      ...save,
      caught: [...save.caught, nextSpec],
      boxedIds: save.boxedIds.includes(nextSpec.id) ? save.boxedIds : [...save.boxedIds, nextSpec.id],
      seenIds: save.seenIds.includes(nextSpec.id) ? save.seenIds : [...save.seenIds, nextSpec.id],
      declaredExisting: declared,
      censusDone: true,
    },
    upgraded: false,
  };
}

export function ingestRows(save: SaveFile, rows: ImportRow[]): {
  save: SaveFile;
  added: number;
  upgraded: number;
  blocked: number;
} {
  let next = save;
  let added = 0;
  let upgraded = 0;
  let blocked = 0;
  for (const row of rows) {
    const origin: Specimen["origin"] = row.result.verdict === "WATCH" ? "duplicate" : "wild";
    const step = upgradeOrAdd(next, row.result, origin);
    if (step.blocked) {
      blocked += 1;
      continue;
    }
    if (step.upgraded) upgraded += 1;
    else added += 1;
    next = step.save;
  }
  return { save: next, added, upgraded, blocked };
}


/** After upgradeOrAdd, stub ids are preserved; pin/Active must use that id. */
export function caughtIdFor(save: SaveFile, result: Pick<IdentifyResult, "id" | "name">): string {
  return save.caught.find((s) => s.id === result.id || s.name === result.name)?.id ?? result.id;
}

export function addNameStubs(save: SaveFile, names: string[], declaredTotal?: number): SaveFile {
  const unique = names.map((n) => n.trim()).filter(Boolean);
  let next = { ...save, caught: [...save.caught], boxedIds: [...save.boxedIds], seenIds: [...save.seenIds] };
  let created = 0;
  for (const name of unique) {
    if (findByName(next.caught, name)) continue;
    const stub = makeStub(name);
    // Cap tracks grok-bots + declared unnamed, not every specimen (skills/clocks).
    const used = accountUsed(next.caught, next.declaredExisting ?? 0);
    if (used >= CAP_MAX && (next.declaredExisting ?? 0) <= 0) break;
    next.caught.push(stub);
    if (!next.boxedIds.includes(stub.id)) next.boxedIds.push(stub.id);
    if (!next.seenIds.includes(stub.id)) next.seenIds.push(stub.id);
    created += 1;
  }
  const base = declaredTotal ?? save.declaredExisting ?? 0;
  const unnamed = Math.max(0, base - created);
  return { ...next, declaredExisting: unnamed, censusDone: true };
}
